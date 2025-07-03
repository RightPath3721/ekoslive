const mongoose = require("mongoose");

const syncScheme = new mongoose.Schema({
	type: String,
	payload: { type: mongoose.Schema.Types.Mixed, default: {} }, // Allows dynamic fields
	owner: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
});

module.exports = mongoose.model("Sync", syncScheme);
