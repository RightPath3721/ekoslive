const mongoose = require("mongoose");

const equipmentTypeScheme = new mongoose.Schema({
	name: String,
	fields: [{ type: mongoose.Schema.Types.ObjectId, ref: "FormField" }],
});

module.exports = mongoose.model("EquipmentType", equipmentTypeScheme);
