/**
 * @typedef {{latitude: number,longitude: number}} Location
 * Function to get the range of coordinates for provided point and radius.
 * @param {Location} location - Location.
 * @param {number} [radius=10] - Radius in kilometers.
 * @returns {{min: Location, max: Location}} - Min and max coordinates in the specified radius.
 */
const calculateRadiusCoords = (location, radius = 10) =>
{
	const earthRadius = 6371; // Earth's radius in kilometers

	// Convert radius to radians
	const radiusInRadians = (radius * 1000) / earthRadius;

	// Calculate latitude range
	const minLatitude = location.latitude - radiusInRadians;
	const maxLatitude = location.latitude + radiusInRadians;

	// Calculate longitude range
	const averageLatitude = (minLatitude + maxLatitude) / 2;
	const deltaLongitude = radiusInRadians / Math.cos(averageLatitude);
	const minLongitude = location.longitude - deltaLongitude;
	const maxLongitude = location.longitude + deltaLongitude;

	return {
		min: { latitude: minLatitude, longitude: minLongitude },
		max: { latitude: maxLatitude, longitude: maxLongitude },
	};
};

module.exports = calculateRadiusCoords;
