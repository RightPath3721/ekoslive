const mongoose = require("mongoose");
const logger = require("../logger");
const getMongooseModelByName = require("../utils/getMongooseModelByName");

const filterScheme = new mongoose.Schema({
	model: [{ type: String, enum: mongoose.modelNames() }],
	key: String,
	type: {
		type: String,
		enum: ["String", "Number", "Enum", "Boolean", "Range", "Date", "Dropdown"],
	},
	path: String,
	label: String,
	options: [{ type: String }],
	range: {
		min: Number,
		max: Number,
		step: Number,
	},
	options_get: {
		model: { type: String, enum: mongoose.modelNames() },
		projection: {
			label: String,
			value: String,
		},
	},
	unit: String,
});

filterScheme.post("find", async function (res, next)
{
	try
	{
		await Promise.allSettled(
			res.map(async (filter, idx) =>
			{
				if (filter.type === "Dropdown" && filter.options_get)
				{
					const { model, projection } = filter.options_get;
					const filterModel = await getMongooseModelByName(model);
					const options = await filterModel.find(
						{},
						Object.values(projection).reduce(
							(acc, item) => ({ ...acc, [item]: 1 }),
							{},
						),
					);
					res[idx].options = JSON.stringify(options);
				}
			}),
		);
	}
	catch (error)
	{
		logger.error("Error processing filter options", error, {
			operation: "filterSchemaPostFind",
			resultCount: res?.length || 0
		});
	}
	finally
	{
		next();
	}
});

module.exports = mongoose.model("FilterField", filterScheme);
