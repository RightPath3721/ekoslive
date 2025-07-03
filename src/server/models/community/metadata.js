const mongoose = require("mongoose");

const metadataScheme = new mongoose.Schema({
	equipment_profile: {
		type: mongoose.Schema.Types.ObjectId,
		ref: "EquipmentProfile",
	},
	target: String,
	filters: Array,
	additional_metadata: Object,
});

module.exports = mongoose.model("Metadata", metadataScheme);
