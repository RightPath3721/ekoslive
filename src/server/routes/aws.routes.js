const express = require("express");
const authMiddleware = require("../middlewares/auth");
const SyncController = require("../controller/sync");
const logger = require("../logger");
const syncData = require("../utils/syncData");
const { isEmpty, isArray } = require("lodash");
const {
	listStellarMateBackups,
	getStellarMateDownloadUrl,
	getStellarMateUploadUrl,
	enforceBackupLimit,
} = require("../utils/minio");
const AWSRoutes = express.Router();

// Endpoint for syncing
AWSRoutes.post("/", authMiddleware, async (req, res) =>
{
	const { username } = req.query;

	try
	{
		const backupFiles = await listStellarMateBackups(username);

		res.json({ success: true, files: backupFiles });
	}
	catch (error)
	{
		logger.error("Error getting backup list data", error, {
			username,
			operation: "listStellarMateBackups"
		});
		res.status(500).json({ message: error.message });
	}
});

// Generate download URL endpoint
AWSRoutes.post("/generate-download-url", async (req, res) =>
{
	try
	{
		const { filename, username } = req.body;
		if (!username)
		{
			return res.status(400).json({ success: false, error: "S3 key required" });
		}

		const downloadUrl = await getStellarMateDownloadUrl(
			`${username}/${filename}`,
		);

		res.json({
			success: true,
			url: downloadUrl,
			expires_in: 900,
		});
	}
	catch (error)
	{
		console.error("Generate download URL error:", error);
		res.status(500).json({ success: false, error: error.message });
	}
});

// Generate upload URL endpoint
AWSRoutes.post("/generate-upload-url", async (req, res) =>
{
	try
	{
		const { username, filename } = req.body;

		if (!username || !filename)
		{
			return res.status(400).json({
				success: false,
				error: "Username and filename required",
			});
		}

		const result = await getStellarMateUploadUrl(username, filename);

		console.log("result: ", result);
		res.json({
			success: true,
			...result,
		});
	}
	catch (error)
	{
		console.error("Generate upload URL error:", error);
		res.status(500).json({ success: false, error: error.message });
	}
});

// Endpoint to enforce backup limit
AWSRoutes.post("/backup/enforce-limit", async (req, res) =>
{
	try
	{
		const { username } = req.body;

		if (!username)
		{
			return res.status(400).json({
				success: false,
				error: "Username is required",
			});
		}

		const result = await enforceBackupLimit(username, 3);

		res.json({
			success: true,
			...result,
		});
	}
	catch (error)
	{
		res.status(500).json({
			success: false,
			error: error.message,
		});
	}
});

module.exports = AWSRoutes;
