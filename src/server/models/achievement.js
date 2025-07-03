const mongoose = require("mongoose");

const achievementScheme = new mongoose.Schema({
	owner: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
	type: String,
	title: String,
	description: String,
	points: Number,
	reward: String,
	key: String,
	status: Boolean,
	ts: mongoose.Schema.Types.Date,
});

module.exports = mongoose.model("Achievement", achievementScheme);
