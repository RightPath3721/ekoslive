const fs = require("fs/promises");
const Minio = require("minio");
const logger = require("../logger");

const { s3AccessKey, s3SecretKey, s3Instance } = require("../config");

const minioClient = new Minio.Client({
	endPoint: "s3.amazonaws.com",
	useSSL: true,
	accessKey: s3AccessKey,
	secretKey: s3SecretKey,
});

/**
 * Saves an image to a AWS bucket.
 * @param {string} objectName - The name of the object to be stored in the bucket.
 * @param {object} file - The file object representing the image to be uploaded.
 * @returns {Promise<void>} A promise that resolves when the image is successfully uploaded to the bucket.
 * @throws {Error} If there is an error reading the file.
 */
const saveImgInBucket = async (objectName, file) =>
{
	const buffer = await fs.readFile(file.path, (err, data) =>
	{
		if (err)
		{
			throw new Error(err);
		}
		else
		{
			return Buffer.from(data);
		}
	});
	await minioClient.putObject(s3Instance, objectName, buffer);
};

const saveThumbnailInBucket = async (objectName, file) =>
{
	const buffer = await fs.readFile(file.thumbnailPath, (err, data) =>
	{
		if (err)
		{
			throw new Error(err);
		}
		else
		{
			return Buffer.from(data);
		}
	});
	await minioClient.putObject(s3Instance, objectName, buffer);
};

/**
 * Generates a presigned URL to access an object from Aws bucket.

 * @param {string} objectName - The name of the object in the bucket for which to generate the URL.
 * @returns {Promise<string>} A promise that resolves to the presigned URL for the specified object.
 * @throws {Error} If there is an error generating the presigned URL.
 */
const getObjectUrl = async (objectName) =>
{
	return await minioClient.presignedGetObject(s3Instance, objectName);
};

/**
 * Deletes an object from the AWS bucket.
 * @param {string|string[]} objectName - The name of the object to delete.
 * @returns {Promise<void>} A promise that resolves when the object is deleted.
 * @throws {Error} If there's an error deleting the object.
 */
const deleteImgFromBucket = async (objectName) =>
{
	if (typeof objectName === "string")
	{
		return await minioClient.removeObject(s3Instance, objectName);
	}
	else
	{
		return await Promise.all(
			objectName.map((name) => minioClient.removeObject(s3Instance, name)),
		);
	}
};

/**
 * Utility function to format file size
 * @param {number} bytes - File size in bytes
 * @returns {string} Formatted file size
 */
const formatFileSize = (bytes) =>
{
	const units = ["B", "KB", "MB", "GB", "TB"];
	let size = bytes;
	let unitIndex = 0;

	while (size >= 1024 && unitIndex < units.length - 1)
	{
		size /= 1024;
		unitIndex++;
	}

	return `${size.toFixed(1)} ${units[unitIndex]}`;
};

/**
 * Lists backup files for a specific user from the StellarMate bucket
 * @param {string} username - The username to list backups for
 * @returns {Promise<Array>} Array of backup file objects
 */
const listStellarMateBackups = async (username) =>
{
	try
	{
		const bucketName = "stellarmate";
		const prefix = `${username}/stellarmate_backup_`;

		// List objects with prefix
		const stream = minioClient.listObjectsV2(bucketName, prefix, true);
		const files = [];

		return new Promise((resolve, reject) =>
		{
			stream.on("data", (obj) =>
			{
				if (obj.name.endsWith(".tar.gz"))
				{
					const keyParts = obj.name.split("/");
					const filename = keyParts[keyParts.length - 1];

					files.push({
						filename: filename,
						size: formatFileSize(obj.size),
						last_modified: obj.lastModified.toISOString(),
						path: `s3://${bucketName}/${obj.name}`,
						source: "s3",
						s3_key: obj.name,
					});
				}
			});

			stream.on("error", (err) =>
			{
				reject(err);
			});

			stream.on("end", () =>
			{
				// Sort by last modified date
				files.sort(
					(a, b) => new Date(b.last_modified) - new Date(a.last_modified),
				);
				resolve(files);
			});
		});
	}
	catch (error)
	{
		throw new Error(`Failed to list backups: ${error.message}`);
	}
};

/**
 * Generates a presigned URL for downloading a StellarMate backup file
 * @param {string} s3Key - The S3 key of the file to download
 * @param {number} expiry - URL expiry time in seconds (default: 900)
 * @returns {Promise<string>} Presigned download URL
 */
const getStellarMateDownloadUrl = async (s3Key, expiry = 900) =>
{
	try
	{
		const bucketName = "stellarmate";
		return await minioClient.presignedGetObject(bucketName, s3Key, expiry);
	}
	catch (error)
	{
		throw new Error(`Failed to generate download URL: ${error.message}`);
	}
};

/**
 * Generates a presigned URL for uploading a StellarMate backup file
 * @param {string} username - The username for the backup
 * @param {string} filename - The filename to upload
 * @param {number} expiry - URL expiry time in seconds (default: 900)
 * @returns {Promise<Object>} Object containing upload URL and S3 key
 */
const getStellarMateUploadUrl = async (username, filename, expiry = 2000) =>
{
	try
	{
		const bucketName = "stellarmate";
		const s3Key = `${username}/${filename}`;

		// Generate presigned PUT URL
		const uploadUrl = await minioClient.presignedPutObject(
			bucketName,
			s3Key,
			expiry,
		);

		return {
			uploadUrl,
			s3Key,
			expiresIn: expiry,
		};
	}
	catch (error)
	{
		throw new Error(`Failed to generate upload URL: ${error.message}`);
	}
};

/**
 * Enforces backup limit for a user by deleting oldest backups
 * @param {string} username - The username to enforce limit for
 * @param {number} maxBackups - Maximum number of backups to keep (default: 3)
 * @returns {Promise<Object>} Result of the operation
 */
const enforceBackupLimit = async (username, maxBackups = 3) =>
{
	try
	{
		const bucketName = "stellarmate";
		const prefix = `${username}/stellarmate_backup_`;

		const stream = minioClient.listObjectsV2(bucketName, prefix, true);
		const files = [];

		return new Promise((resolve, reject) =>
		{
			stream.on("data", (obj) =>
			{
				if (obj.name.endsWith(".tar.gz"))
				{
					files.push({
						name: obj.name,
						lastModified: obj.lastModified,
						size: obj.size,
					});
				}
			});

			stream.on("error", (err) =>
			{
				reject(err);
			});

			stream.on("end", async () =>
			{
				files.sort((a, b) => a.lastModified - b.lastModified);

				if (files.length <= maxBackups)
				{
					resolve({
						success: true,
						message: `Within backup limit (${files.length}/${maxBackups})`,
						deletedFiles: [],
					});
					return;
				}

				const filesToDelete = files.length - maxBackups;
				const deletedFiles = [];

				// Delete the oldest files
				for (let i = 0; i < filesToDelete; i++)
				{
					try
					{
						const fileToDelete = files[i].name;
						await minioClient.removeObject(bucketName, fileToDelete);
						deletedFiles.push(fileToDelete);
					}
					catch (deleteError)
					{
						logger.error("Failed to delete backup file", deleteError, {
							operation: "enforceBackupLimit",
							username,
							filename: files[i].name,
							bucketName
						});
					}
				}

				resolve({
					success: true,
					message: `Deleted ${deletedFiles.length} old backup(s)`,
					deletedFiles: deletedFiles,
					remainingFiles: files.length - deletedFiles.length,
				});
			});
		});
	}
	catch (error)
	{
		logger.error("Error enforcing backup limit for user", error, {
			operation: "enforceBackupLimit",
			username,
			maxBackups
		});
	}
};

module.exports = {
	saveImgInBucket,
	saveThumbnailInBucket,
	getObjectUrl,
	minioClient,
	deleteImgFromBucket,
	getStellarMateDownloadUrl,
	listStellarMateBackups,
	getStellarMateUploadUrl,
	enforceBackupLimit,
};
