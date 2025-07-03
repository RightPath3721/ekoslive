const mongoose = require("mongoose");
const PostModel = require("../models/community/post");
const CommentModel = require("../models/community/comment");
const EquipmentModel = require("../models/observatory/model");
const GalleryImageModel = require("../models/community/galleryImage");
const MetadataModel = require("../models/community/metadata");
const EquipmentProfileModel = require("../models/observatory/equipmentProfile");
const UserModel = require("../models/user");
const { saveImgInBucket, saveThumbnailInBucket, getObjectUrl } = require("../utils/minio");
const MetadataController = require("./metadata");
const ModerationReport = require("../models/moderation/moderationReport");
const ResourceMetadata = require("../models/moderation/resourceMetadata");
const AbuseReport = require("../models/moderation/abuseReports");
const AbuseAction = require("../models/moderation/abuseAction");
const SocialModel = require("../models/social");
const NotificationModel = require("../models/notification");
const logger = require("../logger");
const { wssMessageManager } = require("../websocket");
const getMongooseModelByName = require("../utils/getMongooseModelByName");
const nodemailer = require("nodemailer");
const { generateEmailTemplate } = require("../utils/emailTemplates");
const {
	smtp_host,
	smtp_port,
	smtp_user,
	smtp_pass,
	smtp_from_name,
	smtp_from_email,
	app_url,
} = require("../config");

class PostController
{
	async createPost(username, data, file)
	{
		if (!file) throw new Error("File is missing");
		const user = await this.#getUser(username);

		const metadata = await JSON.parse(data.metadata);
		if (!metadata.equipment_profile)
			throw new Error("Equipment profile is missing");

		const equipmentProfile = await EquipmentProfileModel.findById(
			metadata.equipment_profile,
		);

		const additionalMetadata = await MetadataController.processFile(
			file.path,
			file.mimetype,
		);
		// trying to parse value coming from the client
		let userAdditionalMetadata = {};
		try
		{
			const userData = await JSON.parse(data?.additionalMetadata);
			userAdditionalMetadata = userData;
		}
		catch (error)
		{
			logger.error("Failed to parse additional metadata", error, {
				username,
				additionalMetadata: data?.additionalMetadata
			});
		}

		// merge all the metadata, from client and form smfitstools
		const storeMetadata = await MetadataModel.create({
			additional_metadata: {
				...(additionalMetadata ?? {}),
				...(userAdditionalMetadata ?? {}),
			},
			...metadata,
			equipment_profile: equipmentProfile._id,
		});

		const imageName = `users/${user._id}/gallery/previews/${storeMetadata._id}`;
		const thumbnailName = `users/${user._id}/gallery/thumbnails/${storeMetadata._id}`;
		await saveImgInBucket(imageName, file);
		await saveThumbnailInBucket(thumbnailName, file);

		const galleryImage = await GalleryImageModel.create({
			metadata: storeMetadata._id,
			captured_by: user.socialAccount._id,
			preview: imageName,
			thumbnail: thumbnailName,
		});
		const post = await PostModel.create({
			...data,
			posted_by: user.socialAccount._id,
			image: galleryImage._id,
		});
		const moderationReport = await ModerationReport.findById(
			post.moderation_report,
		);
		moderationReport.status = data.submissionStatus;
		moderationReport.tags = data.tags;
		moderationReport.note = data.note;
		await moderationReport.save();

		const updatedPost = await this.getPost(post._id);

		if (data.submissionStatus === "APPROVED")
		{
			// create notification
			const notification = await NotificationModel.create({
				type: "POST",
				content: `#${user.socialAccount.social_nickname}# created a new post.`,
				target_users: user.socialAccount.followers,
				read_users: [user.socialAccount._id],
				channel: "COMMUNITY",
				role: "REGISTERED",
				actions: [{ type: "Post", id: updatedPost._id }],
			});

			const targetUserNames = await this.getTargetUserNames(
				notification.target_users,
			);
			wssMessageManager.sendMessageByUsernames(targetUserNames, {
				notification,
				type: "new_unread_notification",
			});
		}
		else if (data.submissionStatus === "PENDING")
		{
			// create notification
			await NotificationModel.create({
				type: "PENDING",
				content: `#${user.socialAccount.social_nickname}# created a new post.`,
				target_users: user.socialAccount._id,
				read_users: [user.socialAccount._id],
				channel: "COMMUNITY",
				role: "MODERATOR",
				actions: [{ type: "Moderation" }],
			});

			const notification = await NotificationModel.create({
				type: "PENDING",
				content: `Your post is pending. Please wait until it is approved.`,
				target_users: [user.socialAccount._id],
				read_users: [],
				channel: "COMMUNITY",
				role: "REGISTERED",
				actions: [{ type: "Post" }],
			});

			const transporter = nodemailer.createTransport({
				host: smtp_host,
				port: smtp_port,
				secure: false,
				auth: {
					user: smtp_user,
					pass: smtp_pass,
				},
			});

			// Updated email content for Post pending notification
			const creatorEmailHtml = generateEmailTemplate(
				'New Post Request',
				user.socialAccount.social_nickname,
				`<strong>${user.socialAccount.social_nickname}</strong> has submitted a request to create a new post.<br><br>
				Your post submission is currently pending review by our team. You will be notified once it has been approved or if additional information is needed.`,
				'Go to the Community',
				`${app_url}community`
			);
	
			await transporter.sendMail({
				from: {
					name: smtp_from_name,
					address: smtp_from_email,
				},
				to: user.email, // Send to the submitter
				subject: 'Your Post Request is Pending Review',
				text: `Hello ${user.socialAccount.social_nickname},

Thank you for submitting a new post. Your request is currently pending review by our team.
You will be notified once it has been approved or if additional information is needed.

To view the status of your post request, please visit:
${app_url}community`,
				html: creatorEmailHtml
			});

			const targetUserNames = await this.getTargetUserNames(
				notification.target_users,
			);
			wssMessageManager.sendMessageByUsernames(targetUserNames, {
				notification,
				type: "new_unread_notification",
			});
		}

		return updatedPost;
	}

	async handleNotification(sourceId, action) {
		const post = await PostModel.findById(sourceId);
		const user = await UserModel.findOne({ socialAccount: post.posted_by }).populate("socialAccount");

		if(action === "APPROVED") {
			const notification = await NotificationModel.create({
				type: "POST",
				content: `Your post has been approved.`,
				target_users: [user.socialAccount._id],
				read_users: [],
				channel: "COMMUNITY",
				role: "REGISTERED",
				actions: [{ type: "Post", id: post._id }],
			});

			const targetUserNames = await this.getTargetUserNames(
				notification.target_users,
			);
			wssMessageManager.sendMessageByUsernames(targetUserNames, {
				notification,
				type: "new_unread_notification",
			});
		} else if(action === "REJECTED") {
			const notification = await NotificationModel.create({
				type: "POST",
				content: `Your post has been rejected.`,
				target_users: [user.socialAccount._id],
				read_users: [],
				channel: "COMMUNITY",
				role: "REGISTERED",
				actions: [{ type: "Post" }],
			});

			const transporter = nodemailer.createTransport({
				host: smtp_host,
				port: smtp_port,
				secure: false,
				auth: {
					user: smtp_user,
					pass: smtp_pass,
				},
			});

			const creatorEmailHtml = generateEmailTemplate(
				'Post Rejected',
				user.socialAccount.social_nickname,
				`Your post has been rejected.`,
				'Go to the Community',
				`${app_url}community`
			);

			await transporter.sendMail({
				from: {
					name: smtp_from_name,
					address: smtp_from_email,
				},
				to: user.email,
				subject: 'Your post has been rejected',
				text: `Hello ${user.socialAccount.social_nickname},

Your post has been rejected.`,
				html: creatorEmailHtml
			});

			const targetUserNames = await this.getTargetUserNames(
				notification.target_users,
			);
			wssMessageManager.sendMessageByUsernames(targetUserNames, {
				notification,
				type: "new_unread_notification",
			});
		}
	}

	async getPosts(username, limit = 5, page = 0)
	{
		const user = await this.#getUser(username);
		const posts = await PostModel.find({ posted_by: user._id }, null, {
			sort: "creadetAt",
			limit,
			skip: page * limit,
		}).populate("image");
		return posts;
	}

	async getPostsByOwnerId(ownerId, limit = 5, page = 0)
	{
		const posts = await PostModel.aggregate([
			{
				$match: { posted_by: new mongoose.Types.ObjectId(ownerId) }
			},
			{ $sort: { createdAt: -1 } },
			{ $skip: page * +limit },
			{ $limit: +limit },
			{
				$lookup: {
					from: "galleryimages",
					as: "image",
					foreignField: "_id",
					localField: "image",
				}
			},
			{
				$addFields: {
					image: { $arrayElemAt: ["$image", 0] },
				}
			},
			{
				$lookup: {
					from: "moderationreports",
					as: "moderation_report",
					foreignField: "_id",
					localField: "moderation_report",
				}
			},
			{
				$addFields: {
					moderation_report: { $arrayElemAt: ["$moderation_report", 0] },
				}
			},
			{
				$match: {
					"moderation_report.status": "APPROVED",
				}
			},
			{
				$lookup: {
					from: "resourcemetadatas",
					as: "resource_metadata",
					foreignField: "_id",
					localField: "resource_metadata",
				}
			},
			{
				$addFields: {
					resource_metadata: { $arrayElemAt: ["$resource_metadata", 0] },
				}
			},
			{
				$lookup: {
					from: "socials",
					as: "posted_by",
					foreignField: "_id",
					localField: "posted_by",
				}
			},
			{
				$addFields: {
					posted_by: { $arrayElemAt: ["$posted_by", 0] },
				}
			},
			{
				$match: {
					"posted_by.ban": { $ne: true },
				}
			},
			{
				$lookup: {
					from: "comments",
					as: "comments",
					foreignField: "_id",
					localField: "comments",
					pipeline: [
						{
							$lookup: {
								from: "socials",
								localField: "posted_by",
								foreignField: "_id",
								as: "posted_by",
							}
						},
						{
							$addFields: {
								posted_by: { $arrayElemAt: ["$posted_by", 0] },
							}
						},
						{
							$match: {
								"posted_by.ban": { $ne: true },
							}
						}
					]
				}
			}
		]);

		return posts;
	}

	async getPostsByFollowing(limit, page, username)
	{
		const user = await this.#getUser(username);

		const posts = await PostModel.aggregate([
			{ $sort: { createdAt: -1 } },
			// { $skip: (page - 1) * +limit },
			// { $limit: +limit },
			{
				$lookup: {
					from: "galleryimages",
					as: "image",
					foreignField: "_id",
					localField: "image",
				},
			},
			{
				$addFields: {
					image: { $arrayElemAt: ["$image", 0] },
				},
			},
			{
				$lookup: {
					from: "moderationreports",
					as: "moderation_report",
					foreignField: "_id",
					localField: "moderation_report",
				},
			},
			{
				$addFields: {
					moderation_report: { $arrayElemAt: ["$moderation_report", 0] },
				},
			},
			{
				$match: {
					"moderation_report.status": "APPROVED",
				},
			},
			{
				$lookup: {
					from: "resourcemetadatas",
					as: "resource_metadata",
					foreignField: "_id",
					localField: "resource_metadata",
				},
			},
			{
				$addFields: {
					resource_metadata: { $arrayElemAt: ["$resource_metadata", 0] },
				},
			},
			{
				$lookup: {
					from: "socials",
					as: "posted_by",
					foreignField: "_id",
					localField: "posted_by",
				},
			},
			{
				$addFields: {
					posted_by: { $arrayElemAt: ["$posted_by", 0] },
				},
			},
			{
				$match: {
					"posted_by.ban": { $ne: true },
					"posted_by._id": { $in: user.socialAccount.following },
				},
			},
			{
				$lookup: {
					from: "comments",
					as: "comments",
					foreignField: "_id",
					localField: "comments",
					pipeline: [
						{
							$lookup: {
								from: "socials",
								localField: "posted_by",
								foreignField: "_id",
								as: "posted_by",
							},
						},
						{
							$addFields: {
								posted_by: { $arrayElemAt: ["$posted_by", 0] },
							},
						},
						{
							$match: {
								"posted_by.ban": { $ne: true },
							},
						},
						{
							$lookup: {
								from: "moderationreports",
								as: "moderation_report",
								foreignField: "_id",
								localField: "moderation_report",
							},
						},
						{
							$addFields: {
								moderation_report: { $arrayElemAt: ["$moderation_report", 0] },
							},
						},
						{
							$match: {
								"moderation_report.status": "APPROVED",
							},
						},
					],
				},
			},
		]);
		return posts;
	}

	async getPostsByBooked(limit, page, username)
	{
		const user = await this.#getUser(username);

		const posts = await PostModel.aggregate([
			{ $sort: { createdAt: -1 } },
			// { $skip: (page - 1) * +limit },
			// { $limit: +limit },
			{
				$match: {
					bookmarks: { $in: [user.socialAccount._id] },
				},
			},
			{
				$lookup: {
					from: "galleryimages",
					as: "image",
					foreignField: "_id",
					localField: "image",
				},
			},
			{
				$addFields: {
					image: { $arrayElemAt: ["$image", 0] },
				},
			},
			{
				$lookup: {
					from: "moderationreports",
					as: "moderation_report",
					foreignField: "_id",
					localField: "moderation_report",
				},
			},
			{
				$addFields: {
					moderation_report: { $arrayElemAt: ["$moderation_report", 0] },
				},
			},
			{
				$match: {
					"moderation_report.status": "APPROVED",
				},
			},
			{
				$lookup: {
					from: "resourcemetadatas",
					as: "resource_metadata",
					foreignField: "_id",
					localField: "resource_metadata",
				},
			},
			{
				$addFields: {
					resource_metadata: { $arrayElemAt: ["$resource_metadata", 0] },
				},
			},
			{
				$lookup: {
					from: "socials",
					as: "posted_by",
					foreignField: "_id",
					localField: "posted_by",
				},
			},
			{
				$addFields: {
					posted_by: { $arrayElemAt: ["$posted_by", 0] },
				},
			},
			{
				$match: {
					"posted_by.ban": { $ne: true },
				},
			},
			{
				$lookup: {
					from: "comments",
					as: "comments",
					foreignField: "_id",
					localField: "comments",
					pipeline: [
						{
							$lookup: {
								from: "socials",
								localField: "posted_by",
								foreignField: "_id",
								as: "posted_by",
							},
						},
						{
							$addFields: {
								posted_by: { $arrayElemAt: ["$posted_by", 0] },
							},
						},
						{
							$match: {
								"posted_by.ban": { $ne: true },
							},
						},
						{
							$lookup: {
								from: "moderationreports",
								as: "moderation_report",
								foreignField: "_id",
								localField: "moderation_report",
							},
						},
						{
							$addFields: {
								moderation_report: { $arrayElemAt: ["$moderation_report", 0] },
							},
						},
						{
							$match: {
								"moderation_report.status": "APPROVED",
							},
						},
					],
				},
			},
		]);
		return posts;
	}

	async getPost(postID)
	{
		const objectId = mongoose.Types.ObjectId;

		const post = await PostModel.aggregate([
			{
				$match: { _id: new objectId(postID) },
			},
			{
				$lookup: {
					from: "galleryimages",
					as: "image",
					foreignField: "_id",
					localField: "image",
					pipeline: [
						{
							$lookup: {
								from: "metadatas",
								localField: "metadata",
								foreignField: "_id",
								as: "metadata",
								pipeline: [
									{
										$lookup: {
											from: "equipmentprofiles",
											localField: "equipment_profile",
											foreignField: "_id",
											as: "equipment_profile",
											pipeline: [
												{
													$lookup: {
														from: "equipmentmodels",
														as: "equipments",
														foreignField: "_id",
														localField: "equipments",
														pipeline: [
															{
																$lookup: {
																	from: "equipmenttypes",
																	as: "equipment_type",
																	foreignField: "_id",
																	localField: "equipment_type",
																},
															},
															{
																$addFields: {
																	equipment_type: {
																		$arrayElemAt: ["$equipment_type", 0],
																	},
																},
															},
															{
																$lookup: {
																	from: "manufacturers",
																	as: "manufacturer",
																	foreignField: "_id",
																	localField: "manufacturer",
																},
															},
															{
																$addFields: {
																	manufacturer: {
																		$arrayElemAt: ["$manufacturer", 0],
																	},
																},
															},
														],
													},
												},
											],
										},
									},
									{
										$addFields: {
											equipment_profile: {
												$arrayElemAt: ["$equipment_profile", 0],
											},
										},
									},
								],
							},
						},
						{
							$addFields: {
								metadata: { $arrayElemAt: ["$metadata", 0] },
							},
						},
					],
				},
			},
			{
				$addFields: {
					image: { $arrayElemAt: ["$image", 0] },
				},
			},
			{
				$lookup: {
					from: "moderationreports",
					as: "moderation_report",
					foreignField: "_id",
					localField: "moderation_report",
				},
			},
			{
				$addFields: {
					moderation_report: { $arrayElemAt: ["$moderation_report", 0] },
				},
			},
			{
				$lookup: {
					from: "resourcemetadatas",
					as: "resource_metadata",
					foreignField: "_id",
					localField: "resource_metadata",
				},
			},
			{
				$addFields: {
					resource_metadata: { $arrayElemAt: ["$resource_metadata", 0] },
				},
			},
			{
				$lookup: {
					from: "socials",
					as: "posted_by",
					foreignField: "_id",
					localField: "posted_by",
				},
			},
			{
				$addFields: {
					posted_by: { $arrayElemAt: ["$posted_by", 0] },
				},
			},
			{
				$lookup: {
					from: "comments",
					as: "comments",
					foreignField: "_id",
					localField: "comments",
					pipeline: [
						{
							$lookup: {
								from: "socials",
								localField: "posted_by",
								foreignField: "_id",
								as: "posted_by",
							},
						},
						{
							$addFields: {
								posted_by: { $arrayElemAt: ["$posted_by", 0] },
							},
						},
						{
							$match: {
								"posted_by.ban": { $ne: true },
							},
						},
						{
							$lookup: {
								from: "moderationreports",
								as: "moderation_report",
								foreignField: "_id",
								localField: "moderation_report",
							},
						},
						{
							$addFields: {
								moderation_report: { $arrayElemAt: ["$moderation_report", 0] },
							},
						},
						{
							$match: {
								"moderation_report.status": "APPROVED",
							},
						},
					],
				},
			},
			{
				$limit: 1, // Ensures only one object is returned
			},
		]);

		const singlePost = post.length > 0 ? post[0] : null;
		return singlePost;
	}

	async getPendingPosts()
	{
		const posts = await PostModel.aggregate([
			{ $sort: { createdAt: -1 } },
			{
				$lookup: {
					from: "galleryimages",
					as: "image",
					foreignField: "_id",
					localField: "image",
				},
			},
			{
				$lookup: {
					from: "moderationreports",
					as: "moderation_report",
					foreignField: "_id",
					localField: "moderation_report",
				},
			},
			{
				$addFields: {
					moderation_report: { $arrayElemAt: ["$moderation_report", 0] },
				},
			},
			{
				$match: {
					"moderation_report.status": "PENDING",
				},
			},
			{
				$lookup: {
					from: "resourcemetadatas",
					as: "resource_metadata",
					foreignField: "_id",
					localField: "resource_metadata",
				},
			},
			{
				$lookup: {
					from: "socials",
					as: "posted_by",
					foreignField: "_id",
					localField: "posted_by",
				},
			},
			{
				$lookup: {
					from: "comments",
					as: "comments",
					foreignField: "_id",
					localField: "comments",
					pipeline: [
						{
							$lookup: {
								from: "socials",
								localField: "posted_by",
								foreignField: "_id",
								as: "posted_by",
							},
						},
						{
							$addFields: {
								posted_by: { $arrayElemAt: ["$posted_by", 0] },
							},
						},
					],
				},
			},
		]);

		return posts.map((post) => ({
			...post,
			image: post.image?.[0] ?? null,
			posted_by: post.posted_by?.[0] ?? null,
		}));
	}

	async getStreamPosts({ limit, page })
	{
		const posts = await PostModel.aggregate([
			{ $sort: { createdAt: -1 } },
			{ $skip: (page - 1) * +limit },
			{ $limit: +limit },
			{
				$lookup: {
					from: "galleryimages",
					as: "image",
					foreignField: "_id",
					localField: "image",
				},
			},
			{
				$addFields: {
					image: { $arrayElemAt: ["$image", 0] },
				},
			},
			{
				$lookup: {
					from: "moderationreports",
					as: "moderation_report",
					foreignField: "_id",
					localField: "moderation_report",
				},
			},
			{
				$addFields: {
					moderation_report: { $arrayElemAt: ["$moderation_report", 0] },
				},
			},
			{
				$match: {
					"moderation_report.status": "APPROVED",
				},
			},
			{
				$lookup: {
					from: "resourcemetadatas",
					as: "resource_metadata",
					foreignField: "_id",
					localField: "resource_metadata",
				},
			},
			{
				$addFields: {
					resource_metadata: { $arrayElemAt: ["$resource_metadata", 0] },
				},
			},
			{
				$match: {
					"resource_metadata.publish_status": "PUBLISHED",
				},
			},
			{
				$lookup: {
					from: "socials",
					as: "posted_by",
					foreignField: "_id",
					localField: "posted_by",
				},
			},
			{
				$addFields: {
					posted_by: { $arrayElemAt: ["$posted_by", 0] },
				},
			},
			{
				$match: {
					"posted_by.ban": { $ne: true },
				},
			},
			{
				$lookup: {
					from: "comments",
					as: "comments",
					foreignField: "_id",
					localField: "comments",
					pipeline: [
						{
							$lookup: {
								from: "socials",
								localField: "posted_by",
								foreignField: "_id",
								as: "posted_by",
							},
						},
						{
							$addFields: {
								posted_by: { $arrayElemAt: ["$posted_by", 0] },
							},
						},
						{
							$match: {
								"posted_by.ban": { $ne: true },
							},
						},
						{
							$lookup: {
								from: "moderationreports",
								as: "moderation_report",
								foreignField: "_id",
								localField: "moderation_report",
							},
						},
						{
							$addFields: {
								moderation_report: { $arrayElemAt: ["$moderation_report", 0] },
							},
						},
						{
							$match: {
								"moderation_report.status": "APPROVED",
							},
						},
					],
				},
			},
		]);

		return posts;
	}

	async updatePost(postID, postData)
	{
		const updatedPost = await PostModel.findByIdAndUpdate(postID, postData, {
			new: true,
		});

		const moderationReport = await ModerationReport.findById(
			updatedPost.moderation_report,
		);
		moderationReport.status = postData.submissionStatus;
		moderationReport.tags = postData.tags;
		moderationReport.note = postData.note;
		await moderationReport.save();
		
		if (postData.submissionStatus === "PENDING")
		{
			const notification = await NotificationModel.create({
				type: "PENDING",
				content: `Your post is pending. Please wait until it is approved.`,
				target_users: [updatedPost.posted_by],
				read_users: [],
				channel: "COMMUNITY",
				role: "REGISTERED",
				actions: [{ type: "Post" }],
			});

			const targetUserNames = await this.getTargetUserNames(
				notification.target_users,
			);
			wssMessageManager.sendMessageByUsernames(targetUserNames, {
				notification,
				type: "new_unread_notification",
			});
			return "PENDING";
		}
		const updatePost = await this.getPost(updatedPost._id);
		return updatePost;
	}

	async deletePost(postID)
	{
		const post = await PostModel.findById(postID);

		const moderationReport = await ModerationReport.findById(
			post.moderation_report,
		);
		moderationReport.status = "TRASHED";
		await moderationReport.save();
	}

	async #getUser(username)
	{
		const user = await UserModel.findOne({ username }).populate(
			"socialAccount",
		);
		if (!user) throw new Error("User not found");
		return user;
	}

	async getTargetUserNames(targetUserIds)
	{
		const targetUserNames = await Promise.all(
			targetUserIds.map(async (item) =>
			{
				const targetUser = await UserModel.findOne({ socialAccount: item });
				if (!targetUser) return null;
				return targetUser.username;
			}),
		);
		return targetUserNames.filter((username) => !!username);
	}

	async toggleLikePost(postID, likedBy, username)
	{
		const post = await PostModel.findById(postID);
		const user = await this.#getUser(username);
		// Filter out user's social account from target_users
		const targetUsers = [post.posted_by].filter(
			(userId) => userId.toString() !== user.socialAccount._id.toString(),
		);

		if (!post.liked_by.includes(likedBy))
		{
			const notification = await NotificationModel.create({
				type: "POST",
				content: `#${user.socialAccount.social_nickname}# liked your post.`,
				target_users: targetUsers,
				read_users: [user.socialAccount._id],
				channel: "COMMUNITY",
				role: "REGISTERED",
				actions: [{ type: "Post", id: post._id }],
			});
			const targetUserNames = await this.getTargetUserNames(
				notification.target_users,
			);
			wssMessageManager.sendMessageByUsernames(targetUserNames, {
				notification,
				type: "new_unread_notification",
			});

			post.liked_by.push(likedBy);
			await post.save();
			return true;
		}
		else
		{
			await PostModel.findByIdAndUpdate(postID, {
				$pull: { liked_by: likedBy },
			});
			return false;
		}
	}

	async favoritePost(postID, bookedBy)
	{
		const post = await PostModel.findById(postID);
		if (!post.bookmarks.includes(bookedBy))
		{
			post.bookmarks.push(bookedBy);

			await post.save();
			return "booked";
		}
		else
		{
			const bookedIndex = post.bookmarks.indexOf(bookedBy);
			if (bookedIndex !== -1)
			{
				post.bookmarks.splice(bookedIndex, 1);
				await post.save();
			}
			return "unbooked";
		}
	}

	async createAbuseReport(username, data)
	{
		const user = await this.#getUser(username);
		const newAbuseReport = await AbuseReport.create({
			...data,
			posted_by: user.socialAccount._id
		});
		return newAbuseReport;
	}

	async deleteAbuseReport(data)
	{
		const model = await getMongooseModelByName(data.type)
		const resource = await model.findById(data.resourceId);
		if (resource) {
			await ModerationReport.findByIdAndUpdate(resource.moderation_report, {status: "TRASHED"})
		}
		const abuseReportAction = await AbuseAction.create({ action: "DELETE" });
		const abuseReport = await AbuseReport.findById(data.id);
		abuseReport.status = "Closed";
		abuseReport.action_id = abuseReportAction._id;
		await abuseReport.save();
	}

	async ignoreAbuseReport(data)
	{
		const abuseReportAction = await AbuseAction.create({ action: "IGNORE" });
		const abuseReport = await AbuseReport.findById(data.id);
		abuseReport.status = "Closed";
		abuseReport.action_id = abuseReportAction._id;
		await abuseReport.save();
	}

	async approveAbuseReport(data)
	{
		const abuseReportAction = await AbuseAction.create({ action: "APPROVE" });
		const abuseReport = await AbuseReport.findById(data.id);
		abuseReport.status = "Closed";
		abuseReport.action_id = abuseReportAction._id;
		await abuseReport.save();
	}

	async banAbuseReport(data)
	{
		const model = await getMongooseModelByName(data.type)
		const post = await model.findById(data.resourceId);
		const owner = await SocialModel.findById(post.posted_by);
		owner.ban = true;
		await owner.save();
		
		const abuseReportAction = await AbuseAction.create({ action: "BAN" });
		const abuseReport = await AbuseReport.findById(data.id);
		abuseReport.status = "Closed";
		abuseReport.action_id = abuseReportAction._id;
		await abuseReport.save();
	}

	async getAbuseReports()
	{
		const abuseReports = await AbuseReport.aggregate([
			{ $sort: { createdAt: -1 } },
			{
				$match: {
					status: "New",
				},
			},
			{
				$lookup: {
					from: "socials",
					as: "posted_by",
					foreignField: "_id",
					localField: "posted_by",
				},
			},
			{
				$addFields: {
					posted_by: { $arrayElemAt: ["$posted_by", 0] },
				},
			}
		]);

		return await Promise.all(
			abuseReports.map(async (abuseReport) => ({
				...abuseReport,
				posted_by: {
					...abuseReport.posted_by,
					avatar: abuseReport.posted_by?.avatar ? await getObjectUrl(abuseReport.posted_by.avatar) : null,
				},
			}))
		)
	}

	async getNextPost(postId) {
		const currentPost = await PostModel.findById(postId);
		if (!currentPost) {
			throw new Error("Post not found");
		}

		const nextPost = await PostModel.aggregate([
			{
				$lookup: {
					from: "moderationreports",
					as: "moderation_report",
					foreignField: "_id",
					localField: "moderation_report",
				},
			},
			{
				$addFields: {
					moderation_report: { $arrayElemAt: ["$moderation_report", 0] },
				},
			},
			{
				$match: {
					$and: [
						{ createdAt: { $gt: currentPost.createdAt } },
						{ "moderation_report.status": "APPROVED" }
					]
				}
			},
			{ $sort: { createdAt: 1 } },
			{
				$lookup: {
					from: "galleryimages",
					as: "image",
					foreignField: "_id",
					localField: "image",
					pipeline: [
						{
							$lookup: {
								from: "metadatas",
								localField: "metadata",
								foreignField: "_id",
								as: "metadata",
								pipeline: [
									{
										$lookup: {
											from: "equipmentprofiles",
											localField: "equipment_profile",
											foreignField: "_id",
											as: "equipment_profile",
											pipeline: [
												{
													$lookup: {
														from: "equipmentmodels",
														as: "equipments",
														foreignField: "_id",
														localField: "equipments",
														pipeline: [
															{
																$lookup: {
																	from: "equipmenttypes",
																	as: "equipment_type",
																	foreignField: "_id",
																	localField: "equipment_type",
																},
															},
															{
																$addFields: {
																	equipment_type: {
																		$arrayElemAt: ["$equipment_type", 0],
																	},
																},
															},
															{
																$lookup: {
																	from: "manufacturers",
																	as: "manufacturer",
																	foreignField: "_id",
																	localField: "manufacturer",
																},
															},
															{
																$addFields: {
																	manufacturer: {
																		$arrayElemAt: ["$manufacturer", 0],
																	},
																},
															},
														],
													},
												},
											],
										},
									},
									{
										$addFields: {
											equipment_profile: {
												$arrayElemAt: ["$equipment_profile", 0],
											},
										},
									},
								],
							},
						},
						{
							$addFields: {
								metadata: { $arrayElemAt: ["$metadata", 0] },
							},
						},
					],
				},
			},
			{
				$addFields: {
					image: { $arrayElemAt: ["$image", 0] },
				},
			},
			{
				$lookup: {
					from: "resourcemetadatas",
					as: "resource_metadata",
						foreignField: "_id",
						localField: "resource_metadata",
				},
			},
			{
				$addFields: {
					resource_metadata: { $arrayElemAt: ["$resource_metadata", 0] },
				},
			},
			{
				$lookup: {
					from: "socials",
					as: "posted_by",
					foreignField: "_id",
					localField: "posted_by",
				},
			},
			{
				$addFields: {
					posted_by: { $arrayElemAt: ["$posted_by", 0] },
				},
			},
			{
				$match: {
					"posted_by.ban": { $ne: true }
				}
			},
			{
				$lookup: {
					from: "comments",
					as: "comments",
					foreignField: "_id",
					localField: "comments",
					pipeline: [
						{
							$lookup: {
								from: "socials",
								localField: "posted_by",
								foreignField: "_id",
								as: "posted_by",
							},
						},
						{
							$addFields: {
								posted_by: { $arrayElemAt: ["$posted_by", 0] },
							},
						},
						{
							$match: {
								"posted_by.ban": { $ne: true },
							},
						},
					],
				},
			},
			{ $limit: 1 },
		]);


		return nextPost[0] || null;
	}

	async getPreviousPost(postId) {
		const currentPost = await PostModel.findById(postId);
		if (!currentPost) {
			throw new Error("Post not found");
		}

		const previousPost = await PostModel.aggregate([
			{
				$lookup: {
					from: "moderationreports",
					as: "moderation_report",
					foreignField: "_id",
					localField: "moderation_report",
				},
			},
			{
				$addFields: {
					moderation_report: { $arrayElemAt: ["$moderation_report", 0] },
				},
			},
			{
				$match: {
					$and: [
						{ createdAt: { $lt: currentPost.createdAt } },
						{ "moderation_report.status": "APPROVED" }
					]
				}
			},
			{ $sort: { createdAt: -1 } },
			{
				$lookup: {
					from: "galleryimages",
					as: "image",
					foreignField: "_id",
					localField: "image",
					pipeline: [
						{
							$lookup: {
								from: "metadatas",
								localField: "metadata",
								foreignField: "_id",
								as: "metadata",
								pipeline: [
									{
										$lookup: {
											from: "equipmentprofiles",
											localField: "equipment_profile",
											foreignField: "_id",
											as: "equipment_profile",
											pipeline: [
												{
													$lookup: {
														from: "equipmentmodels",
														as: "equipments",
														foreignField: "_id",
														localField: "equipments",
														pipeline: [
															{
																$lookup: {
																	from: "equipmenttypes",
																	as: "equipment_type",
																	foreignField: "_id",
																	localField: "equipment_type",
																},
															},
															{
																$addFields: {
																	equipment_type: {
																		$arrayElemAt: ["$equipment_type", 0],
																	},
																},
															},
															{
																$lookup: {
																	from: "manufacturers",
																	as: "manufacturer",
																	foreignField: "_id",
																	localField: "manufacturer",
																},
															},
															{
																$addFields: {
																	manufacturer: {
																		$arrayElemAt: ["$manufacturer", 0],
																	},
																},
															},
														],
													},
												},
											],
										},
									},
									{
										$addFields: {
											equipment_profile: {
												$arrayElemAt: ["$equipment_profile", 0],
											},
										},
									},
								],
							},
						},
						{
							$addFields: {
								metadata: { $arrayElemAt: ["$metadata", 0] },
							},
						},
					],
				},
			},
			{
				$addFields: {
					image: { $arrayElemAt: ["$image", 0] },
				},
			},
			{
				$lookup: {
					from: "resourcemetadatas",
					as: "resource_metadata",
						foreignField: "_id",
						localField: "resource_metadata",
				},
			},
			{
				$addFields: {
					resource_metadata: { $arrayElemAt: ["$resource_metadata", 0] },
				},
			},
			{
				$lookup: {
					from: "socials",
					as: "posted_by",
					foreignField: "_id",
					localField: "posted_by",
				},
			},
			{
				$addFields: {
					posted_by: { $arrayElemAt: ["$posted_by", 0] },
				},
			},
			{
				$match: {
					"posted_by.ban": { $ne: true }
				}
			},
			{
				$lookup: {
					from: "comments",
					as: "comments",
					foreignField: "_id",
					localField: "comments",
					pipeline: [
						{
							$lookup: {
								from: "socials",
								localField: "posted_by",
								foreignField: "_id",
								as: "posted_by",
							},
						},
						{
							$addFields: {
								posted_by: { $arrayElemAt: ["$posted_by", 0] },
							},
						},
						{
							$match: {
								"posted_by.ban": { $ne: true },
							},
						},
					],
				},
			},
			{ $limit: 1 },
		]);

		return previousPost[0] || null;
	}
}

module.exports = new PostController();
