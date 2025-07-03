const mongoose = require("mongoose");

const surveyScheme = new mongoose.Schema({
	software: [String],
	hardware: [String],
	imaging: [String],
	user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
	tour_guide: {
		profile: { type: Boolean, default: false },
		feed: { type: Boolean, default: false },
		users: { type: Boolean, default: false },
		equipment: { type: Boolean, default: false },
		observatories: { type: Boolean, default: false },
	},
	detailed_tour_guide: { type: Object, default: {} },
});

module.exports = mongoose.model("Survey", surveyScheme);
