const express = require("express");
const _ = require("lodash");
const cloudRoutes = express.Router();
const logger = require("../logger");
const CloudModel = require("../models/cloud");
const UserModel = require("../models/user");
const { s3AccessKey, s3SecretKey, secret, s3Instance } = require("../config");
const { max_basic_storage, max_pro_storage, max_ultimate_storage } = require("../shared");
const wstokenVerifier = require("../auth/ws-token-verifier");
const Minio = require("minio");
const { saveUrl } = require("../controller/link");
const multer = require("multer");
const upload = multer({ dest: "/tmp/uploads" });
const fs = require("fs/promises");
const authMiddleware = require("../middlewares/auth");
const { default: axios } = require("axios");

// Auth error handling
let throwFailed = function (res, message)
{
	logger.warn(message);
	return res.json({ result: false, message: message });
};

const minioClient = new Minio.Client({
	endPoint: "s3.amazonaws.com",
	useSSL: true,
	accessKey: s3AccessKey,
	secretKey: s3SecretKey,
});

// Maximum number of images to send over
// For now we send the first 100 matching
const MAX_IMAGES = 100;

// Get images metadata for specific user
cloudRoutes.get("/images", async function (req, res)
{
	const username = req.query.username;
	const user = await UserModel.findOne({ username });
	const token = req.query.token;
	let query = [];
	if ("query" in req.query) query = JSON.parse(req.query.query);

	if (wstokenVerifier(token, secret) === false)
		return throwFailed(res, username + ": Invalid token " + token);

	CloudModel.aggregate([
		{ $match: { username } },
		{
			$redact: {
				$cond: {
					if: {
						$or: [
							{
								$and: query,
							},
							{ $eq: ["$username", username] },
						],
					},
					then: "$$DESCEND",
					else: "$$PRUNE",
				},
			},
		},
		{ $limit: MAX_IMAGES },
		{
			$project: {
				_id: 0,
				uuids: "$thumbnails.uuid",
				metadatas: "$metadatas",
			},
		},
	])
		.then((matches) =>
		{
			if (matches[0].uuids === undefined || matches[0].uuids.length === 0)
			{
				return res.json({ result: true, payload: [] });
			}
			let metadatas = matches[0].metadatas;
			let uuids = matches[0].uuids;
			let promises = [];
			for (let i = 0; i < metadatas.length; i++)
			{
				const rawObjectName = "users/" + user._id + "/astronomy-images/raw/" + metadatas[i]?.uuid;
				const previewObjectName = "users/" + user._id + "/astronomy-images/previews/" + metadatas[i]?.uuid;
				const thumbObjectName = "users/" + user._id + "/astronomy-images/thumbnails/" + metadatas[i]?.uuid;

				let objectPromise = minioClient.presignedGetObject(
					s3Instance,
					rawObjectName,
				);
				let previewPromise = minioClient.presignedGetObject(
					s3Instance,
					previewObjectName,
				);
				let thumbPromise = minioClient.presignedGetObject(
					s3Instance,
					thumbObjectName,
				);

				const onePromise = Promise.all([
					objectPromise,
					previewPromise,
					thumbPromise,
				])
					.then((values) =>
					{
						return new Promise(function (resolve, reject)
						{
							let resp = {
								raw: values[0],
								src: values[1],
								shortURL: values[1],
								thumbnail: values[2],
								thumbnailWidth: metadatas[i].width,
								thumbnailHeight: metadatas[i].height,
								metadata: { ...metadatas[i], uuid: uuids[i] },
							};
							saveUrl(values[1])
								.then((newURL) =>
								{
									resp.shortURL = newURL;
									resolve(resp);
								})
								.catch((err) =>
								{
									logger.warn("Failed to save URL: " + err);
									reject(resp);
								});
						});
					})
					.catch((err) =>
					{
						return throwFailed(
							res,
							username +
							": GET_IMAGE promise failed for UUID: " +
							metadatas[i].uuid +
							" --> " +
							err,
						);
					});

				promises.push(onePromise);
			}

			Promise.all(promises)
				.then((values) =>
				{
					return res.json({ result: true, payload: values });
				})
				.catch((err) =>
				{
					return throwFailed(
						res,
						username + ": Failed to get thumbnails info --> " + err,
					);
				});
		})
		.catch((err) =>
		{
			return throwFailed(
				res,
				username + ": Failed to get thumbnails info --> " + err,
			);
		});
});

// Delete images for specific user
cloudRoutes.delete("/images", async function (req, res)
{
	const username = req.query.username;
	const user = await UserModel.findOne({ username });
	const token = req.query.token;
	const payload = req.body;

	if (wstokenVerifier(token, secret) === false)
		return throwFailed(res, username + ": Invalid token " + token);

	try
	{
		await CloudModel.findOneAndUpdate(
			{ username },
			{
				$pull: {
					metadatas: { uuid: { $in: payload } },
					thumbnails: { uuid: { $in: payload } },
					previews: { uuid: { $in: payload } },
				},
			},
			{ multi: true },
		);

		const objectsList = payload.reduce((acc, uuid) =>
		{
			const rawObject = `users/${user._id}/astronomy-images/raw/${uuid}`;
			const previewObject = `users/${user._id}/astronomy-images/previews/${uuid}`;
			const thumbnailObject = `users/${user._id}/astronomy-images/thumbnails/${uuid}`;
			return acc.concat([rawObject, previewObject, thumbnailObject]);
		}, []);

		await minioClient.removeObjects(s3Instance, objectsList);

		return res.json({ result: true });
	}
	catch (error)
	{
		logger.error("Error deleting cloud images", error, {
			username,
			operation: "deleteImages",
			payloadCount: payload?.length || 0
		});
		res.json({ status: false });
	}
});

// Upload raw image to cloud and save metadata in database
cloudRoutes.post("/raw", upload.single("raw"), async function (req, res)
{
	const username = req.body.username;
	const user = await UserModel.findOne({ username });
	const token = req.body.token;
	const filename = req.file.path;
	const metadata = JSON.parse(req.body.metadata);

	if (wstokenVerifier(token, secret) === false)
		return throwFailed(res, username + ": Invalid token " + token);

	const uuid = metadata["uuid"];
	const objectName = "users/" + user._id + "/astronomy-images/raw/" + uuid;
	// Upload now to AWS
	try
	{
		const etag = minioClient.fPutObject(s3Instance, objectName, filename, {
			"Content-Disposition": metadata["Content-Disposition"],
		});

		// Now that raw image was uploaded successfully, push metadata to database
		logger.info(username + ": Successfully uploaded raw file " + uuid);
		metadata.objectname = objectName;
		metadata.etag = etag;
		metadata.tags = [];

		// Record observation date stamp for easy sorting
		metadata.ts = new Date(metadata["date-obs"]);

		// Find the cloud document for user
		// and push into previews property a new metadata object
		CloudModel.findOneAndUpdate(
			{ username },
			{ $push: { ["metadatas"]: metadata } },
			{ new: true, upsert: true },
		).then((doc) =>
		{
			if (doc === null)
			{
				return throwFailed(res, "Failed to save raw.");
			}

			return res.json({ result: true });
		});
	}
	catch (error)
	{
		return throwFailed(
			res,
			username + ": Error uploading raw image UUID " + uuid + " " + error,
		);
	}
});

// Upload preview image to cloud and save metadata in database
cloudRoutes.post(
	"/preview",
	upload.single("preview"),
	async function (req, res)
	{
		const username = req.body.username;
		const user = await UserModel.findOne({ username });
		const token = req.body.token;
		const filename = req.file.path;
		const uuid = req.body.uuid;

		if (wstokenVerifier(token, secret) === false)
			return throwFailed(res, username + ": Invalid token " + token);

		const objectName = "users/" + user._id + "/astronomy-images/previews/" + uuid;
		// Upload now to AWS
		try
		{
			const etag = minioClient.fPutObject(s3Instance, objectName, filename);
			// Now that preview was uploaded successfully, push metadata to database
			logger.info(username + ": Successfully uploaded preview file " + uuid);
			let metadata = {};
			metadata.objectname = objectName;
			metadata.etag = etag;
			metadata.uuid = uuid;

			// Find the cloud document for user
			// and push into previews property a new metadata object
			CloudModel.findOneAndUpdate(
				{ username },
				{ $push: { ["previews"]: metadata } },
				{ new: true, upsert: true },
			).then((doc) =>
			{
				if (doc === null)
				{
					return throwFailed(res, "Failed to save preview.");
				}

				return res.json({ result: true });
			});
		}
		catch (error)
		{
			return throwFailed(
				res,
				username + ": Error uploading preview UUID " + uuid + " " + error,
			);
		}
	},
);

cloudRoutes.post(
	"/sequences",
	upload.single("file"),
	async function (req, res)
	{
		const username = req.body.username;
		const token = req.body.token;
		const filepath = req.body.path;
		const filename = req.body.filename;

		if (wstokenVerifier(token, secret) === false)
			return throwFailed(res, username + ": Invalid token " + token);

		const objectName = username + "/sequences/" + filename;
		// Upload now to AWS
		try
		{
			const buffer = await fs.readFile(req.file.path, (err, data) =>
			{
				if (err)
				{
					return res.json({ error: err });
				}
				else
				{
					return Buffer.from(data);
				}
			});
			const minioResponse = await minioClient.putObject(
				s3Instance,
				objectName,
				buffer,
			);

			// Now that preview was uploaded successfully, push metadata to database
			logger.info(
				username +
				": Successfully uploaded sequence file etag:" +
				minioResponse.etag,
			);
			// Find the cloud document for user
			// and push into previews property a new metadata object
			await CloudModel.findOneAndUpdate(
				{ username },
				{ $setOnInsert: { sequences: [] } },
				{ upsert: true },
			);

			await CloudModel.findOneAndUpdate(
				{ username },
				{
					$push: {
						sequences: {
							etag: minioResponse.etag,
							filepath,
							objectName,
							filename,
						},
					},
				},
			).then((doc) =>
			{
				if (doc === null)
				{
					return throwFailed(res, "Failed to save preview.");
				}
				return res.json({
					result: true,
					sequence: { etag: minioResponse.etag, filepath, objectName },
				});
			});
		}
		catch (error)
		{
			return throwFailed(
				res,
				username + ": Error uploading sequence file " + error,
			);
		}
	},
);

cloudRoutes.post(
	"/scheduler",
	upload.single("file"),
	async function (req, res)
	{
		const username = req.body.username;
		const token = req.body.token;
		const filename = req.body.filename;

		if (wstokenVerifier(token, secret) === false)
			return throwFailed(res, username + ": Invalid token " + token);

		const objectName = username + "/schedules/" + filename;
		// Upload now to AWS
		try
		{
			const buffer = await fs.readFile(req.file.path, (err, data) =>
			{
				if (err)
				{
					return res.json({ error: err });
				}
				else
				{
					return Buffer.from(data);
				}
			});
			const minioResponse = await minioClient.putObject(
				s3Instance,
				objectName,
				buffer,
			);

			logger.info(
				username +
				": Successfully uploaded schedule file etag:" +
				minioResponse.etag,
			);
			// Find the cloud document for user
			// and push into previews property a new object
			await CloudModel.findOneAndUpdate(
				{ username },
				{ $setOnInsert: { schedules: [] } },
				{ upsert: true },
			);

			await CloudModel.findOneAndUpdate(
				{ username },
				{
					$push: {
						schedules: {
							etag: minioResponse.etag,
							objectName,
							filename,
						},
					},
				},
				{ new: true, upsert: true },
			).then((doc) =>
			{
				if (doc === null)
				{
					return throwFailed(res, "Failed to save preview.");
				}
				return res.json({
					result: true,
					schedule: { etag: minioResponse.etag, objectName },
				});
			});
		}
		catch (error)
		{
			return throwFailed(
				res,
				username + ": Error uploading schedule file " + error,
			);
		}
	},
);

cloudRoutes.get("/sequences", async (req, res) =>
{
	const username = req.query.username;
	const token = req.query.token;

	if (wstokenVerifier(token, secret) === false)
		return throwFailed(res, username + ": Invalid token " + token);

	const sequences = await CloudModel.findOne({ username }).select("sequences");
	const sequencesList = await Promise.all(
		sequences.sequences.map(async ({ objectName, filename, filepath }) =>
		{
			const url = await minioClient.presignedGetObject(s3Instance, objectName);
			return { objectName, filename, url, filepath };
		}),
	);
	res.json({ sequences: sequencesList });
});

cloudRoutes.post("/onesequence", async (req, res) =>
{
	const username = req.query.username;
	const token = req.query.token;
	const filename = req.body.filename;
	let isScheduler = false;
	if (!_.isEmpty(filename) && filename.includes("esl")) isScheduler = true;
	let sequence = "";

	if (wstokenVerifier(token, secret) === false)
	{
		return throwFailed(res, `${username}: Invalid token ${token}`);
	}

	try
	{
		// Retrieve user sequences from the database
		const user = await CloudModel.findOne({ username }).select("sequences");
		if (isScheduler)
		{
			const name = filename;
			const schedules = await CloudModel.findOne({ username }).select(
				"schedules",
			);
			if (!_.isEmpty(schedules))
			{
				await Promise.all(
					schedules.schedules.map(async ({ objectName, filename }) =>
					{
						if (filename === name)
						{
							sequence = objectName;
						}
					}),
				);
			}
		}
		else
		{
			if (!_.isEmpty(user.sequences))
			{
				const sequences = user.sequences;
				sequences.map((oneSequence) =>
				{
					if (_.get(oneSequence, "filename", "") === filename)
					{
						sequence = _.get(oneSequence, "objectName", "");
					}
				});
			}
		}
		// Generate a presigned URL to access the file
		const url = await minioClient.presignedGetObject(s3Instance, sequence);

		// Fetch the file content from the presigned URL
		const response = await axios.get(url, { responseType: "text" });
		const fileContent = response.data;

		// Return the file content to the client
		res.status(200).json({ content: fileContent });
	}
	catch (error)
	{
		console.error("Error fetching sequence file:", error.message);
		res
			.status(500)
			.json({ error: "Failed to retrieve sequence file content." });
	}
});

cloudRoutes.post("/delete-file", async (req, res) =>
{
	const username = req.query.username;
	const token = req.query.token;
	const filename = req.body.filename;

	let isScheduler = false;
	if (!_.isEmpty(filename) && filename.includes("esl")) isScheduler = true;

	if (wstokenVerifier(token, secret) === false)
	{
		return throwFailed(res, `${username}: Invalid token ${token}`);
	}

	try
	{
		if (isScheduler)
		{
			// Delete from schedules
			const user = await CloudModel.findOne({ username });
			if (!_.isEmpty(user.schedules))
			{
				const schedules = user.schedules.filter(
					(schedule) => schedule.filename !== filename,
				);

				// Update schedules in the database
				await CloudModel.updateOne({ username }, { $set: { schedules } });
			}
		}
		else
		{
			// Delete from sequences
			const user = await CloudModel.findOne({ username });
			if (!_.isEmpty(user.sequences))
			{
				const sequences = user.sequences.filter(
					(sequence) => sequence.filename !== filename,
				);

				// Update sequences in the database
				await CloudModel.updateOne({ username }, { $set: { sequences } });
			}
		}

		res.status(200).json({ message: "File deleted successfully." });
	}
	catch (error)
	{
		console.error("Error deleting sequence/schedule:", error.message);
		res.status(500).json({ error: "Failed to delete sequence or schedule." });
	}
});

cloudRoutes.get("/scheduler", async (req, res) =>
{
	const username = req.query.username;
	const token = req.query.token;

	if (wstokenVerifier(token, secret) === false)
		return throwFailed(res, username + ": Invalid token " + token);

	const schedules = await CloudModel.findOne({ username }).select("schedules");
	const schedulesList = await Promise.all(
		schedules.schedules.map(async ({ objectName, filename }) =>
		{
			const url = await minioClient.presignedGetObject(s3Instance, objectName);
			return { objectName, filename, url };
		}),
	);
	res.json({ sequences: schedulesList });
});

// Upload thumbnail image to cloud and save metadata in database
cloudRoutes.post(
	"/thumbnail",
	upload.single("thumbnail"),
	async function (req, res)
	{
		const username = req.body.username;
		const user = await UserModel.findOne({ username });
		const token = req.body.token;
		const filename = req.file.path;
		const uuid = req.body.uuid;
		const info = JSON.parse(req.body.info);

		if (wstokenVerifier(token, secret) === false)
			return throwFailed(res, username + ": Invalid token " + token);

		//const data = Buffer.from(buffer.data);

		const objectName = "users/" + user._id + "/astronomy-images/thumbnails/" + uuid;
		// Upload now to AWS
		try
		{
			const etag = minioClient.fPutObject(s3Instance, objectName, filename);

			// Now that preview was uploaded successfully, push metadata to database
			logger.info(username + ": Successfully uploaded thumbnail file " + uuid);
			let metadata = {};
			metadata.objectname = objectName;
			metadata.etag = etag;
			metadata.uuid = uuid;
			metadata.width = info.width;
			metadata.height = info.height;

			// Find the cloud document for user
			// and push into previews property a new metadata object
			CloudModel.findOneAndUpdate(
				{ username },
				{ $push: { ["thumbnails"]: metadata } },
				{ new: true, upsert: true },
			).then((doc) =>
			{
				if (doc === null)
				{
					return throwFailed(res, "Failed to save thumbnail.");
				}

				return res.json({ result: true });
			});
		}
		catch (error)
		{
			return throwFailed(res, error);
		}
	},
);

// Add tag to database
cloudRoutes.post("/tag", async function (req, res)
{
	const username = req.body.username;
	const token = req.body.token;
	const uuid = req.body.uuid;
	const tag = req.body.tag;

	if (wstokenVerifier(token, secret) === false)
		return throwFailed(res, username + ": Invalid token " + token);

	CloudModel.findOneAndUpdate(
		{ username, "metadatas.uuid": uuid },
		{ $push: { "metadatas.$.tags": tag } },
		{
			projection: { metadatas: { $elemMatch: { uuid: uuid } } },
			new: true,
			upsert: true,
		},
	)
		.lean()
		.then((doc) =>
		{
			//ws.send(JSON.stringify({type: commands.UPDATE_METADATA, payload: doc.metadatas[0]}));
			return res.json({ result: true, payload: doc.metadatas[0] });
		})
		.catch((err) =>
		{
			return throwFailed(
				res,
				username +
				": Failed to update tag " +
				tag +
				" with UUID " +
				uuid +
				" --> " +
				err.code,
			);
		});
});

// Delete tag from database
cloudRoutes.delete("/tag", async function (req, res)
{
	const username = req.query.username;
	const token = req.query.token;
	const uuid = req.query.uuid;
	const tag = req.query.tag;

	if (wstokenVerifier(token, secret) === false)
		return throwFailed(res, username + ": Invalid token " + token);

	CloudModel.findOneAndUpdate(
		{ username, "metadatas.uuid": uuid },
		{ $pull: { "metadatas.$.tags": tag } },
		{
			projection: { metadatas: { $elemMatch: { uuid: uuid } } },
			new: true,
		},
	)
		.lean()
		.then((doc) =>
		{
			//ws.send(JSON.stringify({type: commands.UPDATE_METADATA, payload: doc.metadatas[0]}));
			return res.json({ result: true, payload: doc.metadatas[0] });
		})
		.catch((err) =>
		{
			return throwFailed(
				res,
				username +
				": Failed to remove tag " +
				tag +
				" with UUID " +
				uuid +
				" --> " +
				err.code,
			);
		});
});

cloudRoutes.delete("/reset", authMiddleware, async (req, res) =>
{
	const username = req.query.username;

	try
	{
		await CloudModel.findOneAndUpdate(
			{ username },
			{ metadatas: [], previews: [], thumbnails: [] },
		);
		res.json({ success: true });
	}
	catch (error)
	{
		logger.error("Error resetting cloud data", error, {
			username,
			operation: "resetCloudData"
		});
		res.json({ success: false });
	}
});

// Get user's cloud storage usage
cloudRoutes.get("/usage", authMiddleware, async function (req, res)
{
	const username = req.query.username;

	try
	{
		// Get user's cloud data
		const cloudData = await CloudModel.findOne({ username }).select("storage plan_id");

		if (!cloudData)
		{
			return res.json({
				result: false,
				message: "User not found"
			});
		}

		// Get storage usage
		const storage = cloudData.storage || 0;

		// Determine plan and max storage
		const plan_id = Number(cloudData.plan_id || 2); // Default to basic plan (2)

		// Get max storage based on plan
		let maxStorage;
		switch (plan_id)
		{
			case 1: // Pro
			case 4: // Pro
				maxStorage = max_pro_storage;
				break;
			case 3: // Ultimate
			case 5: // Ultimate
				maxStorage = max_ultimate_storage;
				break;
			default: // Basic or any other
				maxStorage = max_basic_storage;
		}

		return res.json({
			result: true,
			usage: storage,
			limit: maxStorage,
			percentage: Math.min(Math.round((storage / maxStorage) * 100), 100)
		});
	} catch (error)
	{
		logger.error("Error getting cloud storage usage", error, {
			username,
			operation: "getCloudStorageUsage"
		});
		return res.json({
			result: false,
			message: "Error getting cloud storage usage"
		});
	}
});

module.exports = cloudRoutes;
