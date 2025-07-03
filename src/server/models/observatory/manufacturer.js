const mongoose = require("mongoose");
const isArray = require("lodash/isArray");
const moderationReport = require("../moderation/moderationReport");
const { getObjectUrl } = require("../../utils/minio");

const manufacturerScheme = new mongoose.Schema(
	{
		posted_by: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "Social",
		},
		name: { type: String, required: true, unique: true },
		url: String,
		logo: String,
		moderation_report: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "ModerationReport",
		},
		equipment_types: [
			{
				type: mongoose.Schema.Types.ObjectId,
				ref: "EquipmentType",
			},
		],
	},
	{ timestamps: true },
);

manufacturerScheme.pre("save", async function (next)
{
	if (this.isNew)
	{
		const moderation_report = new moderationReport();
		await moderation_report.save();
		this.moderation_report = moderation_report._id;
	}
	next();
});

manufacturerScheme.post("aggregate", async function (res, next)
{
	if (isArray(res[0]?.data) && res[0].data.some((item) => !!item.logo))
	{
		const updatedResult = await Promise.allSettled(
			res[0].data.map(async (manufacturer) => ({
				...manufacturer,
				logo: await getObjectUrl(manufacturer.logo),
			})),
		);

		res[0].data = updatedResult.map((result, idx) =>
			result.status === "fulfilled" ? result.value : res[0].data[idx],
		);
	}
	next();
});

module.exports = mongoose.model("Manufacturer", manufacturerScheme);
