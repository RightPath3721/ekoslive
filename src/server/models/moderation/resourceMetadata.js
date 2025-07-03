const mongoose = require("mongoose");

const ResourceMetadataScheme = new mongoose.Schema({
	publish_status: {
		type: String,
		enum: ["PUBLISHED", "UNPUBLISHED", "TRASHED", "DELETED"],
		default: "PUBLISHED"
	},
	access_level: {
		type: String,
		enum: ["PUBLIC", "REGISTERED", "MODERATOR", "ADMIN"],
		default: "PUBLIC"
	},
	tags: [String],
	note: String,
	resource_id: { type: mongoose.Schema.Types.ObjectId, nullable: false },
});

module.exports = mongoose.model("ResourceMetadata", ResourceMetadataScheme);
