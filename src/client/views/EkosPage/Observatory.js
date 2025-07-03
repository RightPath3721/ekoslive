import React, { memo, useCallback, useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useSpring, animated } from "react-spring";
import { selectTrainDevice } from "@redux/selectors";
import { DEVICE_TYPE, IPState, ISState, trainModules } from "@indi/enums";
import { isEmpty } from "lodash";
import { selectTrainDeviceName, selectDome } from "@redux/selectors";
import Reactor from "@common/shared/indi/events.js";
import createStyles from "./ObservatoryModernStyles";
import { Box, Button, Typography } from "@mui/material";
import { v4 as uuidv4 } from "uuid";
import NumericControl from "@components/NumericControl";
import s from "@common/shared/i18n/i18n";
import { Palette } from "@common/shared/common/styles";
import DomeVisualization from "@components/DomeVisualization";
import CustomizedSwitch from "@components/CustomSwitch";
import StopCircleIcon from "@mui/icons-material/StopCircle";

const ObservatoryModern = ({}) =>
{
	const dispatch = useDispatch();
	const LOCAL_STYLES = createStyles(window.innerWidth);

	// Animation values for busy states
	const [busyOpacity, setBusyOpacity] = useState(0.3);
	const [isDomeMoving, setIsDomeMoving] = useState(false);

	/**
	 * Use Selectors
	 */
	const dome = useSelector((state) => selectDome(state));

	const cap = useSelector((state) =>
		selectTrainDevice(state, {
			trainType: trainModules.CaptureOpticalTrain,
			deviceType: DEVICE_TYPE.DUSTCAP,
		}),
	);

	const lightBox = useSelector((state) =>
		selectTrainDevice(state, {
			trainType: trainModules.CaptureOpticalTrain,
			deviceType: DEVICE_TYPE.LIGHTBOX,
		}),
	);

	const mount = useSelector((state) =>
		selectTrainDeviceName(state, {
			trainType: trainModules.CaptureOpticalTrain,
			deviceType: DEVICE_TYPE.MOUNT,
		}),
	);

	// Generate UUIDs for event listeners
	const [domeUUID] = uuidv4();
	const [capUUID] = uuidv4();
	const [lightBoxUUID] = uuidv4();

	///////////////////////////////////////////////////////////////////////////////////
	/// Dome Properties
	///////////////////////////////////////////////////////////////////////////////////
	const [shutterMotionState, setShutterMotionState] = useState(null);
	const [isShutterOpen, setIsShutterOpen] = useState(false);
	const [isSlaving, setIsSlaving] = useState(false);
	const [domeParkState, setDomeParkState] = useState(null);
	const [isDomeParked, setIsDomeParked] = useState(false);
	const [domeAzimuth, setDomeAzimuth] = useState(0);
	const [domeAngularWidth, setDomeAngularWidth] = useState(0);

	///////////////////////////////////////////////////////////////////////////////////
	/// Dust Cap Properties
	///////////////////////////////////////////////////////////////////////////////////
	const [capParkState, setCapParkState] = useState(null);
	const [isCapParked, setIsCapParked] = useState(false);

	///////////////////////////////////////////////////////////////////////////////////
	/// Light Box Properties
	///////////////////////////////////////////////////////////////////////////////////
	const [isLightOn, setIsLightOn] = useState(false);
	const [lightIntensity, setLightIntensity] = useState(0);
	const [hasLightIntensity, setHasLightIntensity] = useState(false);

	/**
	 * State Hooks
	 */
	const [intensity, setIntensity] = useState(0);

	// Start pulsing animation for busy states using react-spring
	const busyIndicatorStyle = useSpring({
		opacity: busyOpacity,
		position: "absolute",
		width: "100%",
		height: "100%",
		borderRadius: "100px",
		border: "3px solid #ffcc00",
	});

	// Start busy animation
	const startBusyAnimation = useCallback(() =>
	{
		setBusyOpacity(0.7);
		setTimeout(() => setBusyOpacity(0.3), 1600);
	}, []);

	useEffect(() =>
	{
		if (isDomeMoving)
		{
			startBusyAnimation();
		}
	}, [isDomeMoving, startBusyAnimation]);

	// Removed startRoofAnimation as it's no longer needed with the new visualization

	/**
	 * Calculate the angular width of the dome shutter in degrees
	 */
	const calculateAngularWidth = useCallback((radius, shutterWidth) =>
	{
		return radius > 0
			? (Math.atan2(shutterWidth / 2, radius) * 2 * 180) / Math.PI
			: 0;
	}, []);

	/**
	 * Update dome properties when they change
	 */
	const onDomePropertyUpdate = useCallback(
		(device, property) =>
		{
			// Only process if this is our dome device
			if (device.name !== dome?.name) return;

			if (property.name === "DOME_MEASUREMENTS")
			{
				const radiusElement = property.numbers.find(
					(num) => num.name === "DOME_RADIUS",
				);
				const shutterWidthElement = property.numbers.find(
					(num) => num.name === "DOME_SHUTTER_WIDTH",
				);

				if (radiusElement && shutterWidthElement)
				{
					const radius = radiusElement.value;
					const shutterWidth = shutterWidthElement.value;
					const angularWidth = calculateAngularWidth(radius, shutterWidth);

					console.log("Dome measurements updated:", {
						radius,
						shutterWidth,
						angularWidth,
					});

					setDomeAngularWidth(angularWidth);
				}
			}
			else if (property.name === "DOME_SHUTTER")
			{
				setShutterMotionState(property.state);
				const shutterOpenElement = property.switches.find(
					(sw) => sw.name === "SHUTTER_OPEN",
				);
				if (shutterOpenElement)
				{
					setIsShutterOpen(shutterOpenElement.state === ISState.ISS_ON);
				}

				// Start animation if in busy state
				if (property.state === IPState.IPS_BUSY)
				{
					startBusyAnimation();
				}
			}
			else if (property.name === "DOME_AUTOSYNC")
			{
				const slavingElement = property.switches.find(
					(sw) => sw.name === "DOME_AUTOSYNC_ENABLE",
				);
				if (slavingElement)
				{
					setIsSlaving(slavingElement.state === ISState.ISS_ON);
				}
			}
			else if (property.name === "DOME_PARK")
			{
				setDomeParkState(property.state);
				const parkElement = property.switches.find((sw) => sw.name === "PARK");
				if (parkElement)
				{
					setIsDomeParked(parkElement.state === ISState.ISS_ON);
				}

				// Start animation if in busy state
				if (property.state === IPState.IPS_BUSY)
				{
					startBusyAnimation();
					// We no longer need to animate the roof sliding as it's handled by the DomeVisualization component
				}
			}
			else if (property.name === "ABS_DOME_POSITION")
			{
				const azimuthElement = property.numbers.find(
					(num) => num.name === "DOME_ABSOLUTE_POSITION",
				);
				if (azimuthElement)
				{
					setDomeAzimuth(azimuthElement.value);
				}

				// Check if dome is moving
				if (property.state === IPState.IPS_BUSY)
				{
					setIsDomeMoving(true);
					startBusyAnimation();
				}
				else
				{
					setIsDomeMoving(false);
				}
			}
		},
		[dome, startBusyAnimation],
	);

	/**
	 * Update cap properties when they change
	 */
	const onCapPropertyUpdate = useCallback(
		(device, property) =>
		{
			// Only process if this is our cap device
			if (device.name !== cap?.name) return;

			if (property.name === "CAP_PARK")
			{
				setCapParkState(property.state);
				const parkElement = property.switches.find((sw) => sw.name === "PARK");
				if (parkElement)
				{
					setIsCapParked(parkElement.state === ISState.ISS_ON);
				}

				// Start animation if in busy state
				if (property.state === IPState.IPS_BUSY)
				{
					startBusyAnimation();
				}
			}
		},
		[cap, startBusyAnimation],
	);

	/**
	 * Update lightbox properties when they change
	 */
	const onLightBoxPropertyUpdate = useCallback(
		(device, property) =>
		{
			// Only process if this is our lightbox device
			if (device.name !== lightBox?.name) return;

			if (property.name === "FLAT_LIGHT_CONTROL")
			{
				const onElement = property.switches.find(
					(sw) => sw.name === "FLAT_LIGHT_ON",
				);
				if (onElement)
				{
					setIsLightOn(onElement.state === ISState.ISS_ON);
				}
			}
			else if (property.name === "FLAT_LIGHT_INTENSITY")
			{
				const intensityElement = property.numbers.find(
					(num) => num.name === "FLAT_LIGHT_INTENSITY_VALUE",
				);
				if (intensityElement)
				{
					setLightIntensity(intensityElement.value);
					setIntensity(intensityElement.value);
				}
			}
		},
		[lightBox],
	);

	/**
	 * Initialize dome properties
	 */
	const initializeDomeProperties = useCallback(() =>
	{
		if (isEmpty(dome)) return;

		// Initialize shutter state
		const shutterProperty = dome.getProperty("DOME_SHUTTER");
		if (shutterProperty)
		{
			setShutterMotionState(shutterProperty.state);
			const shutterOpenElement = shutterProperty.switches.find(
				(sw) => sw.name === "SHUTTER_OPEN",
			);
			if (shutterOpenElement)
			{
				setIsShutterOpen(shutterOpenElement.state === ISState.ISS_ON);
			}
		}

		// Initialize slaving state
		const slavingProperty = dome.getProperty("DOME_AUTOSYNC");
		if (slavingProperty)
		{
			const slavingElement = slavingProperty.switches.find(
				(sw) => sw.name === "DOME_AUTOSYNC_ENABLE",
			);
			if (slavingElement)
			{
				setIsSlaving(slavingElement.state === ISState.ISS_ON);
			}
		}

		// Initialize park state
		const parkProperty = dome.getProperty("DOME_PARK");
		if (parkProperty)
		{
			setDomeParkState(parkProperty.state);
			const parkElement = parkProperty.switches.find(
				(sw) => sw.name === "PARK",
			);
			if (parkElement)
			{
				setIsDomeParked(parkElement.state === ISState.ISS_ON);
			}

			// We no longer need to initialize roof animation as it's handled by the DomeVisualization component
		}

		// Initialize azimuth
		const azimuthProperty = dome.getProperty("ABS_DOME_POSITION");
		if (azimuthProperty)
		{
			const azimuthElement = azimuthProperty.numbers.find(
				(num) => num.name === "DOME_ABSOLUTE_POSITION",
			);
			if (azimuthElement)
			{
				setDomeAzimuth(azimuthElement.value);
			}
		}

		// Initialize dome measurements
		const measurementsProperty = dome.getProperty("DOME_MEASUREMENTS");
		if (measurementsProperty)
		{
			const radiusElement = measurementsProperty.numbers.find(
				(num) => num.name === "DM_DOME_RADIUS",
			);
			const shutterWidthElement = measurementsProperty.numbers.find(
				(num) => num.name === "DM_SHUTTER_WIDTH",
			);

			if (radiusElement && shutterWidthElement)
			{
				const radius = radiusElement.value;
				const shutterWidth = shutterWidthElement.value;
				const angularWidth = calculateAngularWidth(radius, shutterWidth);

				setDomeAngularWidth(angularWidth);
			}
		}
	}, [dome, isDomeParked]);

	/**
	 * Initialize cap properties
	 */
	const initializeCapProperties = useCallback(() =>
	{
		if (isEmpty(cap)) return;

		// Initialize park state
		const parkProperty = cap.getProperty("CAP_PARK");
		if (parkProperty)
		{
			setCapParkState(parkProperty.state);
			const parkElement = parkProperty.switches.find(
				(sw) => sw.name === "PARK",
			);
			if (parkElement)
			{
				setIsCapParked(parkElement.state === ISState.ISS_ON);
			}
		}
	}, [cap]);

	/**
	 * Initialize lightbox properties
	 */
	const initializeLightBoxProperties = useCallback(() =>
	{
		if (isEmpty(lightBox)) return;

		// Initialize light state
		const lightControlProperty = lightBox.getProperty("FLAT_LIGHT_CONTROL");
		if (lightControlProperty)
		{
			const onElement = lightControlProperty.switches.find(
				(sw) => sw.name === "FLAT_LIGHT_ON",
			);
			if (onElement)
			{
				setIsLightOn(onElement.state === ISState.ISS_ON);
			}
		}

		// Initialize intensity
		const intensityProperty = lightBox.getProperty("FLAT_LIGHT_INTENSITY");
		if (intensityProperty)
		{
			setHasLightIntensity(true);
			const intensityElement = intensityProperty.numbers.find(
				(num) => num.name === "FLAT_LIGHT_INTENSITY_VALUE",
			);
			if (intensityElement)
			{
				setLightIntensity(intensityElement.value);
				setIntensity(intensityElement.value);
			}
		}
		else
		{
			setHasLightIntensity(false);
		}
	}, [lightBox]);

	/**
	 * Set up event listeners for property updates
	 */
	useEffect(() =>
	{
		// Initialize properties
		initializeDomeProperties();
		initializeCapProperties();
		initializeLightBoxProperties();

		// Set up event listeners
		if (!isEmpty(dome))
		{
			Reactor.addEventListener(
				"propertyUpdate",
				onDomePropertyUpdate,
				dome,
				domeUUID,
			);
			Reactor.addEventListener(
				"propertyDefined",
				initializeDomeProperties,
				dome,
				domeUUID,
			);
		}

		if (!isEmpty(cap))
		{
			Reactor.addEventListener(
				"propertyUpdate",
				onCapPropertyUpdate,
				cap,
				capUUID,
			);
			Reactor.addEventListener(
				"propertyDefined",
				initializeCapProperties,
				cap,
				capUUID,
			);
		}

		if (!isEmpty(lightBox))
		{
			Reactor.addEventListener(
				"propertyUpdate",
				onLightBoxPropertyUpdate,
				lightBox,
				lightBoxUUID,
			);
			Reactor.addEventListener(
				"propertyDefined",
				initializeLightBoxProperties,
				lightBox,
				lightBoxUUID,
			);
		}

		// Clean up event listeners
		return () =>
		{
			Reactor.removeEventListener("propertyUpdate", domeUUID);
			Reactor.removeEventListener("propertyDefined", domeUUID);
			Reactor.removeEventListener("propertyUpdate", capUUID);
			Reactor.removeEventListener("propertyDefined", capUUID);
			Reactor.removeEventListener("propertyUpdate", lightBoxUUID);
			Reactor.removeEventListener("propertyDefined", lightBoxUUID);
		};
	}, [
		dome,
		cap,
		lightBox,
		onDomePropertyUpdate,
		onCapPropertyUpdate,
		onLightBoxPropertyUpdate,
		initializeDomeProperties,
		initializeCapProperties,
		initializeLightBoxProperties,
	]);

	const toggleSlaving = (enable) =>
	{
		if (isEmpty(dome)) return;
		dispatch(dome.toggleSlaving(enable));
	};

	const toggleShutter = (open) =>
	{
		if (isEmpty(dome)) return;
		dispatch(dome.toggleShutter(open));
	};

	const gotoAZ = (azimuth) =>
	{
		dispatch(dome.gotoAzimuth(Number(azimuth)));
	};

	const abort = () =>
	{
		if (isEmpty(dome)) return;
		dispatch(dome.abort());
	};

	const toggleCapPark = (park) =>
	{
		dispatch(cap.togglePark(park));
	};

	const toggleDomePark = (park) =>
	{
		dispatch(dome.togglePark(park));
	};

	const toggleLight = (on) =>
	{
		dispatch(lightBox.toggleLight(on));
	};

	// We've removed the renderDomeVisualization function since we're now using the DomeVisualization component

	if (isEmpty(dome) && isEmpty(cap) && isEmpty(lightBox)) return null;

	return (
		<Box sx={LOCAL_STYLES.collapseBodyContainer}>
			{/* Dome Section */}
			{!isEmpty(dome) && (
				<Box sx={{ padding: "5px" }}>
					<Typography sx={LOCAL_STYLES.sectionTitle}>
						{s.ekos.collapse_dome.dome || "Dome"}
					</Typography>
					<Box
						sx={{
							flexDirection: "column",
							flex: 1,
						}}
					>
						<Box sx={LOCAL_STYLES.groupContainer}>
							{/* Dome Controls */}
							<Box sx={{ display: "flex", flexDirection: "row", flex: 1 }}>
								<Box sx={{ flex: 0.3 }}>
									{/* Dome Park/Unpark */}
									<Box sx={[LOCAL_STYLES.row, LOCAL_STYLES.collapseFormGroup]}>
										<Typography sx={LOCAL_STYLES.collapseLabel}>
											{s.statuses.Parking}
										</Typography>
										<Box sx={{ flex: 1 }}>
											<CustomizedSwitch
												isBusy={domeParkState === IPState.IPS_BUSY}
												options={[
													{ label: s.general.parked, value: true },
													{ label: s.general.unparked, value: false },
												]}
												value={isDomeParked}
												onChange={toggleDomePark}
												width="300px"
											/>
										</Box>
									</Box>

									{/* Dome Slaving */}
									{!isEmpty(dome) && dome.canGoto() && !isEmpty(mount) && (
										<Box
											sx={[LOCAL_STYLES.row, LOCAL_STYLES.collapseFormGroup]}
										>
											<Typography sx={LOCAL_STYLES.collapseLabel}>
												{s.ekos.collapse_dome.dome_slaving}
											</Typography>
											<Box sx={{ flex: 1 }}>
												<CustomizedSwitch
													isBusy={false} // Slaving doesn't have a busy state currently
													options={[
														{ label: s.general.enable, value: true },
														{ label: s.general.disable, value: false },
													]}
													value={isSlaving}
													onChange={toggleSlaving}
													width="300px"
												/>
											</Box>
										</Box>
									)}

									{/* Dome Shutter */}
									{!isEmpty(dome) && dome.hasShutter() && (
										<Box
											sx={[LOCAL_STYLES.row, LOCAL_STYLES.collapseFormGroup]}
										>
											<Typography sx={LOCAL_STYLES.collapseLabel}>
												{s.ekos.collapse_dome.shutter}
											</Typography>
											<Box sx={{ flex: 1 }}>
												<CustomizedSwitch
													isBusy={shutterMotionState === IPState.IPS_BUSY}
													options={[
														{ label: s.general.opened, value: true },
														{ label: s.general.closed, value: false },
													]}
													value={isShutterOpen}
													onChange={toggleShutter}
													width="300px"
												/>
											</Box>
										</Box>
									)}

									{/* Dome Azimuth */}
									{!isEmpty(dome) && dome.canGoto() && (
										<Box
											sx={[LOCAL_STYLES.row, LOCAL_STYLES.collapseFormGroup]}
										>
											<Typography sx={LOCAL_STYLES.collapseLabel}>
												{s.general.azimuth}
											</Typography>
											<NumericControl
												disabled={isDomeParked}
												initialValue={domeAzimuth}
												onChange={(val) => gotoAZ(val)}
												customLimit={[0, 359]}
												steps={[1, 1]}
												width="150px"
											/>
										</Box>
									)}
								</Box>

								<Box
									sx={{
										flex: 0.3,
										alignItems: "center",
									}}
								>
									{/* Stop Button */}
									<Box sx={LOCAL_STYLES.stopButtonContainer}>
										<Box>
											<Button sx={LOCAL_STYLES.stopButton} onClick={abort}>
												{/* <Box sx={LOCAL_STYLES.stopButtonInner} /> */}
												<StopCircleIcon
													sx={{ color: "#fff", fontSize: "40px" }}
												/>
											</Button>
											<Typography sx={LOCAL_STYLES.stopButtonText}>
												{s.general.stop}
											</Typography>
										</Box>
									</Box>
									{/* Dome Visualization */}
									<Box sx={LOCAL_STYLES.domeVisualizationRow}>
										<DomeVisualization
											dome={dome}
											isDomeParked={isDomeParked}
											isShutterOpen={isShutterOpen}
											domeAzimuth={domeAzimuth}
											domeAngularWidth={domeAngularWidth}
											domeParkState={domeParkState}
											shutterMotionState={shutterMotionState}
											isDomeMoving={isDomeMoving}
											busyIndicatorStyle={busyIndicatorStyle}
											styles={LOCAL_STYLES}
										/>
									</Box>
								</Box>
							</Box>
						</Box>
					</Box>
				</Box>
			)}

			<Box sx={{ flexDirection: "column", flex: 0.3, marginLeft: "20px" }}>
				{/* Light Box Section */}
				{!isEmpty(lightBox) && (
					<Box sx={{ flexDirection: "column" }}>
						<Typography sx={LOCAL_STYLES.sectionTitle}>
							{s.ekos.collapse_dome.light_box || "Light Box"}
						</Typography>
						<Box sx={LOCAL_STYLES.groupContainer}>
							<Box sx={[LOCAL_STYLES.row, { justifyContent: "space-between" }]}>
								{/* Light Circle Visualization */}
								<Box sx={LOCAL_STYLES.lightControlContainer}>
									<Button
										sx={LOCAL_STYLES.lightControlTouchable}
										onClick={() =>
										{
											toggleLight(!isLightOn);
										}}
									>
										<Box
											sx={[
												LOCAL_STYLES.lightControlOuter,
												isLightOn
													? { border: `2px solid ${Palette.orange}` }
													: { border: "2px solid #666" },
											]}
										>
											{isLightOn && (
												<Box
													sx={[
														LOCAL_STYLES.lightControlInner,
														{ backgroundColor: Palette.orange },
													]}
												/>
											)}
										</Box>
									</Button>
									<Box>
										<Typography sx={LOCAL_STYLES.lightStatusText}>
											{isLightOn ? s.general.on : s.general.off}
										</Typography>
										{isLightOn && hasLightIntensity && (
											<Typography sx={LOCAL_STYLES.intensityText}>
												{lightIntensity ? lightIntensity.toFixed(0) : "0"}
											</Typography>
										)}
									</Box>
								</Box>

								{/* Light Controls */}
								<Box sx={LOCAL_STYLES.intensityControlContainer}>
									<Box sx={LOCAL_STYLES.collapseFormGroup}>
										<CustomizedSwitch
											isBusy={false} // Light box doesn't have a busy state currently
											options={[
												{ label: s.general.on || "On", value: true },
												{ label: s.general.off || "Off", value: false },
											]}
											value={isLightOn}
											onChange={toggleLight}
											width="250px"
										/>
									</Box>

									{hasLightIntensity && (
										<Box sx={LOCAL_STYLES.intensityControls}>
											<Typography sx={LOCAL_STYLES.intensityLabel}>
												{s.ekos.collapse_dome.light_intensity ||
													"Light Intensity"}
											</Typography>

											<NumericControl
												disabled={!isLightOn}
												initialValue={intensity}
												onChange={(val) =>
												{
													setIntensity(val);
													dispatch(lightBox.setIntensity(Number(val)));
												}}
												minValue={0}
												maxValue={255}
												totalWidth="150px"
											/>
										</Box>
									)}
								</Box>
							</Box>
						</Box>
					</Box>
				)}

				{/* Dust Cap Section */}
				{!isEmpty(cap) && (
					<Box sx={{ flexDirection: "column" }}>
						<Typography sx={LOCAL_STYLES.sectionTitle}>
							{s.ekos.collapse_dome.cap || "Cap"}
						</Typography>
						<Box sx={LOCAL_STYLES.groupContainer}>
							<Box sx={[LOCAL_STYLES.row, { justifyContent: "space-between" }]}>
								{/* Cap Visualization */}
								<Box style={LOCAL_STYLES.capVisualContainer}>
									<Button
										sx={[
											LOCAL_STYLES.capOuterRing,
											isCapParked
												? { border: `2px solid ${Palette.orange}` }
												: { border: "2px solid #666" },
										]}
										onClick={toggleCapPark}
									>
										{isCapParked ? (
											<Box
												sx={[
													LOCAL_STYLES.capClosed,
													{ backgroundColor: "rgba(255, 102, 0, 0.5)" },
												]}
											/>
										) : (
											<Box
												sx={[
													LOCAL_STYLES.capOpen,
													{ border: "2px solid #666" },
												]}
											/>
										)}

										{/* Busy state indicator */}
										{capParkState === IPState.IPS_BUSY && (
											<animated.div style={busyIndicatorStyle} />
										)}
									</Button>
									<Typography style={LOCAL_STYLES.capStatusText}>
										{capParkState === IPState.IPS_BUSY
											? ""
											: isCapParked
												? s.general.parked
												: s.general.unparked}
									</Typography>
								</Box>

								{/* Cap Controls */}
								<Box style={LOCAL_STYLES.capControlContainer}>
									<CustomizedSwitch
										isBusy={capParkState === IPState.IPS_BUSY}
										options={[
											{ label: s.general.parked, value: true },
											{ label: s.general.unparked, value: false },
										]}
										value={isCapParked}
										onChange={toggleCapPark}
										width="300px"
									/>
								</Box>
							</Box>
						</Box>
					</Box>
				)}
			</Box>
		</Box>
	);
};

export default memo(ObservatoryModern);
