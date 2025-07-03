const PostModel = require("../models/community/post");
const CommentModel = require("../models/community/comment");
const UserModel = require("../models/user");
const { saveImgInBucket } = require("../utils/minio");
const NotificationModel = require("../models/notification");
const { wssMessageManager } = require("../websocket");
const ModerationReport = require("../models/moderation/moderationReport");
class CommentController
{
	async #getUser(username)
	{
		const user = await UserModel.findOne({ username }).populate(
			"socialAccount",
		);
		if (!user) throw new Error("User not found");
		return user;
	}

	async createComment(data, username)
	{
		const {postId, posted_by, content} = data;
		const newComment = await CommentModel.create({ posted_by, content });
		const moderationReport = await ModerationReport.findById(
			newComment.moderation_report,
		);

		moderationReport.status = "APPROVED";
		await moderationReport.save();

		const post = await PostModel.findById(postId);
		post.comments.push(newComment._id);
		await post.save();

		const user = await this.#getUser(username);

		// Filter out user's social account from target_users
		const targetUsers = [post.posted_by].filter(
			(userId) => userId.toString() !== user.socialAccount._id.toString(),
		);

		// create notification
		const notification = await NotificationModel.create({
			type: "COMMENT",
			content: `#${user.socialAccount.social_nickname}# left a comment to your post.`,
			target_users: targetUsers,
			read_users: [],
			channel: "COMMUNITY",
			role: "REGISTERED",
			actions: [{ type: "Comment", id: post._id }],
		});

		const targetUserNames = await this.getTargetUserNames(
			notification.target_users,
		);
		wssMessageManager.sendMessageByUsernames(targetUserNames, {
			notification,
			type: "new_unread_notification",
		});

		const comment = await CommentModel.aggregate([
			{ $match: { _id: newComment._id } },
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
		]);
		return comment[0];
	}

	async getTargetUserNames(targetUserIds)
	{
		let targetUserNames = await Promise.all(
			targetUserIds.map(async (item) =>
			{
				let targetUser = await UserModel.findOne({ socialAccount: item });
				return targetUser.username;
			}),
		);
		return targetUserNames;
	}

	async updateComment(commentID, commentData)
	{
		const updatedComment = await CommentModel.findByIdAndUpdate(
			commentID,
			commentData,
			{ new: true },
		);

		const moderationReport = await ModerationReport.findById(
			updatedComment.moderation_report,
		);

		moderationReport.status = commentData.submissionStatus;
		moderationReport.tags = commentData.tags;
		moderationReport.note = commentData.note;
		await moderationReport.save();

		return updatedComment;
	}

	async deleteComment(commentID)
	{
		const comment = await CommentModel.findById(commentID);
		if (comment) {
			await ModerationReport.findByIdAndUpdate(comment.moderation_report, {status: "TRASHED"})
		}
		return true;
	}

	async toggleLikeComment(commentID, likedBy)
	{
		const comment = await CommentModel.findById(commentID);
		if (!comment.liked_by.includes(likedBy))
		{
			comment.liked_by.push(likedBy);

			await comment.save();
			return true;
		}
		else
		{
			await CommentModel.findByIdAndUpdate(commentID, {
				$pull: { liked_by: likedBy },
			});
			return false;
		}
	}
}

module.exports = new CommentController();
