const winston = require("winston");
const { createLogger, format, transports } = winston; // Use winston here
const DailyRotateFile = require("winston-daily-rotate-file");

const { combine, timestamp, printf, json, errors, colorize } = format;

// Define the severity levels (good to have them explicitly)
const levels = {
	error: 0,
	warn: 1,
	info: 2,
	http: 3,
	verbose: 4,
	debug: 5,
	silly: 6,
};

// Define different colors for each level (for console)
const colors = {
	error: "red",
	warn: "yellow",
	info: "green",
	http: "magenta",
	debug: "blue", // Changed from white for better visibility on some backgrounds
};
// Tell winston that you want to link the colors
winston.addColors(colors); // Corrected: Use winston.addColors

// --- Formats ---
// Human-readable format for the console during development
const developmentConsoleFormat = combine(
	colorize(), // Apply colors
	timestamp({ format: "YYYY-MM-DD HH:mm:ss.SSS" }),
	printf((info) =>
	{
		let log = `${info.timestamp} ${info.level}: ${info.message}`;
		// Attempt to stringify any additional metadata if it's an object
		const metadata = Object.assign({}, info, {
			level: undefined,
			message: undefined,
			splat: undefined,
			timestamp: undefined,
			service: undefined, // Assuming 'service' is defaultMeta
			label: undefined, // Winston might add this
			[Symbol.for("level")]: undefined, // Winston internal symbols
			[Symbol.for("message")]: undefined,
		});
		// Remove undefined keys from metadata before stringifying
		Object.keys(metadata).forEach(
			(key) => metadata[key] === undefined && delete metadata[key],
		);
		if (Object.keys(metadata).length > 0)
		{
			try
			{
				log += ` ${JSON.stringify(metadata)}`;
			}
			catch (e)
			{
				// Fallback if stringify fails (e.g. circular structures not handled by default)
				log += ` [unable to stringify metadata]`;
			}
		}
		if (info.stack)
		{
			// Include stack for errors
			log += `\n${info.stack}`;
		}
		return log;
	}),
);

// Structured JSON format for all transports
const fileJsonFormat = combine(
	timestamp(),
	errors({ stack: true }), // Capture stack traces
	format((info) =>
	{
		const { message, level, timestamp, stack, ...metadata } = info;
		const logEntry = {
			level,
			timestamp,
			message,
			...metadata, // Merge other properties (metadata)
		};
		if (stack)
		{
			logEntry.stack = stack;
		}
		return logEntry;
	})(),
	json(),
);

// --- Logger Creation ---
const logger = createLogger({
	levels, // Use defined levels
	level: process.env.NODE_ENV === "development" ? "debug" : "info", // Default level
	format: fileJsonFormat, // Default format for transports will be JSON
	defaultMeta: { service: "ekoslive-server" }, // Default metadata for all logs
	transports: [], // Initialize with no transports; add them below
});

// --- Transports ---
// Console Transport
if (process.env.NODE_ENV === "development")
{
	logger.add(
		new transports.Console({
			format: developmentConsoleFormat, // Use human-readable for dev console
			level: "debug", // Show debug logs in dev console
		}),
	);
}
else
{
	// For production, you might still want console logs, but in JSON format
	// if you're using a log shipper that reads from stdout (e.g., in Docker/Kubernetes)
	logger.add(
		new transports.Console({
			format: fileJsonFormat, // JSON for production console
			level: "info", // Or your desired production console log level
		}),
	);
}

// File Transports (now using fileJsonFormat)
logger.add(
	new DailyRotateFile({
		filename: "logs/error-%DATE%.log", // Added %DATE% for consistency
		datePattern: "YYYY-MM-DD",
		level: "error",
		format: fileJsonFormat, // Explicitly set JSON format
		maxSize: "10m",
		maxFiles: "14d",
		zippedArchive: true, // Good to have for error logs too
	}),
);
logger.add(
	new DailyRotateFile({
		filename: "logs/access-%DATE%.log", // Added %DATE%
		datePattern: "YYYY-MM-DD",
		level: "info", // This will include error, warn, info
		format: fileJsonFormat, // Explicitly set JSON format
		maxSize: "10m",
		maxFiles: "7d",
		zippedArchive: true,
	}),
);
logger.add(
	new DailyRotateFile({
		filename: "logs/debug-%DATE%.log",
		datePattern: "YYYY-MM-DD", // Simplified pattern, HH can make too many files
		level: "debug", // This will include all levels
		format: fileJsonFormat, // Explicitly set JSON format
		zippedArchive: true,
		maxSize: "20m",
		maxFiles: "7d",
	}),
);

module.exports = logger;
