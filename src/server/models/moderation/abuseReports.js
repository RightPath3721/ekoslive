const mongoose = require("mongoose");

const AbuseReportSchema = new mongoose.Schema(
	{
		posted_by: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "Social",
		},
		reason: {
			type: String,
			enum: [
				"SPAM",
				"HATE SPEECH",
				"INAPPROPRIATE CONTENT",
				"IMPERSONATION",
				"VIOLATION OF TERMS",
				"PRIVACY VIOLATION",
				"WRONG IMAGE",
				"WRONG METADATA",
				"OTHER",
			],
		},
		type: String,
		comment: { type: String, nullable: true },
		resource_id: {
			type: mongoose.Schema.Types.ObjectId,
			nullable: false,
		},
		status: { type: String, enum: ["New", "Closed"], default: "New" },
		action_id: { type: mongoose.Schema.Types.ObjectId, ref: "AbuseAction" },
	},
	{ timestamps: true },
);

module.exports = mongoose.model("AbuseReport", AbuseReportSchema);
