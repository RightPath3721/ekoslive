/**
 * Function to convert latitude/longitude to dms.
 * @param {number} value - Latitude or langitude to convert.
 * @param {["lat"|"lon"]} type - Type of coordinate: "lat" for latitude or "lon" for longitude.
 * @returns {string} - Converted value in format 0° 0' 0'' E.
 */
export const convertCoordToDms = (value, type = "lat") =>
{
	if (!value) return "No Location";
	const degrees = Math.floor(Math.abs(value));
	const minutes = Math.floor((Math.abs(value) - degrees) * 60);
	const seconds = Math.round((Math.abs(value) - degrees - minutes / 60) * 3600);

	const directionType = type === "lat" ? ["S", "N"] : ["W", "E"];
	const direction =
		value < 0
			? value < -180
				? directionType[1]
				: directionType[0]
			: value > 180
				? directionType[0]
				: directionType[1];
	return `${degrees.toString().padStart(2, "0")}° ${minutes.toString().padStart(2, "0")}' ${seconds.toString().padStart(2, "0")}" ${direction}`;
};

/**
 * Converts a DMS (Degrees, Minutes, Seconds) formatted string to decimal degrees.
 * @param {string} value - The DMS string to convert.
 * @returns {number} The decimal degrees equivalent.
 */
export const convertDmsToCoords = (value) =>
{
	const [degreesStr, minutesStr, secondsStr, directionStr] = value.split(" ");
	const degrees = parseInt(degreesStr);
	const minutes = parseInt(minutesStr);
	const seconds = parseInt(secondsStr);

	const sign = directionStr === "W" || directionStr === "S" ? -1 : 1;

	const decimalDegrees = degrees + minutes / 60 + (seconds / 3600) * sign;

	return decimalDegrees;
};
