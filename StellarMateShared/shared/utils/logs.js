import { APP_MODE } from "../../config";

export const logDebug = async (message) =>
{
	console.log(`${new Date().toISOString()} DEBG ${message}`);
};

export const logInfo = async (message) =>
{
	console.log(`${new Date().toISOString()} INFO ${message}`);
};

export const logWarn = async (message) =>
{
	console.log(`${new Date().toISOString()} WARN ${message}`);
};

export const logError = async (message) =>
{
	console.log(`${new Date().toISOString()} ERRO ${message}`);
};
