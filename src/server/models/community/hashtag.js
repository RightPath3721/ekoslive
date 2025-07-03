const mongoose = require("mongoose");

const hashtagSchema = new mongoose.Schema({
	label: {
		type: String,
		unique: true,
	},
});

module.exports = mongoose.model("Hashtag", hashtagSchema);
