// Express Server
const express = require("express");
// HTTP
const http = require("http");
// HTTPs
const https = require("https");
const url = require("url");
const fs = require("fs");
const bodyParser = require("body-parser");
const app = express();
const favicon = require("serve-favicon");
const path = require("path");
const logger = require("./logger");
const { database, server } = require("./config");
const {
	wss1,
	wss2,
	wss3,
	wssMessageManager,
	wssMediaManager,
	wssCloudManager,
} = require("./websocket/index"); // Import all managers
const EkosModel = require("./models/ekos");
const UserModel = require("./models/user");
const { metricsMiddleware } = require("./middleware/metrics.middleware");
const reminderService = require("./services/reminderService");
const bookingAccessService = require("./services/bookingAccessService");
const AccessListSyncService = require("./services/accessListSyncService");

app.set("trust proxy", true);

// Make WSS managers available to routes via app.locals
// This should be done after they are initialized in ./websocket/index.js
app.locals.wssManager = {
	getWssMediaServerManager: () => wssMediaManager,
	getWssCloudServerManager: () => wssCloudManager,
	getWssMessageServerManager: () => wssMessageManager, // Optional, if needed by other routes
};

// Apply metrics middleware to track HTTP requests
app.use(metricsMiddleware);

app.use(favicon(path.join(__dirname, "../../build/public", "favicon.ico")));

const httpServer = http.createServer(app);
const EkosLivePath = require("os").homedir() + "/.local/share/ekoslive";
const clientPath = path.join(__dirname, "..", "..", "build");

const connectDB = () =>
{
	mongoose
		.connect(database, { useNewUrlParser: true })
		.then(() =>
		{
			logger.info("Connected to database.");
			EkosModel.updateMany({}, { connected: false }).then(() =>
				logger.info("Resetting the ekos connections successfully"),
			);
			UserModel.updateMany({}, { connected: false }).then(() =>
				logger.info("Resetting the user connections successfully"),
			);

			// Start the reminder service
			try
			{
				const startPromise = reminderService.start();
				if (startPromise && typeof startPromise.catch === "function")
				{
					startPromise.catch((err) =>
					{
						logger.error("Failed to start reminder service", err, {
							service: "reminderService",
							operation: "start"
						});
					});
				}
				else
				{
					// Handle case where start() doesn't return a Promise
					logger.info("Reminder service started");
				}
			}
			catch (err)
			{
				logger.error("Failed to start reminder service", err, {
					service: "reminderService",
					operation: "start"
				});
			}

			// Start the booking access list updater service
			try
			{
				bookingAccessService.startAccessListUpdater();
				logger.info("Booking access list updater service started");
			}
			catch (err)
			{
				logger.error("Failed to start booking access list updater service", err, {
					service: "bookingAccessService",
					operation: "startAccessListUpdater"
				});
			}

			// Start the access list sync service
			try
			{
				const {
					wssMessageManager,
					wssMediaManager,
					wssCloudManager,
				} = require("./websocket/index");
				const accessListSyncService = new AccessListSyncService([
					wssMessageManager,
					wssMediaManager,
					wssCloudManager,
				]);
				accessListSyncService.start();
				logger.info("Access list sync service started");
			}
			catch (err)
			{
				logger.error("Failed to start access list sync service", err, {
					service: "accessListSyncService",
					operation: "start"
				});
			}
		})
		.catch((error) =>
		{
			logger.error("Failed to connect to database", error, {
				operation: "connectDB"
			});
			process.exit(1);
		});
};

// Start regular http server in production
// so that it can be re-directed to https
if (server !== "local")
{
	// Redirect http to https
	// set up a route to redirect http to https
	app.use(function (req, res, next)
	{
		if (!req.secure)
		{
			return res.redirect(
				(server === "live"
					? "https://ekoslive.com"
					: "https://staging.ekoslive.com") + req.url,
			);
		}
		next();
	});
	// have it listen on 8080
	httpServer.listen(8080);
}

// Database
const mongoose = require("mongoose");
const { accessibleRecordsPlugin } = require("@casl/mongoose");
const { initACL } = require("./utils/updateACL");

mongoose.plugin(accessibleRecordsPlugin);

mongoose.Promise = require("bluebird");
connectDB();
// Compare versions of acl and update permission collection in db
initACL();

const { abilityMiddleware } = require("./acl/createAbility");

// apply the ability object to the request
app.use(abilityMiddleware);

const clientRoutes = [
	"/",
	"/dashboard",
	"/pricing",
	"/notification",
	"/community",
	"/community/moderation",
	"/community/post/:postID",
	"/community/equipment",
	"/community/equipment/:equipmentType",
	"/community/equipment/:equipmentType/:manufacturer",
	"/community/equipment/:equipmentType/:manufacturer/:model",
	"/community/users",
	"/community/:nickname/observatories",
	"/community/:nickname/followers",
	"/community/:nickname/following",
	"/community/:nickname/observatories/:observatoryId",
	"/community/:profile",
];

//serves the index.html
clientRoutes.map((route) =>
{
	app.use(route, express.static(clientPath));
});

app.use("/public", express.static("public"));

app.use(bodyParser.urlencoded({ extended: true, limit: "10mb" }));
app.use(bodyParser.json({ limit: "10mb" }));

// Allow cross domain
const allowCrossDomain = require("./headers/cross-domain");
app.use(allowCrossDomain);

// Authentication API
const authRoutes = require("./routes/auth.routes");
app.use("/api", authRoutes);

// User Settings API
const userSettingsRoutes = require("./routes/user.settings.routes");
app.use("/api/user/settings", userSettingsRoutes);

// Software API
const softwareRoutes = require("./routes/software.routes");
app.use("/api/software", softwareRoutes);

// Upload API
const uploadRoutes = require("./routes/upload.routes");
app.use("/api/upload", uploadRoutes);

// License API
const licenseRoutes = require("./routes/license.routes");
app.use("/api/license", licenseRoutes);

// Short URL service for preview images
const linkRoutes = require("./routes/link.routes");
app.use("/i", linkRoutes);

app.use("/", express.static(EkosLivePath));

// Module images route to serve from memory cache
app.get("/modules/:username/:uuid", (req, res) =>
{
	const { username, uuid } = req.params;
	const imageData = wssMediaManager.getModuleImage(username, uuid);

	if (!imageData)
	{
		return res.status(404).send("Module image not found");
	}

	res.writeHead(200, {
		"Content-Type": "image/jpeg",
		"Content-Length": imageData.length,
	});
	res.end(imageData);
});

// Histogram route to serve from memory cache
app.get("/histograms/:username/:uuid", (req, res) =>
{
	const { username, uuid } = req.params;
	const histogramData = wssMediaManager.getHistogram(username, uuid);

	if (!histogramData)
	{
		return res.status(404).send("Histogram not found");
	}

	// Histogram data is a base64 data URL from chartjs
	res.writeHead(200, {
		"Content-Type": "image/png",
	});
	// Convert base64 data URL to buffer
	const base64Data = histogramData.split(",")[1];
	const imageBuffer = Buffer.from(base64Data, "base64");
	res.end(imageBuffer);
});

// Cloud API
const cloudRoutes = require("./routes/cloud.routes");
app.use("/api/cloud", cloudRoutes);

// Stella API
const stellaRoutes = require("./routes/stella.routes");
app.use("/api/stella", stellaRoutes);

// Astrometry API
const astrometryRoutes = require("./routes/astrometry.routes");
app.use("/api/astrometry", astrometryRoutes);

// Cloud map tiles route
const weatherRoutes = require("./routes/weather.routes");
app.use("/api/weather", weatherRoutes);

// Subscription API
const subscripitonRoutes = require("./routes/subscription.routes");
app.use("/api/subscriptions", subscripitonRoutes);

// Profile routes
const socialRoutes = require("./routes/social.routes");
app.use("/api/social", socialRoutes);

// Observatory routes
const observatoryRoutes = require("./routes/observatory.routes");
app.use("/api/observatories", observatoryRoutes);

// Equipment routes
const equipmentRoutes = require("./routes/equipment.routes");
app.use("/api/equipments", equipmentRoutes);

// PayPal routes
const paypalRoutes = require("./routes/paypal.routes");
app.use("/api/paypal", paypalRoutes);

// Notification routes
const notificationRoutes = require("./routes/notification.routes");
app.use("/api/notification", notificationRoutes);

// Message routes
const messageRoutes = require("./routes/message.routes");
app.use("/api/messages", messageRoutes);

// Community routes
const postRoutes = require("./routes/post.routes");
app.use("/api/posts", postRoutes);
const commentRoutes = require("./routes/comment.routes");
app.use("/api/comments", commentRoutes);
const galleryRoutes = require("./routes/gallery.routes");
app.use("/api/gallery", galleryRoutes);

// Achievement routes
const achievementRoutes = require("./routes/achievement.routes");
app.use("/api/achievements", achievementRoutes);

// Sync routes
const syncRoutes = require("./routes/sync.routes");
app.use("/api/sync", syncRoutes);

// AWS routes
const AWSRoutes = require("./routes/aws.routes");
app.use("/api/aws", AWSRoutes);

// Admin routes
const adminRoutes = require("./routes/admin.routes");
app.use("/api/admin", adminRoutes);

// ACL Routes
const ACLRoutes = require("./routes/acl.routes");
app.use("/api/acl", ACLRoutes);

// Metadata routes, specifically for interaction with smfitstools
const MetadataRoutes = require("./routes/metadata.routes");
app.use("/api/metadata", MetadataRoutes);

const SurveyRoutes = require("./routes/survey.routes");
app.use("/api/survey", SurveyRoutes);

// Health check endpoint
const healthRoutes = require("./routes/health.routes");
app.use("/health", healthRoutes);

// Metrics endpoint
const metricsRoutes = require("./routes/metrics.routes");
app.use("/metrics", metricsRoutes);

// Debug routes (only available in development)
if (server === "local")
{
	const DebugRoutes = require("./routes/debug.routes");
	app.use("/api/debug", DebugRoutes);
	logger.info("Debug routes enabled");
}

// Serve the React app for all unmatched client-side routes
app.get("*", (req, res) =>
{
	res.sendFile(path.join(clientPath, "index.html"));
});

// 404 handler for unmatched API routes
app.use((req, res, next) =>
{
	if (req.originalUrl.startsWith("/api"))
	{
		return res.status(404).json({ error: "API endpoint not found" });
	}
	next();
});

// General error handler
app.use((err, req, res, next) =>
{
	logger.error("Unhandled error occurred", err, { 
		method: req.method, 
		url: req.originalUrl,
		userAgent: req.get('User-Agent'),
		ip: req.ip 
	});
	res.status(500).send("Internal server error");
});

// Create HTTP Server using Express JS
let httpsServer;

if (server === "local")
{
	logger.info("Starting development HTTP server...");
	httpsServer = httpServer;
}
else
{
	const options = {
		key: fs.readFileSync(__dirname + "/certs/privkey.pem"),
		cert: fs.readFileSync(__dirname + "/certs/fullchain.pem"),
	};

	logger.info("Starting live HTTPS server...");
	httpsServer = https.createServer(options, app);
}

httpsServer.on("upgrade", function upgrade(request, socket, head)
{
	const pathname = url.parse(request.url).pathname;

	if (pathname.startsWith("/message"))
	{
		wss1.handleUpgrade(request, socket, head, function done(ws)
		{
			wss1.emit("connection", ws, request);
		});
	}
	else if (pathname.startsWith("/media"))
	{
		wss2.handleUpgrade(request, socket, head, function done(ws)
		{
			wss2.emit("connection", ws, request);
		});
	}
	else if (pathname.startsWith("/cloud"))
	{
		wss3.handleUpgrade(request, socket, head, function done(ws)
		{
			wss3.emit("connection", ws, request);
		});
	}
	else
	{
		socket.destroy();
	}
});

let port = 3000;
if (server === "local") port = 5000;

httpsServer.listen(port, function listening()
{
	logger.info("Listening on " + httpsServer.address().port);
});

// Exporting here to avoid circular dependency
module.exports = {
	app,
};
