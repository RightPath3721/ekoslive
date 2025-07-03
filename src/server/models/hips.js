const mongoose = require("mongoose");

const hipsSchema = new mongoose.Schema({
	id: Number,
	name: String,
	zoom: Number,
	metadata: {
		bin: String,
		ext: String,
		fov_h: String,
		fov_w: String,
		name: String,
		resolution: String,
		uuid: String,
		zoom: Number,
		preview: String,
	},
});

hipsSchema.plugin(require("mongoose-bcrypt"));

module.exports = mongoose.model("Hips", hipsSchema);
