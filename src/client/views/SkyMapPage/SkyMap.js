import React, { useState, useEffect, useRef, useCallback } from "react";
import { useSelector, useDispatch } from "react-redux";
import {
	Box,
	Button,
	IconButton,
	Typography,
	Dialog,
	DialogTitle,
	DialogContent,
	Paper,
	TextField,
	List,
	ListItem,
	ListItemText,
	CircularProgress,
	Tooltip,
	Grid,
} from "@mui/material";
import { styled } from "@mui/material/styles";
import SearchIcon from "@mui/icons-material/Search";
import CloseIcon from "@mui/icons-material/Close";
import FlareIcon from "@mui/icons-material/Flare";
import ErrorIcon from "@mui/icons-material/Error";
import { Palette } from "@common/shared/common/styles";
import { toDMS, toHMS, toHA } from "@common/shared/common/common";
import s from "@common/shared/i18n/i18n";
import MountQuickControls from "../MountPage/MountQuickControls";
import LeftDPad from "../../Components/SideDPad/LeftDPad";
import RightDPad from "../../Components/SideDPad/RightDPad";
import MountQcIcon from "@client/icons/modules/MountQcIcon";
import { m } from "framer-motion";
import { mountActions } from "@redux/actions";
import {
	selectConnectionOnline,
	selectTrainDevice,
	selectActiveDeviceValue,
	selectIsAlignSolved,
	selectDome,
	selectActiveKStarID,
} from "@redux/selectors";
import { trainModules, DEVICE_TYPE, Scheduler } from "@indi/enums";
import { isEmpty, get, isEqual } from "lodash";
import { createSelector } from "reselect";
import ExternalSearch from "../Targets/ExternalSearch";
import { targetsActions } from "@redux/actions";
import useObservatories from "@hooks/useObservatories";
import axios from "axios";
import { v4 as uuidv4 } from "uuid";
import Reactor from "@common/shared/indi/events.js";
import { useNavigate } from "react-router-dom";
import { planType } from "@indi/enums";
import { selectUser } from "@redux/selectors";
import CurrentPlanInformer from "@components/shared/PricingTable/CurrentPlanInformer";

// Styled components
const SkyMapWrapper = styled(Box)(({ theme }) => ({
	position: "relative",
	width: "100%",
	height: "calc(100vh - 100px)",
	overflow: "hidden",
	backgroundColor: "#111111",
	fontFamily: theme.typography.fontFamily,
}));

const SkyMapContainer = styled(Box)({
	width: "100%",
	height: "100%",
	backgroundColor: "#111111",
	position: "absolute",
});

// Updated ImageButton component with tint color for active state
const ImageButton = ({ onClick, isPressed, children, sx = {} }) =>
{
	return (
		<Button
			onClick={onClick}
			sx={{
				width: "50px",
				height: "50px",
				minWidth: "50px",
				margin: "3px",
				padding: 0,
				opacity: isPressed ? 1 : 0.5,
				"&:hover": {
					opacity: isPressed ? 1 : 0.7,
				},
				...sx,
			}}
		>
			{React.cloneElement(children, {
				sx: {
					...(children.props.sx || {}),
					...(isPressed && {
						filter:
							"invert(56%) sepia(85%) saturate(1966%) hue-rotate(360deg) brightness(101%) contrast(106%)",
					}),
				},
			})}
		</Button>
	);
};

const InfoPanel = styled(Paper)(({ theme, borderColor }) => ({
	position: "absolute",
	padding: theme.spacing(1),
	backgroundColor: "rgba(52, 52, 52, 0.8)",
	border: `1px solid ${borderColor || Palette.white70}`,
	borderRadius: theme.shape.borderRadius,
	color: theme.palette.common.white,
	userSelect: "none",
	zIndex: 100,
}));

const CoordinateRow = styled(Box)(({ theme }) => ({
	display: "flex",
	justifyContent: "space-between",
	alignItems: "center",
	borderWidth: "1px",
	borderColor: Palette.greydd,
	borderStyle: "solid",
	padding: theme.spacing(0.5),
	margin: theme.spacing(0.5, 0),
}));

const HeaderText = styled(Typography)({
	color: Palette.orange,
	fontSize: "14px",
	fontWeight: "bold",
	margin: "4px",
});

const CommonText = styled(Typography)({
	color: "white",
	fontSize: "13px",
	margin: "4px",
	width: "120px",
});

const CoordinateText = styled(Typography)({
	color: Palette.white70,
	fontFamily: "monospace",
	fontSize: "14px",
	fontWeight: "bold",
	marginHorizontal: "5px",
});

const ButtonStyle = styled(Button)({
	justifyContent: "center",
	alignItems: "center",
	borderRadius: "6px",
	flexDirection: "row",
	height: "50px",
	backgroundColor: Palette.orange,
	color: "white",
	"&:hover": {
		backgroundColor: "#e65c00",
	},
	"&:disabled": {
		opacity: 0.7,
		backgroundColor: Palette.orange,
	},
});

const getDesignation = createSelector(
	(state) => state.targets.objects,
	(_, name) => name,
	(objects, name) =>
	{
		const target = objects.find((oneObject) => oneObject.info.name === name);
		if (target) return [...target.info.designations, name];
		else return [name];
	},
);

/**
 * Sometimes Ekos find VERY CLOSE targets that are not exactly the same.
 * Here we treat them as same target. This is added on exception basis.
 * @type {{M71: string}}
 */
const alternativeDesignations = {
	"M 71": "NGC 6839",
	"NGC 2239": "NGC 2244",
};

const isSameTarget = (mountTarget, selectedTarget, designations) =>
{
	// Compare name first
	if (
		selectedTarget.localeCompare(mountTarget, undefined, {
			sensitivity: "base",
		}) === 0
	)
		return true;

	// Now compare designations
	for (const oneDesignation of designations)
	{
		if (
			mountTarget.localeCompare(oneDesignation, undefined, {
				sensitivity: "base",
			}) === 0
		)
			return true;
	}

	// Check in alternative designations.
	return get(alternativeDesignations, mountTarget, null) === selectedTarget;
};

const KStarsWasmApp = ({ active }) =>
{
	if (!active) return null;
	// DOM References
	const containerRef = useRef(null);
	const wasmInstanceRef = useRef(null);

	// Core application state
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState(null);
	const [logMessage, setLogMessage] = useState("Loading...");

	// Simplified progress state
	const [downloadProgress, setDownloadProgress] = useState(0);

	const { observatories } = useObservatories();
	const activeKStarsID = useSelector(selectActiveKStarID);

	const navigate = useNavigate();

	// Selected sky object state
	const [selectedSkyObject, setSelectedSkyObject] = useState({
		name: "",
		type: "",
		magnitude: 0,
		RA: 0.0,
		Dec: 0.0,
		RA0: 0.0,
		Dec0: 0.0,
		Az: 0.0,
		Alt: 0.0,
		HA: 0.0,
		ZA: 0.0,
	});

	const designations = useSelector((state) =>
		getDesignation(state, get(selectedSkyObject, "name", "")),
	);

	// These are the exact state variables from the original implementation
	const [showInfoPanel, setShowInfoPanel] = useState(false);
	const [infoPanelPosition, setInfoPanelPosition] = useState({
		x: 100,
		y: 100,
	});
	const [isDragging, setIsDragging] = useState(false);
	const [borderColor, setBorderColor] = useState("rgba(255, 255, 255, 0.7)");

	// This is the exact ref from the original implementation
	const dragStartRef = useRef({ x: 0, y: 0, panelX: 0, panelY: 0 });

	// Display settings state
	const [isShowStars, setIsShowStars] = useState(true);
	const [isShowNGCCatalog, setIsShowNGCCatalog] = useState(true);
	const [isShowSolarSystem, setIsShowSolarSystem] = useState(false);
	const [isShowConstells, setIsShowConstells] = useState(false);
	const [isShowMilkyWay, setIsShowMilkyWay] = useState(false);
	const [isShowGrid, setIsShowGrid] = useState(false);
	const [isShowGround, setIsShowGround] = useState(true);
	const [isShowHIPS, setIsShowHIPS] = useState(false);

	// Center point tracking
	const [centerSkyPoint, setCenterSkyPoint] = useState({
		RA: 0.0,
		Dec: 0.0,
		Az: 0.0,
		Alt: 0.0,
	});

	// Telescope status
	const [isTelescopeCenter, setIsTelescopeCenter] = useState(false);
	const [mountOnline, setMountOnline] = useState(false);
	const [showMountControls, setShowMountControls] = useState(false);

	// Operation status
	const [goRequested, setGoRequested] = useState(false);
	const [slewRequested, setSlewRequested] = useState(false);
	const [solveRequested, setSolveRequested] = useState(false);

	const isBusy = goRequested || solveRequested || slewRequested;

	// Add this selector to check if Ekos profile is running
	const ekosProfileRunning = useSelector(selectConnectionOnline);

	// Add this selector for mount status
	const mountStatus = useSelector((state) => state.status.mount.status);
	const mount = useSelector((state) => state.status.mount);
	const activeMount = useSelector((state) =>
		selectTrainDevice(state, {
			trainType: trainModules.MountOpticalTrain,
			deviceType: DEVICE_TYPE.MOUNT,
		}),
	);
	const mountTarget = useSelector((state) => state.status.mount.target);
	const solution = useSelector((state) => state.status.align.solution, isEqual);

	const dispatch = useDispatch();

	// Add these state variables and refs
	const mountUpdateID = useRef(0);
	const [mountString, setMountString] = useState({ name: "NA", ra: 0, dec: 0 });

	// Add state for dome information
	const [domeString, setDomeString] = useState({ azimuth: 0, width: 0 });
	const [domeUUID] = useState(uuidv4());
	const dome = useSelector(selectDome);

	// Add a function to refresh dome overlay parameters
	const refreshDomeOverlay = useCallback(() =>
	{
		if (
			wasmInstanceRef.current &&
			typeof wasmInstanceRef.current.setDomeSlitOverlayParams === "function"
		)
		{
			wasmInstanceRef.current.setDomeSlitOverlayParams(
				JSON.stringify({
					azimuth: domeString.azimuth,
					angularWidth: domeString.width,
					visibility:
						ekosProfileRunning &&
						domeString.width > 0,
				}),
			);
			wasmInstanceRef.current.forceUpdate(true);
		}
	}, [ekosProfileRunning, domeString?.azimuth, domeString?.width]);

	// Update dome properties function
	const updateDomeProperties = useCallback(
		(device, property) =>
		{
			if (device.name === property.device)
			{
				if (
					property.name === "ABS_DOME_POSITION" ||
					property.name === "DOME_MEASUREMENTS"
				)
				{
					// Get current values
					const azimuth =
						property.name === "ABS_DOME_POSITION"
							? property.numbers[0].value
							: dome?.getAzimuth() || 0;
					const measurements = dome?.getDomeMeasurements();
					const radius =
						property.name === "DOME_MEASUREMENTS"
							? property.numbers[0].value
							: measurements?.radius || 0;
					const shutterWidth =
						property.name === "DOME_MEASUREMENTS"
							? property.numbers[1].value
							: measurements?.shutter_width || 0;

					// Calculate angular width in degrees based on radius and shutter width
					const width =
						radius > 0
							? (Math.atan2(shutterWidth / 2, radius) * 2 * 180) / Math.PI
							: 0;
					if (width > 0 && azimuth >= 0)
						setTimeout(() => setDomeString({ azimuth, width }), 10);
				}
			}
		},
		[dome],
	);

	// Dome effect to listen for property updates
	useEffect(() =>
	{
		if (!isEmpty(dome))
		{
			const azimuth = dome.getAzimuth();
			const measurements = dome.getDomeMeasurements();
			const radius = measurements?.radius || 0;
			const shutterWidth = measurements?.shutter_width || 0;
			const width =
				radius > 0
					? (Math.atan2(shutterWidth / 2, radius) * 2 * 180) / Math.PI
					: 0;

			if (width > 0 && azimuth >= 0)
			{
				setDomeString({ azimuth, width });
			}

			// Add event listeners for dome property updates
			if (typeof Reactor !== "undefined")
			{
				Reactor.addEventListener(
					"propertyUpdate",
					updateDomeProperties,
					dome,
					domeUUID,
				);
				Reactor.addEventListener(
					"propertyDefined",
					updateDomeProperties,
					dome,
					domeUUID,
				);
			}
		}
		else
		{
			setDomeString({ azimuth: 0, width: 0 });
		}

		return () =>
		{
			if (typeof Reactor !== "undefined")
			{
				Reactor.removeEventListener("propertyUpdate", domeUUID);
				Reactor.removeEventListener("propertyDefined", domeUUID);
			}
		};
	}, [dome, updateDomeProperties, domeUUID]);

	// Update dome overlay whenever dome string changes
	useEffect(() =>
	{
		if (wasmInstanceRef.current && !loading)
		{
			refreshDomeOverlay();
		}
	}, [domeString.azimuth, domeString.width, ekosProfileRunning, refreshDomeOverlay, loading]);

	// Create a new function to get timezone using Google's API
	const getTimezoneFromGoogle = async (lat, lng) =>
	{
		try
		{
			// Current timestamp in seconds
			const timestamp = Math.floor(Date.now() / 1000);
			// Make a request to Google's Time Zone API
			const response = await axios.get(
				"https://maps.googleapis.com/maps/api/timezone/json",
				{
					params: {
						location: `${lat},${lng}`,
						timestamp: timestamp,
						key: process.env.REACT_APP_GOOGLE_MAPS_KEY, // Your API key stored in .env file
					},
				},
			);

			// Check if the request was successful
			if (response.data.status === "OK")
			{
				return [
					response.data.timeZoneId,
					response.data.dstOffset,
					response.data.rawOffset,
				];
			}
			else
			{
				console.error("Error from Google Time Zone API:", response.data.status);
				return null;
			}
		}
		catch (error)
		{
			console.error("Error fetching timezone from Google API:", error);
			return null;
		}
	};

	// Map timezone IDs to DST rule codes
	const getDstRuleFromTimezone = (timezoneId) =>
	{
		// US/Canada timezones
		if (
			/^(America\/(New_York|Chicago|Denver|Los_Angeles|Phoenix|Anchorage|Toronto|Vancouver)|US\/|Canada\/)/.test(
				timezoneId,
			)
		)
		{
			return "US";
		}
		// Mexico
		if (
			/^America\/(Mexico_City|Tijuana|Chihuahua|Monterrey)/.test(timezoneId)
		)
		{
			return "MX";
		}
		// European Union
		if (
			/^Europe\/(London|Paris|Berlin|Madrid|Rome|Amsterdam|Brussels|Vienna|Stockholm|Copenhagen|Oslo|Helsinki)/.test(
				timezoneId,
			)
		)
		{
			return "EU";
		}
		// Eastern Europe
		if (
			/^Europe\/(Bucharest|Sofia|Athens|Riga|Tallinn|Vilnius|Kiev)/.test(
				timezoneId,
			)
		)
		{
			return "EE";
		}
		// Iran
		if (/^Asia\/Tehran/.test(timezoneId))
		{
			return "IR";
		}
		// Israel
		if (/^Asia\/Jerusalem/.test(timezoneId))
		{
			return "ZN";
		}
		// Jordan
		if (/^Asia\/Amman/.test(timezoneId))
		{
			return "JD";
		}
		// Lebanon
		if (/^Asia\/Beirut/.test(timezoneId))
		{
			return "LB";
		}
		// Syria
		if (/^Asia\/Damascus/.test(timezoneId))
		{
			return "SY";
		}
		// Australia
		if (/^Australia\//.test(timezoneId))
		{
			return "AU";
		}
		// New Zealand
		if (/^Pacific\/Auckland/.test(timezoneId))
		{
			return "NZ";
		}
		// Chatham, New Zealand
		if (/^Pacific\/Chatham/.test(timezoneId))
		{
			return "CZ";
		}
		// Tonga
		if (/^Pacific\/Tongatapu/.test(timezoneId))
		{
			return "TG";
		}
		// Brazil
		if (/^America\/(Sao_Paulo|Rio_de_Janeiro)/.test(timezoneId))
		{
			return "BZ";
		}
		// Chile
		if (/^America\/Santiago/.test(timezoneId))
		{
			return "CL";
		}
		// Paraguay
		if (/^America\/Asuncion/.test(timezoneId))
		{
			return "PY";
		}
		// Namibia
		if (/^Africa\/Windhoek/.test(timezoneId))
		{
			return "NB";
		}
		// Falkland Islands
		if (/^Atlantic\/Stanley/.test(timezoneId))
		{
			return "FK";
		}
		// Southern Hemisphere
		if (/^(Australia|Pacific|Antarctica)\//.test(timezoneId))
		{
			return "TS";
		}

		// Default: no DST
		return "--";
	};

	const refreshLocation = async (currentObservatory) =>
	{
		if (!currentObservatory || !currentObservatory.location) return;

		const [googleTimezone, dstOffset, rawOffset] = await getTimezoneFromGoogle(
			currentObservatory.location.lat,
			currentObservatory.location.lng,
		);

		// Get the appropriate DST rule code based on the timezone ID
		const dstRule = googleTimezone
			? getDstRuleFromTimezone(googleTimezone)
			: "--";

		let locationParams = {
			longitude: currentObservatory.location.lng,
			latitude: currentObservatory.location.lat,
			city: currentObservatory.location.region,
			country: currentObservatory.location.country,
			timezone: (dstOffset + rawOffset) / 3600,
			dstRule: dstRule,
		};

		wasmInstanceRef.current.setKStarsLocation(JSON.stringify(locationParams));
	};

	// Add a function to refresh mount coordinates that uses the Redux store
	const refreshMountCoordinates = useCallback(() =>
	{
		const ra = mount?.ra;
		const de = mount?.de;
		const mountName = activeMount?.name || "Mount";

		setMountString({ name: mountName, ra: ra, dec: de });

		// Update the mount overlay in the WASM instance
		if (
			wasmInstanceRef.current &&
			typeof wasmInstanceRef.current.setMountOverlayParams === "function"
		)
		{
			wasmInstanceRef.current.setMountOverlayParams(
				JSON.stringify({
					name: mountName,
					ra: ra,
					dec: de,
					visibility: ekosProfileRunning && mountOnline,
				}),
			);
			wasmInstanceRef.current.forceUpdate(true);
		}
	}, [ekosProfileRunning, mountOnline, mount]);

	// Update mount online status based on mount data

	useEffect(() =>
	{
		const available = !isEmpty(activeMount);
		setMountOnline(available);
		if (available) refreshMountCoordinates();
		else if (mountString.ra !== 0)
		{
			setMountString({
				ra: 0,
				dec: 0,
				name: "",
			});
			setLogMessage("");
		}
	}, [activeMount]);

	// Add an effect to monitor mount status and update coordinates accordingly
	useEffect(() =>
	{
		if (ekosProfileRunning)
		{
			if (mountString.ra === 0) setTimeout(refreshMountCoordinates, 500);

			const inMotion =
				mountStatus.includes("Moving") ||
				mountStatus === "Slewing" ||
				mountStatus === "Parking";

			if (inMotion)
			{
				if (mountUpdateID.current === 0)
				{
					refreshMountCoordinates();
					refreshDomeOverlay(); // Also refresh dome overlay when mount is moving
					mountUpdateID.current = setInterval(() =>
					{
						refreshMountCoordinates();
						refreshDomeOverlay(); // Keep dome overlay in sync
					}, 250);
				}
			}
			else if (mountUpdateID.current > 0)
			{
				setTimeout(() =>
				{
					refreshMountCoordinates();
					refreshDomeOverlay(); // Refresh dome overlay again after move completed
				}, 500);
				clearInterval(mountUpdateID.current);
				mountUpdateID.current = 0;
			}

			if (mountStatus === "Tracking")
			{
				// Refresh coordinates one more time after mount starts tracking
				setTimeout(refreshMountCoordinates, 500);

				// Handle slew completion
				if (slewRequested)
				{
					setTimeout(() =>
					{
						// Double check everything is OK before proceeding
						if (mountStatus === "Tracking")
						{
							setSlewRequested(false);
							setBorderColor(Palette.green);
							// Refresh coordinates one final time
							setTimeout(refreshMountCoordinates, 500);
						}
					}, 1000);
				}
			}
		}
		else
		{
			// Clear any existing interval if Ekos is not running
			if (mountUpdateID.current > 0)
			{
				clearInterval(mountUpdateID.current);
				mountUpdateID.current = 0;
			}

			// Reset both mount and dome overlays if Ekos is not running
			if (wasmInstanceRef.current)
			{
				if (
					typeof wasmInstanceRef.current.setMountOverlayParams === "function"
				)
				{
					wasmInstanceRef.current.setMountOverlayParams(
						JSON.stringify({
							name: "Mount",
							ra: 0,
							dec: 0,
							visibility: false,
						}),
					);
					wasmInstanceRef.current.forceUpdate(true);
				}

				if (
					typeof wasmInstanceRef.current.setDomeSlitOverlayParams === "function"
				)
				{
					wasmInstanceRef.current.setDomeSlitOverlayParams(
						JSON.stringify({
							azimuth: 0,
							angularWidth: 0,
							visibility: false,
						}),
					);
					wasmInstanceRef.current.forceUpdate(true);
				}
			}
		}
	}, [mountStatus, ekosProfileRunning, slewRequested, loading]);

	// Clean up on unmount
	useEffect(() =>
	{
		return () =>
		{
			if (mountUpdateID.current > 0)
			{
				clearInterval(mountUpdateID.current);
				mountUpdateID.current = 0;
			}
		};
	}, []);

	// Handler for sky object clicks
	const onSkyObjectClick = useCallback((event) =>
	{
		if (!event || !event.nativeEvent)
		{
			console.warn("Invalid sky object click event received");
			return;
		}

		console.log("Sky object clicked:", event.nativeEvent);

		// Extract object details from the native event
		const skyObject = {
			name: event.nativeEvent.name || "Unknown",
			type: event.nativeEvent.type || "Unknown",
			magnitude:
				typeof event.nativeEvent.magnitude === "number"
					? event.nativeEvent.magnitude
					: 0,
			RA: event.nativeEvent.RA || 0,
			Dec: event.nativeEvent.Dec || 0,
			RA0: event.nativeEvent.RA0 || 0,
			Dec0: event.nativeEvent.Dec0 || 0,
			Az: event.nativeEvent.Az || 0,
			Alt: event.nativeEvent.Alt || 0,
			HA: event.nativeEvent.HA || 0,
			ZA: event.nativeEvent.ZA || 0,
		};

		// Update state with the clicked object
		setSelectedSkyObject(skyObject);
		setBorderColor(Palette.grey99);
		setShowInfoPanel(true);

		// Position the info panel near the click location if available
		if (event.nativeEvent.x && event.nativeEvent.y)
		{
			setInfoPanelPosition({
				x: Math.min(window.innerWidth - 350, Math.max(10, event.nativeEvent.x)),
				y: Math.min(
					window.innerHeight - 250,
					Math.max(10, event.nativeEvent.y),
				),
			});
		}
	}, []);

	// Update the center point listener function
	const onSkyPointCenterListener = useCallback((event) =>
	{
		try
		{
			// Capture event values immediately
			const RA = event?.nativeEvent?.RA || 0;
			const Dec = event?.nativeEvent?.Dec || 0;
			const Az = event?.nativeEvent?.Az || 0;
			const Alt = event?.nativeEvent?.Alt || 0;

			setCenterSkyPoint((prev) =>
			{
				// Only update if values have changed
				if (
					prev.RA === RA &&
					prev.Dec === Dec &&
					prev.Az === Az &&
					prev.Alt === Alt
				)
				{
					return prev;
				}
				return {
					RA,
					Dec,
					Az,
					Alt,
				};
			});
		}
		catch (error)
		{
			console.error("Error processing center point update:", error);
		}
	}, []);

	// Handler for telescope center disabled event
	const onDisableTelescopeCenter = useCallback((event) =>
	{
		setIsTelescopeCenter(event.nativeEvent.state);
	}, []);

	// Function to request center point updates
	const requestCenterPointUpdate = useCallback(() =>
	{
		if (!wasmInstanceRef.current) return;
		try
		{
			if (typeof wasmInstanceRef.current.setOption === "function")
			{
				// Based on interface.cpp, we can use focusObject to trigger a center point update
				const currentFocus = wasmInstanceRef.current.getOption("focusObject");
				if (currentFocus)
				{
					wasmInstanceRef.current.setOption("focusObject", currentFocus);
				}
			}
		}
		catch (error)
		{
			console.error("Error requesting center point:", error);
		}
	}, []);

	// Set up polling for center point updates
	useEffect(() =>
	{
		if (loading || !wasmInstanceRef.current) return;

		// Request an immediate update
		requestCenterPointUpdate();

		// Set up regular polling
		const pollInterval = setInterval(() =>
		{
			requestCenterPointUpdate();
		}, 2000); // Poll every 2 seconds

		return () =>
		{
			clearInterval(pollInterval);
		};
	}, [loading, requestCenterPointUpdate]);

	// Recover the original working loader code with improved progress tracking
	useEffect(() =>
	{
		// Skip if already loaded or not active
		if (wasmInstanceRef.current || !active)
		{
			return;
		}

		// Use the public URL for WASM files
		const wasmBaseUrl = `/public/wasm`;
		console.log(`Using WASM base URL: ${wasmBaseUrl}`);

		// Create a function to manually simulate progress for WASM loading
		const simulateWasmLoadingProgress = () =>
		{
			let currentProgress = 0;

			const progressInterval = setInterval(() =>
			{
				currentProgress += 1;
				setDownloadProgress(currentProgress);

				if (currentProgress >= 95)
				{
					clearInterval(progressInterval);
				}
			}, 200);

			return () => clearInterval(progressInterval);
		};

		// Load the qtloader.js script
		const loadQtLoader = () =>
		{
			return new Promise((resolve, reject) =>
			{
				if (window.qtLoad)
				{
					// qtLoader already loaded
					setDownloadProgress(10);
					resolve();
					return;
				}

				const script = document.createElement("script");
				script.src = `${wasmBaseUrl}/qtloader.js`;
				script.async = true;
				script.onload = () =>
				{
					setDownloadProgress(10);
					resolve();
				};
				script.onerror = (e) => reject(new Error("Failed to load qtloader.js"));
				document.body.appendChild(script);
			});
		};

		// Load the KStarsWasm module
		const loadKStarsWasm = async () =>
		{
			try
			{
				setLoading(true);
				setError(null);

				// Load the qtloader first
				await loadQtLoader();

				// Check if KStarsWasm.js is already loaded
				if (!window.KStarsWasm_entry)
				{
					const script = document.createElement("script");
					script.src = `${wasmBaseUrl}/KStarsWasm.js`;
					script.async = true;

					await new Promise((resolve, reject) =>
					{
						script.onload = () =>
						{
							setDownloadProgress(20);
							resolve();
						};
						script.onerror = (e) =>
							reject(new Error("Failed to load KStarsWasm.js"));
						document.body.appendChild(script);
					});
				}

				// Initialize wasmSkyMapEvents for C++ to JS callbacks
				if (!window.wasmSkyMapEvents)
				{
					window.wasmSkyMapEvents = {};
				}

				// Set up event handlers
				window.wasmSkyMapEvents.onSkyObjectClick = onSkyObjectClick;
				window.wasmSkyMapEvents.onSkyPointCenterListener =
					onSkyPointCenterListener;
				window.wasmSkyMapEvents.onDisableTelescopeCenter =
					onDisableTelescopeCenter;

				setDownloadProgress(30);

				// Start simulating progress for the WASM loading
				const clearProgressSimulation = simulateWasmLoadingProgress();

				// Configure and initialize the WASM module
				if (
					typeof window.KStarsWasm_entry === "function" &&
					!wasmInstanceRef.current
				)
				{
					const config = {
						locateFile: (path) =>
						{
							if (path.endsWith(".wasm") || path.endsWith(".data"))
							{
								return `${wasmBaseUrl}/${path}`;
							}
							return path;
						},
						qt: {
							containerElements: [containerRef.current],
							onLoaded: () =>
							{
								// Stop the progress simulation
								clearProgressSimulation();

								console.log("KStarsWasm loaded successfully!");
								setDownloadProgress(100);

								setTimeout(() =>
								{
									setLoading(false);
									setLogMessage("KStars loaded successfully");
								}, 500);
							},
							entryFunction: window.KStarsWasm_entry,
						},
					};

					try
					{
						const instance = await window.qtLoad(config);
						wasmInstanceRef.current = instance;
						console.log("KStarsWasm instance created");
					}
					catch (error)
					{
						clearProgressSimulation();
						console.error("Failed to load KStarsWasm:", error);
						setError("Failed to load KStarsWasm: " + error.message);
						setLoading(false);
					}
				}
				else if (wasmInstanceRef.current)
				{
					// Already loaded
					clearProgressSimulation();
					setDownloadProgress(100);
					setLoading(false);
					console.log("KStarsWasm already loaded");
				}
				else
				{
					clearProgressSimulation();
					console.error("KStarsWasm_entry function not found");
					setError("KStarsWasm_entry function not found");
					setLoading(false);
				}
			}
			catch (error)
			{
				console.error("Error loading WASM:", error);
				setError("Error loading WASM: " + error.message);
				setLoading(false);
			}
		};

		loadKStarsWasm();

		// Clean up on unmount
		return () =>
		{
			// Clean up wasmSkyMapEvents handlers
			if (window.wasmSkyMapEvents)
			{
				window.wasmSkyMapEvents.onSkyObjectClick = null;
				window.wasmSkyMapEvents.onSkyPointCenterListener = null;
				window.wasmSkyMapEvents.onDisableTelescopeCenter = null;
			}

			// Clean up WASM instance
			if (
				wasmInstanceRef.current &&
				typeof wasmInstanceRef.current.exit === "function"
			)
			{
				try
				{
					wasmInstanceRef.current.exit();
				}
				catch (e)
				{
					console.error("Error during cleanup:", e);
				}
			}
		};
	}, []);

	useEffect(() =>
	{
		if (
			!loading &&
			wasmInstanceRef.current &&
			observatories &&
			observatories.length > 0
		)
		{
			const currentObservatory = observatories.find(
				(obs) => obs.machine_id === activeKStarsID,
			);

			refreshLocation(currentObservatory);
		}
	}, [loading, observatories, refreshLocation]);

	// Function to handle search results from ExternalSearch
	const handleExternalSearch = async (selectedObjectName) =>
	{
		if (!selectedObjectName || !wasmInstanceRef.current) return;

		let finalObjectName = selectedObjectName;

		// Get the primary name of the object
		const response = await axios.get(
			`/api/observatories/get-primary-name?objectName=${selectedObjectName}`,
		);
		if (response.data)
		{
			finalObjectName = response.data.primaryName;
		}

		if (finalObjectName)
		{
			wasmInstanceRef.current.setFocusObject(finalObjectName);
		}
	};

	const gotoSelectedTarget = () =>
	{
		// Sometimes KStars fails to precesses objects close to poles for some reason
		// so we send coordinates directly.
		if (Math.abs(selectedSkyObject.Dec) > 89)
			dispatch(
				mountActions.gotoRADE(
					toHMS(selectedSkyObject.RA),
					toDMS(selectedSkyObject.Dec),
					false,
				),
			);
		else dispatch(mountActions.gotoTarget(selectedSkyObject.name));
	};

	/**
	 * Simply slew. Do not perform any alignment.
	 */
	const slew = () =>
	{
		if (mountStatus === "Parked")
		{
			dispatch(mountActions.unpark());
			// If mount is parked, delay by 1 second to give it time to unpark
			setTimeout(() =>
			{
				gotoSelectedTarget();
				setSlewRequested(true);
				if (isSameTarget(mountTarget, selectedSkyObject.name, designations))
					setBorderColor(Palette.green);
				else setBorderColor(Palette.magenta);
			}, 1000);
			return;
		}

		gotoSelectedTarget();

		// If we are *already* on the same target, we immediately set it to green since we might not get any mount status
		// updates and we could end up stuck in magenta.
		if (isSameTarget(mountTarget, selectedSkyObject.name, designations))
			setBorderColor(Palette.green);
		else
		{
			// Delay setting go requested for at least 1 second to allow mount to change state first.
			setTimeout(() =>
			{
				setSlewRequested(true);
				setBorderColor(Palette.magenta);
			}, 1000);
		}
	};

	const handleSync = useCallback(() =>
	{
		if (!selectedSkyObject || !mountOnline || !wasmInstanceRef.current) return;

		try
		{
			if (typeof wasmInstanceRef.current.setOption === "function")
			{
				// From interface.cpp, we can use focusRA and focusDec to sync
				wasmInstanceRef.current.setOption("focusRA", selectedSkyObject.RA);
				wasmInstanceRef.current.setOption("focusDec", selectedSkyObject.Dec);
			}

			setBorderColor(Palette.green);
		}
		catch (error)
		{
			console.error("Error syncing:", error);
		}
	}, [selectedSkyObject, mountOnline]);

	const go = useCallback(() =>
	{
		if (!selectedSkyObject || !mountOnline || !wasmInstanceRef.current) return;

		try
		{
			setGoRequested(true);
			setBorderColor(Palette.magenta);

			if (typeof wasmInstanceRef.current.setOption === "function")
			{
				// From interface.cpp, we can use focusObject
				wasmInstanceRef.current.setOption(
					"focusObject",
					selectedSkyObject.name,
				);
				wasmInstanceRef.current.setOption("isTracking", true);
			}

			// Simulate solve completion after a delay (in real app this would be handled by align status)
			setTimeout(() =>
			{
				setGoRequested(false);
				setBorderColor(Palette.green);
			}, 5000);
		}
		catch (error)
		{
			console.error("Error going:", error);
			setGoRequested(false);
		}
	}, [selectedSkyObject, mountOnline]);

	const abort = useCallback(() =>
	{
		if (!wasmInstanceRef.current)
		{
			console.warn("Cannot abort: WASM module not loaded");
			return;
		}

		try
		{
			console.log("Aborting current operation");

			if (typeof wasmInstanceRef.current.setOption === "function")
			{
				// From interface.cpp, we can use isTracking to abort
				wasmInstanceRef.current.setOption("isTracking", false);
			}

			setBorderColor(Palette.grey99);
			setGoRequested(false);
			setSolveRequested(false);
			setSlewRequested(false);
		}
		catch (error)
		{
			console.error("Error aborting operation:", error);
		}
	}, []);

	const schedule = useCallback(() =>
	{
		if (!selectedSkyObject) return;

		// This would typically dispatch an action to set scheduler settings
		console.log(`Scheduling ${selectedSkyObject.name}...`);
	}, [selectedSkyObject]);

	// Info panel dragging handlers - exactly as in the original implementation
	const handleInfoPanelMouseDown = (e) =>
	{
		setIsDragging(true);

		// Store initial positions
		dragStartRef.current = {
			x: e.clientX,
			y: e.clientY,
			panelX: infoPanelPosition.x,
			panelY: infoPanelPosition.y,
		};

		// Add global event listeners
		document.addEventListener("mousemove", handleMouseMove);
		document.addEventListener("mouseup", handleMouseUp);

		// Prevent default behavior
		e.preventDefault();
	};

	const handleMouseMove = (e) =>
	{
		if (!isDragging) return;

		// Calculate new position
		const deltaX = e.clientX - dragStartRef.current.x;
		const deltaY = e.clientY - dragStartRef.current.y;

		setInfoPanelPosition({
			x: Math.min(
				window.innerWidth - 250,
				Math.max(0, dragStartRef.current.panelX + deltaX),
			),
			y: Math.min(
				window.innerHeight - 200,
				Math.max(0, dragStartRef.current.panelY + deltaY),
			),
		});
	};

	const handleMouseUp = () =>
	{
		if (isDragging)
		{
			setIsDragging(false);

			// Remove global event listeners
			document.removeEventListener("mousemove", handleMouseMove);
			document.removeEventListener("mouseup", handleMouseUp);
		}
	};

	// Clean up event listeners when component unmounts
	useEffect(() =>
	{
		return () =>
		{
			document.removeEventListener("mousemove", handleMouseMove);
			document.removeEventListener("mouseup", handleMouseUp);
		};
	}, []);

	useEffect(() =>
	{
		if (!loading && wasmInstanceRef.current)
		{
			wasmInstanceRef.current.setOption("showStars", isShowStars);
			wasmInstanceRef.current.forceUpdate(true);
			console.log("isShowStars state changed:", isShowStars);
		}
	}, [loading, isShowStars]);

	useEffect(() =>
	{
		if (!loading && wasmInstanceRef.current)
		{
			wasmInstanceRef.current.setOption("showDeepSky", isShowNGCCatalog);
			wasmInstanceRef.current.forceUpdate(true);
			console.log("isShowNGCCatalog state changed:", isShowNGCCatalog);
		}
	}, [loading, isShowNGCCatalog]);

	useEffect(() =>
	{
		if (!loading && wasmInstanceRef.current)
		{
			wasmInstanceRef.current.setOption("showSolarSystem", isShowSolarSystem);
			wasmInstanceRef.current.setOption("showPlanetNames", isShowSolarSystem);
			wasmInstanceRef.current.forceUpdate(true);
			console.log("isShowSolarSystem state changed:", isShowSolarSystem);
		}
	}, [loading, isShowSolarSystem]);

	useEffect(() =>
	{
		if (!loading && wasmInstanceRef.current)
		{
			wasmInstanceRef.current.setOption(
				"showConstellationArt",
				isShowConstells,
			);
			wasmInstanceRef.current.forceUpdate(true);
			console.log("isShowConstells state changed:", isShowConstells);
		}
	}, [loading, isShowConstells]);

	useEffect(() =>
	{
		if (!loading && wasmInstanceRef.current)
		{
			wasmInstanceRef.current.setOption("showMilkyWay", isShowMilkyWay);
			wasmInstanceRef.current.forceUpdate(true);
			console.log("isShowMilkyWay state changed:", isShowMilkyWay);
		}
	}, [loading, isShowMilkyWay]);

	useEffect(() =>
	{
		if (!loading && wasmInstanceRef.current)
		{
			wasmInstanceRef.current.setOption("showEquatorialGrid", isShowGrid);
			wasmInstanceRef.current.forceUpdate(true);
			console.log("isShowGrid state changed:", isShowGrid);
		}
	}, [loading, isShowGrid]);

	useEffect(() =>
	{
		if (!loading && wasmInstanceRef.current)
		{
			wasmInstanceRef.current.setOption("showGround", isShowGround);
			wasmInstanceRef.current.forceUpdate(true);
			console.log("isShowGround state changed:", isShowGround);
		}
	}, [loading, isShowGround]);

	useEffect(() =>
	{
		if (!loading && wasmInstanceRef.current)
		{
			wasmInstanceRef.current.setOption("showHIPS", isShowHIPS);
			wasmInstanceRef.current.forceUpdate(true);
			console.log("isShowHIPS state changed:", isShowHIPS);
		}
	}, [loading, isShowHIPS]);

	// Add these state variables for FOV overlays
	const [cameraFOV, setCameraFOV] = useState({
		name: "CCD Simulator",
		width: 83.1,
		height: 54.4,
		xOffset: 0,
		yOffset: 0,
		rotation: 0,
		shapeId: 0,
		color: "#a32e00",
		visibility: false,
	});

	const [solverFOV, setSolverFOV] = useState({
		name: "Solver FOV",
		width: 83.1,
		height: 54.4,
		pa: -1,
		ra: 0,
		de: 0,
		color: "#ffff00",
		visibility: false,
	});

	// Add a function to refresh FOV overlays
	const refreshFOVOverlays = useCallback(() =>
	{
		if (
			!wasmInstanceRef.current ||
			typeof wasmInstanceRef.current.setFovOverlayParams !== "function"
		)
			return;

		// Ensure FovType is accessible, otherwise use 0 and 1 directly.
		const FovType = wasmInstanceRef.current.FovType || { Sensor: 0, Solver: 1 };

		// Set Sensor FOV
		wasmInstanceRef.current.setFovOverlayParams(
			FovType.Sensor, // Or 0
			JSON.stringify({
				...cameraFOV,
				visibility:
					ekosProfileRunning && cameraFOV.width > 0 && cameraFOV.height > 0,
			}),
		);

		// Set Solver FOV
		wasmInstanceRef.current.setFovOverlayParams(
			FovType.Solver, // Or 1
			JSON.stringify({
				...solverFOV,
				visibility:
					ekosProfileRunning &&
					solverFOV.width > 0 &&
					solverFOV.height > 0 &&
					solverFOV.de !== 0,
			}),
		);

		wasmInstanceRef.current.forceUpdate(true);
	}, [ekosProfileRunning, cameraFOV, solverFOV, wasmInstanceRef.current]);

	// Add a selector for FOV profiles
	const currentFOVProfile = useSelector(
		(state) => state.targets.currentFOVProfile,
	);
	const fovProfiles = useSelector(
		(state) => state.targets.fovProfiles,
		isEqual,
	);
	const solutionFound = useSelector(
		(state) => selectIsAlignSolved(state),
		isEqual,
	);

	// Update camera FOV based on selected profile
	useEffect(() =>
	{
		if (ekosProfileRunning && fovProfiles && fovProfiles.length > 0)
		{
			const profile = fovProfiles.find(
				(profile) => profile.name === currentFOVProfile,
			);
			if (profile)
			{
				setCameraFOV({
					...cameraFOV,
					name: profile.name,
					width: profile.fovW,
					height: profile.fovH,
					rotation: get(profile, "pa", 0),
					visibility: true,
				});
			}
		}
	}, [ekosProfileRunning, currentFOVProfile, fovProfiles]);

	// Update solver FOV based on solution
	useEffect(() =>
	{
		if (solutionFound && solution)
		{
			// Extract FOV dimensions from solution string (e.g., "83.1' x 54.4'")
			const [width, height] = solution.fov
				.replace("'", "")
				.split(" x ")
				.map((value) => parseFloat(value));

			setSolverFOV({
				...solverFOV,
				name: get(solution, "camera", "Solver FOV"),
				width,
				height,
				pa: get(solution, "PA", 0),
				ra: DMSToDouble(get(solution, "ra", 0)) * 15, // Convert to degrees
				de: DMSToDouble(get(solution, "de", 0)),
				visibility: true,
			});
		}
	}, [solutionFound, solution]);

	// Update FOV overlays whenever they change
	useEffect(() =>
	{
		if (wasmInstanceRef.current && !loading)
		{
			refreshFOVOverlays();
		}
	}, [cameraFOV, solverFOV, ekosProfileRunning, refreshFOVOverlays, loading]);

	// Add DMSToDouble function if it's not already imported
	const DMSToDouble = (dmsStr) =>
	{
		if (!dmsStr) return 0;

		// Handle negative values
		const isNegative = dmsStr.startsWith("-");
		const cleanStr = dmsStr.replace("-", "").trim();

		// Split into degrees, minutes, seconds
		const parts = cleanStr.split(":");
		let degrees = 0;

		if (parts.length === 3)
		{
			// Format: DD:MM:SS
			degrees =
				parseFloat(parts[0]) +
				parseFloat(parts[1]) / 60 +
				parseFloat(parts[2]) / 3600;
		}
		else if (parts.length === 2)
		{
			// Format: DD:MM
			degrees = parseFloat(parts[0]) + parseFloat(parts[1]) / 60;
		}
		else
		{
			// Format: DD
			degrees = parseFloat(cleanStr);
		}

		return isNegative ? -degrees : degrees;
	};

	// Add this selector near the top with other selectors
	const user = useSelector(selectUser);

	return (
		<SkyMapWrapper>
			{/* Replace the search button with ExternalSearch component */}
			<Box
				sx={{
					position: "absolute",
					left: "20px",
					top: "20px",
					zIndex: 100,
					alignSelf: "baseline",
				}}
			>
				<ExternalSearch runExternalSearch={handleExternalSearch} />
			</Box>

			{/* Display controls at top center */}
			<Box
				sx={{
					position: "absolute",
					top: "5px",
					width: "100%",
					display: "flex",
					flexDirection: "row",
					padding: "5px",
					justifyContent: "center",
					zIndex: 10,
				}}
			>
				<Box sx={{ margin: "3px" }}>
					<ImageButton
						isPressed={isShowStars}
						onClick={() =>
						{
							setIsShowStars(!isShowStars);
						}}
					>
						<Box
							component="img"
							src={require("@images/skymap/kstars_stars.webp")}
							alt="Stars"
							sx={{ width: "50px", height: "50px" }}
						/>
					</ImageButton>
				</Box>

				<Box sx={{ margin: "3px" }}>
					<ImageButton
						isPressed={isShowNGCCatalog}
						onClick={() =>
						{
							setIsShowNGCCatalog(!isShowNGCCatalog);
						}}
					>
						<Box
							component="img"
							src={require("@images/skymap/kstars_deepsky.webp")}
							alt="Deep Sky"
							sx={{ width: "50px", height: "50px" }}
						/>
					</ImageButton>
				</Box>

				<Box sx={{ margin: "3px" }}>
					<ImageButton
						isPressed={isShowSolarSystem}
						onClick={() =>
						{
							setIsShowSolarSystem(!isShowSolarSystem);
						}}
					>
						<Box
							component="img"
							src={require("@images/skymap/kstars_solarsystem.webp")}
							alt="Solar System"
							sx={{ width: "50px", height: "50px" }}
						/>
					</ImageButton>
				</Box>

				<Box sx={{ margin: "3px" }}>
					<ImageButton
						isPressed={isShowConstells}
						onClick={() =>
						{
							setIsShowConstells(!isShowConstells);
						}}
					>
						<Box
							component="img"
							src={require("@images/skymap/kstars_cbound.webp")}
							alt="Constellations"
							sx={{ width: "50px", height: "50px" }}
						/>
					</ImageButton>
				</Box>

				<Box sx={{ margin: "3px" }}>
					<ImageButton
						isPressed={isShowMilkyWay}
						onClick={() =>
						{
							setIsShowMilkyWay(!isShowMilkyWay);
						}}
					>
						<Box
							component="img"
							src={require("@images/skymap/kstars_mw.webp")}
							alt="Milky Way"
							sx={{ width: "50px", height: "50px" }}
						/>
					</ImageButton>
				</Box>

				<Box sx={{ margin: "3px" }}>
					<ImageButton
						isPressed={isShowGrid}
						onClick={() =>
						{
							setIsShowGrid(!isShowGrid);
						}}
					>
						<Box
							component="img"
							src={require("@images/skymap/kstars_grid.webp")}
							alt="Grid"
							sx={{ width: "50px", height: "50px" }}
						/>
					</ImageButton>
				</Box>

				<Box sx={{ margin: "3px" }}>
					<ImageButton
						isPressed={isShowGround}
						onClick={() =>
						{
							setIsShowGround(!isShowGround);
						}}
					>
						<Box
							component="img"
							src={require("@images/skymap/kstars_horizon.webp")}
							alt="Ground"
							sx={{ width: "50px", height: "50px" }}
						/>
					</ImageButton>
				</Box>

				<Box sx={{ margin: "3px" }}>
					<ImageButton
						isPressed={isShowHIPS}
						onClick={() =>
						{
							setIsShowHIPS(!isShowHIPS);
						}}
					>
						<Box
							component="img"
							src={require("@images/skymap/kstars_dss.webp")}
							alt="DSS Images"
							sx={{ width: "50px", height: "50px" }}
						/>
					</ImageButton>
				</Box>
			</Box>

			{/* Right side controls */}
			<Box
				sx={{
					position: "absolute",
					top: "5px",
					right: "5px",
					padding: "5px",
					alignItems: "flex-end",
					zIndex: 10,
				}}
			>
				<Box sx={{ display: "flex", flexDirection: "row" }}>
					{/* Mount control button - only show if ekosProfileRunning is true */}
					{ekosProfileRunning && (
						<Box sx={{ marginRight: "10px" }}>
							<ImageButton
								isPressed={showMountControls}
								onClick={() => setShowMountControls(!showMountControls)}
							>
								<Box
									component="img"
									src={
										showMountControls
											? require("@images/mount_qc_on.webp")
											: require("@images/mount_qc.webp")
									}
									alt="Mount Controls"
									sx={{ width: "50px", height: "50px" }}
								/>
							</ImageButton>
						</Box>
					)}

					{/* Existing telescope lock button */}
					<Box>
						<ImageButton
							isPressed={isTelescopeCenter}
							onClick={() =>
							{
								setIsTelescopeCenter(!isTelescopeCenter);

								if (
									wasmInstanceRef.current &&
									typeof wasmInstanceRef.current.setOption === "function"
								)
								{
									// From interface.cpp, we can use isTracking to lock the telescope
									wasmInstanceRef.current.setOption(
										"isTracking",
										!isTelescopeCenter,
									);
								}
							}}
						>
							<Box
								component="img"
								src={require("@images/skymap/lock.webp")}
								alt="Lock Telescope"
								sx={{ width: "50px", height: "50px" }}
							/>
						</ImageButton>
					</Box>
				</Box>
			</Box>

			{/* Main KStars container */}
			<SkyMapContainer ref={containerRef} id="kstars-wasm-container">
				{loading && (
					<div
						className="wasm-loading"
						style={{
							position: "absolute",
							top: 0,
							left: 0,
							width: "100%",
							height: "100%",
							display: "flex",
							flexDirection: "column",
							justifyContent: "center",
							alignItems: "center",
							backgroundColor: "rgba(0, 0, 0, 0.8)",
							zIndex: 1000,
							color: "white",
						}}
					>
						{/* Simplified progress indicator */}
						<div
							style={{
								width: "250px",
								marginBottom: "20px",
								textAlign: "center",
							}}
						>
							{/* Progress bar */}
							<div
								style={{
									width: "100%",
									height: "10px",
									backgroundColor: "#333",
									borderRadius: "5px",
									overflow: "hidden",
								}}
							>
								<div
									style={{
										width: `${downloadProgress}%`,
										height: "100%",
										backgroundColor: "#FFA500",
										borderRadius: "5px",
										transition: "width 0.2s ease",
									}}
								/>
							</div>

							{/* Percentage text */}
							<div
								style={{
									marginTop: "10px",
									fontSize: "14px",
								}}
							>
								Loading Sky Map ({downloadProgress}%)
							</div>
						</div>

						<div
							className="wasm-loading-spinner"
							style={{
								width: "30px",
								height: "30px",
								border: "3px solid rgba(255, 255, 255, 0.3)",
								borderRadius: "50%",
								borderTop: "3px solid #FFA500",
								animation: "spin 1s linear infinite",
							}}
						></div>

						<style>
							{`
                @keyframes spin {
                  0% { transform: rotate(0deg); }
                  100% { transform: rotate(360deg); }
                }
              `}
						</style>
					</div>
				)}
				{error && (
					<div
						className="wasm-error"
						style={{
							position: "absolute",
							top: 0,
							left: 0,
							width: "100%",
							height: "100%",
							display: "flex",
							flexDirection: "column",
							justifyContent: "center",
							alignItems: "center",
							backgroundColor: "rgba(0, 0, 0, 0.8)",
							zIndex: 1000,
							color: "white",
							padding: "20px",
							textAlign: "center",
						}}
					>
						<div
							style={{
								fontSize: "20px",
								color: "#FF6347",
								marginBottom: "15px",
							}}
						>
							Error Loading KStars
						</div>
						<p>{error}</p>
					</div>
				)}
			</SkyMapContainer>

			{/* Coordinates display at bottom right */}
			<Box
				sx={{
					position: "absolute",
					flexDirection: "row",
					alignItems: "center",
					alignSelf: "flex-end",
					bottom: "5px",
					right: "5px",
					display: "flex",
					zIndex: 10,
					p: 1,
					backgroundColor: "rgba(0, 0, 0, 0.5)",
					borderRadius: "4px",
				}}
			>
				<HeaderText>RA:</HeaderText>
				<CoordinateText>{toHMS(centerSkyPoint.RA)}</CoordinateText>
				<HeaderText>DE:</HeaderText>
				<CoordinateText>{toDMS(centerSkyPoint.Dec)}</CoordinateText>
				<HeaderText>AZ:</HeaderText>
				<CoordinateText>{toDMS(centerSkyPoint.Az)}</CoordinateText>
				<HeaderText>AL:</HeaderText>
				<CoordinateText>{toDMS(centerSkyPoint.Alt)}</CoordinateText>
			</Box>

			{/* Sky object information panel - exactly as in the original */}
			{showInfoPanel && selectedSkyObject && (
				<div
					className="info-panel"
					style={{
						position: "absolute",
						left: `${infoPanelPosition.x}px`,
						top: `${infoPanelPosition.y}px`,
						cursor: isDragging ? "grabbing" : "grab",
						borderColor: borderColor,
						backgroundColor: "rgba(0, 0, 0, 0.7)",
						border: "2px solid",
						borderRadius: "8px",
						padding: "15px",
						width: "440px",
						color: "white",
						zIndex: 100,
						boxShadow: "0 4px 8px rgba(0, 0, 0, 0.5)",
					}}
					onMouseDown={handleInfoPanelMouseDown}
				>
					<div
						className="info-panel-header"
						style={{
							display: "flex",
							justifyContent: "space-between",
							alignItems: "center",
							marginBottom: "12px",
						}}
					>
						<div
							className="info-panel-title"
							style={{
								fontWeight: "bold",
								fontSize: "18px",
							}}
						>
							{selectedSkyObject.name} ({selectedSkyObject.type})
						</div>
						<button
							className="close-button"
							onClick={() => setShowInfoPanel(false)}
							style={{
								background: "none",
								border: "none",
								color: "white",
								fontSize: "22px",
								cursor: "pointer",
							}}
						>
							×
						</button>
					</div>

					{/* Rest of the info panel content */}
					<Box sx={{ pointerEvents: "auto" }}>
						{/* Object Magnitude */}
						<Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
							<FlareIcon sx={{ color: "#ffffffcc", fontSize: "26px" }} />
							<Typography sx={{ color: "white", fontSize: "16px", ml: 1 }}>
								{selectedSkyObject.magnitude.toFixed(2)}
							</Typography>
						</Box>

						{/* First coordinate row */}
						<Box
							sx={{
								flexDirection: "row",
								alignItems: "flex-start",
								justifyContent: "space-between",
								borderWidth: "1px",
								borderColor: Palette.greydd,
								borderStyle: "solid",
								display: "flex",
								p: 0.75,
								mb: 1,
							}}
						>
							<HeaderText>RA</HeaderText>
							<CommonText>{toHMS(selectedSkyObject.RA)}</CommonText>
							<HeaderText>DE</HeaderText>
							<CommonText>{toDMS(selectedSkyObject.Dec)}</CommonText>
							<HeaderText>HA</HeaderText>
							<CommonText>{toHA(selectedSkyObject.HA || 0)}</CommonText>
						</Box>

						{/* Second coordinate row */}
						<Box
							sx={{
								flexDirection: "row",
								justifyContent: "space-between",
								borderWidth: "1px",
								borderColor: Palette.greydd,
								borderStyle: "solid",
								display: "flex",
								p: 0.75,
								mb: 1.5,
							}}
						>
							<HeaderText>AZ</HeaderText>
							<CommonText>{toDMS(selectedSkyObject.Az)}</CommonText>
							<HeaderText>AL</HeaderText>
							<CommonText>{toDMS(selectedSkyObject.Alt)}</CommonText>
							<HeaderText>ZA</HeaderText>
							<CommonText>{toDMS(selectedSkyObject.ZA || 0)}</CommonText>
						</Box>

						<Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
							{/* Action buttons */}
							<Box
								sx={{
									flexDirection: "row",
									justifyContent: "space-between",
									marginVertical: "5px",
									marginHorizontal: "5px",
									display: "flex",
									mt: 2,
								}}
							>
								<Box sx={{ flex: 1 }}>
									<ButtonStyle
										fullWidth
										disabled={!mountOnline && user?.plan_id === planType.DEFAULT}
										onClick={slew}
										sx={{ opacity: mountOnline ? 1 : 0.7 }}
									>
										{s.skymap.goto}
									</ButtonStyle>
								</Box>

								<Box sx={{ flex: 1, marginLeft: "6px" }}>
									<ButtonStyle
										fullWidth
										disabled={!mountOnline && user?.plan_id === planType.DEFAULT}
										onClick={handleSync}
										sx={{ opacity: mountOnline ? 1 : 0.7 }}
									>
										{s.ekos.collapse_align.action_sync}
									</ButtonStyle>
								</Box>

								<Box sx={{ flex: 1, marginLeft: "6px" }}>
									<ButtonStyle
										fullWidth
										disabled={!mountOnline && user?.plan_id === planType.DEFAULT}
										onClick={() => {
											if (isBusy) abort();
											else go();
										}}
										sx={{ opacity: mountOnline ? 1 : 0.7 }}
									>
										{isBusy ? "Stop" : "Go & Solve"}
									</ButtonStyle>
								</Box>

								<Box sx={{ flex: 1, marginLeft: "6px" }}>
									<ButtonStyle fullWidth onClick={schedule} disabled={user?.plan_id === planType.DEFAULT}>
										{s.general.schedule}
									</ButtonStyle>
								</Box>
							
							</Box>
							{user?.plan_id === planType.DEFAULT && (
								<CurrentPlanInformer text="Upgrade Plan to Access Controls" sx={{ width: "100%" }} />
							)}
						</Box>

					</Box>
				</div>
			)}

			{/* Add the MountQuickControls when showMountControls is true and ekosProfileRunning is true */}
			{showMountControls && ekosProfileRunning && (
				<>
					{/* Left D-Pad */}
					<Box
						sx={{
							position: "absolute",
							left: "1%",
							top: "40%",
							zIndex: 100,
							display: "flex",
							flexDirection: "column",
							alignItems: "center",
						}}
					>
						<LeftDPad />
					</Box>

					{/* Right D-Pad */}
					<Box
						sx={{
							position: "absolute",
							right: "1%",
							top: "40%",
							zIndex: 100,
							display: "flex",
							flexDirection: "column",
							alignItems: "center",
						}}
					>
						<RightDPad />
					</Box>

					{/* Bottom Mount Controls */}
					<Box
						sx={{
							position: "absolute",
							bottom: 0,
							left: "50%",
							transform: "translateX(-50%)",
							display: "flex",
							justifyContent: "center",
							alignItems: "center",
							height: "100px",
							width: "max-content",
							zIndex: 100,
						}}
					>
						<MountQuickControls />
					</Box>
				</>
			)}
		</SkyMapWrapper>
	);
};

export default KStarsWasmApp;
