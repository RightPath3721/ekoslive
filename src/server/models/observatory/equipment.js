const mongoose = require("mongoose");

const equipmentScheme = new mongoose.Schema({
	label: String,
	equipment_model: {
		type: mongoose.Schema.Types.ObjectId,
		ref: "EquipmentModel",
	},
	moderation_report: {
		type: mongoose.Schema.Types.ObjectId,
		ref: "ModerationReport",
	},
});

equipmentScheme.post("save", async function (_, next)
{
	const ManufacturerModel = this.db.model("Manufacturer");
	const manufacturer = await ManufacturerModel.findById(this.manufacturer);
	if (!manufacturer.equipment_types)
	{
		await ManufacturerModel.findByIdAndUpdate(this.manufacturer, {
			equipment_types: [this.equipment_type],
		});
		return next();
	}
	else if (manufacturer.equipment_types.includes(this.equipment_type))
	{
		return next();
	}
	else
	{
		await ManufacturerModel.findByIdAndUpdate(this.manufacturer, {
			$push: { equipment_types: this.equipment_type },
		});
		return next();
	}
});

module.exports = mongoose.model("Equipment", equipmentScheme);
