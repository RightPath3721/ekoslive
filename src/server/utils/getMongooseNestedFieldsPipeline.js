const escapeRegExp = require("lodash/escapeRegExp");
const isArray = require("lodash/isArray");
const isString = require("lodash/isString");
const dayjs = require("dayjs");
const mongoose = require("mongoose");
const getObjectsInRadiusPipeline = require("./getObjectsInRadiusPipeline");
const calculateRadiusCoords = require("./calculateRadiusCoords");

// Store here all models with lowercase name as key and original name as value for easy access
const mongooseModels = new Map();
mongoose
	.modelNames()
	.forEach((modelName) =>
		mongooseModels.set(modelName.toLowerCase(), modelName),
	);

/**
 * Generates a MongoDB aggregation pipeline for retrieving nested fields based on a given path and value.
 * @param {string} path - The dot-separated path to the nested field.
 * @param {any} value - The value to match against the nested field (optional).
 * @returns {object[]} - An array of aggregation pipeline stages.
 */
const getMongooseNestedFieldsPipeline = (path, value) =>
{
	const fields = path.split(".");

	// Check whether the pipeline should look for the search value in the original document if there is an object, or in the nested collection
	const isNestedCollection =
		fields.length > 2 ||
		(fields.length === 2 &&
			mongooseModels.get(fields[0].toLowerCase().replace("_", "")) &&
			!mongoose.isValidObjectId(fields[1]));

	if (isNestedCollection)
	{
		return generateLookupStage(fields, value);
	}
	else
	{
		return [{ $match: getMongooseMatcher(path, value) }];
	}
};

/**
 * Creates a MongoDB aggregation pipeline stage for matching documents based on a given key and value.
 * @param {string} key - The field name to match against.
 * @param {any} value - The value to search for.
 * @returns {object} - An aggregation pipeline stage object or empty object if no match criteria can be generated.
 */
const getMongooseMatcher = (key, value) =>
{
	if (key === "location")
	{
		let [latitude, longitude] = value;

		if (!latitude || !longitude) return {};

		const radius = rest["radius"];
		const pipeline = getObjectsInRadiusPipeline(
			calculateRadiusCoords(
				{ latitude: +latitude, longitude: +longitude },
				+radius,
			),
		);

		return pipeline;
	}
	else if (key === "radius")
	{
		return {};
	}
	else if (value === "true" || value === "false")
	{
		return { [key]: value === "true" };
	}
	else if (isArray(value) && value.every((item) => !isNaN(item)))
	{
		return {
			[key]: { $gt: +value[0], ...(value[1] ? { $lt: +value[1] } : {}) },
		};
	}
	else if (dayjs(value).isValid())
	{
		return { [key]: { $gte: dayjs(value).format("YYYY-MM-DD") } };
	}
	else if (
		isArray(value) &&
		value.every((item) => mongoose.isValidObjectId(item))
	)
	{
		return {
			[key]: { $in: value.map((val) => new mongoose.Types.ObjectId(val)) },
		};
	}
	else if (isArray(value))
	{
		return {
			[key]: { $in: value },
		};
	}
	else if (mongoose.isValidObjectId(value))
	{
		return { [key]: new mongoose.Types.ObjectId(value) };
	}
	else if (isString(value))
	{
		return { [key]: new RegExp(escapeRegExp(value), "i") };
	}
	else
	{
		return {};
	}
};

/**
 * Generates a MongoDB aggregation pipeline stage for a lookup operation based on a given field path.
 * @param {string[]} fields - An array of field names representing the path to traverse.
 * @param {any} value - The value for searching.
 * @param {number} idx - The current index within the fields array (optional, default is 0).
 * @returns {object[]} - An array containing aggregation pipeline stage.
 */
const generateLookupStage = (fields, value, idx = 0) =>
{
	const isLast = idx === fields.length - 1;
	const fieldKey = fields[idx];

	return [
		{
			[isLast ? "$match" : "$lookup"]: {
				...(isLast
					? getMongooseMatcher(fieldKey, value)
					: {
							from:
								fieldKey === "equipments"
									? "equipmentmodels"
									: fieldKey === "moderation_report"
										? "moderationreports"
										: fieldKey.replace("_", ""),
							localField: fieldKey,
							foreignField: "_id",
							as: fieldKey,
							pipeline: generateLookupStage(fields, value, idx + 1),
						}),
			},
		},
		...(isLast
			? []
			: [
					{
						$unwind: {
							path: `$${fieldKey}`,
							preserveNullAndEmptyArrays: false,
						},
					},
				]),
	];
};

module.exports = { getMongooseNestedFieldsPipeline, getMongooseMatcher };
