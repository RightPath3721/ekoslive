const mongoose = require("mongoose");
const moderationReport = require("../moderation/moderationReport");
const resourceMetadata = require("../moderation/resourceMetadata");

const postScheme = new mongoose.Schema(
	{
		title: String,
		description: String,
		astrobinLink:String,
		posted_by: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "Social",
		},
		image: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "GalleryImage",
		},
		bookmarks: [
			{
				type: mongoose.Schema.Types.ObjectId,
				ref: "Social",
			},
		],
		comments: [
			{
				type: mongoose.Schema.Types.ObjectId,
				ref: "Comment",
			},
		],
		collabolators: [{ type: mongoose.Schema.Types.ObjectId, ref: "Social" }],
		liked_by: [{ type: mongoose.Schema.Types.ObjectId, ref: "Social" }],
		moderation_report: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "ModerationReport",
		},
		resource_metadata: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "ResourceMetadata",
		},
		abuse_reports: [
			{ type: mongoose.Schema.Types.ObjectId, ref: "AbuseReport" },
		],
	},
	{ timestamps: true },
);

postScheme.virtual("comments_count").get(function ()
{
	return this.comments.length;
});

postScheme.virtual("likes_count").get(function ()
{
	return this.liked_by.length;
});

postScheme.pre("findOneAndUpdate", async function (next)
{
	const updatedData = this.getUpdate();
	if ("metadata" in (updatedData ?? {}))
	{
		const post = await this.model.db
			.model("Post")
			.findById(this.getQuery()?._id);
		const galleryImage = await this.model.db
			.model("GalleryImage")
			.findById(post.image);
		await this.model.db
			.model("Metadata")
			.findByIdAndUpdate(galleryImage.metadata, updatedData.metadata);
		delete updatedData.metadata;
	}
	next();
});

postScheme.pre("findOneAndDelete", async function (next)
{
	const post = await this.model.db.model("Post").findById(this.getQuery()?._id);
	await this.model.db.model("GalleryImage").findByIdAndDelete(post.image);
	next();
});

postScheme.post("findOne", async function (res, next)
{
	if (!res) return next();
	const galleryImage = await this.model.db
		.model("GalleryImage")
		.findById(res.image);
	const metadata = await this.model.db
		.model("Metadata")
		.findById(galleryImage.metadata);
	galleryImage.metadata = metadata;
	res.image = galleryImage;
	next();
});

postScheme.pre("save", async function (next)
{
	if (this.isNew)
	{
		const moderation_report = new moderationReport();
		await moderation_report.save();
		this.moderation_report = moderation_report._id;

		const resource_metadata = new resourceMetadata();
		await resource_metadata.save();
		this.resource_metadata = resource_metadata._id;
	}
	next();
});

module.exports = mongoose.model("Post", postScheme);
