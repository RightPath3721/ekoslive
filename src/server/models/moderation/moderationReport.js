const mongoose = require("mongoose");

const ModerationReportScheme = new mongoose.Schema({
	status: { type: String, enum: ["PENDING", "APPROVED", "REJECTED", "TRASHED", "BLACKLISTED"], default: "PENDING" },
	tags: [String],
	note: String,
	action_id: [{type: mongoose.Schema.Types.ObjectId, ref: "ModerationAction"}],
});

module.exports = mongoose.model("ModerationReport", ModerationReportScheme);
