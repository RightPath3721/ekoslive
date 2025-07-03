const express = require("express");
const authMiddleware = require("../middlewares/auth");
const AchievementController = require("../controller/achievement");
const logger = require("../logger");
const AchievementRoutes = express.Router();
const syncData = require("../utils/syncData");

AchievementRoutes.get("/", authMiddleware, async (req, res) =>
{
	const { username } = req.query;

	try
	{
		const achievements =
			await AchievementController.getUserAchievements(username);
		res.json(achievements);
	}
	catch (error)
	{
		logger.error("Error getting achievements for user", error, {
			username,
			operation: "getUserAchievements"
		});
		res.status(400).json({ message: error.message });
	}
});

AchievementRoutes.post("/", authMiddleware, async (req, res) =>
{
	const { username } = req.query;

	try
	{
		const achievement = await AchievementController.createUserAchievement(
			username,
			req.body,
		);
		res.json(achievement);
	}
	catch (error)
	{
		logger.error("Error creating achievement for user", error, {
			username,
			operation: "createUserAchievement",
			achievementData: req.body
		});
		res.status(400).json({ message: error.message });
	}
});

// Endpoint for syncing achievements
AchievementRoutes.post("/sync", authMiddleware, async (req, res) =>
{
	const { username } = req.query;
	const { localAchievements } = req.body; // localAchievements is an array from the local/offline app

	try
	{
		const remoteAchievements =
			await AchievementController.getUserAchievements(username);
		const mergedAchievements = syncData(localAchievements, remoteAchievements);
		const updatedAchievements =
			await AchievementController.updateUserAchievements(
				username,
				mergedAchievements,
			);

		res.json(updatedAchievements);
	}
	catch (error)
	{
		logger.error("Error syncing achievements for user", error, {
			username,
			operation: "syncAchievements",
			localAchievementsCount: localAchievements?.length || 0
		});
		res.status(500).json({ message: error.message });
	}
});

module.exports = AchievementRoutes;
