const mongoose = require("mongoose");

// Record all changes in resource metadata line by line to include publish_status, access_level, tags, and note changes (if any)
const ResourceActionScheme = new mongoose.Schema(
	{
		change: String, // REGISTERED -> PUBLIC || NOTE -> "new note"
		moderator_id: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
		resource_id: { type: mongoose.Schema.Types.ObjectId, nullable: false },
	},
	{ timestamps: true },
);

module.exports = mongoose.model("ResourceAction", ResourceActionScheme);
