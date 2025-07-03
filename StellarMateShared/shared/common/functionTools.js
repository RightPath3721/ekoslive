import
{
	targetsActions,
	mountActions,
	alignActions,
	schedulerActions,
	captureActions,
	profileActions,
} from "@redux/actions";
import
{
	selectCheckStatus,
	selectProfiles,
	selectSelectedProfile,
} from "@redux/selectors";
import { store } from "@redux/store";
import
{
	directionTypes,
	objectTypes,
} from "@common/shared/indi/enums";
import { fractionToHM } from "@common/shared/common/common";
import s from "../i18n/i18n";
import { get } from "lodash";
import storage from "../../config/storage"
import { trainModules } from "../indi/enums";

/**
 * Pauses the execution of the asynchronous function for a specified number of milliseconds.
 * @param {number} ms The number of milliseconds to wait before resolving the promise.
 * @return {Promise<void>} A promise that resolves after the specified number of milliseconds.
 */
function sleep(ms)
{
	return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Converts a given timestamp into a Julian Date.
 * @param {number | string} timestamp The timestamp to be converted to Julian Date. This can be a Unix timestamp (milliseconds since epoch) or a date string parseable by the JavaScript Date object.
 * @returns {number} The corresponding Julian Date
 */
function timestampToJulianDate(timestamp)
{
	// Create a new Date object from the timestamp
	const date = new Date(timestamp);
	// Get the individual components of the date
	let year = date.getUTCFullYear();
	let month = date.getUTCMonth() + 1; // Months are zero-based, so we add 1
	const day = date.getUTCDate();
	const hour = date.getUTCHours();
	const minute = date.getUTCMinutes();
	const second = date.getUTCSeconds();
	const millisecond = date.getUTCMilliseconds();
	// Adjust month and year if the month is January or February
	if (month <= 2)
	{
		year -= 1;
		month += 12;
	}
	// Calculate intermediate values
	const A = Math.floor(year / 100);
	const B = 2 - A + Math.floor(A / 4);
	// Calculate the Julian Day Number (JDN)
	const JDN =
		Math.floor(365.25 * (year + 4716)) +
		Math.floor(30.6001 * (month + 1)) +
		day +
		B -
		1524.5;
	// Calculate the fractional day from the time
	const dayFraction =
		hour / 24 + minute / 1440 + second / 86400 + millisecond / 86400000;
	// Combine JDN and dayFraction to get the Julian Date
	const JD = JDN + dayFraction;
	return JD;
}

/**
 * Searches for astronomical objects
 * @param {object} options The options for searching target objects.
 * @param {number} [options.minAlt=15] The minimum altitude in degrees
 * @param {number} [options.maxMagnitude=10] The maximum magnitude (brightness) of the objects.
 * @param {number} [options.minDuration=1] The minimum duration in hours for which the object should be visible.
 * @param {number} [options.minFOV=5] The minimum Field of View (FOV) in arcminutes.
 * @param {number} [options.maxFOV] The maximum Field of View (FOV) in arcminutes (optional).
 * @param {string} [options.direction="All"] The direction in which to search for objects (e.g., "N", "S", "E", "W").
 * @param {string} [options.objectType="Galaxies"] The type of objects to search for (e.g., "Galaxies", "Stars").
 * @param {boolean} [options.night] If true, set the search at night time.
 * @param {number | string} [options.time] The specific time (timestamp) at which to search for objects.
 * @param {boolean} [options.observable] If true, filter objects that are observable based on sensor FOV profile.
 * @returns {Array<string>} An array of target object names that meet the specified criteria.
 */
async function findTargetObjects({
	minAlt = 15,
	maxMagnitude = 10,
	minDuration = 1,
	minFOV = 5,
	maxFOV,
	direction = "All",
	objectType = "Galaxies",
	night,
	time,
	observable,
})
{
	let jd;
	const ekosStatus = store.getState().ekos.connection.online;
	if (night && !ekosStatus)
	{
		const dusk = store.getState().targets.almanac?.Dusk;
		const dawn = store.getState().targets.almanac?.Dawn;
		let HM = fractionToHM((dusk + dawn) / 2 || 0);
		let timestamp = new Date();
		const [hours, minutes] = HM.split(":").map(Number);
		timestamp.setHours(hours, minutes, 0, 0);
		jd = timestampToJulianDate(timestamp);
	}
	if (time && !ekosStatus)
	{
		jd = timestampToJulianDate(time);
	}
	await store.dispatch(
		targetsActions.searchObjects({
			jd: jd,
			maxMagnitude: maxMagnitude,
			minAlt: minAlt,
			direction: directionTypes[direction],
			minDuration: minDuration * 3600,
			minFOV: minFOV,
			type: objectTypes[objectType],
		}),
	);

	await sleep(3000);

	// Access state directly from the store
	const targetObjectNames = store.getState().targets.names;
	let targetObjects = store
		.getState()
		.targets.objects.filter((item) =>
			targetObjectNames.includes(item.metadata.name),
		);

	// Filter with maxFOV

	if (maxFOV)
	{
		targetObjects = targetObjects.filter(
			(item) =>
				item.metadata.fov_h * 60 < maxFOV && item.metadata.fov_w * 60 < maxFOV,
		);
	}

	const targetsState = store.getState().targets;
	const sensorFovProfiles = targetsState.fovProfiles;
	const currentFovProfileName = targetsState.currentFOVProfile;

	const currentFOVProfile = sensorFovProfiles.find(
		(item) => item.name === currentFovProfileName,
	);

	const sensorFovH = currentFOVProfile?.fovH;
	const sensorFovW = currentFOVProfile?.fovW;

	// Filter with ratio of FOV

	if (observable)
	{
		let result = [];

		for (let item of targetObjects)
		{
			const sensorFOV = sensorFovH * sensorFovW;
			const targetFOV = item.metadata.fov_h * item.metadata.fov_w * 3600;
			const minRatio = 25;
			const maxRatio = 125;
			const ratio = (targetFOV / sensorFOV) * 100;

			if (ratio)
			{
				if (ratio >= minRatio && ratio <= maxRatio) result.push(item);
			}
			else
			{
				result.push(item);
			}
		}

		// return result
		return result?.map((item) => item.metadata.name);
	}

	// return targetObjects
	return targetObjects?.map((item) => item.metadata.name);
}

/**
 * Compares two strings to check if they are considered the same based on specific criteria.
 * @param {string} first The first string to compare
 * @param {string} second The second string to compare
 * @param {boolean} [isExact=true] If true, checks for exact match (ignoring case and whitespace).
 * If false, checks if the second string is a substring of the first string (ignoring case and whitespace).
 * @returns {boolean} Returns true if the strings match based on the criteria, otherwise false.
 */
function isSameString(first, second, isExact = true)
{
	if (first == null || second == null) return false;

	const smallFirst = first.toLowerCase().replace(/\s+/g, "");
	const smallSecond = second.toLowerCase().replace(/\s+/g, "");

	if (isExact)
	{
		return smallFirst === smallSecond;
	}
	else
	{
		return smallFirst.includes(smallSecond);
	}
}

/**
 * Compares two floating-point numbers to determine if they are considered the same within a specified threshold.
 * @param {number} first The first floating-point number to compare
 * @param {number} second The second floating-point number to compare.
 * @param {number} [threshold=0.1] The threshold within which the two numbers are considered the same. Default is 0.1.
 * @returns {boolean} Returns true if the absolute difference between the two numbers is less than or equal to the threshold, otherwise false.
 */
function isSameFloat(first, second, threshold = 0.1)
{
	if (first == null || second == null) return false;

	return Math.abs(first - second) <= threshold;
}

/**
 * Compares two values to determine if they are the same integer.
 * @param {number} first The first value to compare, which can be of any type that can be parsed as an integer.
 * @param {number} second The second value to compare, which can be of any type that can be parsed as an integer.
 * @returns {boolean} Returns true if both values are the same integer, otherwise false.
 */
function isSameInteger(first, second)
{
	if (first == null || second == null) return false;

	return parseInt(first) === parseInt(second);
}

/**
 * Filters a list of image metadata objects based on specified criteria.
 * @param {Object} options The filter criteria.
 * @param {Object} [options.airmass] The airmass criteria.
 * @param {number} [options.airmass.min] The minimum airmass value.
 * @param {number} [options.airmass.max] The maximum airmass value.
 * @param {Object} [options.binning] The binning criteria.
 * @param {number} [options.binning.X] The binning factor along the X-axis.
 * @param {number} [options.binning.Y] The binning factor along the Y-axis.
 * @param {string} [options.camera] The camera name (case-insensitive, partial match).
 * @param {Date | string} [options.date] The date of the image (exact date match).
 * @param {Object} [options.exposure] The exposure criteria.
 * @param {number} [options.exposure.min] The minimum exposure time.
 * @param {number} [options.exposure.max] The maximum exposure time.
 * @param {string} [options.filename] The filename (case-insensitive, exact match).
 * @param {string} [options.filter] The filter name (case-insensitive, exact match).
 * @param {string} [options.frame] The frame type (case-insensitive, exact match).
 * @param {string} [options.telescope] The telescope name (case-insensitive, partial match).
 * @param {string} [options.object] The object name (case-insensitive, exact match).
 * @param {number} [options.temperature] The CCD temperature (float).
 * @param {number} [options.gain] The gain value (integer).
 * @param {number} [options.offset] The offset value (integer).
 * @returns {Array<object>} An array of filtered image metadata objects.
 */
function filterImages({
	airmass,
	binning,
	camera,
	date,
	exposure,
	filename,
	filter,
	frame,
	telescope,
	object,
	temperature,
	gain,
	offset,
})
{
	const images = store.getState().wsMedia.images;

	const filteredImages = images.filter((item) =>
	{
		const metadata = item.metadata;

		if (airmass?.min && metadata.airmass < airmass.min) return false;
		if (airmass?.max && metadata.airmass > airmass.max) return false;

		if (binning?.X && metadata.xbinning !== binning.X) return false;
		if (binning?.Y && metadata.ybinning !== binning.Y) return false;

		// String, isExact = false
		if (camera && !isSameString(metadata.instrume, camera, false)) return false;
		if (date && !isSameDate(metadata.ts, date)) return false;

		if (exposure?.min && metadata.exptime < exposure.min) return false;
		if (exposure?.max && metadata.exptime > exposure.max) return false;

		// String, isExact = true
		if (filename && !isSameString(metadata.filename, filename, true))
			return false;

		// String, isExact = true
		if (filter && !isSameString(metadata.filter, filter, true)) return false;

		// String, isExact = true
		if (frame && !isSameString(metadata.frame, frame, true)) return false;

		// String, isExact = false
		if (telescope && !isSameString(metadata.telescop, telescope, false))
			return false;

		// String, isExact = true
		if (object && !isSameString(metadata.object, object, true)) return false;

		// Float
		if (temperature && !isSameFloat(metadata["ccd-temp"], temperature))
			return false;

		if (gain && !isSameInteger(metadata.gain, gain)) return false;
		if (offset && !isSameInteger(metadata.offset, offset)) return false;

		return true;
	});
	return filteredImages;
}

/**
 * Compares two date strings to determine if they represent the same calendar date.
 * @param {string | Date} dateStr1 The first date string or Date object to compare.
 * @param {string | Date} dateStr2 The second date string or Date object to compare.
 * @return {boolean} Returns true if both date strings represent the same calendar date, otherwise false.
 */
function isSameDate(dateStr1, dateStr2)
{
	if (!dateStr1 || !dateStr2) return false;

	const date1 = new Date(dateStr1);
	const date2 = new Date(dateStr2);

	return (
		date1.getFullYear() === date2.getFullYear() &&
		date1.getMonth() === date2.getMonth() &&
		date1.getDate() === date2.getDate()
	);
}

/**
 * Configures the auto-parking feature based on specified parameters.
 * @param {Object} config - Configuration object
 * @param {boolean} [config.everyday=false] - Determines if the auto-park feature should be enabled every day.
 * @param {string} [config.time="00:00:00"] - Specifies the exact time to trigger auto-parking in the format "HH:MM:SS".
 * @param {boolean} [config.sunrise] - If set to true, the auto-park time will be set to the sunrise time fetched from the state store.
 * @param {boolean} [config.dawn] - If set to true, the auto-park time will be set to the dawn time fetched from the state store.
 * @returns {string} - Returns a completion status indicating that the action was successfully completed.
 */
function autoPark({ everyday = false, time = "00:00:00", sunrise, dawn })
{
	if (sunrise)
	{
		const sunrise = store.getState().targets.almanac?.SunRise;
		let HM = fractionToHM(sunrise);
		time = `${HM}:00`;
	}

	if (dawn)
	{
		const dawn = store.getState().targets.almanac?.Dawn;
		let HM = fractionToHM(dawn);
		time = `${HM}:00`;
	}

	const payload = {
		parkEveryDay: everyday,
		autoParkTime: time,
	};

	store.dispatch(mountActions.setAllSettings(payload));
	store.dispatch(mountActions.setAutoPark({ toggled: true }));

	return s.stella.action_completed;
};

/**
 * Commands a telescope to go to a specified target and solve the alignment.
 * @param {Object} options The options for this function.
 * @param {string} [options.target] The target celestial object to go to.
 * @param {boolean} [options.solve] If true, initiates a solve action after reaching the target.
 * @returns {Promise<string>} A promise that resolves to a status message indicating the result of the action.
 */
async function gotoAndSolve({ target, solve })
{
	let designations = null;

	const objects = await storage.getItem("astro_designations");
	if (objects)
	{
		designations = JSON.parse(objects);
	}

	let primary = target;
	if (designations && Array.isArray(designations))
	{
		designations.forEach((oneDesignation) =>
		{
			if (oneDesignation.designations.includes(target))
			{
				primary = oneDesignation.primary;
			}
		});
	}

	const ekosProfileRunning = store.getState().ekos.connection.online;
	if (!ekosProfileRunning)
	{
		return s.stella.confirm_ekos_running;
	}
	const mountTarget = store.getState().status.mount.target;
	const confirmSameTarget = mountTarget === primary;
	if (confirmSameTarget)
	{
		if (solve)
		{
			store.dispatch(alignActions.solve());
			return s.stella.go_solve_action;
		}
		return s.stella.action_completed;
	}
	else
	{
		store.dispatch(mountActions.unpark());

		setTimeout(() => store.dispatch(mountActions.gotoTarget(target), 1000));

		if (solve)
		{
			// Introduce another 1000 ms delay before starting the status check loop
			setTimeout(() =>
			{
				return new Promise((resolve) =>
				{
					const intervalId = setInterval(() =>
					{
						const mountStatus = store.getState().status.mount.status;

						if (mountStatus === "Tracking")
						{
							// When "Tracking" status is found, dispatch the action
							store.dispatch(alignActions.solve());
							// Clear the interval to stop further checks
							clearInterval(intervalId);
							return s.stella.go_solve_action;
						}
					}, 500);
				});
			}, 1000);
		}
		return s.stella.action_completed;
	}
};

/**
 * Manages telescope scheduler jobs by either deleting all jobs or starting the scheduler.
 * @param {Object} options The options for managing the scheduler.
 * @param {boolean} [options.deleteJobs] If true, deletes all current scheduler jobs.
 * @param {boolean} [options.start] If true, starts the scheduler if it is not already running.
 * @return {string} Returns a status message indicating the result of the action.
 */
function scheduler({ deleteJobs, start })
{
	const jobs = store.getState().ekos?.schedulerJobs?.jobs || [];
	if (deleteJobs)
	{
		if (jobs.length > 0)
		{
			jobs.forEach((item, index) =>
			{
				store.dispatch(schedulerActions.removeJob({ index }));
			});
		}
		return s.stella.action_completed;
	}
	if (start)
	{
		const schedulerRunning = store.getState().status.scheduler.status;
		if (schedulerRunning == 2) return s.stella.action_completed;
		else
		{
			store.dispatch(schedulerActions.toggleScheduler());
			return s.stella.action_completed;
		}
	}
	return s.stella.action_failed;
}

/**
 * Captures a preview image if the Ekos profile is running and certain conditions are met.
 * @param {Object} options The options for capturing a preview.
 * @param {boolean} [options.preview] If true, initiates a capture preview action.
 * @return {string} Returns a status message indicating the result of the action.
 */
function capture({ preview })
{
	const ekosProfileRunnig = store.getState().ekos.connection.online;
	if (!ekosProfileRunnig)
	{
		return s.stella.confirm_ekos_running;
	}
	const isCapturing = selectCheckStatus(store.getState());
	if (preview && !isCapturing)
	{
		store.dispatch(captureActions.capturePreview());
		return s.stella.action_completed;
	}
	return s.stella.action_failed;
}

/**
 * Toggles the ekos profile based on the provided enabled flag.
 * @param {Object} options The options for toggling the profile.
 * @param {boolean} [options.enabled] If true, enables and starts the profile; if false, stops the profile.
 * @return {string} Returns a status message indicating the result of the action.
 */
function profileToggle({ enabled })
{
	const profiles = selectProfiles(store.getState());
	const selectedProfile = selectSelectedProfile(store.getState());

	if (enabled)
	{
		// Check if the currently selected scopes are the same ones selected in the profile
		// if not, sync them and THEN start the profile.
		const profile = profiles.find(
			(item) => get(item, "name", "") === selectedProfile,
		);
		if (profile)
		{
			//set auto_connect to true, if its not checked by default.
			if (profile.auto_connect === false)
			{
				profile.auto_connect = true;
			}
			store.dispatch(profileActions.updateProfile(profile));
		}
		store.dispatch(profileActions.saveSelectedProfile(profile.name));
		store.dispatch(profileActions.startProfile(profile));
	}
	else
	{
		store.dispatch(profileActions.stopProfile());
	}

	return s.stella.action_completed;
}

/**
 * Toggles the parking state of a target device (mount, dome, or cap) with optional scheduling.
 * @param {Object} options The options for toggling the parking state.
 * @param {string} [options.target] The target device to toggle (e.g., "mount", "dome", "cap").
 * @param {boolean} [options.park] If true, parks the target device.
 * @param {boolean} [options.abort] If true, aborts the mount action.
 * @returns {string} - Returns a status message indicating the result of the action.
 */
function parkToggle({ target, park, abort })
{
	const ekosProfileRunning = store.getState().ekos.connection.online;
	if (!ekosProfileRunning)
	{
		return s.stella.confirm_ekos_running;
	}
	if (target === "mount")
	{
		if (abort)
		{
			store.dispatch(mountActions.stop());
			return s.stella.action_completed;
		}
		else
		{
			store.dispatch(park ? mountActions.park() : mountActions.unpark());
			return s.stella.action_completed;
		}
	}
	else if (target === "dome")
	{
		const dome = selectDome(store.getState());
		store.dispatch(dome.togglePark(park));
		return s.stella.action_completed;
	}
	else if (target === "cap")
	{
		const cap = selectTrainDevice(store.getState(), {
			trainType: trainModules.CaptureOpticalTrain,
			deviceType: DEVICE_TYPE.DUSTCAP,
		});
		store.dispatch(cap.togglePark(park));
		return s.stella.action_completed;
	}
	else
	{
		return s.stella.action_failed;
	}
}


/**
 * Executes a specified function with provided arguments and returns its result.
 * @param {string} function_name The name of the function to execute.
 * @param {Object} function_args The arguments to pass to the function.
 * @return {Promise<*>} A promise that resolves to the result of the executed function.
 */
async function functionTools(function_name, function_args)
{
	switch (function_name)
	{
		case "findTargetObjects":
			return await findTargetObjects(function_args);
		case "filterImages":
			return filterImages(function_args);
		case "parkToggle":
			return parkToggle(function_args);
		case "autoPark":
			return autoPark(function_args);
		case "gotoAndSolve":
			return await gotoAndSolve(function_args);
		case "scheduler":
			return scheduler(function_args);
		case "capture":
			return capture(function_args);
		case "profileToggle":
			return profileToggle(function_args);
	}
}

export default functionTools;
