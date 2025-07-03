const { createLogger, format, transports } = require("winston");
const { combine, timestamp } = format;

const subscriptionLogger = createLogger({
	format: combine(
		timestamp(),
		format.printf((info) => `${info.timestamp} ${info.level}: ${info.message}`),
	),
});

if (process.env.NODE_ENV === "development")
	subscriptionLogger.add(new transports.Console());

const DailyRotateFile = require("winston-daily-rotate-file");

subscriptionLogger.add(
	new DailyRotateFile({
		filename: "logs/subscriptions/error.log",
		level: "error",
		maxSize: "10m",
		maxFiles: "40d",
	}),
);
subscriptionLogger.add(
	new DailyRotateFile({
		filename: "logs/subscriptions/access.log",
		level: "info",
		maxFiles: "40d",
	}),
);
subscriptionLogger.add(
	new DailyRotateFile({
		filename: "logs/subscriptions/debug-%DATE%.log",
		datePattern: "YYYY-MM-DD-HH",
		maxFiles: "40d",
		level: "debug",
	}),
);

module.exports = subscriptionLogger;
