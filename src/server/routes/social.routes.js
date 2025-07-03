const express = require("express");
const socialRoutes = express.Router();
const SocialController = require("../controller/social");
const authMiddleware = require("../middlewares/auth");
const { getObjectUrl } = require("../utils/minio");
const { upload, convertToWebP } = require("../utils/multerUpload");
const logger = require("../logger");

socialRoutes.get("/", authMiddleware, async (req, res) =>
{
	const { username } = req.query;
	try
	{
		const socialProfile =
			await SocialController.findSocialProfileByUsername(username);
		if (socialProfile) {
			if (socialProfile.avatar)
			{
				const avatarUrl = await getObjectUrl(socialProfile.avatar);
				socialProfile.avatar = avatarUrl;
			}
			if (socialProfile.profile_background)
			{
				const backgroundUrl = await getObjectUrl(
					socialProfile.profile_background,
				);
				socialProfile.profile_background = backgroundUrl;
			}
			res.status(200).json({ socialProfile });
		} else {
			// User exists, but no social profile found
			res.status(200).json({ socialProfile: null });
		}
	}
	catch (error)
	{
		if (error.message === "User not found") {
			res.status(404).json({ message: "User not found" });
		} else {
			logger.error("Error fetching social profile", error, {
				username,
				operation: "findSocialProfileByUsername"
			});
			res.status(500).json({ error: "An internal server error occurred while fetching the social profile." });
		}
	}
});

socialRoutes.post("/", authMiddleware, async (req, res) =>
{
	const { username } = req.query;
	const { userData } = req.body;
	try
	{
		const user = await SocialController.createSocialProfile(username, userData);
		res.status(201).json({ user });
	}
	catch (error)
	{
		res.status(400).json({ error: error.message });
	}
});

socialRoutes.patch("/", authMiddleware, async (req, res) =>
{
	const { username } = req.query;
	try
	{
		const updatedUser = await SocialController.updateSocialProfile(
			username,
			req.body,
		);
		res.status(200).json({ user: updatedUser });
	}
	catch (error)
	{
		logger.error("Error updating social profile", error, {
			username,
			operation: "updateSocialProfile"
		});
		res.status(400).json({ error: error.message });
	}
});

socialRoutes.patch(
	"/update-avatar",
	authMiddleware,
	upload.single("avatar"),
	convertToWebP,
	async (req, res) =>
	{
		try
		{
			const newAvatar = await SocialController.updateAvatar(
				req.query.username,
				req.file,
			);
			res.status(200).json({ newAvatar });
		}
		catch (error)
		{
			logger.error("Error updating avatar", error, {
				username: req.query.username,
				operation: "updateAvatar"
			});
			res.status(500).json({ error });
		}
	},
);

socialRoutes.patch(
	"/update-background",
	authMiddleware,
	upload.single("background"),
	convertToWebP,
	async (req, res) =>
	{
		try
		{
			const newBackground = await SocialController.updateBackgroundImage(
				req.query.username,
				req.file,
			);
			res.status(200).json({ newBackground });
		}
		catch (error)
		{
			logger.error("Error updating background", error, {
				username: req.query.username,
				operation: "updateBackgroundImage"
			});
			res.status(500).json({ error });
		}
	},
);

socialRoutes.get("/followers/:profileId", async (req, res) =>
{
	const { page = 0, limit = 10, search = "" } = req.query;
	const { profileId } = req.params;
	try
	{
		const followers = await SocialController.getFollowers(
			profileId,
			page,
			limit,
			search,
		);
		res.send(followers);
	}
	catch (error)
	{
		logger.error("Error getting followers", error, {
			operation: "getFollowers",
			profileId,
			page,
			limit,
			search
		});
		res.status(400).send({ message: error.message });
	}
});

socialRoutes.get("/following/:profileId", async (req, res) =>
{
	const { page = 0, limit = 10, search = "" } = req.query;
	const { profileId } = req.params;
	try
	{
		const followers = await SocialController.getFollowing(
			profileId,
			page,
			limit,
			search,
		);
		res.send(followers);
	}
	catch (error)
	{
		logger.error("Error getting following users", error, {
			operation: "getFollowing",
			profileId,
			page,
			limit,
			search
		});
		res.status(400).send({ message: error.message });
	}
});

socialRoutes.get("/:nickname", async (req, res) =>
{
	const { nickname } = req.params;
	try
	{
		const profile = await SocialController.getSocialProfile(
			nickname,
		);
		if (!profile)
		{
			return res.status(404).json({ message: "User not found" });
		}
		res.json(profile);
	}
	catch (error)
	{
		logger.error("Error getting social profile", error, {
			operation: "getSocialProfile",
			nickname
		});
		res.status(400).json({ message: error.message });
	}
});

socialRoutes.post(
	"/follow/:followingProfileId",
	authMiddleware,
	async (req, res) =>
	{
		const { followingProfileId } = req.params;
		const { username, value = "1" } = req.query;

		try
		{
			await SocialController.updateFollowers(
				username,
				followingProfileId,
				value === "1",
			);
			res.status(204).send();
		}
		catch (error)
		{
			logger.error("Error updating followers", error, {
				username,
				operation: "updateFollowers",
				followingProfileId,
				value
			});
			res.status(500).json({ message: error.message });
		}
	},
);

module.exports = socialRoutes;
