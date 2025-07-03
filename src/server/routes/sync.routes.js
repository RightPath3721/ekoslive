const express = require("express");
const authMiddleware = require("../middlewares/auth");
const SyncController = require("../controller/sync");
const logger = require("../logger");
const syncData = require("../utils/syncData");
const { isEmpty, isArray } = require("lodash");
const SyncRoutes = express.Router();

// Endpoint for syncing
SyncRoutes.get("/", authMiddleware, async (req, res) =>
{
	const { username } = req.query;
	const { data } = req.body; // localAchievements is an array from the local/offline app

	try
	{
		const remoteData = await SyncController.getSyncData(username);

		res.json({ success: true, data: remoteData.payload });
		logger.debug("Remote data after getSyncData:", { remoteData });
	}
	catch (error)
	{
		logger.error("Error syncing data", error, {
			username,
			operation: "getSyncData"
		});
		res.status(500).json({ message: error.message });
	}
});

SyncRoutes.post("/", authMiddleware, async (req, res) =>
{
	const { username } = req.query;
	const { type, data } = req.body;
	let mergedData = [];
	let remoteData = {};
	try
	{
		const syncedData = await SyncController.getSyncData(username);

		if (isEmpty(syncedData) || isEmpty(syncedData[0].payload[type]))
			remoteData = [];
		else remoteData = syncedData[0].payload[type];

		mergedData = syncData(data, remoteData);

		await SyncController.createOrUpdateUserData(username, {
			type,
			data: mergedData,
		});

		res.json({
			success: true,
			payload: mergedData,
		});
	}
	catch (error)
	{
		logger.error("Error creating sync data", error, {
			username,
			operation: "createOrUpdateUserData",
			type
		});
		res.status(400).json({ message: error.message });
	}
});

module.exports = SyncRoutes;
