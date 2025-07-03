const url = require("url");
const WebSocket = require("ws");
const { get, isEmpty } = require("lodash");
const wstokenVerifier = require("../auth/ws-token-verifier");
const ekosController = require("../controller/ekos");
const ekosModel = require("../models/ekos");
const cloudModel = require("../models/cloud");
const hipsModel = require("../models/hips");
const UserModel = require("../models/user");
const ObservatoryModel = require("../models/observatory/observatory");
const { saveUrl } = require("../controller/link");
const { generateHistogram } = require("../utils/histogram.js");
const sharp = require("sharp");
const logger = require("../logger");
const commands = require("../../../StellarMateShared/shared/commands");
const fs = require("fs"); // Import full fs module
const { existsSync, mkdirSync, writeFileSync } = fs; // Keep specific imports if needed elsewhere
const path = require("path");
const jpeg = require("jpeg-js");
const { compareVersions } = require("compare-versions");
const wssBaseManager = require("./wssBaseManager");
const LRU = require("lru-cache");
const { secret } = require("../config");
const {
	max_basic_storage,
	max_pro_storage,
	max_ultimate_storage,
} = require("../shared");

// Maximum size for module images per user (800MB)
const MAX_MODULE_CACHE_SIZE = 800 * 1024 * 1024;
// Maximum number of module images per user
const MAX_MODULE_CACHE_COUNT = 5;

const METADATA_PACKET = 512;
//const MAX_METADATA_SIZE = 2000;

// Maximum number of images to send over
// For now we send the first 100 matching
const MAX_IMAGES = 100;

const EkosLiveSubscription = { Free: 2, Pro: [1, 4], Ultimate: [3, 5] };

class wssMediaServerManager extends wssBaseManager
{
	static EkosLivePath = require("os").homedir() + "/.local/share/ekoslive";

	constructor(server, wssMessageManager)
	{
		super(server);
		this.wssMessageManager = wssMessageManager;
		this.cloudManager = null;

		// Create caches to store user-specific module and histogram data
		this.moduleImageCaches = new Map();
		this.histogramCaches = new Map();

		// File retention time (2 hours in milliseconds)
		this.FILE_RETENTION_MS = 2 * 60 * 60 * 1000;

		// Maximum size for histogram cache per user (200MB)
		this.MAX_HISTOGRAM_CACHE_SIZE = 200 * 1024 * 1024;
		// Maximum number of histograms per user (same as modules)
		this.MAX_HISTOGRAM_CACHE_COUNT = 5;

		// Create global HIPS directory (shared across all users)
		try
		{
			// Wrap FS operation
			const hipsDir = path.resolve(wssMediaServerManager.EkosLivePath, "hips");
			if (!existsSync(hipsDir))
			{
				mkdirSync(hipsDir, { recursive: true });
			}
		}
		catch (error)
		{
			logger.error("Failed to create HIPS directory during server initialization", error, {
				operation: "createHipsDirectory",
				hipsDirectory: path.resolve(wssMediaServerManager.EkosLivePath, "hips"),
				component: "wssMediaServerManager"
			});
			// Decide if this is a critical failure
		}
	}

	// Clean up old files for a user
	cleanupOldFiles(username, type, retentionPeriodMs)
	{
		try
		{
			// Wrap entire cleanup logic
			const userDir = path.resolve(
				wssMediaServerManager.EkosLivePath,
				username,
			);
			const typeDir = path.resolve(userDir, type);

			if (!existsSync(typeDir))
			{
				return;
			}

			const currentRetentionPeriod =
				typeof retentionPeriodMs === "number" && retentionPeriodMs > 0
					? retentionPeriodMs
					: this.FILE_RETENTION_MS;

			const now = Date.now();
			let files = [];
			try
			{
				files = fs.readdirSync(typeDir);
			}
			catch (readDirErr)
			{
				logger.error("Failed to read directory during cleanup", {
					username: username,
					fileType: type,
					directory: typeDir,
					error: readDirErr,
				});
				return; // Cannot proceed if directory cannot be read
			}

			// Get all files with their stats
			const fileStats = files
				.map((file) =>
				{
					const filePath = path.resolve(typeDir, file);
					try
					{
						const stats = fs.statSync(filePath); // Use fs.statSync
						return { name: file, path: filePath, stats };
					}
					catch (
						statErr // Catch specific stat error
					)
					{
						logger.error("Failed to get stats for file during cleanup", {
							username: username,
							fileType: type,
							fileName: file,
							directory: typeDir,
							error: statErr,
						});
						return null;
					}
				})
				.filter(Boolean);

			// Delete files older than the determined retention time
			for (const file of fileStats)
			{
				const age = now - file.stats.mtimeMs;

				if (age > currentRetentionPeriod)
				{
					try
					{
						fs.unlinkSync(file.path); // Use fs.unlinkSync
						logger.info(
							`Deleted old file for user ${username}, type ${type}: ${file.path} (age: ${age}ms / ${currentRetentionPeriod}ms)`,
						);
					}
					catch (unlinkErr)
					{
						logger.error("Failed to delete file during cleanup", {
							username: username,
							fileType: type,
							filePath: file.path,
							error: unlinkErr,
						});
					}
				}
			}
		}
		catch (outerError)
		{
			logger.error("Unhandled error during cleanupOldFiles", {
				username: username,
				fileType: type,
				error: outerError,
			});
		}
	}

	// Get or create LRU cache for a specific user's module images
	getModuleCache(username)
	{
		if (!this.moduleImageCaches.has(username))
		{
			const cache = new LRU({
				max: MAX_MODULE_CACHE_COUNT,
				maxSize: MAX_MODULE_CACHE_SIZE,
				// Calculate size of entry (imageData buffer)
				sizeCalculation: (value, key) => value.length,
			});
			this.moduleImageCaches.set(username, cache);
		}
		return this.moduleImageCaches.get(username);
	}

	// Get or create LRU cache for a specific user's histograms
	getHistogramCache(username)
	{
		if (!this.histogramCaches.has(username))
		{
			const cache = new LRU({
				max: this.MAX_HISTOGRAM_CACHE_COUNT,
				maxSize: this.MAX_HISTOGRAM_CACHE_SIZE,
				// Calculate size of entry (histogram data)
				sizeCalculation: (value, key) => value.length,
			});
			this.histogramCaches.set(username, cache);
		}
		return this.histogramCaches.get(username);
	}

	// Get histogram from cache
	getHistogram(username, uuid)
	{
		const histogramCache = this.getHistogramCache(username);
		const cacheKey = `${username}:${uuid}`;
		const histogramData = histogramCache.get(cacheKey);
		if (!histogramData)
		{
			logger.warn("Histogram not found in cache", {
				username: username,
				histogramUuid: uuid,
			});
		}
		return histogramData;
	}

	// Clean up user's caches when they disconnect
	cleanupModuleCache(username)
	{
		try
		{
			// Wrap cache cleanup
			if (this.moduleImageCaches.has(username))
			{
				this.moduleImageCaches.get(username).reset();
				this.moduleImageCaches.delete(username);
				logger.debug(`${username}: Cleaned up module image cache`);
			}
			if (this.histogramCaches.has(username))
			{
				this.histogramCaches.get(username).reset();
				this.histogramCaches.delete(username);
				logger.debug(`${username}: Cleaned up histogram cache`);
			}
		}
		catch (cacheError)
		{
			logger.error("Error during cache cleanup", {
				username: username,
				error: cacheError,
			});
		}
	}

	setCloudManager(manager)
	{
		this.cloudManager = manager;
	}

	// Get module image from cache
	getModuleImage(username, uuid)
	{
		const moduleCache = this.getModuleCache(username);
		const cacheKey = `${username}:${uuid}`;
		const imageData = moduleCache.get(cacheKey);
		if (!imageData)
		{
			logger.warn("Module image not found in cache", {
				username: username,
				moduleImageUuid: uuid,
			});
		}
		return imageData;
	}

	listen()
	{
		// Global WebSocket server error handler
		this.wss.on("error", (error) =>
		{
			logger.error("Global WebSocket Server Error (wssMediaServerManager)", {
				error: error,
			});
		});

		this.wss.on("connection", (ws, req) =>
		{
			// Declare variables needed in outer scope
			let location,
				username,
				primaryID,
				token,
				storage = 0,
				plan_id = 2,
				client_type = 1,
				remoteToken = null;

			try
			{
				// Wrap initial connection setup logic
				location = url.parse(req.url, true);

				const version = location.query.version;
				username = location.query.username; // Assign to outer scope
				token = location.query.token; // Assign to outer scope
				// Ensure we always have a valid machine ID by using username as fallback
				const machineID =
					location.query.machine_id && location.query.machine_id !== "undefined"
						? location.query.machine_id
						: username;
				// primaryID should never be null/undefined since we always have username
				primaryID = machineID; // Assign to outer scope
				const observatoryName = location.query.observatory ?? null;

				if (username === undefined)
				{
					let notification = { severity: 3, uuid: "987654321" };
					notification.message = "Missing or invalid username.";
					logger.error("Terminating connection: Missing username", {
						remoteAddress: req.socket.remoteAddress,
						requestUrl: location.href,
						tokenProvided: token,
					});

					if (token)
					{
						ws.send(
							JSON.stringify({
								token,
								type: commands.NEW_NOTIFICATION,
								notification,
							}),
						);
						ws.send(JSON.stringify({ token, type: commands.LOGOUT }));
					}
					ws.terminate();
					return; // Exit connection handler
				}

				if (version)
				{
					const userClient = this.getUserClient(username);
					if (
						userClient &&
						userClient.connected &&
						userClient.ws.readyState === WebSocket.OPEN
					)
					{
						if (compareVersions(version, "3.7.2") < 0)
						{
							const notification = { severity: 3, uuid: "987654321" };
							notification.message =
								"Old KStars version detected. Update to 3.7.2 or higher.";
							userClient.ws.send(
								JSON.stringify({
									token,
									type: commands.NEW_NOTIFICATION,
									payload: notification,
								}),
							);
						}
						else
						{
							userClient.ws.send(
								JSON.stringify({
									type: commands.SET_KSTARS_VERSION,
									payload: version,
								}),
							);
						}
					}
				}

				// client type: 1 is WEB, 2 is APP
				// user type: 1 is online (live.stellarmate.com), 2 is offline ekoslive
				// plan_id = 2, client_type = 1, remoteToken = null; // Already declared

				// EkosLive subscription plan? Free or Pro?
				if ("plan_id" in location.query)
					plan_id = Number(location.query.plan_id);
				// Client is web browser or StellarMate App?
				if ("client_type" in location.query)
					client_type = Number(location.query.client_type);

				// Check storage from cloud collection (uses username) - Added .catch()
				cloudModel
					.findOne({ username }, "storage")
					.then((ekos) =>
					{
						if (ekos) storage = ekos.storage;
					})
					.catch((err) =>
					{
						logger.error("Failed to fetch initial storage for media", {
							username: username,
							error: err,
						});
						storage = 0; // Assume 0 on error
					});

				if (!token || wstokenVerifier(token, secret) === false)
				{
					logger.error("Invalid token on media WebSocket connection", {
						username: username,
						remoteAddress: req.socket.remoteAddress,
						requestUrl: location.href,
					});
					logger.error("Invalid token details for media WebSocket connection", {
						username: username,
						tokenProvided: token,
					});
					const notification = {
						severity: 3,
						message: "Session expired. Try to login.",
						uuid: "987654321",
					};
					if (this.wssMessageManager)
					{
						this.wssMessageManager.sendUserNotification(username, notification);
					}
					else
					{
						try
						{
							ws.send(
								JSON.stringify({
									type: commands.NEW_NOTIFICATION,
									payload: notification,
								}),
							);
						}
						catch (e)
						{}
					}
					try
					{
						ws.send(JSON.stringify({ type: commands.LOGOUT, payload: {} }));
					}
					catch (e)
					{}
					ws.terminate();
					return; // Exit connection handler
				}
				////////////////////////////////// Ekos Client Connection ////////////////////////////////
				else if (location.pathname === "/media/ekos")
				{
					if ("remoteToken" in location.query)
						remoteToken = location.query.remoteToken;

					// Fetch user from DB to get persisted ekosLiveCloudEnabled setting
					UserModel.findOne({ username: username })
						.then((userFromDB) =>
						{
							if (!userFromDB)
							{
								logger.error("User not found in DB during Ekos connection", new Error("User not found"), {
									operation: "ekosConnectionSetup",
									username,
									component: "wssMediaServerManager"
								});
								ws.terminate();
								return;
							}

							// All plans can enable cloud. Quota is the differentiator.
							// Initialize cloudEnabled from the persisted DB setting.
							let initialCloudEnabled =
								userFromDB.ekosLiveCloudEnabled || false;

							const existingEkosClient = this.ekosClients.get(primaryID);

							if (existingEkosClient)
							{
								if (!existingEkosClient.connected)
								{
									logger.info("Ekos media client reconnecting", {
										username: username,
										primaryId: primaryID,
										machineId: machineID,
										planId: plan_id,
									});
									existingEkosClient.token = token;
									existingEkosClient.ws = ws;
									existingEkosClient.connected = true;
									existingEkosClient.plan_id = plan_id; // plan_id from query parameters
									existingEkosClient.cloudEnabled = initialCloudEnabled; // Use DB value
									existingEkosClient.metadata = {};
									existingEkosClient.machineID = machineID;
									this.initObservatoryAccess(primaryID, username);
									// Perform initial cleanup of old preview files with a short retention
									this.cleanupOldFiles(username, "previews", 10 * 60 * 1000); // 10 minutes
								}
								else
								{
									logger.warn(
										`${username}: Ekos media client connected again while already marked as connected. Updating.`,
									);
									existingEkosClient.token = token;
									existingEkosClient.ws = ws;
									existingEkosClient.plan_id = plan_id; // plan_id from query parameters
									existingEkosClient.cloudEnabled = initialCloudEnabled; // Use DB value
									existingEkosClient.metadata = {};
									existingEkosClient.machineID = machineID;
									this.initObservatoryAccess(primaryID, username);
									// Perform initial cleanup of old preview files with a short retention
									this.cleanupOldFiles(username, "previews", 10 * 60 * 1000); // 10 minutes
								}
								// Inform KStars of the current cloud status from DB
								if (
									existingEkosClient.connected &&
									existingEkosClient.ws &&
									existingEkosClient.ws.readyState === WebSocket.OPEN
								)
								{
									try
									{
										existingEkosClient.ws.send(
											JSON.stringify({
												type: commands.SET_CLOUD_ENABLED_STATUS,
												payload: {
													cloudEnabled: existingEkosClient.cloudEnabled,
												},
											}),
										);
									}
									catch (e)
									{
										logger.error("Error sending SET_CLOUD_ENABLED_STATUS to KStars on reconnect", e, {
											operation: "sendCloudEnabledStatus",
											username,
											primaryId: primaryID,
											machineId: existingEkosClient.machineID,
											component: "wssMediaServerManager"
										});
									}
								}
							}
							else
							{
								let newEkosClient = {
									username: username,
									token: token,
									remoteToken: remoteToken,
									connected: true,
									ws: ws,
									plan_id: plan_id, // plan_id from query parameters
									cloudEnabled: initialCloudEnabled, // Use DB value
									remoteMedia: null,
									metadata: {},
									machineID: machineID,
									observatoryName: observatoryName,
								};
								this.ekosClients.set(primaryID, newEkosClient);
								this.initObservatoryAccess(primaryID, username);

								try
								{
									const userDir = path.resolve(
										wssMediaServerManager.EkosLivePath,
										username,
									);
									if (!existsSync(userDir))
										mkdirSync(userDir, { recursive: true });
									const previewDir = path.resolve(userDir, "previews");
									if (!existsSync(previewDir))
										mkdirSync(previewDir, { recursive: true });
								}
								catch (dirError)
								{
									logger.error(
										"Failed to create user directories for new Ekos client",
										{
											username: username,
											machineId: newEkosClient.machineID,
											primaryId: primaryID,
											error: dirError,
										},
									);
								}
								// Perform initial cleanup of old preview files with a short retention
								this.cleanupOldFiles(username, "previews", 10 * 60 * 1000); // 10 minutes
								// Inform KStars of the current cloud status from DB
								if (
									newEkosClient.connected &&
									newEkosClient.ws &&
									newEkosClient.ws.readyState === WebSocket.OPEN
								)
								{
									try
									{
										newEkosClient.ws.send(
											JSON.stringify({
												type: commands.SET_CLOUD_ENABLED_STATUS,
												payload: { cloudEnabled: newEkosClient.cloudEnabled },
											}),
										);
									}
									catch (e)
									{
										logger.error("Error sending SET_CLOUD_ENABLED_STATUS to KStars on new connection", e, {
											operation: "sendCloudEnabledStatus",
											username,
											primaryId: primaryID,
											machineId: newEkosClient.machineID,
											cloudEnabled: newEkosClient.cloudEnabled,
											component: "wssMediaServerManager"
										});
									}
								}
							}

							// Sync with cloudManager's state if it exists
							// This ensures cloudManager also uses the DB-derived state for this user/session
							if (this.cloudManager)
							{
								this.cloudManager.setCloudEnabled(
									username,
									initialCloudEnabled,
								);
							}
						})
						.catch((err) =>
						{
							logger.error("Error fetching user from DB during Ekos connection setup", err, {
								operation: "fetchUserFromDB",
								username,
								machineId: machineID,
								primaryId: primaryID,
								component: "wssMediaServerManager"
							});
							ws.terminate();
						});
				}
				////////////////////////////////// Web Client Messages ////////////////////////////////
				else
				{
					// If a user is already logged in from else where
					// We need to disconnect them first, before we allow this one
					const userClient = this.getUserClient(username);
					if (
						userClient &&
						userClient.connected &&
						userClient.ws.readyState === WebSocket.OPEN
					)
					{
						// cleanup previous session
						userClient.ws.send(
							JSON.stringify({ token, type: commands.LOGOUT }),
						);
						userClient.ws.send(
							JSON.stringify({
								token,
								type: commands.NEW_NOTIFICATION,
								payload: {
									severity: 3,
									message: "User logged in from another location!",
									uuid: "1234",
								},
							}),
						);
					}

					let cloudEnabled = false;
					if ("cloudEnabled" in location.query) cloudEnabled = true;
					if ("remoteToken" in location.query)
						remoteToken = location.query.remoteToken;

					let newUserClient = {};
					newUserClient.username = username;
					newUserClient.token = token;
					newUserClient.remoteToken = remoteToken;
					newUserClient.connected = true;
					newUserClient.ws = ws;
					newUserClient.client_type = client_type;
					newUserClient.state = { connected: false };
					newUserClient.cloudEnabled = cloudEnabled;
					newUserClient.cloudPending = false;
					newUserClient.plan_id = plan_id;
					newUserClient.remoteMedia = null;
					newUserClient.query = [];
					newUserClient.machineID = machineID;
					this.userClients.add(newUserClient);
				}
			}
			catch (error)
			{
				// End of initial setup try block
				logger.error("Error during initial WebSocket connection setup", error, {
					operation: "websocketConnectionSetup",
					remoteAddress: req.socket.remoteAddress,
					requestUrl: location.href,
					component: "wssMediaServerManager"
				});
				try
				{
					ws.terminate();
				}
				catch (e)
				{
					logger.error("Failed to terminate WebSocket after setup error", e, {
						operation: "terminateWebSocket",
						remoteAddress: req.socket.remoteAddress,
						requestUrl: location.href,
						component: "wssMediaServerManager"
					});
				}
				return; // Stop further processing for this connection
			}

			// Attach event listeners *outside* the initial try/catch
			////////////////////////////////// Messages ////////////////////////////////
			ws.on("message", async (message) =>
			{
				try
				{
					// Wrap message handler logic
					const userClient = this.getUserClient(username); // Get userClient again inside try block
					const currentToken = location.query.token; // Use token from connection closure

					// Re-verify token for each message
					if (
						!currentToken ||
						wstokenVerifier(currentToken, secret) === false
					)
					{
						logger.error("Invalid token during message processing, terminating session", new Error("Invalid token"), {
							operation: "tokenValidation",
							username,
							tokenUsed: currentToken,
							remoteAddress: req.socket.remoteAddress,
							requestUrl: location.href,
							component: "wssMediaServerManager"
						});
						const notification = {
							severity: 3,
							message: "Session expired. Try to login.",
							uuid: "987654321",
						};
						if (this.wssMessageManager)
						{
							this.wssMessageManager.sendUserNotification(
								username,
								notification,
							);
						}
						else
						{
							try
							{
								ws.send(
									JSON.stringify({
										type: commands.NEW_NOTIFICATION,
										payload: notification,
									}),
								);
							}
							catch (e)
							{}
						}
						try
						{
							ws.send(JSON.stringify({ type: commands.LOGOUT, payload: {} }));
						}
						catch (e)
						{}
						ws.terminate(); // Terminate on invalid token
						return;
					}
					////////////////////////////////// Ekos Client Messages ////////////////////////////////
					else if (location.pathname === "/media/ekos")
					{
						// Wrap the entire Ekos message handling in a nested try...catch
						try
						{
							const ekosClient = this.ekosClients.get(primaryID);
							if (!ekosClient)
							{
								logger.warn(
									`${username}: Received message for Ekos media client, but client not found for primaryID ${primaryID}. Ignoring.`,
								);
								return; // Exit if client doesn't exist
							}

							if (typeof message === "string")
							{
								try
								{
									ekosClient.metadata = JSON.parse(message);
									logger.info(`${username}: Received metadata update`);

									// Check if we have a valid connected user client
									// send the metadata to it
									if (
										userClient &&
										userClient.connected &&
										userClient.ws.readyState === WebSocket.OPEN
									)
									{
										logger.debug(
											`${username}: Forwarding metadata to web client`,
										);
										userClient.ws.send(
											JSON.stringify({
												type: commands.NEW_IMAGE_METADATA,
												payload: ekosClient.metadata,
											}),
										);
									}
								}
								catch (err)
								{
									logger.error("Failed to parse metadata from Ekos client string message", err, {
										operation: "parseMetadata",
										username,
										primaryId: primaryID,
										machineId: ekosClient.machineID,
										rawMessage: message,
										component: "wssMediaServerManager"
									});
								}
							}
							// If message is BINARY
							else
							{
								storage += message.length; // Use storage from outer scope
								// If free user exceed their quotas disable sending images
								if (
									ekosClient.plan_id === EkosLiveSubscription.Free &&
									storage > max_basic_storage
								)
								{
									// Warn user that storage is over
									const notification = {
										severity: 3,
										message: "Storage limit for Ekos Live Basic is reached!",
										uuid: "12345678",
									};
									this.wssMessageManager.sendUserNotification(
										username,
										notification,
									);
									logger.info(
										`${username}: Storage (${storage}) exceeded free limit. Disabling blobs.`,
									);
									// Disable BLOBS as Ekos size
									ws.send(
										JSON.stringify({
											token: currentToken,
											type: commands.SET_BLOBS,
											payload: false,
										}),
									);
									return;
								}
								else if (
									EkosLiveSubscription.Pro.includes(ekosClient.plan_id) &&
									storage > max_pro_storage
								)
								{
									// Warn user that storage is over
									const notification = {
										severity: 3,
										message: "Storage limit for Ekos Live Pro is reached!",
										uuid: "12345678",
									};
									this.wssMessageManager.sendUserNotification(
										username,
										notification,
									);
									logger.info(
										`${username}: Storage (${storage}) exceeded Pro limit. Disabling blobs.`,
									);
									// Disable BLOBS as Ekos size
									ws.send(
										JSON.stringify({
											token: currentToken,
											type: commands.SET_BLOBS,
											payload: false,
										}),
									);
									return;
								}
								else if (
									EkosLiveSubscription.Ultimate.includes(ekosClient.plan_id) &&
									storage > max_ultimate_storage
								)
								{
									// Warn user that storage is over
									const notification = {
										severity: 3,
										message: "Storage limit for Ekos Live Ultimate is reached!",
										uuid: "12345678",
									};
									this.wssMessageManager.sendUserNotification(
										username,
										notification,
									);
									logger.info(
										`${username}: Storage (${storage}) exceeded Ultimate limit. Disabling blobs.`,
									);
									// Disable BLOBS as Ekos size
									ws.send(
										JSON.stringify({
											token: currentToken,
											type: commands.SET_BLOBS,
											payload: false,
										}),
									);
									return;
								}
								let imageData = message;
								try
								{
									// Check if this packet uses the new KStars 3.5.5 binary
									// format where the first 128bytes are metadata
									// if it fails, we use original format.
									let metadata = message.slice(0, METADATA_PACKET);
									metadata = metadata.filter((i) => i !== 0);
									metadata = metadata.toString("utf-8");
									ekosClient.metadata = JSON.parse(metadata);

									imageData = message.slice(METADATA_PACKET);

									// Ignore empty image
									if (ekosClient.metadata.size === "0 B") return;
									let uuid = ekosClient.metadata.uuid;

									if (uuid.startsWith("hips"))
									{
										// logger.info(`${username}: Processing HIPS image ${uuid}`);
										// Save to disk (HIPS files are shared across users)
										const hipsPath = path.resolve(
											path.resolve(wssMediaServerManager.EkosLivePath, "hips"),
											uuid,
										);
										writeFileSync(hipsPath, imageData); // Consider async write

										// Store to DB with global HIPS URL (relative to EkosLivePath which is served at root)
										ekosClient.metadata.preview = `/hips/${uuid}`;
										const query = {
											name: ekosClient.metadata["name"],
											zoom: ekosClient.metadata["zoom"],
											metadata: JSON.stringify(ekosClient.metadata),
										};
										// Use await with updateOne for cleaner error handling if possible, or ensure callback handles errors
										await hipsModel.updateOne(
											query,
											{ $setOnInsert: query },
											{ upsert: true },
											(err) =>
											{
												if (err)
												{
													logger.error("Error inserting HIPS data to DB", err, {
														operation: "insertHipsData",
														username,
														primaryId: primaryID,
														machineId: ekosClient.machineID,
														hipsUuid: uuid,
														dbQuery: query,
														component: "wssMediaServerManager"
													});
												}
											},
										);
									}
									else if (uuid.startsWith("+"))
									{
										// Handle module images in memory using LRU cache
										// logger.debug(`${username}: Processing module image ${uuid}`);
										const moduleCache = this.getModuleCache(username);
										const cacheKey = `${username}:${uuid}`;
										moduleCache.set(cacheKey, imageData);

										// Update metadata with module preview URL that includes username
										ekosClient.metadata.preview = `/modules/${username}/${uuid}`;
									}
									else if (uuid === "skypoint_hips")
									{
										// Handle skypoint_hips in memory using LRU cache
										// logger.info(`${username}: Processing skypoint_hips image`);
										const moduleCache = this.getModuleCache(username);
										const cacheKey = `${username}:${uuid}`;
										moduleCache.set(cacheKey, imageData);

										// Update metadata with module preview URL that includes username
										ekosClient.metadata.preview = `/modules/${username}/${uuid}`;
									}
									else
									{
										logger.info(
											`${username}: Processing new image capture ${uuid}`,
										);
										await this.updateObservatoryImagesCaptured(primaryID); // Use primaryID here

										try
										{
											logger.debug(
												`${username}: Generating histogram for image ${uuid}`,
											);
											// For regular non-module images, let's create a histogram
											const histogram = await generateHistogram(
												imageData,
												ekosClient.metadata.channels,
											);

											// Store histogram in cache
											const histogramCache = this.getHistogramCache(username);
											const cacheKey = `${username}:${uuid}`;
											histogramCache.set(cacheKey, histogram);

											// Update metadata with virtual histogram URL
											ekosClient.metadata.histogram = `/histograms/${username}/${uuid}`;
										}
										catch (err)
										{
											logger.error("Failed to generate histogram for image", err, {
												operation: "generateHistogram",
												username,
												primaryId: primaryID,
												machineId: ekosClient.machineID,
												imageUuid: uuid,
												component: "wssMediaServerManager"
											});
										}

										// Save preview image
										try
										{
											// Wrap FS write
											const previewPath = path.resolve(
												path.resolve(
													wssMediaServerManager.EkosLivePath,
													username,
													"previews",
												),
												uuid,
											);
											writeFileSync(previewPath, imageData); // Consider async write

											// Update metadata with preview URL
											ekosClient.metadata.preview = `/${username}/previews/${uuid}`;

											// Clean up old preview files
											this.cleanupOldFiles(username, "previews");
										}
										catch (writeErr)
										{
											logger.error("Failed to write preview file", writeErr, {
												operation: "writePreviewFile",
												username,
												primaryId: primaryID,
												machineId: ekosClient.machineID,
												imageUuid: uuid,
												filePath: previewPath,
												component: "wssMediaServerManager"
											});
										}
									}

									// Broadcast metadata to all users with access to this observatory
									const observatoryUsers = this.getObservatoryUsers(primaryID);
									for (const observatoryUser of observatoryUsers)
									{
										const targetUserClient =
											this.getUserClient(observatoryUser); // Renamed variable
										if (
											targetUserClient &&
											targetUserClient.connected &&
											targetUserClient.machineID === primaryID &&
											targetUserClient.ws.readyState === WebSocket.OPEN
										)
										{
											try
											{
												// Wrap send operation
												targetUserClient.ws.send(
													JSON.stringify({
														type: commands.NEW_METADATA,
														payload: ekosClient.metadata,
													}),
												);
											}
											catch (sendErr)
											{
												logger.error("Failed to send NEW_METADATA to observatory user", sendErr, {
													operation: "sendNewMetadata",
													sourceUser: username,
													primaryId: primaryID,
													machineId: ekosClient.machineID,
													targetObservatoryUser: observatoryUser,
													component: "wssMediaServerManager"
												});
											}
										}
									}
								}
								catch (err)
								{
									logger.error("Failed to process binary image data from Ekos client", err, {
										operation: "processBinaryImageData",
										username,
										primaryId: primaryID,
										machineId: ekosClient.machineID,
										component: "wssMediaServerManager"
									});
									return; // Exit binary processing on error
								}

								ekosController.increaseProperty(
									username,
									"storage",
									imageData.length, // Use imageData.length, not message.length
								);

								// Cloud upload logic moved inside the 'else' block above for regular images
							}
						}
						catch (mainEkosError)
						{
							// Catch errors from the main try block for Ekos messages
							logger.error("Unhandled error processing Ekos media message", mainEkosError, {
								operation: "processEkosMessage",
								username,
								primaryId: primaryID,
								machineId: ekosClient ? ekosClient.machineID : "unknown",
								component: "wssMediaServerManager"
							});
						}
					}
					////////////////////////////////// Web Client Messages ////////////////////////////////
					else
					{
						// Wrap the entire Web message handling in a nested try...catch
						try
						{
							// const userClient = this.getUserClient(username); // Already defined in outer scope
							if (!userClient)
							{
								logger.warn(
									`${username}: Received message for Web media client, but client not found. Ignoring.`,
								);
								return; // Exit if client doesn't exist
							}

							const ekosClient = this.ekosClients.get(userClient?.machineID);
							let command;
							try
							{
								// Attempt to parse the message as JSON first
								command = JSON.parse(message);
							}
							catch (parseError)
							{
								// If JSON parsing fails, treat it as a plain string message (or handle appropriately)
								logger.warn(
									`${username}: Received non-JSON message from web client: ${message.toString().substring(0, 100)}...`,
								);
								// Decide how to handle non-JSON messages, e.g., ignore or log
								command = { type: "UNKNOWN_FORMAT" }; // Assign a default or marker type
							}

							// Now process the command based on its type
							if (command.type === commands.OPTION_SET_CLOUD_STORAGE)
							{
								// This command comes from the client (web or StellarMate App)
								// when the cloud storage toggle is changed.
								// For EkosLive Web, the API call is the source of truth for DB persistence.
								// This handler should only update the in-memory state for the relevant sessions.
								// It should NOT update the database.

								const newCloudValue = command.payload.value;
								logger.info(
									`${username}: Received OPTION_SET_CLOUD_STORAGE via WebSocket with value: ${newCloudValue}. Updating in-memory states.`,
								);

								if (userClient)
								{
									// userClient is the web client that sent the command
									userClient.cloudEnabled = newCloudValue;
								}

								if (ekosClient)
								{
									// ekosClient is the KStars client associated with this web client's machineID
									ekosClient.cloudEnabled = newCloudValue;
									// Inform the actual KStars client if it's connected and the value changed
									// This might be redundant if the API call also informs KStars, but ensures consistency
									// if this WS command is the only one received by a specific KStars instance.
									if (
										ekosClient.connected &&
										ekosClient.ws &&
										ekosClient.ws.readyState === WebSocket.OPEN
									)
									{
										try
										{
											ekosClient.ws.send(
												JSON.stringify({
													type: commands.SET_CLOUD_ENABLED_STATUS,
													payload: { cloudEnabled: ekosClient.cloudEnabled },
												}),
											);
										}
										catch (e)
										{
											logger.error("Error sending SET_CLOUD_ENABLED_STATUS to KStars on reconnect", e, {
												operation: "sendCloudEnabledStatus",
												username,
												primaryId: primaryID,
												machineId: ekosClient.machineID,
												component: "wssMediaServerManager"
											});
										}
									}
								}
								else if (userClient && !ekosClient)
								{
									// If only web client is connected and KStars is not,
									// userClient.cloudPending could be used if we want KStars to pick up this state on next connect,
									// but our primary mechanism is now DB lookup on KStars connect.
									logger.info(
										`${username}: OPTION_SET_CLOUD_STORAGE received, KStars not connected for machineID ${userClient.machineID}. Web client state updated.`,
									);
								}

								// This updates the cloudManager's understanding of the state for the user.
								// Ensure userClient is passed correctly if ekosClient is null.
								this.setCloudEnabled(userClient, ekosClient);
							}
							else if (command.type === commands.ADD_TAG)
							{
								this.addTag(
									username,
									ws,
									command.payload.uuid,
									command.payload.tag,
								);
							}
							else if (command.type === commands.REMOVE_TAG)
							{
								this.removeTag(
									username,
									ws,
									command.payload.uuid,
									command.payload.tag,
								);
							}
							else if (command.type === commands.DELETE_IMAGES)
							{
								cloudModel
									.updateOne(
										{ username },
										{
											$pull: {
												metadatas: { uuid: { $in: command.payload } },
												thumbnails: { uuid: { $in: command.payload } },
												previews: { uuid: { $in: command.payload } },
											},
										},
										{ multi: true },
									)
									.then(async () =>
									{
										let objectsList = [];
										for (const uuid of command.payload)
										{
											const user = await UserModel.findOne({ username });
											if (user)
											{
												// Check if user exists before accessing _id
												objectsList.push(
													"users/" + user._id + "/astronomy-images/raw/" + uuid,
												);
												objectsList.push(
													"users/" +
														user._id +
														"/astronomy-images/previews/" +
														uuid,
												);
												objectsList.push(
													"users/" +
														user._id +
														"/astronomy-images/thumbnails/" +
														uuid,
												);
											}
											else
											{
												logger.warn(
													`${username}: User not found during DELETE_IMAGES for UUID ${uuid}`,
												);
											}
										}
										if (this.cloudManager && objectsList.length > 0)
										{
											// Check cloudManager exists
											this.cloudManager.removeObjects(objectsList, (err) =>
											{
												if (err)
													logger.error("Removing objects from S3 cloud storage failed", err, {
														operation: "removeS3Objects",
														username,
														objectsToRemove: objectsList,
														component: "wssMediaServerManager"
													});
												else this.sendImages(username, ws, userClient.query);
											});
										}
										else if (objectsList.length === 0)
										{
											logger.warn(
												`${username}: No objects to remove for DELETE_IMAGES`,
											);
											this.sendImages(username, ws, userClient.query); // Still send images if none to delete
										}
									})
									.catch((err) =>
										logger.error("Deleting images metadata from DB failed", err, {
											operation: "deleteImagesMetadata",
											username,
											uuids: command.payload,
											component: "wssMediaServerManager"
										}),
									);
							}
							else if (command.type === commands.ASTRO_GET_OBJECTS_IMAGE)
							{
								const zoom = get(command.payload, "zoom", 20000);
								const names = command.payload["names"];
								let pendingNames = [];
								for (const name of names)
								{
									// Check first if we have this hips metadata in the database
									const query = { name: name, zoom: zoom };
									hipsModel
										.find(query)
										.then(
											(
												data, // Removed err from callback params as it's handled by .catch
											) =>
											{
												try
												{
													if (!isEmpty(data))
													{
														ws.send(
															JSON.stringify({
																type: commands.NEW_IMAGE_METADATA,
																payload: JSON.parse(data[0].metadata),
															}),
														);
													}
													else pendingNames.push(name);
												}
												catch (error)
												{
													logger.error("HIPS model metadata processing failed", error, {
														operation: "processHipsMetadata",
														username,
														objectName: name,
														zoomLevel: zoom,
														component: "wssMediaServerManager"
													});
												}

												// // If we have any names left not found in the DB, send them to KStars.
												if (
													!isEmpty(pendingNames) &&
													ekosClient &&
													ekosClient.connected &&
													ekosClient.ws?.readyState === WebSocket.OPEN // Add null check
												)
												{
													try
													{
														// Wrap send
														ekosClient.ws.send(
															JSON.stringify({
																type: commands.ASTRO_GET_OBJECTS_IMAGE,
																payload: { zoom: zoom, names: pendingNames },
															}),
														);
													}
													catch (sendErr)
													{
														logger.error("Failed to send ASTRO_GET_OBJECTS_IMAGE to Ekos client", sendErr, {
															operation: "sendAstroGetObjectsImage",
															username,
															zoomLevel: zoom,
															objectNamesPending: pendingNames,
															component: "wssMediaServerManager"
														});
													}
												}
											},
										)
										.catch((dbErr) =>
										{
											// Add catch for the find query
											logger.error("HIPS model DB query failed", dbErr, {
												operation: "hipsModelQuery",
												username,
												objectName: name,
												zoomLevel: zoom,
												component: "wssMediaServerManager"
											});
										});
								}
							}
							else if (command.type === commands.GET_IMAGES)
							{
								try
								{
									userClient.query = command.payload.query;
									this.sendImages(username, ws, userClient.query);
								}
								catch (err)
								{
									logger.error(
										"Error processing GET_IMAGES query for web client",
										err,
										{
											operation: "processGetImagesQuery",
											username,
											clientQuery: userClient.query,
											component: "wssMediaServerManager"
										},
									);
								}
							}
							else if (
								command.type === commands.SET_ACTIVE_KSTARS_CONNECTION
							)
							{
								// Update machineID for userClient and client state in the ekos
								this.updateUserActiveKstars(username, command.payload);
								const targetEkosClient = this.ekosClients.get(command.payload); // Renamed variable
								if (
									targetEkosClient &&
									targetEkosClient.connected &&
									targetEkosClient.ws?.readyState === WebSocket.OPEN // Add null check
								)
								{
									try
									{
										// Wrap send operations
										targetEkosClient.ws.send(
											JSON.stringify({
												type: commands.SET_CLIENT_STATE,
												payload: { state: true },
											}),
										);

										targetEkosClient.ws.send(
											JSON.stringify({ type: commands.GET_CONNECTION }),
										);
										targetEkosClient.ws.send(
											JSON.stringify({ type: commands.GET_DRIVERS }),
										);
										targetEkosClient.ws.send(
											JSON.stringify({ type: commands.GET_SCOPES }),
										);
										targetEkosClient.ws.send(
											JSON.stringify({ type: commands.GET_PROFILES }),
										);
										targetEkosClient.ws.send(
											JSON.stringify({ type: commands.GET_DEVICES }),
										);
									}
									catch (sendErr)
									{
										logger.error(
											"Failed to send state/GET commands to newly active KStars client",
											sendErr,
											{
												operation: "sendStateGetCommands",
												username,
												targetMachineId: command.payload,
												component: "wssMediaServerManager"
											},
										);
									}
								}
							}
							else if (
								ekosClient &&
								ekosClient.connected &&
								ekosClient.ws?.readyState === WebSocket.OPEN // Add null check
							)
							{
								// Check if user has control permission
								if (await this.canUserControl(username, userClient.machineID))
								{
									// Use await here
									try
									{
										// Wrap send
										// Forward the command to the observatory
										ekosClient.ws.send(message);
									}
									catch (sendErr)
									{
										logger.error(
											"Failed to forward message from web client to Ekos",
											sendErr,
											{
												operation: "forwardMessageToEkos",
												username,
												machineId: userClient.machineID,
												messagePreview: typeof message === "string" ? message.substring(0, 100) : "binary_message",
												component: "wssMediaServerManager"
											});
									}
								}
								else
								{
									try
									{
										// Wrap send
										// Send permission denied notification
										ws.send(
											JSON.stringify({
												type: commands.NEW_NOTIFICATION,
												payload: {
													severity: 3,
													message:
														"You do not have control permission for this observatory",
													uuid: "permission_denied",
												},
											}),
										);
									}
									catch (sendErr)
									{
										logger.error(
											"Failed to send permission denied notification to web client",
											sendErr,
											{
												operation: "sendPermissionDeniedNotification",
												username,
												machineId: userClient.machineID,
												component: "wssMediaServerManager"
											});
									}
								}
							}
						}
						catch (mainWebError)
						{
							// Catch errors from the main try block for Web messages
							logger.error("Unhandled error processing Web media message", mainWebError, {
								operation: "processWebMessage",
								username,
								machineId: userClient ? userClient.machineID : "unknown",
								messagePreview: typeof message === "string" ? message.substring(0, 200) : "binary_message",
								component: "wssMediaServerManager"
							});
						}
					}
				}
				catch (msgError)
				{
					// End of try block for message handler
					logger.error("Generic error processing WebSocket message", msgError, {
						operation: "processWebSocketMessage",
						username,
						primaryId: primaryID,
						path: location.pathname,
						messagePreview: typeof message === "string" ? message.substring(0, 200) : "binary_message",
						component: "wssMediaServerManager"
					});
					// Decide if the connection should be terminated based on the error
					if (msgError instanceof SyntaxError)
					{
						// e.g., Invalid JSON
						// Maybe just log and ignore, or notify client
					}
					else
					{
						// For other errors, maybe terminate
						// ws.terminate();
					}
				}
			});

			////////////////////////////////// Close Event ////////////////////////////////
			ws.on("close", () =>
			{
				try
				{
					// Wrap close handler logic
					////////////////////////////////// Ekos Client Closing ////////////////////////////////
					if (location.pathname === "/media/ekos")
					{
						const ekosClient = this.ekosClients.get(primaryID);
						if (ekosClient)
						{
							logger.info(
								`${username}: Ekos media client disconnected from websocket server.`,
							);
							// Mark as disconnected instead of deleting
							ekosClient.connected = false;
							ekosClient.ws = null;
							// Keep the client entry in the map: this.ekosClients.delete(primaryID);
							this.cleanupModuleCache(username); // Cache cleanup might still be relevant
						}
					}
					////////////////////////////////// Web Client Closing ////////////////////////////////
					else
					{
						const userClient = this.getUserClient(username);
						if (userClient)
						{
							logger.info(
								`${userClient.username}: Web media client disconnected from websocket server.`, // Use userClient.username
							);
							this.userClients.delete(userClient);
							this.cleanupModuleCache(username);
						}
					}
				}
				catch (closeError)
				{
					// End of try block for close handler
					logger.error("Error during WebSocket close handling", {
						username: username,
						primaryId: primaryID,
						path: location.pathname,
						error: closeError,
					});
				}
			});
		});
	}

	setCloudEnabled(userClient, ekosClient)
	{
		const { username } = userClient;
		if (this.cloudManager)
		{
			// Check if cloudManager is set
			this.cloudManager.setCloudEnabled(
				username,
				ekosClient && ekosClient.cloudEnabled,
			);
		}
		else
		{
			logger.warn(`${username}: CloudManager not available to setCloudEnabled`);
		}
	}

	sendImages(username, ws, query)
	{
		cloudModel
			.aggregate([
				{ $match: { username } },
				{
					$redact: {
						$cond: {
							if: {
								$or: [
									{
										$and: query,
									},
									{ $eq: ["$username", username] },
								],
							},
							then: "$$DESCEND",
							else: "$$PRUNE",
						},
					},
				},
				{ $limit: MAX_IMAGES },
				{
					$project: {
						_id: 0,
						uuids: "$thumbnails.uuid",
						metadatas: "$metadatas",
						thumbnails: "$thumbnails",
						previews: "$previews",
					},
				},
			])
			.then((matches) =>
			{
				// Check if matches array is empty or first element lacks uuids
				if (
					!matches ||
					matches.length === 0 ||
					!matches[0] ||
					matches[0].uuids === undefined ||
					matches[0].uuids.length === 0
				)
				{
					try
					{
						// Wrap send
						ws.send(JSON.stringify({ type: commands.GET_IMAGES, payload: [] }));
					}
					catch (sendErr)
					{
						logger.error(
							"Failed to send empty GET_IMAGES result (no matches)",
							{ username: username, clientQuery: query, error: sendErr },
						);
					}
					logger.info(
						// Use info level for expected empty results
						`${username}: No cloud images found with query ${JSON.stringify(query)}`,
					);
					return;
				}
				let completeMetadatas = matches[0]?.metadatas ?? []; // These are the "good" records
				const allPreviews = matches[0].previews ?? [];
				const allThumbnails = matches[0].thumbnails ?? [];
				let promises = [];

				for (const metadataItem of completeMetadatas)
				{
					// Iterate over complete metadata entries
					if (!metadataItem || !metadataItem.uuid)
					{
						logger.warn(
							`${username}: Skipping metadata item due to missing uuid for query ${JSON.stringify(query)}`,
						);
						continue;
					}

					const previewItem = allPreviews.find(
						(p) => p && p.uuid === metadataItem.uuid,
					);
					const thumbItem = allThumbnails.find(
						(t) => t && t.uuid === metadataItem.uuid,
					);

					// Check if essential object names are present.
					// metadataItem.objectname comes from RAW processing.
					// previewItem and thumbItem might be missing if their initial upload failed,
					// but the client might still want to show the image if RAW is there.
					// For now, we require all three for a complete entry to be sent.
					if (
						!metadataItem.objectname || // Essential: indicates RAW image processed
						!previewItem?.objectname || // Essential for display
						!thumbItem?.objectname || // Essential for display
						!this.cloudManager
					)
					{
						logger.warn(
							`${username}: Skipping image UUID ${metadataItem.uuid} for query ${JSON.stringify(query)} due to missing S3 object names (raw, preview, or thumb) or cloudManager. Metadata: ${metadataItem.objectname}, Preview: ${previewItem?.objectname}, Thumb: ${thumbItem?.objectname}`,
						);
						continue;
					}

					let objectPromise = this.cloudManager.getObjectURL(
						metadataItem.objectname,
					); // RAW
					let previewPromise = this.cloudManager.getObjectURL(
						previewItem.objectname,
					);
					let thumbPromise = this.cloudManager.getObjectURL(
						thumbItem.objectname,
					);

					const onePromise = Promise.all([
						objectPromise,
						previewPromise,
						thumbPromise,
					])
						.then((values) =>
						{
							if (
								!values ||
								values.length < 3 ||
								!values[0] ||
								!values[1] ||
								!values[2]
							)
							{
								logger.warn(
									`${username}: Incomplete S3 URL values received for UUID ${metadataItem.uuid}, query ${JSON.stringify(query)}. Raw: ${values[0]}, Preview: ${values[1]}, Thumb: ${values[2]}`,
								);
								return null;
							}
							return new Promise(function (resolve, reject)
							{
								let resp = {
									raw: values[0],
									src: values[1],
									shortURL: values[1], // Default shortURL
									thumbnail: values[2],
									thumbnailWidth: thumbItem?.width, // Use optional chaining
									thumbnailHeight: thumbItem?.height, // Use optional chaining
									metadata: metadataItem, // This is the full metadata
								};
								saveUrl(values[1]) // Save the preview URL
									.then((newURL) =>
									{
										resp.shortURL = newURL;
										resolve(resp);
									})
									.catch((err) =>
									{
										logger.warn(
											`${username}: Failed to save short URL for ${values[1]} (UUID: ${metadataItem.uuid}): ${err.message}`,
										);
										resolve(resp); // Resolve with default shortURL on error
									});
							});
						})
						.catch((err) =>
						{
							logger.error("Failed to get S3 URLs for image via getObjectURL", {
								username: username,
								imageUuid: metadataItem?.uuid,
								clientQuery: query,
								error: err,
							});
							return null; // Return null on error to filter out later
						});

					promises.push(onePromise);
				}

				Promise.all(promises)
					.then((values) =>
					{
						const validValues = values.filter((v) => v !== null); // Filter out nulls from errors
						try
						{
							// Wrap send
							ws.send(
								JSON.stringify({
									type: commands.GET_IMAGES,
									payload: validValues,
								}),
							);
						}
						catch (sendErr)
						{
							logger.error(
								`${username}: Failed to send GET_IMAGES response: ${sendErr.message}`,
							);
						}
					})
					.catch(
						(
							err, // This catch might be redundant if individual promises handle errors
						) =>
							logger.error(
								"Error in Promise.all for sendImages getObjectURL calls",
								{ username: username, clientQuery: query, error: err },
							),
					);
			})
			.catch((err) =>
			{
				logger.error("MongoDB aggregation failed in sendImages", {
					username: username,
					clientQuery: query,
					error: err,
				});
				try
				{
					// Try sending empty array on error
					ws.send(JSON.stringify({ type: commands.GET_IMAGES, payload: [] }));
				}
				catch (sendErr)
				{
					logger.error(
						"Failed to send empty GET_IMAGES response after aggregation error",
						{ username: username, clientQuery: query, error: sendErr },
					);
				}
			});
	}

	async getHips(names, zoom)
	{
		// This function seems incomplete and potentially problematic (mixing async/await with .then without proper return/await)
		// It should likely be refactored to use async/await consistently or Promise.all
		logger.warn(
			"getHips function usage detected - potential issues with async handling.",
		);
		let pendingNames = [];
		let data = [];
		for (const name of names)
		{
			const query = { name: { $eq: name }, zoom: { $eq: zoom } };
			try
			{
				const docs = await hipsModel.find(query); // Use await
				if (!isEmpty(docs))
				{
					data.push(docs); // This pushes an array of docs, might want docs[0]?
				}
				else
				{
					pendingNames.push(name); // Add to pending only if not found
				}
			}
			catch (err)
			{
				logger.error("Error retrieving HIPS data from DB", {
					hipsObjectName: name,
					zoomLevel: zoom,
					error: err,
				});
				pendingNames.push(name); // Assume pending if error occurs
			}
		}
		return { pendingNames: pendingNames, data: data }; // Data structure might need adjustment
	}

	addTag(username, ws, uuid, oneTag)
	{
		cloudModel
			.findOneAndUpdate(
				{ username, "metadatas.uuid": uuid },
				{ $push: { "metadatas.$.tags": oneTag } },
				{
					projection: { metadatas: { $elemMatch: { uuid: uuid } } },
					new: true,
					upsert: false, // Should not upsert if metadata doesn't exist
				},
			)
			.lean()
			.then((doc) =>
			{
				if (doc && doc.metadatas && doc.metadatas.length > 0)
				{
					// Check if doc and metadata exist
					try
					{
						// Wrap send
						ws.send(
							JSON.stringify({
								type: commands.UPDATE_METADATA,
								payload: doc.metadatas[0],
							}),
						);
					}
					catch (sendErr)
					{
						logger.error(
							"Failed to send UPDATE_METADATA WebSocket message after addTag",
							{
								username: username,
								imageUuid: uuid,
								tagAdded: oneTag,
								error: sendErr,
							},
						);
					}
				}
				else
				{
					logger.warn(
						`${username}: Failed to find metadata with UUID ${uuid} to add tag ${oneTag}`,
					);
					// Optionally notify the user
				}
			})
			.catch((err) =>
			{
				logger.error("Failed to update tag in DB for image metadata", {
					username: username,
					imageUuid: uuid,
					tag: oneTag,
					error: err,
				});
			});
	}

	// This removes ONE tag from the user's list of tags.
	// tags: [ {uuid: "123", tags: ["one","two","three"]}, {uuid: "456", tags: ["foo", "bar"]}
	// So if we want to remove foo, we send removeTab("jasem", ws, 456, "foo")
	removeTag(username, ws, uuid, oneTag)
	{
		cloudModel
			.findOneAndUpdate(
				{ username, "metadatas.uuid": uuid },
				{ $pull: { "metadatas.$.tags": oneTag } },
				{
					projection: { metadatas: { $elemMatch: { uuid: uuid } } },
					new: true,
				},
			)
			.lean()
			.then((doc) =>
			{
				if (doc && doc.metadatas && doc.metadatas.length > 0)
				{
					// Check if doc and metadata exist
					try
					{
						// Wrap send
						ws.send(
							JSON.stringify({
								type: commands.UPDATE_METADATA,
								payload: doc.metadatas[0],
							}),
						);
					}
					catch (sendErr)
					{
						logger.error(
							"Failed to send UPDATE_METADATA WebSocket message after removeTag",
							{
								username: username,
								imageUuid: uuid,
								tagRemoved: oneTag,
								error: sendErr,
							},
						);
					}
				}
				else
				{
					// This case might happen if the tag didn't exist or the metadata didn't exist
					logger.warn(
						`${username}: Metadata or tag not found for removeTag operation (UUID: ${uuid}, Tag: ${oneTag})`,
					);
					// Optionally send back the original metadata if needed, or a specific status
				}
			})
			.catch((err) =>
			{
				logger.error("Failed to remove tag from DB for image metadata", {
					username: username,
					imageUuid: uuid,
					tag: oneTag,
					error: err,
				});
			});
	}

	async updateObservatoryImagesCaptured(machineID)
	{
		try
		{
			await ObservatoryModel.findOneAndUpdate(
				{
					machine_id: machineID,
				},
				{ $inc: { images_captured: 1 } },
				{ upsert: false }, // Ensure it doesn't create a new doc if machine_id not found
			);
		}
		catch (error)
		{
			logger.error(
				"Failed to increment images_captured for observatory in DB",
				{ machineId: machineID, error: error },
			);
		}
	}

	updateEkosClientCloudSetting(username, cloudEnabled, planId)
	{
		// planId might still be useful for other logic, but not for enabling/disabling
		// Iterate over all ekosClients (Map)
		for (const [primaryID, ekosClient] of this.ekosClients)
		{
			if (ekosClient.username === username)
			{
				// Found the client for the user
				// All plans can enable cloud storage. The difference is quota.
				const newCloudEnabledState = cloudEnabled;

				if (ekosClient.cloudEnabled !== newCloudEnabledState)
				{
					ekosClient.cloudEnabled = newCloudEnabledState;
					logger.info(
						`MediaServer: Updated in-memory cloudEnabled for ${username} (PrimaryID: ${primaryID}) to ${ekosClient.cloudEnabled}`,
					);

					// If there's a connected user client associated with this ekosClient, update it too
					const userClient = this.getUserClient(username);
					if (userClient && userClient.machineID === primaryID)
					{
						userClient.cloudEnabled = ekosClient.cloudEnabled;
					}

					// Also inform the actual Ekos (KStars) client if it's connected
					if (
						ekosClient.connected &&
						ekosClient.ws &&
						ekosClient.ws.readyState === WebSocket.OPEN
					)
					{
						try
						{
							ekosClient.ws.send(
								JSON.stringify({
									type: commands.SET_CLOUD_ENABLED_STATUS, // Assuming a command to inform KStars
									payload: { cloudEnabled: ekosClient.cloudEnabled },
								}),
							);
							logger.info(
								`MediaServer: Sent SET_CLOUD_ENABLED_STATUS to KStars for ${username}`,
							);
						}
						catch (e)
						{
							logger.error(
								"Error sending SET_CLOUD_ENABLED_STATUS to KStars on cloud setting update",
								{
									username: username,
									primaryId: primaryID,
									machineId: ekosClient.machineID,
									attemptedCloudEnabled: ekosClient.cloudEnabled,
									error: e,
								},
							);
						}
					}
				}
				// If multiple ekosClients can be associated with one username (e.g. multiple devices),
				// we might want to continue iterating or break if only one is expected.
				// For now, assume we update all matching.
			}
		}
	}
	// triggerThumbnailCleanup is removed as thumbnails are not stored locally by mediaManager.
}

module.exports = wssMediaServerManager;
