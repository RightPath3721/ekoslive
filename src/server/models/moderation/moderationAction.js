const mongoose = require("mongoose");

const ModerationActionScheme = new mongoose.Schema(
	{
		action: String,
		moderator_id: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
		note: String,
	},
	{ timestamps: true },
);

module.exports = mongoose.model("ModerationAction", ModerationActionScheme);
