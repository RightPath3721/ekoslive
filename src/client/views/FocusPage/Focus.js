import Button from "@mui/material/Button";
import Grid from "@mui/material/Grid";
import Input from "@mui/material/Input";
import FastForwardIcon from "@mui/icons-material/FastForward";
import LoopIcon from "@mui/icons-material/Loop";
import SettingsIcon from "@mui/icons-material/Settings";
import ImageIcon from "@mui/icons-material/Image";
import { Box } from "@mui/system";
import { get, isEmpty, isEqual } from "lodash";
import React, { useCallback, useEffect, useState, useId } from "react";
import { useDispatch, useSelector } from "react-redux";
import { focusActions, indiActions, opticalTrainActions } from "@redux/actions";
import { numericControls, trainModules, DEVICE_TYPE } from "@indi/enums";
import Dropdown from "../../Components/Dropdown";
import Reactor from "@indi/events";
import s from "@common/shared/i18n/i18n";
import NumericControl from "../../Components/NumericControl";
import { styles } from "../../shared/styles";
import Graph from "./FocusGraph";
import Preset from "./Preset";
import AssistantIcon from "@mui/icons-material/Assistant";
import {
	selectTrainDevice,
	selectFocusStatus,
	selectFocusCurrentPreset,
	selectTargetFocusSettings,
	selectFocusSettings,
} from "@redux/selectors";
import Icon from "@components/Icon";
import BarChartIcon from "@mui/icons-material/BarChart";
import FocusImage from "./FocusImage";
import { Palette } from "@common/shared/common/styles";
import { Stop } from "@mui/icons-material";

const Focus = ({ toggleSettings, toggleOpticalTrain, setShowAdvisor }) =>
{
	const dispatch = useDispatch();

	const activeFocuser = useSelector((state) =>
		selectTrainDevice(state, {
			trainType: trainModules.FocusOpticalTrain,
			deviceType: DEVICE_TYPE.FOCUSER,
		}),
	);
	const focusStatus = useSelector(selectFocusStatus, isEqual);

	const currentPreset = useSelector(selectFocusCurrentPreset);
	const targetFocusSettings = useSelector(selectTargetFocusSettings);
	const focusSettings = useSelector(selectFocusSettings, isEqual);
	const connected = useSelector(
		(state) => state.ekos.connection.connected && state.ekos.connection.online,
	);
	const activeCamera = useSelector((state) =>
		selectTrainDevice(state, {
			trainType: trainModules.FocusOpticalTrain,
			deviceType: DEVICE_TYPE.CAMERA,
		}),
	);
	const id = useId();

	const [isSubscribed, setIsSubscribed] = useState(false);
	const chartData = get(focusStatus, "chart", []);
	const [inProgress, setInProgress] = useState(false);
	const [looping, setLooping] = useState(false);
	const [isAbsoluteFocuser, setIsAbsoluteFocuser] = useState(false);
	const [absolutePosition, setAbsolutePosition] = useState(50000);

	const [exposure, setExposure] = useState(
		isEmpty(focusSettings) ? 0 : focusSettings.focusExposure,
	);

	const [focusTicks, setFocusTicks] = useState(
		isEmpty(focusSettings) ? 0 : focusSettings.focusTicks,
	);

	const [filter, setFilter] = useState(
		isEmpty(focusSettings) ? 0 : focusSettings.focusFilter,
	);
	const [steps, setSteps] = useState(
		isEmpty(focusSettings) && focusSettings.absTicksSpin === null
			? 0
			: focusSettings.absTicksSpin,
	);
	const [payloadState, setPayloadState] = useState({
		targetAbsolutePosition: -1,
	});

	const [state, setState] = useState({
		showSettings: false,
		showGraph: false,
		showImage: false,
	});
	const [showPresetSettings, setShowPresetSettings] = useState(false);

	const { showSettings, showGraph, showImage } = state;

	const focus_loop = () =>
	{
		dispatch(focusActions.setFocusSettings(targetFocusSettings));
		dispatch(focusActions.focus_loop());
		setLooping(true);
	};

	const focus_absolute = (value) =>
	{
		if (!isEmpty(activeFocuser))
		{
			dispatch(activeFocuser.setPosition(value));
		}
	};

	const start = () =>
	{
		dispatch(focusActions.setFocusSettings(targetFocusSettings));
		dispatch(focusActions.start());
	};

	const stop = () =>
	{
		dispatch(focusActions.stop());
		setLooping(false);
	};

	const updatePosition = (device, property) =>
	{
		if (device.name === property.device)
		{
			setAbsolutePosition(property.numbers[0].value);
		}
	};
	/**
	 * Watch for property updates registered in the addEventListener.
	 * @type {(function(*): void)|*}
	 */
	const onPropertyUpdate = useCallback((device, property) =>
	{
		if (property.name === "ABS_FOCUS_POSITION")
			setTimeout(updatePosition, 10, device, property);
	});

	/**
	 * Initializes the steps input on start (which is set to -1 by default).
	 */
	useEffect(() =>
	{
		if (connected && !isEmpty(activeFocuser))
		{
			// Watch property updates
			Reactor.addEventListener(
				"propertyUpdate",
				onPropertyUpdate,
				activeFocuser,
				id,
			);
			try
			{
				dispatch(opticalTrainActions.getAllTrains());
				const isAbsolute = activeFocuser.isAbsoluteFocuser();
				setIsAbsoluteFocuser(isAbsolute);
				const focusPosition = activeFocuser.getPosition();
				setAbsolutePosition(focusPosition);

				if (payloadState.targetAbsolutePosition === -1)
				{
					setPayloadState({
						...payloadState,
						targetAbsolutePosition: isAbsolute === true ? focusPosition : 50000,
					});
				}
			}
			catch
			{}
		}
		else if (!connected)
		{
			setIsSubscribed(false);
		}

		return () =>
		{
			Reactor.removeEventListener("propertyUpdate", id);
		};
	}, [connected, activeFocuser?.name, currentPreset]);

	// if we are not subscribed to focus absolute position, then (permanently) subscribe and set isSubscribed to true
	useEffect(() =>
	{
		if (isSubscribed === false && payloadState.targetAbsolutePosition !== -1)
		{
			if (!isEmpty(activeFocuser))
			{
				dispatch(
					indiActions.subscribeToProperty(
						activeFocuser.name,
						"ABS_FOCUS_POSITION",
						true,
					),
				);
				setIsSubscribed(true);
			}
		}
	}, [payloadState.targetAbsolutePosition]);

	// set settings when changed
	useEffect(() =>
	{
		const payload = {
			focusExposure: exposure,
			focusFilter: filter,
			absTicksSpin: steps,
			focusTicks,
		};
		dispatch(focusActions.setAllSettings(payload));
	}, [exposure, filter, steps, focusTicks]);

	/**
	 * Handles status changes.
	 */
	useEffect(() =>
	{
		let nextProgress = true;
		switch (focusStatus.status) {
			case "Idle":
				nextProgress = false;
				break;
			case "Complete":
				setSteps(absolutePosition);
				nextProgress = false;
				break;
			case "Failed":
				nextProgress = false;
				break;
			case "Aborted":
				nextProgress = false;
				break;

			default:
				break;
		}

		setInProgress(nextProgress);
		if (looping && nextProgress === false) setLooping(false);
	}, [focusStatus.status]);

	return (
		<>
			{showPresetSettings && (
				<Box sx={LOCAL_STYLES.quickSettings}>
					<Preset
						toggleOpticalTrain={toggleOpticalTrain}
						filter={filter}
						setFilter={setFilter}
					/>
				</Box>
			)}
			{showGraph && (
				<Box sx={LOCAL_STYLES.quickSettings}>
					<Graph chartData={chartData} />
				</Box>
			)}

			{showImage && (
				<Box sx={LOCAL_STYLES.quickSettings}>
					<FocusImage />
				</Box>
			)}

			<Box>
				<Box sx={[styles.row]}>
					<Box
						sx={{
							padding: "5px",
						}}
					>
						<Icon name="numbers" size={24} color="#CECECE" />
					</Box>
					<Box>
						<Dropdown
							disabled={true}
							options={[]}
							value={absolutePosition}
							width="120px"
						/>
					</Box>
					<Button
						sx={{
							backgroundColor: Palette.grey33,
							marginLeft: "10px",
							minWidth: "40px",
							height: "40px",
						}}
						onClick={() => setShowAdvisor(true)}
					>
						<AssistantIcon />
					</Button>
				</Box>

				<Box sx={[styles.row, { marginTop: "10px" }]}>
					<Box
						sx={{
							padding: "5px",
						}}
					>
						<Icon name="altimeter" size={24} color="#CECECE" />
					</Box>{" "}
					{isAbsoluteFocuser ? (
						<NumericControl
							initialValue={steps}
							steps={[1000, 1000]}
							customLimit={[0, 500000]}
							onChange={(value) =>
								{
								setSteps(value);
								focus_absolute(value);
							}}
							width="120px"
							size={4}
						/>
					) : (
						<Input
							sx={{
								color: "white",
								backgroundColor: "#1d1d1d",
								width: "125px",
								borderRadius: "4px",
								".MuiInputBase-input": { textAlign: "center" },
							}}
							contentEditable={false}
							value={get(payloadState, "targetAbsolutePosition", 0)}
							disableUnderline
						/>
					)}
				</Box>

				<Box sx={[styles.row, { marginTop: "10px" }]}>
					<Box
						sx={{
							padding: "5px",
						}}
					>
						<Icon name="ruler" size={24} color="#CECECE" />
					</Box>{" "}
					<NumericControl
						device={activeCamera}
						initialValue={focusTicks}
						onChange={(value) =>
						{
							setFocusTicks(value);
						}}
						steps={[100, 100]}
						customLimit={[10, 10000]}
						value={focusTicks}
						width="120px"
						size={4}
					/>
				</Box>
				<Box sx={[styles.row, { marginTop: "10px" }]}>
					<Box
						sx={{
							padding: "5px",
						}}
					>
						<Icon name="camera" size={24} color="#CECECE" />
					</Box>{" "}
					<NumericControl
						device={activeCamera}
						initialValue={exposure}
						type={numericControls.EXPOSURE}
						onChange={(value) =>
						{
							setExposure(value);
						}}
						width="120px"
						value={exposure}
						size={4}
					/>
					<Button
						disabled={(!looping && inProgress) || isEmpty(activeFocuser)}
						onClick={() =>
						{
							inProgress ? stop() : focus_loop();
						}}
						sx={[
							LOCAL_STYLES.imageButton,
							{
								borderRadius: "50%",
								marginLeft: "10px",
								backgroundColor: "#FFFCFA1A",
							},
						]}
					>
						{inProgress ? (
							<Stop sx={{ fontSize: 20, color: Palette.white }} />
						) : (
							<LoopIcon sx={{ color: "#CECECE", fontSize: 20 }} />
						)}
					</Button>
				</Box>

				<Box sx={LOCAL_STYLES.buttonBox}>
					<Box sx={{ display: "flex", flexDirection: "column" }}>
						<Button
							onClick={() =>
							{
								setState({ ...state, showGraph: !showGraph, showImage: false });
							}}
							sx={[
								LOCAL_STYLES.imageButton,
								{ borderRadius: "50%", backgroundColor: "#FFFCFA1A" },
							]}
						>
							<BarChartIcon sx={{ color: "#CECECE", fontSize: 20 }} />
						</Button>
						<Button
							onClick={() =>
							{
								setState({ ...state, showImage: !showImage, showGraph: false });
							}}
							sx={[
								LOCAL_STYLES.imageButton,
								{
									borderRadius: "50%",
									backgroundColor: "#FFFCFA1A",
									marginTop: "10px",
								},
							]}
						>
							<ImageIcon sx={{ color: "#CECECE", fontSize: 20 }} />
						</Button>
					</Box>

					{!isEmpty(activeFocuser) && (
						<Grid sx={[styles.row, LOCAL_STYLES.gridItem]}>
							{inProgress ? (
								<Button
									disabled={!inProgress}
									onClick={() => stop()}
									sx={[
										{
											borderRadius: "50%",
											width: "70px",
											height: "70px",
											border: "2px solid white",
											backgroundColor: inProgress
												? Palette.red
												: "rgba(255, 252, 250, 0.08)",
										},
									]}
								>
									<Stop sx={{ color: Palette.white, fontSize: 50 }} />
								</Button>
							) : (
								<Button
									sx={{
										borderRadius: "50%",
										padding: "12px",
										width: "70px",
										height: "70px",
										backgroundColor: "#FF6600",
										color: Palette.white,
										fontWeight: 400,
										fontSize: "12px",
										border: "2px solid white",
									}}
									onClick={start}
									disabled={inProgress}
								>
									{s.ekos.capture_filters.auto_focus}
								</Button>
							)}
						</Grid>
					)}
					<Box sx={{ display: "flex", flexDirection: "column" }}>
						<Button
							onClick={() =>
							{
								setState({ ...state, showSettings: !showSettings });
								toggleSettings("Focus");
							}}
							sx={[
								LOCAL_STYLES.imageButton,
								{ backgroundColor: "#FFFCFA1A", borderRadius: "50%" },
							]}
						>
							<SettingsIcon sx={{ color: "#CECECE", fontSize: 20 }} />
						</Button>

						<Button
							onClick={() => setShowPresetSettings((prevValue) => !prevValue)}
							sx={[
								LOCAL_STYLES.imageButton,
								{
									backgroundColor: showPresetSettings ? "#FF6600" : "#FFFCFA1A",
									borderRadius: "50%",
									marginTop: "10px",
								},
							]}
						>
							<FastForwardIcon sx={{ color: "#CECECE", fontSize: 20 }} />
						</Button>
					</Box>
				</Box>
			</Box>
		</>
	);
};

export default Focus;

const LOCAL_STYLES = {
	image: {
		width: "100%",
		height: "100%",
		maxWidth: "100%",
		marginLeft: "auto",
		marginRight: "auto",
		cursor: "pointer",
	},
	btn: {
		backgroundColor: "#ff6600",
		color: "#FFFFFF",
		textTransform: "none",
		minWidth: "128px",
		height: "46px",
		border: "1px solid #2d2d2d",
	},
	gridItem: {
		justifyContent: "space-between",
		alignItems: "center",
		gap: "14px",
	},
	buttonBox: {
		display: "flex",
		flexDirection: "row",
		gap: "14px",
		marginTop: "10px",
		justifyContent: "center",
	},
	imageButton: { width: "40px", height: "40px", minWidth: "auto", padding: 0 },
	quickSettings: {
		position: "absolute",
		left: "calc(100% + 1px)",
		top: "50%",
		transform: "translateY(-50%)",
		backgroundColor: "rgb(16, 16, 16)",
		padding: "18px 12px",
		display: "flex",
		gap: "12px",
		flexDirection: "column",
	},
};
