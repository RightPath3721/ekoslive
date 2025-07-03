const mongoose = require("mongoose");
const axios = require("axios");
const userModel = require("./models/user");
const cloudModel = require("./models/cloud");
const { minioClient } = require("./utils/minio");
const logger = require("./logger");
const { database, s3Instance } = require("./config");

const url = "https://stellarmate.com/scripts/jauth_testing.php";
const stellarmateKey = process.env.STELLARMATE_KEY;

const delay = (ms) => new Promise((res) => setTimeout(res, ms));

const mergeUsers = async () =>
{
	// all the users
	const users = await userModel.find({});
	const duplicated_ids = [];

	for (let i = 0; i < users.length; i++)
	{
		logger.info(`iteration ${i}`);
		const user = users[i];

		if (duplicated_ids.includes(user._id?.toString()))
		{
			await userModel.findByIdAndDelete(user._id);
			continue;
		}

		// delay to not DDOS stellarmate.com
		if (i % 8 === 0 && i !== 0)
		{
			await delay(6000);
		}

		try
		{
			const { data: stellarmateData } = await axios.post(url, {
				key: stellarmateKey,
				username: user.username ?? user.email,
			});
			if (!stellarmateData.result)
			{
				throw new Error(stellarmateData.message);
			}
			const regex = new RegExp(
				`(${stellarmateData.username}|${stellarmateData.email?.replaceAll(".", "\\.")})`,
				"gi",
			);

			const duplicates = await userModel.find({
				$or: [{ username: regex }, { email: regex }],
			});
			duplicates.sort((a, b) => a.lastLogged - b.lastLogged);
			// all the ids for single user
			const duplicatedIds = duplicates.map((item) => item._id.toString());

			// go over the user's documents and merge them into one
			const mergedUser = duplicates.reduce((acc, item) =>
			{
				return {
					...mergeUserDocuments(acc, item._doc),
					username: stellarmateData.username,
					email: stellarmateData.email,
					plan_id: stellarmateData.plan_id,
				};
			}, {});

			// updated user document
			await userModel.findByIdAndUpdate(mergedUser._id, mergedUser);

			// added all the records for the single user to the duplicated_ids for skipping them in the next iterations
			duplicated_ids.push(...duplicatedIds);
			const cloudModels = await cloudModel.find({
				$or: [{ username: regex }, { email: regex }],
			});
			cloudModels.sort((a, b) => a.lastLogged - b.lastLogged);

			const cloudData = await mergeClouds(cloudModels, {
				plan_id: stellarmateData.plan_id,
				from_date: stellarmateData.from_date,
				to_date: stellarmateData.to_date,
				username: stellarmateData.username,
			});
			if (!cloudData)
			{
				continue;
			}
			else
			{
				await cloudModel.findByIdAndUpdate(cloudData.cloud._id, {
					...cloudData.cloud,
				});
				await cloudModel.deleteMany({
					_id: { $in: cloudData.duplicates },
				});
			}
		}
		catch (error)
		{
			logger.debug(
				`ignoring user: ${user.username ?? user.email} due to: ${error.message}`,
			);
		}
	}
	logger.debug("mongo users and clouds are up-to date");
};

const mergeUserDocuments = (user, duplicate) =>
{
	const observatories = [];
	if (user.observatories)
	{
		observatories.push(...user.observatories);
	}
	if (duplicate.observatories)
	{
		observatories.push(...duplicate.observatories);
	}
	return { ...user, ...duplicate, observatories };
};

const mergeClouds = async (clouds, userData) =>
{
	const metadatas = [],
		thumbnails = [],
		previews = [],
		sequences = [],
		schedules = [],
		tags = [],
		duplicates = [];
	let cloudModel;
	const objectnamesToRemove = [];

	for (let i = 0; i < clouds.length; i++)
	{
		const cloud = clouds[i];
		if (i !== clouds.length - 1)
		{
			duplicates.push(cloud._id);
		}
		cloudModel = cloud;
		sequences.push(...(cloud.sequences ?? []));
		schedules.push(...(cloud.schedules ?? []));
		tags.push(...(cloud.tags ?? []));
		for (let j = 0; j < cloud.metadatas.length; j++)
		{
			metadatas.push(cloud.metadatas[j]);
			thumbnails.push(cloud.thumbnails[j]);
			previews.push(cloud.previews[j]);
			if (j === cloud.metadatas.length - 1)
			{
				objectnamesToRemove.push(
					...cloud.previews
						.slice(j + 1, cloud.previews.length)
						.map((item) => item.objectname),
				);
				objectnamesToRemove.push(
					...cloud.thumbnails
						.slice(j + 1, cloud.thumbnails.length)
						.map((item) => item.objectname),
				);
			}
		}
	}

	if (!cloudModel)
	{
		return null;
	}
	else
	{
		try
		{
			await minioClient.removeObjects(s3Instance, objectnamesToRemove);
		}
		catch (error)
		{
			logger.error("Error removing objects from S3 bucket", error, {
				bucket: s3Instance,
				objectCount: objectnamesToRemove.length
			});
		}
		return {
			cloud: {
				...cloudModel._doc,
				metadatas,
				previews,
				thumbnails,
				sequences,
				schedules,
				tags,
				...userData,
			},
			duplicates,
		};
	}
};

const updateUsers = () =>
{
	mongoose
		.connect(database, { useNewUrlParser: true })
		.then(mergeUsers)
		.catch((err) => logger.error("Error running sync script", err));
};

updateUsers();
