import SunCalc from "suncalc";
import moment from "moment-timezone";

export const getTwilightTimes = (lat, lon, date, timezone) =>
{
	// Ensure the date is a Date object for SunCalc
	const targetDate = moment.tz(date, timezone);

	// Use SunCalc to get solar times for the given date and location
	const times = SunCalc.getTimes(targetDate.toDate(), lat, lon);
	
	// Get moon times for the same date and location
	const moonTimes = SunCalc.getMoonTimes(targetDate.toDate(), lat, lon);

	// Convert all times to moment objects in the specified timezone
	const formatTimeInTimezone = (time) => {
		if (!time) return null;
		
		// Convert UTC time directly to the target timezone
		// First get the UTC timestamp
		const utcTimestamp = time.getTime();
		
		// Create a moment object with that timestamp and set it to the target timezone
		return moment.utc(utcTimestamp).tz(timezone);
	};

	// Return combined solar and lunar times as moment objects in the specified timezone
	return {
		// Solar times
		sunrise: formatTimeInTimezone(times.sunrise),
		sunset: formatTimeInTimezone(times.sunset),
		civilDawn: formatTimeInTimezone(times.dawn),        // Sun is 6° below horizon
		civilDusk: formatTimeInTimezone(times.dusk),        // Sun is 6° below horizon
		nauticalDawn: formatTimeInTimezone(times.nauticalDawn),  // Sun is 12° below horizon
		nauticalDusk: formatTimeInTimezone(times.nauticalDusk),  // Sun is 12° below horizon
		astronomicalDawn: formatTimeInTimezone(times.nightEnd),  // Sun is 18° below horizon
		astronomicalDusk: formatTimeInTimezone(times.night),     // Sun is 18° below horizon
		
		// Lunar times
		moonrise: formatTimeInTimezone(moonTimes.rise),    // Time when moon rises
		moonset: formatTimeInTimezone(moonTimes.set)       // Time when moon sets
	};
};

// Helper functions to use with the returned moment objects
export const getHours = (momentObj) => momentObj ? momentObj.hours() : null;
export const getMinutes = (momentObj) => momentObj ? momentObj.minutes() : null;
export const getSeconds = (momentObj) => momentObj ? momentObj.seconds() : null;
export const format = (momentObj, formatString) => momentObj ? momentObj.format(formatString) : '';
