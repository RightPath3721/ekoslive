const express = require("express");
const { upload, convertToWebP } = require("../utils/multerUpload");
const logger = require("../logger");
const authMiddleware = require("../middlewares/auth");
const PostController = require("../controller/post");
const EquipmentController = require("../controller/equipment");
const PostModel = require("../models/community/post");
const ModerationAction = require("../models/moderation/moderationAction");
const { getObjectUrl } = require("../utils/minio");
const ModerationReport = require("../models/moderation/moderationReport");
const PostRoutes = express.Router();


PostRoutes.get("/", authMiddleware, async (req, res) =>
{
	const { username, page, limit } = req.query;
	try
	{
		const posts = await PostController.getPosts(username, limit, page);
		res.json(posts);
	}
	catch (error)
	{
		logger.error("Error getting posts", error, {
			username,
			operation: "getPosts",
			page,
			limit
		});
		res.status(400).json({ message: error.message });
	}
});

PostRoutes.get("/stream", async (req, res) =>
{
	const { page = 1, limit = 10 } = req.query;

	try
	{
		const posts = await PostController.getStreamPosts({ limit, page });

		const updatedPosts = await Promise.all(
			posts.map(async (post) =>
			{
				let previewUrl, thumbnailUrl, ownerAvatarUrl;
				if (post.image.preview)
				{
					previewUrl = await getObjectUrl(post.image.preview);
				}
				if (post.image.thumbnail)
				{
					thumbnailUrl = await getObjectUrl(post.image.thumbnail);
				}
				if (post.posted_by?.avatar)
				{
					ownerAvatarUrl = await getObjectUrl(post.posted_by.avatar);
				}

				const updatedComments = await Promise.all(
					post.comments.map(async (comment) =>
					{
						if (comment.posted_by?.avatar)
						{
							comment.posted_by.avatar = await getObjectUrl(
								comment.posted_by.avatar,
							);
						}
						return comment;
					}),
				);
				// Mutate the post object with the new URLs
				return {
					...post,
					image: {
						...post.image,
						preview: previewUrl,
						thumbnail: thumbnailUrl,
					},
					posted_by: {
						...post.posted_by,
						avatar: ownerAvatarUrl,
					},
					comments: updatedComments,
				};
			}),
		);

		res.json(updatedPosts);
	}
	catch (error)
	{
		logger.error("Error getting stream posts", error, {
			operation: "getStreamPosts",
			page,
			limit
		});
		res.status(400).json({ message: error.message });
	}
});

PostRoutes.get("/abuse-report", authMiddleware, async (req, res) =>
{
	try
	{
		const abuseReports = await PostController.getAbuseReports(req.body);
		res.json(abuseReports);
	}
	catch (error)
	{
		logger.error("Error getting abuse report", error, {
			operation: "getAbuseReports"
		});
		res.status(400).json({ message: error.message });
	}
});

PostRoutes.get("/pending", async (req, res) =>
{
	try
	{
		const posts = await PostController.getPendingPosts();

		const updatedPosts = await Promise.all(
			posts.map(async (post) =>
			{
				let previewUrl, thumbnailUrl, ownerAvatarUrl;
				if (post.image.preview)
				{
					previewUrl = await getObjectUrl(post.image.preview);
				}
				if (post.image.thumbnail)
				{
					thumbnailUrl = await getObjectUrl(post.image.thumbnail);
				}
				if (post.posted_by.avatar)
				{
					ownerAvatarUrl = await getObjectUrl(post.posted_by.avatar);
				}

				const updatedComments = await Promise.all(
					post.comments.map(async (comment) =>
					{
						if (comment.posted_by.avatar)
						{
							comment.posted_by.avatar = await getObjectUrl(
								comment.posted_by.avatar,
							);
						}
						return comment;
					}),
				);
				// Mutate the post object with the new URLs
				return {
					...post,
					image: {
						...post.image,
						preview: previewUrl,
						thumbnail: thumbnailUrl,
					},
					posted_by: {
						...post.posted_by,
						avatar: ownerAvatarUrl,
					},
					comments: updatedComments,
				};
			}),
		);

		res.json(updatedPosts);
	}
	catch (error)
	{
		logger.error("Error getting pending posts", error, {
			operation: "getPendingPosts"
		});
		res.status(400).json({ message: error.message });
	}
});

PostRoutes.get("/following", authMiddleware, async (req, res) =>
{
	const { page = 1, limit = 10, username } = req.query;

	try
	{
		const posts = await PostController.getPostsByFollowing(
			limit,
			page,
			username,
		);

		const updatedPosts = await Promise.all(
			posts.map(async (post) =>
			{
				let previewUrl, thumbnailUrl, ownerAvatarUrl;
				if (post.image.preview)
				{
					previewUrl = await getObjectUrl(post.image.preview);
				}
				if (post.image.thumbnail)
				{
					thumbnailUrl = await getObjectUrl(post.image.thumbnail);
				}
				if (post.posted_by?.avatar)
				{
					ownerAvatarUrl = await getObjectUrl(post.posted_by.avatar);
				}

				const updatedComments = await Promise.all(
					post.comments.map(async (comment) =>
					{
						if (comment.posted_by?.avatar)
						{
							comment.posted_by.avatar = await getObjectUrl(
								comment.posted_by.avatar,
							);
						}
						return comment;
					}),
				);
				// Mutate the post object with the new URLs
				return {
					...post,
					image: {
						...post.image,
						preview: previewUrl,
						thumbnail: thumbnailUrl,
					},
					posted_by: {
						...post.posted_by,
						avatar: ownerAvatarUrl,
					},
					comments: updatedComments,
				};
			}),
		);

		res.json(updatedPosts);
	}
	catch (error)
	{
		logger.error("Error getting posts for following", error, {
			username,
			operation: "getPostsByFollowing",
			page,
			limit
		});
		res.status(400).json({ message: error.message });
	}
});

PostRoutes.get("/booked", authMiddleware, async (req, res) =>
{
	const { page = 1, limit = 10, username } = req.query;

	try
	{
		const posts = await PostController.getPostsByBooked(limit, page, username);
		const updatedPosts = await Promise.all(
			posts.map(async (post) =>
			{
				let previewUrl, thumbnailUrl, ownerAvatarUrl;
				if (post.image.preview)
				{
					previewUrl = await getObjectUrl(post.image.preview);
				}
				if (post.image.thumbnail)
				{
					thumbnailUrl = await getObjectUrl(post.image.thumbnail);
				}
				if (post.posted_by?.avatar)
				{
					ownerAvatarUrl = await getObjectUrl(post.posted_by.avatar);
				}

				const updatedComments = await Promise.all(
					post.comments.map(async (comment) =>
					{
						if (comment.posted_by.avatar)
						{
							comment.posted_by.avatar = await getObjectUrl(
								comment.posted_by?.avatar,
							);
						}
						return comment;
					}),
				);
				// Mutate the post object with the new URLs
				return {
					...post,
					image: {
						...post.image,
						preview: previewUrl,
						thumbnail: thumbnailUrl,
					},
					posted_by: {
						...post.posted_by,
						avatar: ownerAvatarUrl,
					},
					comments: updatedComments,
				};
			}),
		);

		res.json(updatedPosts);
	}
	catch (error)
	{
		logger.error("Error getting booked posts", error, {
			username,
			operation: "getPostsByBooked",
			page,
			limit
		});
		res.status(400).json({ message: error.message });
	}
});

PostRoutes.post("/approve/:moderationReportId/:type/:sourceId", async (req, res) =>
{
	const { moderationReportId, type, sourceId } = req.params;
	try
	{
		const moderationAction = await ModerationAction.create(req.body);
		const moderationReport =
			await ModerationReport.findById(moderationReportId);
		moderationReport.status = req.body.action;
		moderationReport.action_id.push(moderationAction._id);
		await moderationReport.save();

		if(type === "post") {
			await PostController.handleNotification(sourceId, req.body.action);
		} else if(type === "manufacturer") {
			await EquipmentController.handleManufacturerNotification(sourceId, req.body.action);
		} else if(type === "model") {
			await EquipmentController.handleModelNotification(sourceId, req.body.action);
		}

		return res.json({ message: "success" });
	}
	catch (error)
	{
		logger.error("Error approving moderation report", error, {
			operation: "approveModerationReport",
			moderationReportId,
			type,
			sourceId
		});
		res.status(400).json({ message: error.message });
	}
});

PostRoutes.post(
	"/",
	authMiddleware,
	upload.single("image"),
	convertToWebP,
	async (req, res) =>
	{
		const { username } = req.query;
		const submissionStatus = req.ability.can("update", "ModeratingStatus")
			? req.body.submissionStatus
			: "PENDING";
		req.body.submissionStatus = submissionStatus;

		try
		{
			const post = await PostController.createPost(
				username,
				req.body,
				req.file,
			);
			if (!post)
			{
				res.status(404).json({ message: "Post not found" });
			}
			else if (req.body.submissionStatus === "APPROVED")
			{
				if (post.image.preview)
				{
					post.image.preview = await getObjectUrl(post.image.preview);
				}
				if (post.image.thumbnail)
				{
					post.image.thumbnail = await getObjectUrl(post.image.thumbnail);
				}
				if (post.posted_by.avatar)
				{
					post.posted_by.avatar = await getObjectUrl(post.posted_by.avatar);
				}

				const updatedComments = await Promise.all(
					post.comments.map(async (comment) =>
					{
						if (comment.posted_by.avatar)
						{
							comment.posted_by.avatar = await getObjectUrl(
								comment.posted_by.avatar,
							);
						}
						return comment;
					}),
				);
				post.comments = updatedComments;
				res.json(post);
			}
			else
			{
				res.json({ message: "sucess" });
			}
		}
		catch (error)
		{
			logger.error("Error uploading post", error, {
				username,
				operation: "createPost",
				submissionStatus: req.body.submissionStatus
			});
			res.status(400).json({ message: error.message });
		}
	},
);

PostRoutes.patch("/:postID", authMiddleware, async (req, res) =>
{
	const { username } = req.query;
	const { postID } = req.params;

	try
	{
		const post = await PostModel.findById(postID);
		if (!post)
		{
			res.status(404).json({ message: "Post not found" });
		}
		else if (!req.ability.can("update", post))
		{
			res.status(403).json({ message: "Forbidden" });
		}
		else
		{
			const updatedPost = await PostController.updatePost(post._id, req.body);
			if (updatedPost == "PENDING")
			{
				res.json("PENDING");
				return;
			}
			if (updatedPost.image.preview)
			{
				updatedPost.image.preview = await getObjectUrl(
					updatedPost.image.preview,
				);
			}
			if (updatedPost.image.thumbnail)
			{
				updatedPost.image.thumbnail = await getObjectUrl(
					updatedPost.image.thumbnail,
				);
			}
			if (updatedPost.posted_by.avatar)
			{
				updatedPost.posted_by.avatar = await getObjectUrl(
					updatedPost.posted_by.avatar,
				);
			}

			const updatedComments = await Promise.all(
				updatedPost.comments.map(async (comment) =>
				{
					if (comment.posted_by.avatar)
					{
						comment.posted_by.avatar = await getObjectUrl(
							comment.posted_by.avatar,
						);
					}
					return comment;
				}),
			);
			updatedPost.comments = updatedComments;
			res.json(updatedPost);
		}
	}
	catch (error)
	{
		logger.error("Error updating post", error, {
			username,
			operation: "updatePost",
			postID
		});
		res.status(400).json({ message: error.message });
	}
});

PostRoutes.get("/:postID", async (req, res) =>
{
	const { postID } = req.params;

	try
	{
		const post = await PostController.getPost(postID);
		if (!post)
		{
			res.status(404).json({ message: "Post not found" });
		}
		else
		{
			if (post.image.preview)
			{
				post.image.preview = await getObjectUrl(post.image.preview);
			}
			if (post.image.thumbnail)
			{
				post.image.thumbnail = await getObjectUrl(post.image.thumbnail);
			}
			if (post.posted_by.avatar)
			{
				post.posted_by.avatar = await getObjectUrl(post.posted_by.avatar);
			}

			const updatedComments = await Promise.all(
				post.comments.map(async (comment) =>
				{
					if (comment.posted_by.avatar)
					{
						comment.posted_by.avatar = await getObjectUrl(
							comment.posted_by.avatar,
						);
					}
					return comment;
				}),
			);
			post.comments = updatedComments;

			res.json(post);
		}
	}
	catch (error)
	{
		logger.error("Error getting post", error, {
			operation: "getPost",
			postID
		});
		res.status(400).json({ message: error.message });
	}
});

PostRoutes.delete("/:postID", authMiddleware, async (req, res) =>
{
	const { username } = req.query;
	const { postID } = req.params;

	try
	{
		const post = await PostModel.findById(postID);
		if (!post)
		{
			res.status(404).json({ message: "Post not found" });
		}
		else if (!req.ability.can("delete", post))
		{
			res.status(403).json({ message: "Forbidden" });
		}
		else
		{
			await PostController.deletePost(post._id);
			res.status(200).json({ message: "Post deleted successfully" });
		}
	}
	catch (error)
	{
		logger.error("Error deleting post", error, {
			username,
			operation: "deletePost",
			postID
		});
		res.status(400).json({ message: error.message });
	}
});

PostRoutes.post("/like/:postID", authMiddleware, async (req, res) =>
{
	const { postID } = req.params;
	const { likedBy } = req.body;
	const { username } = req.query;
	try
	{
		const result = await PostController.toggleLikePost(
			postID,
			likedBy,
			username,
		);
		res.json(result);
	}
	catch (error)
	{
		logger.error("Error toggling like post", error, {
			username,
			operation: "toggleLikePost",
			postID,
			likedBy
		});
		res.status(400).json({ message: error.message });
	}
});

PostRoutes.post("/favorite/:postID", authMiddleware, async (req, res) =>
{
	const { postID } = req.params;
	const { bookedBy } = req.body;
	try
	{
		const result = await PostController.favoritePost(postID, bookedBy);
		res.json(result);
	}
	catch (error)
	{
		logger.error("Error favoriting post", error, {
			operation: "favoritePost",
			postID,
			bookedBy
		});
		res.status(400).json({ message: error.message });
	}
});

PostRoutes.post("/abuse-report", authMiddleware, async (req, res) =>
{
	const { username } = req.query;
	try
	{
		const abuseReport = await PostController.createAbuseReport(username, req.body);
		res.json({ message: "success" });
	}
	catch (error)
	{
		logger.error("Error creating abuse report", error, {
			username,
			operation: "createAbuseReport"
		});
		res.status(400).json({ message: error.message });
	}
});

PostRoutes.post("/abuse-report/delete", authMiddleware, async (req, res) =>
{
	try
	{
		await PostController.deleteAbuseReport(req.body);
		res.json({ message: "success" });
	}
	catch (error)
	{
		logger.error("Error deleting abuse report", error, {
			operation: "deleteAbuseReport"
		});
		res.status(400).json({ message: error.message });
	}
});

PostRoutes.post("/abuse-report/ignore", authMiddleware, async (req, res) =>
{
	try
	{
		const abuseReport = await PostController.ignoreAbuseReport(req.body);
		res.json({ message: "success" });
	}
	catch (error)
	{
		logger.error("Error ignoring abuse report", error, {
			operation: "ignoreAbuseReport"
		});
		res.status(400).json({ message: error.message });
	}
});

PostRoutes.post("/abuse-report/approve", authMiddleware, async (req, res) =>
{
	try
	{
		const abuseReport = await PostController.approveAbuseReport(req.body);
		res.json({ message: "success" });
	}
	catch (error)
	{
		logger.error("Error approving abuse report", error, {
			operation: "approveAbuseReport"
		});
		res.status(400).json({ message: error.message });
	}
});

PostRoutes.post("/abuse-report/ban", authMiddleware, async (req, res) =>
{
	try
	{
		const abuseReport = await PostController.banAbuseReport(req.body);
		res.json({ message: "success" });
	}
	catch (error)
	{
		logger.error("Error banning abuse report", error, {
			operation: "banAbuseReport"
		});
		res.status(400).json({ message: error.message });
	}
});

PostRoutes.get("/profile/:profileId", async (req, res) =>
{
	const { profileId } = req.params;
	const { page, limit } = req.query;

	try
	{
		const posts = await PostController.getPostsByOwnerId(
			profileId,
			limit,
			page,
		);

		const updatedPosts = await Promise.all(
			posts.map(async (post) =>
			{
				let previewUrl, thumbnailUrl, ownerAvatarUrl;
				if (post.image.preview)
				{
					previewUrl = await getObjectUrl(post.image.preview);
				}
				if (post.image.thumbnail)
				{
					thumbnailUrl = await getObjectUrl(post.image.thumbnail);
				}
				if (post.posted_by?.avatar)
				{
					ownerAvatarUrl = await getObjectUrl(post.posted_by.avatar);
				}

				const updatedComments = await Promise.all(
					post.comments.map(async (comment) =>
					{
						if (comment.posted_by?.avatar)
						{
							comment.posted_by.avatar = await getObjectUrl(
								comment.posted_by.avatar,
							);
						}
						return comment;
					}),
				);

				return {
					...post,
					image: {
						...post.image,
						preview: previewUrl,
						thumbnail: thumbnailUrl,
					},
					posted_by: {
						...post.posted_by,
						avatar: ownerAvatarUrl,
					},
					comments: updatedComments,
				};
			}),
		);

		res.json(updatedPosts);
	}
	catch (error)
	{
		logger.error("Error getting posts for profile", error, {
			operation: "getPostsByOwnerId",
			profileId,
			page,
			limit
		});
		res.status(400).json({ message: error.message });
	}
});

PostRoutes.get("/next/:postId", async (req, res) => {
	try {
		const { postId } = req.params;
		const post = await PostController.getNextPost(postId);
		
		if (!post) {
			return res.status(404).json({ message: "There is no next post" });
		}

		// Get URLs for images and avatars
		let previewUrl, thumbnailUrl, ownerAvatarUrl;
		if (post.image.preview) {
			previewUrl = await getObjectUrl(post.image.preview);
		}
		if (post.image.thumbnail) {
			thumbnailUrl = await getObjectUrl(post.image.thumbnail);
		}
		if (post.posted_by?.avatar) {
			ownerAvatarUrl = await getObjectUrl(post.posted_by.avatar);
		}

		const updatedComments = await Promise.all(
			post.comments.map(async (comment) => {
				if (comment.posted_by?.avatar) {
					comment.posted_by.avatar = await getObjectUrl(comment.posted_by.avatar);
				}
				return comment;
			})
		);

		res.json({
			...post,
			image: {
				...post.image,
				preview: previewUrl,
				thumbnail: thumbnailUrl,
			},
			posted_by: {
				...post.posted_by,
				avatar: ownerAvatarUrl,
			},
			comments: updatedComments,
		});
	} catch (error) {
		logger.error("Error getting next post", error, {
			operation: "getNextPost",
			postId
		});
		res.status(400).json({ message: error.message });
	}
});

PostRoutes.get("/previous/:postId", async (req, res) => {
	try {
		const { postId } = req.params;
		const post = await PostController.getPreviousPost(postId);
		
		if (!post) {
			return res.status(404).json({ message: "There is no previous post" });
		}

		// Get URLs for images and avatars
		let previewUrl, thumbnailUrl, ownerAvatarUrl;
		if (post.image.preview) {
			previewUrl = await getObjectUrl(post.image.preview);
		}
		if (post.image.thumbnail) {
			thumbnailUrl = await getObjectUrl(post.image.thumbnail);
		}
		if (post.posted_by?.avatar) {
			ownerAvatarUrl = await getObjectUrl(post.posted_by.avatar);
		}

		const updatedComments = await Promise.all(
			post.comments.map(async (comment) => {
				if (comment.posted_by?.avatar) {
					comment.posted_by.avatar = await getObjectUrl(comment.posted_by.avatar);
				}
				return comment;
			})
		);

		res.json({
			...post,
			image: {
				...post.image,
				preview: previewUrl,
				thumbnail: thumbnailUrl,
			},
			posted_by: {
				...post.posted_by,
				avatar: ownerAvatarUrl,
			},
			comments: updatedComments,
		});
	} catch (error) {
		logger.error("Error getting previous post", error, {
			operation: "getPreviousPost",
			postId
		});
		res.status(400).json({ message: error.message });
	}
});

module.exports = PostRoutes;
