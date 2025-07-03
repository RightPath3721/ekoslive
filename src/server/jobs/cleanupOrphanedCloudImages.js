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

async function cleanupOrphanedImages()
{
	logger.info("Starting orphaned cloud images cleanup job...");

	try
	{
		await mongoose.connect(database, {
			useNewUrlParser: true,
			useUnifiedTopology: true,
		});
		logger.info("Successfully connected to MongoDB.");

		const cloudDocs = await cloudModel.find({});
		logger.info(`Found ${cloudDocs.length} documents in clouds collection.`);

		for (const doc of cloudDocs)
		{
			const username = doc.username;
			logger.info(`Processing user: ${username}`);

			const metadataUuids = new Set(doc.metadatas.map((m) => m.uuid));
			let updatesMade = false;

			// --- Process Previews ---
			const orphanedPreviews = doc.previews.filter(
				(p) => p.uuid && !metadataUuids.has(p.uuid),
			);
			const previewObjectsToRemoveS3 = orphanedPreviews
				.map((p) => p.objectname)
				.filter(Boolean);
			const previewUuidsToRemoveDB = orphanedPreviews.map((p) => p.uuid);

			if (previewObjectsToRemoveS3.length > 0)
			{
				logger.info(
					`${username}: Found ${previewObjectsToRemoveS3.length} orphaned preview S3 objects to remove.`,
				);
				try
				{
					await new Promise((resolve, reject) =>
					{
						minioClient.removeObjects(
							s3Instance,
							previewObjectsToRemoveS3,
							(err) =>
							{
								if (err)
								{
									logger.error("Error removing preview objects from S3", err, {
										username,
										objectCount: previewObjectsToRemoveS3.length,
										operation: "removePreviewObjects"
									});
									return reject(err);
								}
								logger.info(
									`${username}: Successfully removed ${previewObjectsToRemoveS3.length} preview objects from S3.`,
								);
								resolve();
							},
						);
					});
					// If S3 removal is successful, then prepare for DB update
					if (previewUuidsToRemoveDB.length > 0)
					{
						await cloudModel.updateOne(
							{ _id: doc._id },
							{
								$pull: { previews: { uuid: { $in: previewUuidsToRemoveDB } } },
							},
						);
						logger.info(
							`${username}: Successfully removed ${previewUuidsToRemoveDB.length} orphaned preview entries from DB.`,
						);
						updatesMade = true;
					}
				}
				catch (s3Error)
				{
					logger.error("Failed to remove preview S3 objects", s3Error, {
						username,
						objectCount: previewObjectsToRemoveS3.length,
						operation: "previewCleanup"
					});
				}
			}

			// --- Process Thumbnails ---
			const orphanedThumbnails = doc.thumbnails.filter(
				(t) => t.uuid && !metadataUuids.has(t.uuid),
			);
			const thumbnailObjectsToRemoveS3 = orphanedThumbnails
				.map((t) => t.objectname)
				.filter(Boolean);
			const thumbnailUuidsToRemoveDB = orphanedThumbnails.map((t) => t.uuid);

			if (thumbnailObjectsToRemoveS3.length > 0)
			{
				logger.info(
					`${username}: Found ${thumbnailObjectsToRemoveS3.length} orphaned thumbnail S3 objects to remove.`,
				);
				try
				{
					await new Promise((resolve, reject) =>
					{
						minioClient.removeObjects(
							s3Instance,
							thumbnailObjectsToRemoveS3,
							(err) =>
							{
								if (err)
								{
									logger.error("Error removing thumbnail objects from S3", err, {
										username,
										objectCount: thumbnailObjectsToRemoveS3.length,
										operation: "removeThumbnailObjects"
									});
									return reject(err);
								}
								logger.info(
									`${username}: Successfully removed ${thumbnailObjectsToRemoveS3.length} thumbnail objects from S3.`,
								);
								resolve();
							},
						);
					});
					// If S3 removal is successful, then prepare for DB update
					if (thumbnailUuidsToRemoveDB.length > 0)
					{
						await cloudModel.updateOne(
							{ _id: doc._id },
							{
								$pull: {
									thumbnails: { uuid: { $in: thumbnailUuidsToRemoveDB } },
								},
							},
						);
						logger.info(
							`${username}: Successfully removed ${thumbnailUuidsToRemoveDB.length} orphaned thumbnail entries from DB.`,
						);
						updatesMade = true;
					}
				}
				catch (s3Error)
				{
					logger.error("Failed to remove thumbnail S3 objects", s3Error, {
						username,
						objectCount: thumbnailObjectsToRemoveS3.length,
						operation: "thumbnailCleanup"
					});
				}
			}

			if (!updatesMade)
			{
				logger.info(`${username}: No orphaned images found.`);
			}
		}

		logger.info("Orphaned cloud images cleanup job finished.");
	}
	catch (error)
	{
		logger.error("Error during orphaned images cleanup job", error, {
			operation: "cleanupOrphanedImages"
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
	cleanupOrphanedImages()
		.then(() =>
		{
			process.exit(0);
		})
		.catch((err) =>
		{
			logger.error("Unhandled error in cleanup script", err, {
				operation: "scriptExecution"
			});
			process.exit(1);
		});
}

module.exports = cleanupOrphanedImages;
