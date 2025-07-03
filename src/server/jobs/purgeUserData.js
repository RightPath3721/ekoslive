const mongoose = require("mongoose");
const Minio = require("minio");
const cloudModel = require("../models/cloud");
const logger = require("../logger");
const { database, s3AccessKey, s3SecretKey, s3Instance } = require("../config");

// Initialize Minio Client
const minioClient = new Minio.Client({
	endPoint: "s3.amazonaws.com", // Or your S3 endpoint
	useSSL: true,
	accessKey: s3AccessKey,
	secretKey: s3SecretKey,
});

async function purgeUserData(targetUsername)
{
	if (!targetUsername)
	{
		logger.error("Username argument is required", new Error("Missing username argument"), {
			usage: "node purgeUserData.js <username>",
			operation: "validateArguments"
		});
		process.exit(1);
	}

	logger.info(`Starting data purge for user: ${targetUsername}...`);

	try
	{
		await mongoose.connect(database, {
			useNewUrlParser: true,
			useUnifiedTopology: true,
		});
		logger.info("Successfully connected to MongoDB.");

		const userDoc = await cloudModel.findOne({ username: targetUsername });

		if (!userDoc)
		{
			logger.warn(`User ${targetUsername} not found in the database.`);
			return;
		}

		logger.info(`Found user ${targetUsername}. Preparing to purge data.`);

		const metadataObjects = userDoc.metadatas
			.map((m) => m.objectname)
			.filter(Boolean);
		const previewObjects = userDoc.previews
			.map((p) => p.objectname)
			.filter(Boolean);
		const thumbnailObjects = userDoc.thumbnails
			.map((t) => t.objectname)
			.filter(Boolean);

		const allS3ObjectsToRemove = [
			...metadataObjects,
			...previewObjects,
			...thumbnailObjects,
		];

		if (allS3ObjectsToRemove.length > 0)
		{
			logger.info(
				`${targetUsername}: Found ${allS3ObjectsToRemove.length} S3 objects to remove.`,
			);
			await new Promise((resolve, reject) =>
			{
				minioClient.removeObjects(s3Instance, allS3ObjectsToRemove, (err) =>
				{
					if (err)
					{
						// Log error but proceed, as some objects might be already deleted or non-critical
						logger.error("Error removing some objects from S3", err, {
							targetUsername,
							objectCount: allS3ObjectsToRemove.length,
							operation: "removeS3Objects"
						});
					}
					else
					{
						logger.info(
							`${targetUsername}: Successfully removed ${allS3ObjectsToRemove.length} objects from S3 (or they were already absent).`,
						);
					}
					resolve(); // Resolve even if there are errors to allow DB cleanup
				});
			});
		}
		else
		{
			logger.info(`${targetUsername}: No S3 objects found to remove.`);
		}

		// Remove the user's entire document from MongoDB
		logger.info(
			`${targetUsername}: Attempting to remove user document from MongoDB...`,
		);
		const deletionResult = await cloudModel.deleteOne({
			username: targetUsername,
		});

		if (deletionResult.deletedCount > 0)
		{
			logger.info(
				`${targetUsername}: Successfully removed user document from MongoDB.`,
			);
		}
		else
		{
			logger.warn(
				`${targetUsername}: User document was not found or already removed from MongoDB.`,
			);
		}

		logger.info(`Data purge for user ${targetUsername} finished.`);
	}
	catch (error)
	{
		logger.error("Error during data purge for user", error, {
			targetUsername,
			operation: "purgeUserData"
		});
	}
	finally
	{
		try
		{
			await mongoose.disconnect();
			logger.info("Disconnected from MongoDB.");
		}
		catch (disconnectError)
		{
			logger.error("Error disconnecting from MongoDB", disconnectError, {
				operation: "mongoDisconnect"
			});
		}
	}
}

// Allow running the script directly
if (require.main === module)
{
	const usernameArg = process.argv[2];
	purgeUserData(usernameArg)
		.then(() =>
		{
			process.exit(0);
		})
		.catch((err) =>
		{
			logger.error("Unhandled error in purgeUserData script", err, {
				targetUsername: usernameArg,
				operation: "scriptExecution"
			});
			process.exit(1);
		});
}

module.exports = purgeUserData;
