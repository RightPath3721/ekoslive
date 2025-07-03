const mongoose = require("mongoose");

const formFieldScheme = new mongoose.Schema({
	label: String,
	type: {
		type: String,
		enum: ["String", "Number", "Enum", "Boolean", "Range", "Date", "Dropdown"],
	},
	placeholder: String,
	options: [String],
	range: {
		min: Number,
		max: Number,
		step: Number,
	},
	unit: String,
	relations: {
		key: { type: mongoose.Schema.Types.ObjectId },
		path: String,
	},
	key: String,
	required: Boolean,
	default: { type: String, nullable: true },
});

module.exports = mongoose.model("FormField", formFieldScheme);
