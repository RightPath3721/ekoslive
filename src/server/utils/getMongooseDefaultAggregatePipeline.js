const isEmpty = require("lodash/isEmpty");
const isArray = require("lodash/isArray");
const escapeRegExp = require("lodash/escapeRegExp");
const calculateRadiusCoords = require("../utils/calculateRadiusCoords");
const getObjectsInRadiusPipeline = require("../utils/getObjectsInRadiusPipeline");
const {
	getMongooseNestedFieldsPipeline,
	getMongooseMatcher,
} = require("./getMongooseNestedFieldsPipeline");

/**
 * Generates a default aggregation pipeline for Mongoose queries.
 * This function builds an aggregation pipeline suitable for basic sorting, pagination,
 * searching, filtering, and projection.
 * @param {object} options - Options for customizing the aggregation pipeline.
 * @param {string} options.sort_direction - Sort direction (asc or desc, defaults to desc).
 * @param {string} options.sort_by - Field to sort by (defaults to "createdAt").
 * @param {string} options.search - Search term to filter results (defaults to "model").
 * @param {number} options.page - Page number for pagination (defaults to 0).
 * @param {number} options.limit - Number of documents per page (defaults to 10).
 * @param {string[]} options.search_fields - Array of fields to search in (defaults to ["username", "email", "label"]).
 * @param {object} options.projection - Object defining which fields to include or exclude (defaults to empty object).
 * @returns {object} An object containing the `aggregatePipeline` and `countPipeline` for aggregation.
 * - `aggregatePipeline` - The aggregation pipeline for finding documents.
 * - `countPipeline` - The aggregation pipeline for counting total documents (without sorting, pagination, or projection).
 */
const getMongooseDefaultAggregatePipeline = ({
	sort_direction = "desc",
	sort_by = "createdAt",
	search = "",
	page = 0,
	limit = 10,
	search_fields = ["username", "email", "label", "name", "social_nickname"],
	projection = {},
	...rest
}) =>
{
	const aggregatePipeline = [
		...(rest.createdAt ? [{
			$match: {
				createdAt: { $gte: new Date(rest.createdAt) }
			}
		}] : []),
		{ $sort: { [sort_by]: sort_direction === "desc" ? -1 : 1 } },
		{ $skip: +page * limit },
		{ $limit: +limit },
	];

	if (search)
	{
		const regex = new RegExp(escapeRegExp(search), "i");
		const matchStage = {
			$match: {
				$or: isArray(search_fields)
					? search_fields.map((field) => ({ [field]: regex }))
					: [{ [search_fields]: regex }],
			},
		};
		aggregatePipeline.unshift(matchStage);
	}

	if (Object.keys(rest).length > 0)
	{
		const filterStage = [];
		Object.entries(rest).map(([key, value]) =>
		{
			if (key?.includes("."))
			{
				filterStage.push(...getMongooseNestedFieldsPipeline(key, value));
			}
			else if (key === "location")
			{
				let [latitude, longitude] = value;

				if (!latitude || !longitude) return;

				const radius = rest["radius"];
				const pipeline = getObjectsInRadiusPipeline(
					calculateRadiusCoords(
						{ latitude: +latitude, longitude: +longitude },
						+radius,
					),
				);

				filterStage.push(...pipeline);
			}
			else if (key === "radius" || key === "createdAt")
			{
				return;
			}
			else
			{
				const stage = getMongooseMatcher(key, value);
				if (isEmpty(stage))
				{
					return;
				}
				else
				{
					filterStage.push({ $match: stage });
				}
			}
		});

		aggregatePipeline.unshift(...filterStage);
	}

	if (Object.keys(projection).length > 0)
	{
		const projectionStage = { $project: projection };
		aggregatePipeline.push(projectionStage);
	}

	return {
		aggregatePipeline,
		countPipeline: [
			...aggregatePipeline.slice(0, -2),
			{ $count: "totalCount" },
		],
	};
};

module.exports = getMongooseDefaultAggregatePipeline;
