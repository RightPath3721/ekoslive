/**
 * @typedef {{latitude: number,longitude: number}} Location
 * Generates a Mongoose pipeline for filtering objects based on their location within a specified radius.
 * @param {{min: Location, max: Location}} locationData - An object containing the minimum and maximum latitude/longitude coordinates for the search area.
 * @returns {Array<object>} - An array representing the Mongoose pipeline stages for filtering by location.
 */
const getObjectsInRadiusPipeline = ({ max, min }) =>
{
	const pipeline = [
		{
			$lookup: {
				from: "locations",
				localField: "location",
				foreignField: "_id",
				as: "location",
			},
		},
		{ $unwind: "$location" },
		{
			$match: {
				"location.lat": { $gte: min.latitude, $lte: max.latitude },
				"location.lng": { $gte: min.longitude, $lte: max.longitude },
			},
		},
	];
	return pipeline;
};

module.exports = getObjectsInRadiusPipeline;
