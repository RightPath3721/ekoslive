const mongoose = require("mongoose");
const isArray = require("lodash/isArray");
const moderationReport = require("../moderation/moderationReport");
const { getObjectUrl } = require("../../utils/minio");

const equipmentModelScheme = new mongoose.Schema(
	{
		posted_by: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "Social",
		},
		equipment_type: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "EquipmentType",
		},
		manufacturer: { type: mongoose.Schema.Types.ObjectId, ref: "Manufacturer" },
		label: { type: String, required: true, unique: true },
		logo: String,
		url: String,
		moderation_report: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "ModerationReport",
		},
		optional_fields: Object,
		source_id: String,
		discontinued: Boolean
	},
	{ timestamps: true },
);

equipmentModelScheme.pre("save", async function (next)
{
	if (this.isNew)
	{
		const moderation_report = new moderationReport();
		await moderation_report.save();
		this.moderation_report = moderation_report._id;
	}
	next();
});

equipmentModelScheme.post("aggregate", async function (res, next)
{
	if (isArray(res[0]?.data) && res[0].data.some((item) => !!item.logo))
	{
		const updatedResult = await Promise.allSettled(
			res[0].data.map(async (model) => ({
				...model,
				logo: await getObjectUrl(model.logo),
			})),
		);

		res[0].data = updatedResult.map((result, idx) =>
			result.status === "fulfilled" ? result.value : res[0].data[idx],
		);
	}
	next();
});

module.exports = mongoose.model("EquipmentModel", equipmentModelScheme);
