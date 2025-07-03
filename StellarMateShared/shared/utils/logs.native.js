import { FileLogger, LogLevel } from "react-native-file-logger";

export const logDebug = async (message) =>
{
	console.log(`${new Date().toISOString()} DEBG ${message}`);
	try
	{
		const currentLogLevel = FileLogger.getLogLevel();
		const level = LogLevel.Debug;
		if (currentLogLevel <= level) FileLogger.write(level, message);
	}
	catch (error)
	{
		console.log("logDebug error: ", error);
	}
};

export const logInfo = async (message) =>
{
	console.log(`${new Date().toISOString()} INFO ${message}`);
	try
	{
		const currentLogLevel = FileLogger.getLogLevel();
		const level = LogLevel.Info;
		if (currentLogLevel <= level) FileLogger.write(level, message);
	}
	catch (error)
	{
		console.log("logInfo error: ", error);
	}
};

export const logWarn = async (message) =>
{
	console.log(`${new Date().toISOString()} WARN ${message}`);
	try
	{
		const currentLogLevel = FileLogger.getLogLevel();
		const level = LogLevel.Warning;
		if (currentLogLevel <= level) FileLogger.write(level, message);
	}
	catch (error)
	{
		console.log("logWarn error:", error);
	}
};

export const logError = async (message) =>
{
	console.log(`${new Date().toISOString()} ERRO ${message}`);
	try
	{
		const currentLogLevel = FileLogger.getLogLevel();
		const level = LogLevel.Error;
		if (currentLogLevel <= level) FileLogger.write(level, message);
	}
	catch (error)
	{
		console.log("logError error: ", error);
	}
};
