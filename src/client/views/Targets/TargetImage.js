import React, { memo, useEffect, useRef, useState } from "react";
import { get, isEmpty, isEqual } from "lodash";
import { useDispatch, useSelector, useStore } from "react-redux";
import Image from "mui-image";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Grid from "@mui/material/Grid";
import Modal from "@mui/material/Modal";
import Typography from "@mui/material/Typography";
import { px, styles } from "../../shared/styles";
import { Palette } from "@common/shared/common/styles";
import { deviceType } from "@indi/enums";
import FOVOverlay from "./FOVOverlay";
import {
	LevelsMap,
	range360,
	rangeDec,
	toDMS,
	toHMS,
} from "@common/shared/common/common";
import {
	indiActions,
	mountActions,
	schedulerActions,
	targetsActions,
} from "@redux/actions";
import {
	elementAttributeSelector,
	propertySelector,
	selectMountStatus,
	selectCurrentFOVProfile,
	selectCurrentFramingTarget,
	selectFramingObjects,
	selectConnectionOnline,
} from "@redux/selectors";
import commands from "@commands";
import AlertDialog from "../../Components/AlertDialog";
import s from "@common/shared/i18n/i18n";
import Icon from "../../Components/Icon";
import SliderComponent from "../../Components/Slider";

const TargetImage = ({ imageSource, targetInfo, solve, preview }) =>
{
	// Size of the target image
	const imageWidth = 200;
	const imageHeight = 200;

	const dispatch = useDispatch();
	const store = useStore();
	const modalImageSize = Math.min(window.innerWidth, window.innerHeight);
	const boxRef = useRef(null);

	const mountStatus = useSelector(selectMountStatus, isEqual);

	const currentFOVProfile = useSelector(selectCurrentFOVProfile);
	// Use shallow equal so that selector is updated when the fovProfiles array is UPDATED.
	const selectedFOVProfile = useSelector(
		(state) =>
			state.targets.fovProfiles.find(
				(oneFOV) => oneFOV.name === currentFOVProfile,
			),
		isEqual,
	);
	const [zoomLevel, setZoomLevel] = useState(20000);
	const [zoomFOV, setZoomFOV] = useState(87.9);
	const [frameSource, setFrameSource] = useState(imageSource);
	const currentFramingTarget = useSelector(selectCurrentFramingTarget);
	const framingObjects = useSelector(selectFramingObjects);
	// Is Ekos online now?
	const ekosRunning = useSelector(selectConnectionOnline);

	const [showFramingAssistant, setShowFramingAssistant] = useState(false);
	const [pa, setPA] = useState(0);
	const [translation, setTranslation] = useState({ x: 0, y: 0 });
	const [pixelScale, setPixelScale] = useState({ x: 1, y: 1 });
	const [fovTranslation, setFovTranslation] = useState({ x: 0, y: 0 });
	const [targetOffset, setTargetOffset] = useState(0);
	const [goRequested, setGoRequested] = useState(false);
	const [rotateRequested, setRotateRequested] = useState(false);
	const [offset, setOffset] = useState(0);
	const [offsetColor, setOffsetColor] = useState("green");
	const [offsetIcon, setOffsetIcon] = useState("rotate-right");
	const [controlType, setControlType] = useState("manual");
	const [borderColor, setBorderColor] = useState(Palette.grey44);
	const [progress, setProgress] = useState(0);
	const [showAlert, setShowAlert] = useState(false);

	const [isDragging, setIsDragging] = useState(false);
	const [startPosition, setStartPosition] = useState(null);

	const handleMouseDown = (e) =>
	{
		setIsDragging(true);
		setStartPosition({
			x: e.clientX - translation.x,
			y: e.clientY - translation.y,
		});
	};

	const handleMouseUp = () =>
	{
		setIsDragging(false);
	};

	const handleMouseMove = (e) =>
	{
		if (isDragging)
		{
			const newX = e.clientX - startPosition.x;
			const newY = e.clientY - startPosition.y;

			setTranslation({ x: newX, y: newY });
		}
	};

	// Equatorial Coordinates Offset
	const [targetCoords, setTargetCoords] = useState({
		targetRA: targetInfo.ra0,
		targetDE: targetInfo.de0,
	});

	// Selectors
	const rotators = useSelector(
		(state) =>
			state.indi.devices.filter((device) => device.type === deviceType.ROTATOR),
		isEqual,
	);
	const alignState = useSelector((state) => state.status.align.status, isEqual);

	const rotatorProperty = useSelector((state) =>
		propertySelector(state, {
			device: isEmpty(rotators) ? "" : rotators[0].name,
			property: "ABS_ROTATOR_ANGLE",
		}),
	);

	const rotatorAngle = useSelector((state) =>
		elementAttributeSelector(state, {
			device: isEmpty(rotators) ? "" : rotators[0].name,
			property: "ABS_ROTATOR_ANGLE",
			element: "ANGLE",
			attribute: "value",
		}),
	);

	const adjustCoordinate = () =>
	{
		// Compute the declination of the tile row from the mosaic center
		const newDE = targetInfo.de0 + translation.y * pixelScale.y;
		// Adjust RA based on the shift in declination
		const sphericalX = (1 / Math.cos((newDE * Math.PI) / 180)) * pixelScale.x;
		//const sphericalX = pixelScale.x;
		// Return the adjusted coordinates in degrees
		return {
			raFactor: sphericalX * translation.x,
			deFactor: pixelScale.y * translation.y,
		};
	};

	/**
	 * Adjust RA/DE JNow coordinates when user drags the FOV around.
	 */
	useEffect(() =>
	{
		const factor = adjustCoordinate();
		const newTargetRA = range360(targetInfo.ra0 * 15 - factor.raFactor);
		const newTargetDE = rangeDec(targetInfo.de0 - factor.deFactor);
		setTargetCoords({ targetRA: newTargetRA / 15, targetDE: newTargetDE });
	}, [translation, pixelScale]);

	const getFOVForZoom = (zoom) =>
	{
		for (const oneLevel of LevelsMap)
		{
			if (oneLevel.zoom === zoom) return oneLevel.fov;
		}

		// Default
		return 87.9;
	};

	const zoomIn = () =>
	{
		const zoomIndex = LevelsMap.findIndex(
			(oneLevel) => oneLevel.zoom === zoomLevel,
		);
		if (zoomIndex >= 0)
		{
			const nextIndex = zoomIndex + 1;
			if (nextIndex < LevelsMap.length)
			{
				const previousFOV = LevelsMap[zoomIndex].fov;
				const nextFOV = LevelsMap[nextIndex].fov;
				const factor = previousFOV / nextFOV;
				const newX = translation.x * factor;
				const newY = translation.y * factor;
				setTranslation({ x: newX, y: newY });
				setZoomLevel(LevelsMap[nextIndex].zoom);
			}
		}
	};

	const zoomOut = () =>
	{
		const zoomIndex = LevelsMap.findIndex(
			(oneLevel) => oneLevel.zoom === zoomLevel,
		);
		if (zoomIndex >= 0)
		{
			const nextIndex = zoomIndex - 1;
			if (nextIndex >= 0)
			{
				const previousFOV = LevelsMap[zoomIndex].fov;
				const nextFOV = LevelsMap[nextIndex].fov;
				const factor = previousFOV / nextFOV;
				const newX = translation.x * factor;
				const newY = translation.y * factor;
				setTranslation({ x: newX, y: newY });
				setZoomLevel(LevelsMap[nextIndex].zoom);
			}
		}
	};

	useEffect(() =>
	{
		setZoomFOV(getFOVForZoom(zoomLevel));
		if (currentFramingTarget === targetInfo.name)
		{
			const framedObject =
				framingObjects[
					LevelsMap.findIndex((oneLevel) => oneLevel.zoom === zoomLevel)
				];
			if (framedObject)
			{
				const preview = get(framedObject, "metadata.preview", null);
				let uri = null;
				if (preview) uri = preview;
				else if (framedObject.image) uri = framedObject.image;
				setFrameSource({ priority: "high", uri: uri });
			}
			else setFrameSource(imageSource);
		}
	}, [zoomLevel, framingObjects, showFramingAssistant]);

	useEffect(() =>
	{
		setPixelScale({
			x: zoomFOV / 60 / modalImageSize,
			y: zoomFOV / 60 / modalImageSize,
		});
	}, [zoomFOV]);

	// Whenever the full screen view is toggled, sync the current rotation to the selected FOV
	// profile rotation if possible.
	// Calculate difference between target and current angles
	useEffect(() =>
	{
		if (showFramingAssistant)
		{
			// Sync FOV rotation to FOV rotation.
			if (
				(!isEmpty(selectedFOVProfile) && selectedFOVProfile.pa !== 0) ||
				pa > 360
			)
			{
				setPA(get(selectedFOVProfile, "pa", 0));
				setPixelScale({
					x: zoomFOV / 60 / modalImageSize,
					y: zoomFOV / 60 / modalImageSize,
				});
			}

			// If there is no translation, then sync the target RA/DE to mount RA/DE
			if (translation.x === 0 && translation.y === 0)
			{
				setTargetCoords({ targetRA: targetInfo.ra0, targetDE: targetInfo.de0 });
			}

			// If the framing target is not us, let's fetch
			if (currentFramingTarget !== targetInfo.name)
			{
				setTranslation({ x: 0, y: 0 });
				setFovTranslation({ x: 0, y: 0 });
				dispatch(targetsActions.clearFramingObjects());
				dispatch(targetsActions.setFramingTarget(targetInfo.name));
				dispatch(
					targetsActions.getObjectsImage({
						names: [targetInfo.name],
						zoom: 10000,
					}),
				);
				dispatch(
					targetsActions.getObjectsImage({
						names: [targetInfo.name],
						zoom: 15000,
					}),
				);
				dispatch(
					targetsActions.getObjectsImage({
						names: [targetInfo.name],
						zoom: 20000,
					}),
				);
				dispatch(
					targetsActions.getObjectsImage({
						names: [targetInfo.name],
						zoom: 25000,
					}),
				);
			}
			else
			{
				const framedObject =
					framingObjects[
						LevelsMap.findIndex((oneLevel) => oneLevel.zoom === zoomLevel)
					];
				if (framedObject)
					setFrameSource({
						priority: "high",
						uri: get(framedObject, "metadata.preview", frameSource?.uri),
					});
			}
		}
	}, [showFramingAssistant]);

	useEffect(() =>
	{
		if (!isEmpty(selectedFOVProfile))
		{
			const profilePA = get(selectedFOVProfile, "pa", null);

			if (profilePA)
			{
				let diff = profilePA - pa;
				while (diff < -180) diff += 180;
				while (diff > 180) diff -= 180;

				const absDiff = Math.abs(diff);
				if (absDiff > 10) setOffsetColor("red");
				else if (absDiff > 2) setOffsetColor("yellow");
				else setOffsetColor("green");

				if (absDiff < 1)
				{
					diff = 0;
					setOffsetIcon("check");
					setBorderColor(Palette.green);
				}
				else if (diff >= 0) setOffsetIcon("rotate-right");
				else setOffsetIcon("rotate-left");

				setOffset(diff);
			}
		}
	}, [pa, selectedFOVProfile]);

	// Update progress bar if align state is in progress
	useEffect(() =>
	{
		const intervalID = setInterval(() =>
		{
			if (alignState === "In Progress")
			{
				if (progress < 100) setProgress(progress + 10);
				else setProgress(0);
			}
			else
			{
				if (alignState === "Complete")
				{
					setFovTranslation(translation);
				}
				clearInterval(intervalID);
				if (alignState === "Idle") setBorderColor(Palette.grey44);
				else if (alignState === "Complete") setBorderColor(Palette.green);
				else setBorderColor(Palette.red);
			}
		}, 250);

		// else
		//     clearInterval(intervalID);

		return () =>
		{
			clearInterval(intervalID);
		};
	}, [alignState]);

	/**
	 * Check if we reached target angle.
	 */
	useEffect(() =>
	{
		// If we reached target angle, solve
		if (rotateRequested && Math.abs(rotatorAngle - targetOffset) < 1)
		{
			setRotateRequested(false);
			setBorderColor(Palette.yellow);
			setTimeout(() => solve(2), 1000);
		}
	}, [rotateRequested, rotatorAngle]);

	const rotate = () =>
	{
		const newOffset = range360(rotatorAngle - offset);
		setTargetOffset(newOffset);
		rotatorProperty.setElementTargetValue("ANGLE", newOffset);
		setRotateRequested(true);
		setBorderColor(Palette.magenta);
		dispatch(
			indiActions.sendDeviceProperty(
				rotators[0].name,
				rotatorProperty.name,
				rotatorProperty.numbers.map((oneElement) => ({
					name: oneElement.name,
					value: oneElement.targetValue,
				})),
			),
		);
	};

	/**
	 * If image fails to load then it probably means the server does not have it cached
	 * so we ask server to get it from KStars.
	 */
	const handleImageLoadError = () =>
	{
		dispatch(targetsActions.getObjectsImage({ names: [targetInfo.name] }));
	};

	/**
	 * Check if mount completed slewing to target.
	 */
	useEffect(() =>
	{
		if (goRequested && mountStatus === "Tracking")
		{
			// Slew To Target solving after 1 second.
			setTimeout(() =>
			{
				// Double check everything is OK before proceeding
				if (mountStatus === "Tracking")
				{
					setGoRequested(false);

					// Do we need to rotate now?
					if (offset !== 0 && controlType === "automatic") rotate();
					// If not, let's proceed to solving
					else
					{
						setBorderColor(Palette.yellow);
						setTimeout(() => solve(1), 1000);
					}
				}
			}, 1500);
		}
	}, [goRequested, mountStatus]);

	const goCoordinates = () =>
	{
		setGoRequested(true);
		setBorderColor(Palette.magenta);
		dispatch(mountActions.unpark());
		dispatch(
			mountActions.gotoRADE(
				toHMS(targetCoords.targetRA * 15),
				toDMS(targetCoords.targetDE),
				true,
			),
		);
	};

	const handleGOTORotate = () =>
	{
		// Do we need to GOTO first?
		// Allow for some margin if we rotate slightly it will most likely adjust RA/DE slightly
		// which we can ignore

		const ra0 = store.getState().status.mount.ra0 / 15;
		const de0 = store.getState().status.mount.de0;
		if (
			Math.abs(ra0 - targetCoords.targetRA) > 0.01 ||
			Math.abs(de0 - targetCoords.targetDE) > 0.01
		)
		{
			goCoordinates();
		}
		else if (offset !== 0)
		{
			if (controlType === "automatic") rotate();
			else
			{
				solve(2);
			}
		}
	};

	const handleSchedule = () =>
	{
		dispatch(
			targetsActions.setSelectedTarget({
				ra0: targetCoords.targetRA,
				de0: targetCoords.targetDE,
				name: targetInfo.name,
			}),
		);
		// Only set PA if the rotation is not set to ignore
		if (controlType !== "ignore")
			dispatch(schedulerActions.setAllSettings({ positionAngleSpin: pa }));

		dispatch({
			type: commands.NEW_NOTIFICATION,
			payload: {
				severity: 1,
				uuid: "",
				message: targetInfo.name + " added to Scheduler.",
			},
		});
	};

	return (
		<>
			{/* Framing Assistance Modal */}
			<Modal
				onClose={() => setShowFramingAssistant(false)}
				open={showFramingAssistant}
				aria-labelledby="modal-modal-title"
				aria-describedby="modal-modal-description"
			>
				<Grid container sx={LOCAL_STYLES.framingAssistantContainer}>
					<Button
						sx={[LOCAL_STYLES.closeButton]}
						onClick={() => setShowFramingAssistant(false)}
					>
						<Icon name="Close" size={25} color={Palette.white} />
					</Button>

					<Grid
						item
						sx={[
							styles.center,
							{
								display: "flex",
								flexDirection: "column",
								flex: 0.15,
								gap: "15px",
							},
						]}
					>
						{/* Left Side: Zoom In */}
						<Button
							onClick={zoomIn}
							sx={{
								width: "75px",
								height: "75px",
								backgroundColor: Palette.grey44,
							}}
						>
							<Icon color={Palette.white70} size={50} name="add" />
						</Button>
						{/* Left Side: Zoom Out */}
						<Button
							onClick={zoomOut}
							sx={{
								width: "75px",
								height: "75px",
								backgroundColor: Palette.grey44,
							}}
						>
							<Icon color={Palette.white70} size={50} name="remove" />
						</Button>
					</Grid>

					<Grid item sx={{ flex: 0.5 }}>
						{!isEmpty(selectedFOVProfile) ? (
							<div
								onMouseDown={handleMouseDown}
								onMouseUp={handleMouseUp}
								onMouseMove={handleMouseMove}
								style={{
									display: "flex",
									position: "absolute",
									width: window.innerWidth / 1.5,
									height: window.innerHeight - 10,
									zIndex: 6,
									elevation: 6,
									justifyContent: "center",
									alignItems: "center",
								}}
							>
								<Box
									sx={{
										// calculates the width and height from the fov profile data and fov width from metadata
										width:
											(window.innerWidth / 1.5) *
											px *
											(selectedFOVProfile?.fovW / zoomFOV),
										height:
											(window.innerHeight - 10) *
											(selectedFOVProfile?.fovH / zoomFOV),
										opacity: 0.7,
										border: `2px solid ${Palette.userinput}`,
										borderBottom: `2px solid ${Palette.orange}`,
										transform: `translate(${translation.x}px, ${translation.y}px) rotate(${pa}deg)`,
									}}
								/>
							</div>
						) : null}

						{/* FOV overlay */}
						{!isEmpty(selectedFOVProfile) ? (
							<FOVOverlay
								fovData={selectedFOVProfile}
								fovWidth={zoomFOV}
								fovHeight={zoomFOV}
								imageWidth={(window.innerWidth / 1.5) * px}
								imageHeight={window.innerHeight - 10}
								translation={fovTranslation}
								fullscreen
							/>
						) : // </Box>
						null}
						<Box ref={boxRef} sx={[styles.center]}>
							<Image
								height={window.innerHeight - 10}
								width={(window.innerWidth / 1.5) * px}
								duration={0}
								onError={handleImageLoadError}
								src={get(frameSource, "uri", "")}
								style={{
									borderRadius: "5px",
									border: `1px solid ${borderColor}`,
								}}
							/>
						</Box>
					</Grid>

					{/* Right Side: Controls */}
					<Grid
						item
						sx={{
							padding: "16px",
							zIndex: 5,
							flexDirection: "column",
							alignItems: "center",
							flex: 0.3,
						}}
					>
						{/* 1. Label: Object Name */}
						<Typography
							sx={[styles.h2, { color: Palette.white70, paddingBlock: "30px" }]}
						>
							{targetInfo.name}
						</Typography>

						{/**** Rotation Part ******/}
						<Box sx={{ display: "flex", flexDirection: "column", gap: "15px" }}>
							<Typography sx={[styles.h2, { color: Palette.orange }]}>
								{s.general.rotation}
							</Typography>
							{/* 2. Automatic vs Manual Switcher */}
							<Box
								sx={[
									styles.row,
									{
										alignItems: "center",
										justifyContent: "center",
										gap: "20px",
									},
								]}
							>
								<Button
									sx={{
										backgroundColor:
											controlType === "automatic"
												? Palette.orange
												: Palette.grey44,
										color: Palette.white70,
									}}
									onClick={() => setControlType("automatic")}
									disabled={rotators.length === 0}
								>
									{s.general.automatic}
								</Button>
								<Button
									sx={{
										backgroundColor:
											controlType === "manual"
												? Palette.orange
												: Palette.grey44,
										color: Palette.white70,
									}}
									onClick={() => setControlType("manual")}
								>
									{s.general.manual}
								</Button>
							</Box>

							{/* 3. Target Position Angle Slider */}
							<Box sx={LOCAL_STYLES.rotationSlider}>
								<Box
									sx={[
										styles.row,
										{
											justifyContent: "space-between",
										},
									]}
								>
									<Typography sx={{ color: Palette.white70 }}>
										{s.targets.target_rotation}
									</Typography>
									<Typography
										sx={{
											color: Palette.white70,
										}}
									>
										{(pa >= 0 ? "+" : "-") +
											Math.abs(pa).toFixed(0).toString().padStart(3, "0")}
									</Typography>
								</Box>
								<SliderComponent
									thumbTintColor={Palette.orange}
									maximumTrackTintColor={Palette.grey66}
									minimumTrackTintColor={Palette.orange}
									value={pa}
									step={1}
									min={-180}
									max={180}
									onChange={(e) => setPA(e.target.value)}
								/>
							</Box>

							{/* 4. Angular Difference */}
							<Box sx={LOCAL_STYLES.offsetContainer}>
								<Box sx={[styles.row, { alignItems: "center", gap: "15px" }]}>
									<Typography
										sx={{
											color: Palette.white70,
										}}
									>
										{s.targets.angular_offset}
									</Typography>
									<Typography
										sx={{
											fontSize: "24px",
											color: offsetColor,
										}}
									>
										{offset.toFixed(0)}
									</Typography>
								</Box>
								<Icon color={offsetColor} size={50} name={offsetIcon} />
							</Box>
						</Box>

						{/**** Rotation Part ******/}
						<Typography
							sx={[
								styles.h2,
								{
									color: Palette.orange,
									padding: "10px",
									margin: "10px",
								},
							]}
						>
							{s.general.center}
						</Typography>
						{/* 5. RA/DE Offset */}
						<Box sx={LOCAL_STYLES.coordinatesContainer}>
							<Box sx={[styles.row, { alignItems: "center", gap: "15px" }]}>
								<Typography
									sx={{
										color: Palette.white70,
										fontSize: "24px",
									}}
								>
									{s.ekos.mount_status_bar.ra}
								</Typography>
								<Typography
									sx={{
										fontSize: "24px",
										color: Palette.white70,
									}}
								>
									{" " + toHMS(targetCoords.targetRA * 15)}
								</Typography>
							</Box>
							<Box sx={[styles.row, { alignItems: "center", gap: "15px" }]}>
								<Typography
									sx={{
										color: Palette.white70,
										fontSize: "24px",
									}}
								>
									{s.ekos.mount_status_bar.de}
								</Typography>
								<Typography
									sx={{
										fontSize: "24px",
										color: Palette.white70,
									}}
								>
									{toDMS(targetCoords.targetDE)}
								</Typography>
							</Box>
						</Box>

						{/* 6. Goto & Rotate & Solve */}
						<Box
							sx={[
								styles.row,
								{
									marginTop: "16px",
									height: "auto",
									gap: "10px",
								},
							]}
						>
							<Button
								sx={[LOCAL_STYLES.btn, { color: Palette.white70 }]}
								onClick={ekosRunning ? handleGOTORotate : handleSchedule}
							>
								{!ekosRunning ? "Schedule" : s.targets.goto_rotate}
							</Button>
							<Button
								sx={{ backgroundColor: Palette.grey44 }}
								onClick={() =>
								{
									setTranslation({ x: 0, y: 0 });
									setTargetCoords({
										targetRA: targetInfo.ra0,
										targetDE: targetInfo.de0,
									});
									setPA(selectedFOVProfile.pa);
									setTargetOffset(0);
									setFovTranslation({ x: 0, y: 0 });
								}}
							>
								<Icon color={Palette.white70} size={30} name="delete" />
							</Button>
						</Box>
					</Grid>
				</Grid>
			</Modal>

			{/* Image Component with FOV */}
			<Button
				onClick={() =>
				{
					if (!isEmpty(selectedFOVProfile))
					{
						setShowFramingAssistant(true);
					}
					else if (!ekosRunning && isEmpty(selectedFOVProfile))
					{
						setShowFramingAssistant(true);
					}
				}}
				sx={{ padding: 0 }}
			>
				{/* FOV overlay */}
				{!isEmpty(selectedFOVProfile) ? (
					<FOVOverlay
						fovData={selectedFOVProfile}
						fovWidth={zoomFOV}
						fovHeight={zoomFOV}
						imageWidth={imageWidth}
						imageHeight={imageHeight}
						translation={{
							x: (fovTranslation.x * imageWidth) / modalImageSize,
							y: (fovTranslation.y * imageHeight) / modalImageSize,
						}}
					/>
				) : null}

				{/* Object Image */}
				<Image
					duration={0}
					src={preview}
					width={imageWidth}
					height={imageHeight}
				/>
			</Button>

			<AlertDialog
				yes
				show={showAlert}
				close={() => setShowAlert(false)}
				title={s.status.info}
				description={s.targets.alert_select_FOV_body}
			/>
		</>
	);
};

const LOCAL_STYLES = {
	framingAssistantContainer: {
		display: "flex",
		backgroundColor: "black",
		flexDirection: "row",
		height: "95vh",
		padding: "10px",
		gap: "10px",
		flexWrap: "nowrap",
	},
	rotationSlider: {
		backgroundColor: Palette.grey33,
		borderRadius: "5px",
		padding: "10px",
		zIndex: 5,
		flexDirection: "column",
	},
	offsetContainer: {
		backgroundColor: Palette.grey33,
		borderRadius: "5px",
		padding: "10px",
		zIndex: 5,
		display: "flex",
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "space-between",
	},
	coordinatesContainer: {
		backgroundColor: Palette.grey33,
		borderRadius: "5px",
		padding: "10px",
		zIndex: 5,
		flexDirection: "column",
	},
	closeButton: {
		position: "absolute",
		right: "20px",
		top: "20px",
		alignItems: "center",
		justifyContent: "center",
		zIndex: 10,
		width: "30px",
		height: "30px",
		backgroundColor: Palette.orange,
		minWidth: "auto",
	},
	btn: {
		backgroundColor: "#ff6600",
		color: "#FFFFFF",
		textTransform: "none",
		width: "175px",
		height: "52px",
		border: "1px solid #2d2d2d",
	},
};

export default memo(TargetImage, isEqual);
