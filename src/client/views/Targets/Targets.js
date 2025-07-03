import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Grid from "@mui/material/Grid";
import Modal from "@mui/material/Modal";
import Typography from "@mui/material/Typography";
import debounce from "lodash/debounce";
import get from "lodash/get";
import isEmpty from "lodash/isEmpty";
import isEqual from "lodash/isEqual";
import union from "lodash/union";
import dayjs from "dayjs";
import React, {
	Suspense,
	useCallback,
	useEffect,
	useRef,
	useState,
} from "react";
import { useDispatch, useSelector } from "react-redux";
import { useTimer } from "react-timer-hook";
import Icon from "@components/Icon";
import SliderComponent from "@components/Slider";

import {
	selectCamerasResolution,
	selectTelescopeInfo,
	selectListObjectNames,
	selectAlmanac,
	selectConnectionOnline,
	selectConnected,
	selectTargetsSearchResults,
	selectHipsCache,
	selectTargetsObjects,
	selectLocalLoadingObjects,
	selectRemoteLoadingObjects,
	selectObservability,
	selectRisetime,
	selectInfoUpdateTS,
	selectAlignPA,
	selectAlignFOV,
	selectAlignCamera,
	selectCurrentFOVProfile,
	selectFovProfiles,
	selectUser,
	selectSelectedProfile,
	selectTrainName,
} from "@redux/selectors";
import { indiActions, targetsActions } from "@redux/actions";
import { toDMS, dateDiffInDays } from "@common/shared/common/common";
import { directionTypes, objectTypes, Sync, trainModules } from "@indi/enums";
import s from "@common/shared/i18n/i18n";
import { deviceType } from "@indi/enums";
import { px, styles } from "../../shared/styles";
import { Palette } from "@common/shared/common/styles";
import FovBar from "./FovBar";
import ListsBar from "./ListsBar";
import FovSettings from "./FovSettings";
import ExternalSearch from "./ExternalSearch";
import TargetsList from "./TargetsList";
import StellaFilterInputButton from "@components/StellaFilterInputButton";
import TabLoader from "@components/TabLoader";
import tourGuide from "@components/global/tourGuide";
import SyncSettings from "@common/shared/utils/sync";
import { isArray } from "lodash";
import config from "@client/config";

const VisibilityOverlay = React.lazy(() => import("./VisibilityOverlay"));
const ObjectTypeOverlay = React.lazy(() => import("./ObjectTypeOverlay"));
const ListsPopup = React.lazy(() => import("./ListsPopup"));

const tourGuideSteps = [
	{
		selector: "#targetInfo",
		content: s.tourGuide.description_targets_info,
	},
	{
		selector: "#targetSearch",
		content: s.tourGuide.description_search_bar,
	},
	{
		selector: "#targetDateTime",
		content: s.tourGuide.description_time_controls,
	},
	{
		selector: "#targetControl",
		content: s.tourGuide.description_target_controls,
	},
	{
		selector: "#objectInfo",
		content: s.tourGuide.description_object_info,
	},
	{
		selector: "#targetFOV",
		content: s.tourGuide.description_fov,
	},
	{
		selector: "#targetAction",
		content: s.tourGuide.description_target_action,
	},
];

const defaultSettings = {
	searchText: "",
	objectType: "Galaxies",
	direction: "All",
	minAlt: 15,
	minDuration: 1,
	minFOV: 5,
	maxMagnitude: 10,
	activeList: "",
};

const Targets = ({ active }) =>
{
	const dispatch = useDispatch();

	// Ekos Alamac data
	const almanac = useSelector(selectAlmanac, isEqual);
	// Are we connected to StellarMate
	const connected = useSelector(selectConnected);
	// Is Ekos online now?
	const ekosRunning = useSelector(selectConnectionOnline);
	// Search results from the filters
	const searchResults = useSelector(selectTargetsSearchResults);

	// Core data for objects in cache (hipsCache) and also in memory (targetsObjects)
	const hipsCache = useSelector(selectHipsCache);
	const targetsObjects = useSelector(selectTargetsObjects);

	// Use we this to keep track of pending objects that we asked Ekos to send back.
	// It is necessary so that we don't keep spamming Ekos requests for pending data.
	const localLoadingObjects = useSelector(selectLocalLoadingObjects);
	const remoteLoadingObjects = useSelector(selectRemoteLoadingObjects);

	// Time-dependent data. Whenever time changes, we need to update them.
	const observability = useSelector(selectObservability);
	const risetime = useSelector(selectRisetime);
	const infoUpdateTS = useSelector(selectInfoUpdateTS);
	const user = useSelector(selectUser);

	// Align rotation use for framing assistance
	const alignPA = useSelector(selectAlignPA);
	const alignFOV = useSelector(selectAlignFOV);
	const alignCamera = useSelector(selectAlignCamera);

	// User generated lists
	const lists = useSelector((state) => state.targets.lists);
	const [activeList, setActiveList] = useState("");
	const [filteredNames, setFilteredNames] = useState([]);
	const activeListNames = useSelector((state) =>
		selectListObjectNames(state, activeList),
	);
	// Field of View profiles
	const currentFOVProfile = useSelector(selectCurrentFOVProfile);
	const fovProfiles = useSelector(selectFovProfiles);
	const prevFovProfiles = useRef(fovProfiles);
	const prevTargetLists = useRef(lists);

	// Hardware Info
	const cameraInfo = useSelector(
		(state) => selectCamerasResolution(state),
		isEqual,
	);
	const telescopeInfo = useSelector(
		(state) => selectTelescopeInfo(state),
		isEqual,
	);
	const isSyncAllowed = useSelector((state) => state.wsMessage.connected);

	// Rotators
	const rotators = useSelector(
		(state) =>
			state.indi.devices.filter((device) => device.type === deviceType.ROTATOR),
		isEqual,
	);
	const [presetToggle, setPresetToggle] = useState({
		enabled: false,
		mode: "none",
	});
	const activeProfile = useSelector(selectSelectedProfile);
	const activeTrain = useSelector((state) =>
		selectTrainName(state, { trainType: trainModules.CaptureOpticalTrain }),
	);
	const [dateTime, setDateTime] = useState(new Date());

	const [selectedDate, setSelectedDate] = useState(new Date());
	const [selectedTime, setSelectedTime] = useState(new Date());
	const [showDatePicker, setShowDatePicker] = useState(false);
	const [showTimePicker, setShowTimePicker] = useState(false);

	const [showVisibilityOverlay, setShowVisibilityOverlay] = useState(false);
	const [showFilterOverlay, setShowFilterOverlay] = useState(false);
	const [showTargetTypeOverlay, setShowTargetTypeOverlay] = useState(false);
	const [showListOverlay, setShowListOverlay] = useState(false);

	// Display list is what is actually getting displayed so either searchResults or the activeList
	const [displayList, setDisplayList] = useState(
		activeListNames || searchResults.slice(0, 20) || [],
	);
	const [listsPopup, setListsPopup] = useState({ show: false, target: {} });
	const [designations, setDesignations] = useState([]);

	const [filterSettings, setFilterSettings] = useState({
		objectType: defaultSettings.objectType,
		direction: defaultSettings.direction,
		minAlt: defaultSettings.minAlt,
		minDuration: defaultSettings.minDuration,
		maxMagnitude: defaultSettings.maxMagnitude,
		minFOV: defaultSettings.minFOV,
		timeSinceLastFilterChange: new Date().getTime(),
	});

	let ekosClockTimer = -1,
		observabilityTimer = -1;

	const { objectType, direction, minAlt, minDuration, maxMagnitude, minFOV } =
		filterSettings;

	const updateFOVs = () =>
	{
		// adds the cameras that haven't been added to fov profiles yet
		const profileExists = fovProfiles.find(
			(profile) => profile.name === cameraInfo.name,
		);
		const focalLength = telescopeInfo.focal_length;
		const fovW =
			(206264.8062470963552 * cameraInfo.width * cameraInfo.pixelW) /
			60000.0 /
			focalLength;
		const fovH =
			(206264.8062470963552 * cameraInfo.height * cameraInfo.pixelH) /
			60000.0 /
			focalLength;

		// If profile does not exist, create one and set it as default
		if (!profileExists)
		{
			// Now get its focal length
			const newFOVProfile = {
				focalLength,
				cameraDimensions: {
					width: cameraInfo.width,
					height: cameraInfo.height,
				},
				pixelDimensions: {
					width: cameraInfo.pixelW,
					height: cameraInfo.pixelH,
				},
				name: cameraInfo.name,
				fovW: fovW,
				fovH: fovH,
				pa: 0,
				train: activeTrain,
				profile: activeProfile,
				generated: true,
				uuid: cameraInfo.name,
			};

			dispatch(targetsActions.setFovProfiles([...fovProfiles, newFOVProfile]));
			if (newFOVProfile.name !== currentFOVProfile)
				dispatch(targetsActions.setCurrentFOVProfile(newFOVProfile.name));
		}
		// Otherwise update the existing profile with the new values
		else
		{
			const updatedProfile = {
				...profileExists, // Retain the existing UUID
				focalLength,
				cameraDimensions: {
					width: cameraInfo.width,
					height: cameraInfo.height,
				},
				pixelDimensions: {
					width: cameraInfo.pixelW,
					height: cameraInfo.pixelH,
				},
				fovW: fovW,
				fovH: fovH,
				updatedAt: +new Date(),
			};

			const newList = fovProfiles.map((oneProfile) =>
				oneProfile.name === updatedProfile.name ? updatedProfile : oneProfile,
			);
			dispatch(targetsActions.setFovProfiles(newList));
		}
	};

	// Create timer to clear loading objects. We can request objects from KStars
	// but if KStars does not respond in 10 seconds, then we clear the list and request again
	const pendingObjectsTimer = useTimer({
		expiryTimestamp: new Date(),
		autoStart: false,
		onExpire: () =>
		{
			dispatch(targetsActions.clearLoadingObjects());
		},
	});

	/**
	 * @description External search is used to find object first in the cache and if not then from KStars. If found,
	 * they are added to "My Searches" list for future reference.
	 * @param {string} selectedObjectName - Name of the searhcing objects.
	 * @returns {void}
	 */
	const runExternalSearch = (selectedObjectName) =>
	{
		if (isEmpty(selectedObjectName)) return;

		if (!isEmpty(designations))
		{
			if (!Array.isArray(designations)) return;
			designations.forEach((designation) =>
			{
				if (designation.designations.includes(selectedObjectName))
					selectedObjectName = get(designation, "primary");
			});
		}
		const partialMatches = searchResults.reduce((acc) =>
		{
			const searchObjects = targetsObjects.filter(
				(oneObject) =>
					!isEmpty(oneObject.info) &&
					searchResults.includes(oneObject.info.name),
			);
			for (const oneObject of searchObjects)
			{
				if (isEmpty(oneObject.info)) return acc;

				if (
					oneObject.info.name === selectedObjectName ||
					oneObject.info.designations.find(
						(oneName) => oneName === selectedObjectName,
					)
				)
					acc.push(oneObject.info.name);
			}

			return acc;
		}, []);

		// If we found at least one name from search results, nothing to do
		// as it will be filtered normally
		if (!isEmpty(partialMatches))
		{
			// We need to reset list in case it was set to something else
			setActiveList("");
			return;
		}
		else
		{
			// Let's look into ready & loaded targetObjects first
			const oneObject = targetsObjects.find(
				(object) => get(object, "info.name", null) === selectedObjectName,
			);

			// If it exists in targetObjects, no need to do any loading. Just set the active list to "My Searches".
			// But if empty then we do not have this object ready loaded in RAM or in the App cache at all.
			if (isEmpty(oneObject))
			{
				// Start checking the HIPS cache, if it exists, load it up.
				if (hipsCache?.includes(selectedObjectName))
					dispatch(targetsActions.loadHiPSObjects([selectedObjectName], false));
				else
				{
					// Load from KStars
					dispatch(
						targetsActions.getObjectsInfo(
							{ names: [selectedObjectName] },
							false,
						),
					);
					dispatch(
						targetsActions.getObjectsImage(
							{ names: [selectedObjectName] },
							false,
						),
					);
				}
			}
		}
		const mySearches = lists.find((list) => list.name === "My Searches");

		if (!mySearches)
		{
			const newList = {
				name: "My Searches",
				payload: [selectedObjectName],
				updatedAt: +new Date(),
				uuid: "My Searches",
			};
			dispatch(targetsActions.setLists([...lists, newList]));
		}
		else
		{
			if (!mySearches.payload.includes(selectedObjectName))
			{
				dispatch(
					targetsActions.setLists(
						lists.map((list) =>
							list.name === "My Searches"
								? {
										...list,
										payload: [...list.payload, selectedObjectName],
										updatedAt: +new Date(),
									}
								: list,
						),
					),
				);
				setActiveList("My Searches");
			}
		}
	};

	const updateTargetResults = () =>
	{
		dispatch(
			targetsActions.searchObjects({
				maxMagnitude: maxMagnitude,
				minAlt: minAlt,
				direction: directionTypes[direction],
				minDuration: minDuration * 3600,
				minFOV: minFOV,
				type: objectTypes[objectType],
			}),
		);
	};

	const addToList = (listName, target) =>
	{
		const updatedLists = lists.map((oneList) =>
		{
			// Check if this is the list we need to update
			if (oneList.name === listName)
			{
				const newPayload = oneList.payload.includes(target.info.name)
					? oneList.payload.filter((item) => item !== target.info.name)
					: [...oneList.payload, target.info.name];

				return {
					...oneList,
					payload: newPayload,
					updatedAt: +new Date(),
				};
			}

			return oneList;
		});

		dispatch(targetsActions.setLists(updatedLists));
	};

	const setNightTime = () =>
	{
		if (ekosRunning || isEmpty(almanac)) return;

		let sunset = toDMS(almanac.SunSet * 24);
		let currentDate = new Date();
		let [hours, mins, secs] = sunset.split(":");
		let nightTime = new Date(
			currentDate.getFullYear(),
			currentDate.getMonth(),
			currentDate.getDate(),
			hours,
			mins,
			secs,
		);
		setSelectedDate(nightTime);
		setSelectedTime(nightTime);
	};

	useEffect(() =>
	{
		if (ekosRunning && !isEmpty(cameraInfo) && !isEmpty(telescopeInfo))
		{
			updateFOVs();
		}
	}, [cameraInfo, telescopeInfo, ekosRunning]);

	/**
	 * This E ffect is run ONCE on startup to do the following:
	 * 1. Load HiPS cache on startup.
	 * 2. Update clock every one minute.
	 * 3. Fetch geographic location.
	 */
	useEffect(() =>
	{
		dispatch(targetsActions.loadHiPSCache(targetsObjects));

		if (connected) dispatch(targetsActions.getAlmanac());

		if (ekosRunning)
		{
			setDateTime(new Date());
		}
	}, []);

	/**
	 * Whenever the active list changes, update the display list.
	 */
	useEffect(() =>
	{
		if (!isEmpty(activeListNames)) setDisplayList(activeListNames);
		else setDisplayList([]);
	}, [activeList]);

	/**
	 * Are we connected to StellarMate & KStars? Let's then fetch default results.
	 */
	useEffect(() =>
	{
		if (connected && active)
		{
			// Two seconds after KStars is connected, start getting some data.
			setTimeout(() =>
			{
				dispatch(targetsActions.getAlmanac());
				updateTargetResults();
				const objects = localStorage.getItem("astro_designations");
				if (objects)
				{
					const parsedObjects = JSON.parse(objects);
					setDesignations(parsedObjects);
				}
			}, 2000);
		}
	}, [connected, active]);

	/**
	 * If Ekos is running.
	 */
	useEffect(() =>
	{
		if (ekosRunning)
		{
			// Get observability now
			if (!isEmpty(displayList))
			{
				const JD = new Date() / 86400000 + 2440587.5;
				dispatch(targetsActions.getObjectsRiseSet(JD, displayList));
				dispatch(targetsActions.getObjectsObservability(JD, displayList));
			}

			// Update clock every 60 seconds
			ekosClockTimer = setInterval(() =>
			{
				const now = new Date();
				setDateTime(now);
			}, 61000);

			// Fetch rise set every 5 minutes.
			observabilityTimer = setInterval(() =>
			{
				if (!isEmpty(displayList))
				{
					const JD = new Date() / 86400000 + 2440587.5;
					dispatch(targetsActions.getObjectsRiseSet(JD, displayList));
					dispatch(targetsActions.getObjectsObservability(JD, displayList));
				}
			}, 300000);
		}
		else
		{
			// Remove generated profiles
			if (!isEmpty(fovProfiles))
			{
				const updateFOVProfiles = fovProfiles.filter(
					(oneProfile) => !oneProfile.generated,
				);
				dispatch(targetsActions.setFovProfiles(updateFOVProfiles));
			}

			if (ekosClockTimer !== -1) clearInterval(ekosClockTimer);
			if (observabilityTimer !== -1) clearInterval(observabilityTimer);
		}

		// Clean up function
		return () =>
		{
			clearInterval(ekosClockTimer);
			clearInterval(observabilityTimer);
		};
	}, [ekosRunning]);

	/**
	 * In case current FOV profile is empty, set it to one of the generated ones.
	 */
	useEffect(() =>
	{
		if (isEmpty(currentFOVProfile) && !isEmpty(fovProfiles))
		{
			const generatedProfile = fovProfiles.find(
				(oneProfile) => oneProfile.generated,
			);
			if (!isEmpty(generatedProfile))
			{
				dispatch(targetsActions.setCurrentFOVProfile(generatedProfile.name));
			}
		}
	}, [currentFOVProfile, fovProfiles]);

	/**
	 * Subscribe to rotator absolute angle property.
	 */
	useEffect(() =>
	{
		if (!isEmpty(rotators))
		{
			dispatch(
				indiActions.subscribeToProperty(
					rotators[0].name,
					"ABS_ROTATOR_ANGLE",
					true,
				),
			);
		}
	}, [rotators.length]);

	/**
	 * If Alignment rotation is updated, updated the current profile if it was generated (dynamic).
	 */
	useEffect(() =>
	{
		if (!alignPA) return;

		let fovRange = {};
		let fovW = null,
			fovH = null;
		if (alignFOV)
		{
			let re = /(.+)' x (.+)'/i;
			const match = re.exec(alignFOV);
			fovW = parseFloat(match[1]);
			fovH = parseFloat(match[2]);
			fovRange = { fovW, fovH };
		}

		// FIXME right now we update ALL cameras with the rotation results and FOV.
		// However, it should be limited to the active camera only. This is added to KStars 3.5.6
		if (!isEmpty(alignCamera))
			dispatch(
				targetsActions.setFovProfiles(
					fovProfiles.map((oneProfile) =>
						oneProfile.generated && oneProfile.name === alignCamera
							? { ...oneProfile, pa: alignPA, ...fovRange }
							: oneProfile,
					),
				),
			);
		else
			dispatch(
				targetsActions.setFovProfiles(
					fovProfiles.map((oneProfile) =>
						oneProfile.generated
							? { ...oneProfile, pa: alignPA, ...fovRange }
							: oneProfile,
					),
				),
			);
	}, [alignPA, alignFOV, alignCamera]);

	/**
	 * Update date time whenever either time or date picker changes.
	 */
	useEffect(() =>
	{
		if (ekosRunning || !selectedTime || !selectedDate) return;

		const newDateTime = new Date(
			selectedDate.getFullYear(),
			selectedDate.getMonth(),
			selectedDate.getDate(),
			selectedTime.getHours(),
			selectedTime.getMinutes(),
			selectedTime.getSeconds(),
		);

		// Only fetch new Almanac if the date difference is more than a day.
		if (isEmpty(almanac) || dateDiffInDays(newDateTime, dateTime) > 0)
			dispatch(targetsActions.getAlmanac());

		// If the difference is more than 10 minutes, fetch rise time and observability from Ekos.
		if (Math.abs(newDateTime - dateTime) / 60000 > 10)
		{
			const JD = newDateTime / 86400000 + 2440587.5;
			dispatch(targetsActions.getObjectsRiseSet(JD, displayList));
			dispatch(targetsActions.getObjectsObservability(JD, displayList));
		}

		setDateTime(newDateTime);
	}, [selectedTime, selectedDate]);

	/**
	 * @param {[string]} data - Names of object to load info for.
	 * @returns {void}
	 */
	const loadUncachedData = (data) =>
	{
		dispatch(targetsActions.getObjectsInfo({ names: data }));
		dispatch(targetsActions.getObjectsImage({ names: data }));
	};
	// Use debouncer to limit too many calls
	const loadUncachedDataDebouncer = useCallback(
		debounce(loadUncachedData, 500),
		[],
	);

	/**
	 * @param {[string]} data - Names of object to load for from hips async storage.
	 * @returns {void}
	 */
	const loadHIPSObjects = (data) =>
		dispatch(targetsActions.loadHiPSObjects(data));

	// Wait until we have enough hips objects before calling this
	const loadHIPSObjectsDebouncer = useCallback(
		debounce(loadHIPSObjects, 500),
		[],
	);

	/**
	 * Whenever the search results is updated.
	 * We check if we have the objects loaded already in the store.
	 * If not, we dispatch actions to fetch them from Ekos.
	 */
	useEffect(() =>
	{
		// check if info is already in targets state
		let pendingObjects = [];
		let pendingRiseTime = [];
		let pendingObservability = [];

		let activeListPayload = {};

		if (isArray(lists) && !isEmpty(activeList))
		{
			activeListPayload = lists.find((oneList) => oneList.name === activeList);
		}

		// Object names are either the search results from KStars or the currently active list
		const objectNames = get(
			activeListPayload,
			"payload",
			searchResults.slice(0, 100),
		);

		// if (isEmpty(activeList)) setFilteredNames(searchResults);

		// Update actual display list
		setDisplayList(objectNames);

		// Now we check if targetObjects have our desired targets already loaded.
		for (const objectName of objectNames)
		{
			// checking the objects state has the object image and info
			if (
				isEmpty(targetsObjects) ||
				targetsObjects.find((object) => get(object, "info.name", null)) !==
					objectName
			)
				pendingObjects.push(objectName);

			// checking object rise/set/transit times have been fetched from Ekos
			if (
				isEmpty(risetime) ||
				risetime.find((object) => object.name === objectName) === undefined
			)
				pendingRiseTime.push(objectName);

			// checking object observatory data (alt, az, ha) has been fetched from Ekos
			if (
				isEmpty(observability) ||
				observability.find((object) => object.name === objectName) === undefined
			)
				pendingObservability.push(objectName);
		}

		const JD = dateTime / 86400000 + 2440587.5;
		// fetch objects rise and observatory data
		if (!isEmpty(pendingRiseTime))
			dispatch(targetsActions.getObjectsRiseSet(JD, pendingRiseTime));
		if (!isEmpty(pendingObservability))
			dispatch(
				targetsActions.getObjectsObservability(JD, pendingObservability),
			);

		if (!isEmpty(pendingObjects))
		{
			// Cached objects are all objects available in HIPS Cache in async storage
			const cachedObjects = pendingObjects.filter(
				(oneObject) =>
					hipsCache?.includes(oneObject) &&
					!localLoadingObjects?.includes(oneObject),
			);
			// UnCached object are all object NOT in HiPS cache and also not currently in loading process
			const unCacheObjects = pendingObjects.filter(
				(oneObject) =>
					!hipsCache?.includes(oneObject) &&
					!remoteLoadingObjects?.includes(oneObject),
			);
			//  Try to load cached objects are once from storage
			if (!isEmpty(cachedObjects)) loadHIPSObjectsDebouncer(cachedObjects);
			// Try to load uncached objects from KStars
			if (!isEmpty(unCacheObjects))
			{
				// Try to limit how much we fetch as a time
				// Otherwise the app becomes too slow
				// Needs to optimize drawings and too many renders
				loadUncachedDataDebouncer(unCacheObjects);

				// Clear loading objects if not already loaded in 10 seconds.
				const time = new Date();
				time.setSeconds(time.getSeconds() + 10);
				pendingObjectsTimer.restart(time);
			}
		}
	}, [hipsCache, infoUpdateTS, searchResults, activeList]);

	const useEffectAsync = (effect, inputs) =>
	{
		useEffect(() =>
		{
			effect();
		}, inputs);
	};
	useEffectAsync(async () =>
	{
		if (!isEqual(prevTargetLists.current, lists) && isSyncAllowed)
		{
			await SyncSettings({
				data: lists,
				updaterAction: (array) => dispatch(targetsActions.setLists(array)),
				type: Sync.TARGETS,
				username: get(user, "username", null),
				token: get(user, "token", null),
				URL: config.EKOSLIVE_URL,
			});
			prevTargetLists.current = lists;
		}
	}, [lists]);

	useEffectAsync(async () =>
	{
		// Only sync if the content actually changes, not just the reference
		if (!isEqual(prevFovProfiles.current, fovProfiles) && isSyncAllowed)
		{
			await SyncSettings({
				data: fovProfiles,
				updaterAction: (array) =>
					dispatch(targetsActions.setFovProfiles(array)),
				type: Sync.FOV,
				username: get(user, "username", null),
				token: get(user, "token", null),
				URL: config.EKOSLIVE_URL,
			});
			prevFovProfiles.current = fovProfiles;
		}
	}, [fovProfiles]);

	useEffect(() =>
	{
		updateTargetResults();
	}, [objectType, direction]);

	useEffect(() =>
	{
		dispatch(targetsActions.getObjectsNames());
		dispatch(targetsActions.getDesignations());
	}, []);

	useEffect(() =>
	{
		// check if info is already in targets state
		let pendingRiseTime = [];
		let pendingObservability = [];

		// Object names are either the search results from KStars or the currently active list
		const objectNames = lists[activeList];

		if (objectNames)
		{
			setDisplayList(objectNames);

			// Now we check if targetObjects have our desired targets already loaded.
			for (const objectName of objectNames)
			{
				if (
					isEmpty(risetime) ||
					risetime.find((object) => object.name === objectName) === undefined
				)
					pendingRiseTime.push(objectName);

				// checking object observatory data (alt, az, ha) has been fetched from Ekos
				if (
					isEmpty(observability) ||
					observability.find((object) => object.name === objectName) ===
						undefined
				)
					pendingObservability.push(objectName);
			}
		}

		const JD = dateTime / 86400000 + 2440587.5;
		// fetch objects rise and observatory data
		if (!isEmpty(pendingRiseTime))
			dispatch(targetsActions.getObjectsRiseSet(JD, pendingRiseTime));
		if (!isEmpty(pendingObservability))
			dispatch(
				targetsActions.getObjectsObservability(JD, pendingObservability),
			);
	}, [activeList]);

	/**
	 * When component becomes active again, ensure data is up to date
	 */
	useEffect(() =>
	{
		if (active && connected)
		{
			// If we have no display list but have search results, restore them
			if (isEmpty(displayList) && !isEmpty(searchResults))
			{
				setDisplayList(searchResults.slice(0, 20));
			}

			// If we have an active list but no display list, restore from the active list
			if (
				isEmpty(displayList) &&
				!isEmpty(activeList) &&
				!isEmpty(lists[activeList])
			)
			{
				setDisplayList(lists[activeList]);
			}

			// Update time-dependent data
			if (!isEmpty(displayList))
			{
				const JD = dateTime / 86400000 + 2440587.5;
				dispatch(targetsActions.getObjectsRiseSet(JD, displayList));
				dispatch(targetsActions.getObjectsObservability(JD, displayList));
			}

			// Refresh search results if needed
			if (isEmpty(searchResults))
			{
				updateTargetResults();
			}
		}
	}, [active]);

	if (!active) return null;

	return (
		<Box
			sx={[
				{
					display: "flex",
					flex: 1,
					padding: "10px",
					display: active ? "block" : "none",
				},
			]}
		>
			<Suspense fallback={<TabLoader />}>
				<VisibilityOverlay
					showVisibilityOverlay={showVisibilityOverlay}
					setShowVisibilityOverlay={() => setShowVisibilityOverlay(false)}
				/>
			</Suspense>
			<Modal
				open={showListOverlay}
				onClose={() => setShowListOverlay(false)}
				aria-labelledby="modal-modal-title"
				aria-describedby="modal-modal-description"
			>
				<Box sx={[styles.centerAbsolute, LOCAL_STYLES.modal]}>
					{/* FOV Bar */}
					<FovBar
						setPresetToggle={setPresetToggle}
						setShowFilterOverlay={setShowFilterOverlay}
						setShowListOverlay={setShowListOverlay}
					/>

					{/* List Bar */}
					<ListsBar
						activeList={activeList}
						setActiveList={setActiveList}
						setDisplayList={() => setDisplayList(filteredNames)}
						lists={lists}
					/>
				</Box>
			</Modal>

			<Modal
				open={presetToggle.enabled}
				onClose={() => setPresetToggle({ ...presetToggle, enabled: false })}
				aria-labelledby="modal-modal-title"
				aria-describedby="modal-modal-description"
			>
				<Box
					sx={[
						styles.centerAbsolute,
						{
							backgroundColor: "black",
							padding: "20px",
							display: "flex",
							flexDirection: "column",
							gap: "16px",
						},
					]}
				>
					<FovSettings
						presetToggle={presetToggle}
						setPresetToggle={(e) => setPresetToggle(e)}
					/>
				</Box>
			</Modal>

			<Modal
				open={showFilterOverlay}
				onClose={() => setShowListOverlay(false)}
				aria-labelledby="modal-modal-title"
				aria-describedby="modal-modal-description"
			>
				<Box
					sx={{
						paddingTop: "60px",
						backgroundColor: "rgba(0,0,0,0.7)",
						display: "grid",
						placeItems: "center",
					}}
				>
					<Box
						sx={{
							display: "flex",
							flexDirection: "column",
							width: "90%",
							alignItems: "center",
							justifyContent: "center",
						}}
					>
						{/* Buttons */}
						{/* Sliders Container */}
						{/* Min Altitude for -- hours */}
						<Box sx={[styles.row, LOCAL_STYLES.sliderbox]}>
							<Icon size={25} color={Palette.white70} name="height" />
							<Typography sx={[LOCAL_STYLES.centeredText, { width: "75px" }]}>
								{minAlt}°
							</Typography>
							<Box sx={{ width: "650px" }}>
								<SliderComponent
									style={LOCAL_STYLES.slider}
									min={15}
									max={90}
									minimumTrackTintColor="#FFFFFF"
									maximumTrackTintColor="#000000"
									step={5}
									value={minAlt}
									onChange={(e) =>
										setFilterSettings({
											...filterSettings,
											minAlt: e.target.value,
										})
									}
									onSlidingComplete={updateTargetResults}
								/>
							</Box>
						</Box>

						<Box sx={[styles.row, LOCAL_STYLES.sliderbox]}>
							<Icon size={25} color={Palette.white70} name="schedule" />
							<Typography sx={[LOCAL_STYLES.centeredText, { width: "75px" }]}>
								{minDuration} hr(s)
							</Typography>
							<Box sx={{ width: "650px" }}>
								<SliderComponent
									style={LOCAL_STYLES.slider}
									min={1}
									max={12}
									minimumTrackTintColor="#FFFFFF"
									maximumTrackTintColor="#000000"
									step={1}
									value={minDuration}
									onChange={(e) =>
										setFilterSettings({
											...filterSettings,
											minDuration: e.target.value,
										})
									}
									onSlidingComplete={updateTargetResults}
								/>
							</Box>
						</Box>

						<Box sx={LOCAL_STYLES.sliderbox}>
							<Icon size={25} color={Palette.white70} name="vignette" />
							<Typography sx={[LOCAL_STYLES.centeredText, { width: "75px" }]}>
								{minFOV}&apos;
							</Typography>
							<Box sx={{ width: "650px" }}>
								<SliderComponent
									style={LOCAL_STYLES.slider}
									min={0}
									max={90}
									minimumTrackTintColor="#FFFFFF"
									maximumTrackTintColor="#000000"
									step={5}
									value={minFOV}
									onChange={(e) =>
										setFilterSettings({
											...filterSettings,
											minFOV: e.target.value,
										})
									}
									onSlidingComplete={updateTargetResults}
								/>
							</Box>
						</Box>

						<Box sx={LOCAL_STYLES.sliderbox}>
							<Icon size={25} color={Palette.white70} name="flare" />
							<Typography sx={[LOCAL_STYLES.centeredText, { width: "75px" }]}>
								{maxMagnitude}
							</Typography>
							<Box sx={{ width: "650px" }}>
								<SliderComponent
									style={LOCAL_STYLES.slider}
									min={1}
									max={30}
									minimumTrackTintColor="#FFFFFF"
									maximumTrackTintColor="#000000"
									step={1}
									value={maxMagnitude}
									onChange={(e) =>
										setFilterSettings({
											...filterSettings,
											maxMagnitude: e.target.value,
										})
									}
									onSlidingComplete={updateTargetResults}
								/>
							</Box>
						</Box>

						{/* Direction bar */}
						<Box
							sx={{
								flexDirection: "row",
								justifyContent: "center",
								marginTop: "10px",
							}}
						>
							{Object.keys(directionTypes).map((oneDirection, index) => (
								<Button
									key={index}
									style={
										direction === oneDirection
											? LOCAL_STYLES.activeBtn
											: LOCAL_STYLES.inactiveBtn
									}
									onClick={() =>
									{
										setFilterSettings({
											...filterSettings,
											direction: oneDirection,
										});
									}}
								>
									<Typography sx={{ color: "white", fontSize: "18px" }}>
										{oneDirection}
									</Typography>
								</Button>
							))}
						</Box>
					</Box>
					<Button
						sx={[LOCAL_STYLES.closeButton]}
						onClick={() => setShowFilterOverlay(false)}
					>
						<Icon name="Close" size={25} color={Palette.white} />
					</Button>
				</Box>
			</Modal>

			<Suspense fallback={<TabLoader />}>
				<ObjectTypeOverlay
					objectType={objectType}
					setFilterSettings={setFilterSettings}
					showTargetTypeOverlay={showTargetTypeOverlay}
					setShowTargetTypeOverlay={setShowTargetTypeOverlay}
					filterSettings={filterSettings}
				/>
			</Suspense>

			{listsPopup.show ? (
				<Suspense fallback={<TabLoader />}>
					<ListsPopup
						target={listsPopup.target}
						setListsPopup={setListsPopup}
						lists={lists}
						objectName={listsPopup.target.info.name}
						addToList={addToList}
					/>
				</Suspense>
			) : null}

			<Box
				sx={
					presetToggle.enabled
						? { display: "none" }
						: {
								display: "flex",
								flexDirection: "column",
								width: "100%",
								height: "100%",
								gap: "10px",
							}
				}
			>
				<Grid container sx={{ gap: "6px" }}>
					{/* Search Count */}
					<Typography sx={LOCAL_STYLES.searchResultsCountText}>
						{displayList.length}
					</Typography>
					<ExternalSearch runExternalSearch={runExternalSearch} />

					<StellaFilterInputButton setDisplayList={setDisplayList} />

					{/* Date & Time */}
					<Grid
						id="targetDateTime"
						item
						sx={[styles.row, { alignItems: "center" }]}
					>
						<Box sx={[styles.center, { marginRight: "8px" }]}>
							<Icon
								sx={{ alignSelf: "center" }}
								color={Palette.white70}
								size={25}
								name="schedule"
							/>
						</Box>
						<Box sx={[styles.row, LOCAL_STYLES.collapseFormGroup]}>
							<Box
								sx={[styles.row, LOCAL_STYLES.timeSelector, styles.center]}
								onTouchEnd={() =>
								{
									if (ekosRunning === false) setShowDatePicker(!showDatePicker);
								}}
							>
								<Typography sx={{ fontSize: "20px", color: Palette.white70 }}>
									{dayjs(dateTime).format("YYYY.MM.DD")}
								</Typography>
							</Box>
							<Box
								sx={[styles.row, LOCAL_STYLES.timeSelector, styles.center]}
								onTouchEnd={() =>
								{
									if (ekosRunning === false) setShowTimePicker(!showTimePicker);
								}}
							>
								<Typography sx={{ fontSize: "20px", color: Palette.white70 }}>
									{dayjs(dateTime).format("LT")}
								</Typography>
							</Box>
						</Box>
						<Button
							sx={[
								styles.center,
								{
									marginLeft: "10px",
									height: "40px",
									color: Palette.white70,
								},
								ekosRunning ? { backgroundColor: Palette.orange } : null,
							]}
							disabled={ekosRunning}
							onClick={() =>
							{
								const now = new Date();
								setSelectedDate(now);
								setSelectedTime(now);
							}}
						>
							<Typography
								sx={{
									color: Palette.white70,
									fontSize: "20px",
								}}
							>
								{s.targets.now}
							</Typography>
						</Button>
						<Button
							sx={[
								styles.center,
								{
									marginLeft: "4px",
									height: "40px",
									color: Palette.white70,
									marginRight: "10px",
								},
							]}
							onClick={() => setNightTime()}
							disabled={ekosRunning}
						>
							<Typography
								sx={{
									color: Palette.white70,
									fontSize: "20px",
								}}
							>
								{s.targets.night}
							</Typography>
						</Button>
					</Grid>
					<Grid
						id="targetControl"
						item
						sx={[styles.row, { gap: "10px", alignItems: "center" }]}
					>
						{/* Visibility */}
						<Button
							sx={[
								{
									alignItems: "center",
									height: "40px",
									width: "40px",
									color: Palette.white70,
								},
							]}
							onClick={() =>
							{
								setShowVisibilityOverlay(true);
							}}
						>
							<Icon name="visibility" color={Palette.orange} size={26} />
						</Button>

						{/* Lists */}
						<Button
							sx={[
								{
									alignItems: "center",
									height: "40px",
									width: "40px",
									color: Palette.white70,
								},
								isEmpty(activeList)
									? {}
									: {
											borderColor: Palette.orange,
											borderWidth: 2 * px,
										},
							]}
							onClick={() => setShowListOverlay(true)}
						>
							<Icon name="list" color={Palette.orange} size={26} />
						</Button>

						{/* Filters */}
						<Button
							sx={[
								{
									alignItems: "center",
									height: "40px",
									width: "40px",
									color: Palette.white70,
								},
							]}
							onClick={() => setShowFilterOverlay(true)}
						>
							<Icon name="filter-alt" color={Palette.orange} size={26} />
						</Button>

						{/* Object Type */}
						<Button
							sx={[
								{
									alignItems: "center",
									height: "40px",
									width: "40px",
									color: Palette.white70,
								},
							]}
							onClick={() => setShowTargetTypeOverlay(true)}
						>
							<Icon name="star" color={Palette.orange} size={26} />
						</Button>

						{/* Reset All Button */}
						<Button
							sx={{
								height: "40px",
								width: "40px",
							}}
							onClick={() =>
							{
								setFilterSettings({
									searchText: defaultSettings.searchText,
									objectType: defaultSettings.objectType,
									direction: defaultSettings.direction,
									minAlt: defaultSettings.minAlt,
									minDuration: defaultSettings.minDuration,
									maxMagnitude: defaultSettings.maxMagnitude,
									minFOV: defaultSettings.minFOV,
								});
								setActiveList("");
								updateTargetResults();
							}}
						>
							<Icon
								sx={LOCAL_STYLES.icon}
								color={Palette.orange}
								size={26}
								name="settings-backup-restore"
							/>
						</Button>
					</Grid>
				</Grid>

				{/* Targets scrollview */}
				<TargetsList
					displayList={displayList}
					dateTime={dateTime}
					activeList={activeList}
					setListsPopup={setListsPopup}
					addToList={addToList}
				/>
			</Box>
		</Box>
	);
};

export default tourGuide(Targets, {
	steps: tourGuideSteps,
	key: "targets",
});

const LOCAL_STYLES = {
	icon: {
		color: Palette.white70,
		height: "auto",
	},
	activeBtn: {
		backgroundColor: Palette.orange,
		borderWidth: "1.5px",
		paddingInline: "20px",
		marginRight: "5px",
		marginBottom: "5px",
	},
	closeButton: {
		position: "absolute",
		right: "20px",
		top: "20px",
		alignItems: "center",
		justifyContent: "center",
		zIndex: 10,
		minWidth: "auto",
		width: "48px",
		height: "48px",
		backgroundColor: Palette.orange,
	},
	inactiveBtn: {
		borderWidth: "1.5px",
		paddingInline: "20px",
		marginRight: "5px",
		marginBottom: "5px",
	},
	timeSelector: {
		justifyContent: "center",
		backgroundColor: "#444",
		height: "40px",
		paddingInline: "2px",
		width: "130px",
		marginRight: "15px",
		borderRadius: "4px",
		fontSize: "16px",
	},
	modal: {
		display: "flex",
		flexDirection: "column",
		gap: "15px",
		padding: "15px",
		backgroundColor: "black",
	},
	header: {
		fontSize: "20px",
		alignItems: "center",
		marginRight: "10px",
	},
	centeredText: {
		fontSize: "18px",
		textAlign: "center",
		justifyContent: "center",
		lineHeight: "35px",
		color: Palette.white70,
	},
	objectHeader: {
		borderWidth: px,
		borderColor: Palette.green,
		paddingInline: "25px",
		paddingBlock: "5px",
		borderRadius: "8px",
		backgroundColor: "green",
	},
	slider: {
		backgroundColor: Palette.grey44,
		height: "50px",
		borderRadius: "5px",
	},
	searchResultsCountText: {
		color: Palette.orange,
		fontSize: "18px",
		alignSelf: "center",
		borderColor: Palette.grey66,
		marginRight: "5px",
		alignItems: "center",
		height: "auto",
		justifyContent: "center",
	},
	sliderbox: {
		display: "flex",
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "center",
		height: "60px",
	},
};
