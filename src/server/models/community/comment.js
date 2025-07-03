const mongoose = require("mongoose");
const moderationReport = require("../moderation/moderationReport");

const commentScheme = new mongoose.Schema({
	posted_by: { type: mongoose.Schema.Types.ObjectId, ref: "Social" },
	content: String,
	liked_by: [{ type: mongoose.Schema.Types.ObjectId, ref: "Social" }],
	moderation_report: {
		type: mongoose.Schema.Types.ObjectId,
		ref: "ModerationReport",
	},
	abuse_reports: [{ type: mongoose.Schema.Types.ObjectId, ref: "AbuseReport" }],
});

commentScheme.pre("save", async function (next)
{
	if (this.isNew)
	{
		const moderation_report = new moderationReport();
		await moderation_report.save();
		this.moderation_report = moderation_report._id;
	}
	next();
});

module.exports = mongoose.model("Comment", commentScheme);
