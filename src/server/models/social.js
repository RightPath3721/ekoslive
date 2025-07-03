const mongoose = require("mongoose");
const isArray = require("lodash/isArray");
const { getObjectUrl } = require("../utils/minio");
const logger = require("../logger");

const socialScheme = new mongoose.Schema(
	{
		status: Boolean,
		profile_background: String,
		social_nickname: String,
		gallery_images: [
			{
				type: mongoose.Schema.Types.ObjectId,
				ref: "GalleryImage",
				default: [],
			},
		],
		avatar: String,
		profile_description: String,
		full_name: String,
		owner: {
			type: mongoose.Schema.Types.ObjectId,
			required: true,
			ref: "User",
		},
		followers: [
			{
				type: mongoose.Schema.Types.ObjectId,
				ref: "Social",
				default: [],
			},
		],
		following: [
			{
				type: mongoose.Schema.Types.ObjectId,
				ref: "Social",
				default: [],
			},
		],
		posts: [
			{
				type: mongoose.Schema.Types.ObjectId,
				ref: "Post",
				default: [],
			},
		],
		ban: { type: Boolean, default: false },
		motto: { type: String, maxLength: 40 },
	},
	{ timestamps: true, versionKey: false },
);

socialScheme.virtual("posts_count").get(function ()
{
	return this.posts.length;
});

socialScheme.virtual("followers_count").get(function ()
{
	return this.followers.length;
});

socialScheme.virtual("following_count").get(function ()
{
	return this.following.length;
});

socialScheme.post("aggregate", async function (res, next)
{
	const data = res[0]?.data;

	if (data && isArray(data))
	{
		const profiles = await Promise.allSettled(
			data.map(async (socialProfile) => ({
				...socialProfile,
				avatar: socialProfile.avatar
					? await getObjectUrl(socialProfile.avatar)
					: null,
			})),
		);
		res[0].data = profiles
			.map((result) => (result.status === "fulfilled" ? result.value : null))
			.filter((profile) => profile);

		return next();
	}
	else if (isArray(res))
	{
		const profiles = await Promise.allSettled(
			res.map(async (socialProfile) => ({
				...socialProfile,
				avatar: socialProfile.avatar
					? await getObjectUrl(socialProfile.avatar)
					: null,
			})),
		);

		res.splice(
			0,
			res.length,
			...profiles
				.map((result) => (result.status === "fulfilled" ? result.value : null))
				.filter((profile) => profile),
		);
		return next();
	}
	else
	{
		return next();
	}
});

socialScheme.post("findOne", async function (res, next)
{
	try
	{
		if (res?.avatar)
		{
			const avatarUrl = await getObjectUrl(res.avatar);
			res.avatar = avatarUrl;
		}
		if (res?.profile_background)
		{
			const backgroundUrl = await getObjectUrl(res.profile_background);
			res.profile_background = backgroundUrl;
		}
	}
	catch (error)
	{
		logger.error("Error processing social profile URLs", error, {
			operation: "socialSchemaPostFindOne",
			hasAvatar: !!res?.avatar,
			hasProfileBackground: !!res?.profile_background
		});
	}
	next();
});

module.exports = mongoose.model("Social", socialScheme);
