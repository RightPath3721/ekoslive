const mongoose = require("mongoose");

const AbuseActionSchema = new mongoose.Schema({
	action: { type: String, enum: ["DELETE", "APPROVE", "IGNORE", "BAN"] },
	moderator_id: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
	note: String,
	report_id: { type: mongoose.Schema.Types.ObjectId, ref: "AbuseReport" },
});

module.exports = mongoose.model("AbuseAction", AbuseActionSchema);
