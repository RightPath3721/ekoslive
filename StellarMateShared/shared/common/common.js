import { SchedulerJobStatus } from "../indi/enums";
import s from "../i18n/i18n";

const API_LOGGING = true;

/**
 *
 * @param fov FOV width in arc-minutes
 * @returns {number} Zoom level to send to HiPS generator tool in Ekos
 */
export const getZoomForFOV = (fov) =>
{
	return (
		355.0769 + (1719789000 - 355.0769) / ((1 + fov / 0.001310833) ^ 1.023914)
	);
};

export const apiLOG = (...params) =>
{
	if (API_LOGGING)
	{
		const timestamp = "[" + new Date().toUTCString() + "] ";
		console.log(timestamp, ...params);
	}
};

export const formatTimestamp = (d) =>
{
	let _d = new Date(d);
	let hh = `${_d.getHours()}`;
	if (hh < 10)
	{
		hh = `0${hh}`;
	}
	let mm = `${_d.getMinutes()}`;
	if (mm < 10)
	{
		mm = `0${mm}`;
	}
	let ss = `${_d.getSeconds()}`;
	if (ss < 10)
	{
		ss = `0${ss}`;
	}

	return `${hh}:${mm}:${ss}`;
};

export const GetTimeAgo = ({ dateString }) =>
{
	const now = new Date();
	const date = new Date(dateString);
	const seconds = Math.floor((now - date) / 1000);

	if (!seconds || seconds < 0) return "just now";

	const intervals = {
		year: 31536000,
		month: 2592000,
		week: 604800,
		day: 86400,
		hour: 3600,
		minute: 60,
	};

	let counter;
	let unit;

	if (seconds >= intervals.year)
	{
		counter = Math.floor(seconds / intervals.year);
		unit = counter === 1 ? "year" : "years";
	}
	else if (seconds >= intervals.month)
	{
		counter = Math.floor(seconds / intervals.month);
		unit = counter === 1 ? "month" : "months";
	}
	else if (seconds >= intervals.week)
	{
		counter = Math.floor(seconds / intervals.week);
		unit = counter === 1 ? "week" : "weeks";
	}
	else if (seconds >= intervals.day)
	{
		counter = Math.floor(seconds / intervals.day);
		unit = counter === 1 ? "day" : "days";
	}
	else if (seconds >= intervals.hour)
	{
		counter = Math.floor(seconds / intervals.hour);
		unit = counter === 1 ? "hour" : "hours";
	}
	else if (seconds >= intervals.minute)
	{
		counter = Math.floor(seconds / intervals.minute);
		unit = counter === 1 ? "minute" : "minutes";
	}
	else
	{
		return "just now";
	}

	return `${counter} ${unit} ago`;
};

export const toHMS = (D) =>
{
	let h = Math.floor(Math.abs(D / 15.0));
	let m = Math.floor((D / 15.0 - h) * 60);
	let s = Math.min(59, Math.round(60 * (60 * (D / 15.0 - h) - Math.abs(m))));
	if (h < 10)
	{
		h = `0${h}`;
	}
	if (m < 10)
	{
		m = `0${m}`;
	}
	if (s < 10)
	{
		s = `0${s}`;
	}
	return `${h}:${m}:${s}`;
};

// // Fraction of day -->
export const fractionToHM = (fraction, wrapToTomorrow = false) =>
{
	const now = Date.now();
	let fractionTime = new Date();
	fractionTime.setHours(0, 0, 0, 0);
	const value = fraction * 24 * 3600;
	fractionTime.setSeconds(fractionTime.getSeconds() + value);
	if (wrapToTomorrow && fractionTime < now)
		fractionTime.setDate(fractionTime.getDate() + 1);
	let h = fractionTime.getHours();
	if (h < 10) h = `0${h}`;
	let m = fractionTime.getMinutes();
	if (m < 10) m = `0${m}`;
	return `${h}:${m}`;
};

export const toHA = (D) =>
{
	let H = D / 15.0;
	if (H < -12) H += 24;
	if (H > 12) H -= 24;

	let sign = H >= 0 ? "+" : "-";
	H = Math.abs(H);
	let h = Math.floor(H);
	let m = Math.floor((H - h) * 60);
	let s = Math.min(59, Math.round(60 * (60 * (H - h) - Math.abs(m))));
	if (h < 10)
	{
		h = `0${h}`;
	}
	if (m < 10)
	{
		m = `0${m}`;
	}
	if (s < 10)
	{
		s = `0${s}`;
	}
	return `${sign}${h}:${m}:${s}`;
};

export const toDMS = (D) =>
{
	let sign = D >= 0 ? "+" : "-";
	let dabs = Math.abs(D);
	let d = Math.floor(dabs);
	let m = Math.floor((dabs - d) * 60);
	let s = Math.min(59, Math.round(60 * (60 * (dabs - d) - Math.abs(m))));
	if (d < 10)
	{
		d = `0${d}`;
	}
	if (m < 10)
	{
		m = `0${m}`;
	}
	if (s < 10)
	{
		s = `0${s}`;
	}

	return `${sign}${d}:${m}:${s}`;
};

export const DMSToDouble = (dmsStr) =>
{
	if (!dmsStr) return NaN;

	// If it's already a number, just return it
	if (!dmsStr.includes(":"))
	{
		return parseFloat(dmsStr);
	}

	const parts = dmsStr.split(":");
	if (parts.length < 2 || parts.length > 3)
	{
		return NaN;
	}

	// Parse each component
	const degrees = parseFloat(parts[0]);
	const minutes = parseFloat(parts[1]);
	const seconds = parts.length === 3 ? parseFloat(parts[2]) : 0;

	// Validate ranges
	if (
		isNaN(degrees) ||
		isNaN(minutes) ||
		isNaN(seconds) ||
		minutes < 0 ||
		minutes >= 60 ||
		seconds < 0 ||
		seconds >= 60
	)
	{
		return NaN;
	}

	// Preserve the sign of degrees for the final result
	const sign = degrees < 0 ? -1 : 1;
	return sign * (Math.abs(degrees) + minutes / 60 + seconds / 3600);
};

export const deltaAngle = (angle1, angle2) =>
{
	let angleDiff = angle1 - angle2;

	while (angleDiff > 360) angleDiff -= 360;
	while (angleDiff < -360) angleDiff += 360;

	// Adjust to range [-180, 180]
	if (angleDiff > 180) return -(360 - angleDiff);
	if (angleDiff < -180) return 360 + angleDiff;

	return angleDiff;
};

export const toAZ = (D) =>
{
	let dabs = Math.abs(D);
	let d = Math.floor(dabs);
	let m = Math.floor((dabs - d) * 60);
	let s = Math.min(59, Math.round(60 * (60 * (dabs - d) - Math.abs(m))));
	if (d < 100)
	{
		d = `0${d}`;
	}
	else if (d < 10)
	{
		d = `00${d}`;
	}
	if (m < 10)
	{
		m = `0${m}`;
	}
	if (s < 10)
	{
		s = `0${s}`;
	}

	return `${d}:${m}:${s}`;
};

export const toFixed = (num, decimalPlaces) =>
{
	const extra = Math.pow(10, Math.abs(decimalPlaces));
	return Math.round(num * extra + Number.EPSILON) / extra;
};

export function formatBytes(a, b)
{
	if (a === 0) return "0 Bytes";

	const c = 1024,
		d = b || 2,
		e = ["Bytes", "KB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"],
		f = Math.floor(Math.log(a) / Math.log(c));
	return parseFloat((a / Math.pow(c, f)).toFixed(d)) + " " + e[f];
}

export const range360 = (degree) =>
{
	let res = degree;
	while (res < 0.0) res += 360.0;
	while (res > 360.0) res -= 360.0;
	return res;
};

export const range24 = (r) =>
{
	let res = r;
	while (res < 0.0) res += 24.0;
	while (res > 24.0) res -= 24.0;
	return res;
};

export const rangeDec = (degrees) =>
{
	if (degrees >= 270.0 && degrees <= 360.0) return degrees - 360.0;
	if (degrees >= 180.0 && degrees < 270.0) return 180.0 - degrees;
	if (degrees >= 90.0 && degrees < 180.0) return 180.0 - degrees;
	return degrees;
};

/**
 * Zoom level in Ekos HIPSFinder versus the tile actual FOV we get in arc-minutes.
 */
export const LevelsMap = [
	{ zoom: 5000, fov: 324.368568 },
	{ zoom: 10000, fov: 176.075946 },
	{ zoom: 15000, fov: 117.421226 },
	{ zoom: 20000, fov: 87.833624 },
	{ zoom: 25000, fov: 70.527829 },
	{ zoom: 30000, fov: 58.6182 },
];

export const rangePositionAngle = (degrees) =>
{
	while (degrees > 180) degrees -= 360;
	while (degrees < -180) degrees += 360;
	return degrees;
};

export const rotationToPositionAngle = (rotation) =>
{
	let pa = rotation + 180;
	if (pa > 180) pa -= 360;
	if (pa < -180) pa += 360;
	return pa;
};

export const positionAngleToRotation = (pa) =>
{
	let rotation = pa - 180;
	if (rotation > 180) rotation -= 360;
	if (rotation < -180) rotation += 360;
	return rotation;
};

export function addHoursToDate(date, h)
{
	date.setTime(date.getTime() + h * 60 * 60 * 1000);
	return date;
}

export function addMinutesToDate(date, m)
{
	date.setTime(date.getTime() + m * 60 * 1000);
	return date;
}

export function capitalizeAllWords(string)
{
	const words = string.split(" ");

	for (let i = 0; i < words.length; i++)
	{
		words[i] = words[i][0].toUpperCase() + words[i].substr(1);
	}

	return words.join(" ");
}

export function removeWhiteSpace(string)
{
	return string.replace(/ /g, "");
}

export const reduceDecimalPlaces = (number) =>
{
	if (number === null || isNaN(number)) return 0;

	// Convert the number to a string with 3 decimal places
	const reducedNumberString = parseFloat(number.toFixed(3)).toString();

	// Remove any trailing zeros and unnecessary decimal point
	const trimmedNumberString = reducedNumberString
		.replace(/(\.\d*?[1-9])0+$/, "$1")
		.replace(/\.$/, "");

	// Convert the string back to a float
	return parseFloat(trimmedNumberString);
};

export const PierSides = ["west", "east"];
export const toPierSideText = (pierSide) =>
{
	if (pierSide < 0 || pierSide > 1) return "Unknown";
	else return s.ekos.collapse_polar[PierSides[pierSide]];
};

// a and b are javascript Date objects
export const dateDiffInDays = (a, b) =>
{
	const _MS_PER_DAY = 1000 * 60 * 60 * 24;
	// Discard the time and time-zone information.
	const utc1 = Date.UTC(a.getFullYear(), a.getMonth(), a.getDate());
	const utc2 = Date.UTC(b.getFullYear(), b.getMonth(), b.getDate());

	return Math.abs(Math.floor((utc2 - utc1) / _MS_PER_DAY));
};

export const EmptyAction = { type: "NOP", payload: "" };

// Binning Options
export const binningOptions = [
	{
		label: "1x1",
		value: 1,
	},
	{
		label: "2x2",
		value: 2,
	},
	{
		label: "4x4",
		value: 4,
	},
];

// Frame types
export const frameTypeOptions = [
	{ label: "L", text: "Light", value: 0 },
	{ label: "B", text: "Bias", value: 1 },
	{ label: "D", text: "Dark", value: 2 },
	{ label: "F", text: "Flat", value: 3 },
];

export const returnSchedulerStatus = (item) =>
{
	let status = "Idle";
	if (item === SchedulerJobStatus.IDLE) status = "Idle";
	else if (item === SchedulerJobStatus.EVALUATION) status = "Evaluation";
	else if (item === SchedulerJobStatus.SCHEDULED) status = "Scheduled";
	else if (item === SchedulerJobStatus.RUNNING) status = "Running";
	else if (item === SchedulerJobStatus.ERROR) status = "Error";
	else if (item === SchedulerJobStatus.ABORTED) status = "Aborted";
	else if (item === SchedulerJobStatus.INVALID) status = "Invalid";
	else if (item === SchedulerJobStatus.COMPLETED) status = "Completed";
	return status;
};

/**
 * Trim versions
 * @param {*} version 2.7.20 --> 2.7.2
 * @returns
 */
export const getTrimmedVersion = (version) =>
{
	const versionSegments = version.split(".");

	// If there are at least three segments, trim the last segment to its first character
	if (versionSegments.length >= 3)
	{
		versionSegments[2] = versionSegments[2].charAt();
	}

	return versionSegments.join(".");
};
