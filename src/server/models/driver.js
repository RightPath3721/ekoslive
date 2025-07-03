const mongoose = require("mongoose");

const driverSchema = new mongoose.Schema({
	label: String,
	family: String,
	vid: String,
	pid: String,
	deviceName: String,
	rawDevice: Object,
	isSerial: Boolean,
	serial: String,
});

driverSchema.plugin(require("mongoose-bcrypt"));

module.exports = mongoose.model("Driver", driverSchema);
