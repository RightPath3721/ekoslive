const mongoose = require("mongoose");

const locationScheme = new mongoose.Schema({
	public: Boolean,
	lng: Number,
	lat: Number,
	region: String,
	country: String,
	elevation: Number,
	accuracy: { type: String, enum: ["COARSE", "FINE"] },
});

module.exports = mongoose.model("Location", locationScheme);
