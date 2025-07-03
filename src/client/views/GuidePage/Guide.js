import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import IconButton from "@mui/material/IconButton";
import Typography from "@mui/material/Typography";
import SettingsIcon from "@mui/icons-material/Settings";
import FastForwardIcon from "@mui/icons-material/FastForward";
import { Stop } from "@mui/icons-material";
import RepeatIcon from "@mui/icons-material/Repeat";
import { Box } from "@mui/system";
import { get, isEqual } from "lodash";
import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { guideActions } from "@redux/actions";
import { achievementsConstants, ekosConstants } from "@redux/constants";
import s from "@common/shared/i18n/i18n";
import Settings from "./Settings";
import { styles } from "../../shared/styles";
import Graph from "./Graph";
import GuideModal from "./GuideModal";
import { selectGuideStatus, selectEchoData } from "@redux/selectors";
import GraphBox from "../../Components/GraphBox";
import { Palette } from "@common/shared/common/styles";
import ImageIcon from "@mui/icons-material/Image";
import BarChartIcon from "@mui/icons-material/BarChart";
import GuideImage from "./GuideImage";
import Icon from "@components/Icon";

const LEDStatusColors = {
	yellow: "#ffff00",
	grey: "#353537",
	darkRed: "#550000",
	green: "#005500",
	lightGreen: "#00ff00",
	lightRed: "#FF0000",
};

const LEDStatus = ({ color }) =>
{
	return (
		<Box
			style={{
				backgroundColor: `${color}`,
				width: "15px",
				height: "15px",
				borderRadius: "50%",
			}}
		/>
	);
};

const getIdleColor = (status) =>
{
	switch (status)
	{
		case "Reacquiring":
		case "Capturing":
		case "Calibration error":
		case "Calibrating":
		case "Guiding":
		case "Looping":
			return LEDStatusColors.green;
		case "Idle":
		case "Selecting Star":
		case "Aborted":
			return LEDStatusColors.lightGreen;
		default:
			return LEDStatusColors.darkRed;
	}
};

const getPrepColor = (status) =>
{
	switch (status)
	{
		case "Guiding":
		case "Looping":
		case "Idle":
		case "Reacquiring":
			return LEDStatusColors.green;
		case "Aborted":
		case "Selecting Star":
			return LEDStatusColors.darkRed;
		case "Caribrating error":
			return LEDStatusColors.lightRed;
		case "Calibrating":
			return LEDStatusColors.yellow;
		case "Capturing":
			return LEDStatusColors.lightGreen;
		default:
			return LEDStatusColors.darkRed;
	}
};

const getRunningColor = (status) =>
{
	switch (status)
	{
		case "Reacquiring":
			return LEDStatusColors.yellow;
		case "Guiding":
		case "Looping":
			return LEDStatusColors.lightGreen;
		case "Idle":
		case "Capturing":
		case "Calibrating":
			return LEDStatusColors.grey;
		case "Calibrating error":
		case "Selecting Star":
		case "Aborted":
			return LEDStatusColors.darkRed;
		default:
			return LEDStatusColors.darkRed;
	}
};

const graphLegend = [
	{
		title: "DE",
		color: "rgb(0, 204, 255)",
	},
	{
		title: "RA",
		color: "rgb(204, 255, 0)",
	},
	{
		title: "RMS",
		color: "rgb(255, 0, 0)",
	},
];

const Guide = ({ settings, toggleSettings, toggleOpticalTrain, type = "" }) =>
{
	const dispatch = useDispatch();
	const guideStatus = useSelector(selectGuideStatus);
	const echo = useSelector(selectEchoData, isEqual);

	const [inProgress, setInProgress] = useState(false);

	const [starting, setStarting] = useState(false);
	const [capturing, setCapturing] = useState(false);
	const [checkReading, setCheckReading] = useState(0);

	const [showGuideModal, setShowGuideModal] = useState(false);
	const [state, setState] = useState({
		showImage: false,
		showGraph: false,
		showManualPulse: false,
	});

	const { showImage, showGraph } = state;

	// if totalRMS is < 0.5 arcsecs. achievement is achieved
	useEffect(() =>
	{
		//make sure echo is set to GUIDE, and it gets set when we start Guiding
		const type = get(echo, "type", "");
		if (type === achievementsConstants.ACHIEVE_GUIDE_RMS)
		{
			setCheckReading(checkReading + 1);
			const totalRMSarcs =
				Math.sqrt(
					Math.pow(guideStatus.rarms, 2) + Math.pow(guideStatus.derms, 2),
				).toFixed(2) *
				60 *
				60;

			//start checking after 15 readings
			if (totalRMSarcs < 0.5 && checkReading > 15)
			{
				dispatch({
					type: ekosConstants.GET_ECHO_DATA,
					data: {
						type: achievementsConstants.ACHIEVE_GUIDE_RMS,
						payload: { totalRMS: totalRMSarcs },
					},
				});
				setCheckReading(0);
			}
		}
	}, [guideStatus, echo]);

	const capture = () =>
	{
		dispatch(guideActions.capture());
	};

	const loop = () =>
	{
		setInProgress(true);
		dispatch(guideActions.loop());
	};

	const start = () =>
	{
		dispatch(guideActions.start());
		setCheckReading(0);
		setInProgress(true);
	};

	const stop = () =>
	{
		dispatch(guideActions.stop());
		setInProgress(false);
	};

	if (type === "chart")
		return (
			<GraphBox legend={graphLegend}>
				<Graph />
			</GraphBox>
		);

	return settings ? (
		<Settings />
	) : (
		<>
			{showGuideModal && <GuideModal toggleOpticalTrain={toggleOpticalTrain} />}
			{showGraph && (
				<Box sx={LOCAL_STYLES.quickSettings}>
					<GraphBox legend={graphLegend}>
						<Graph />
					</GraphBox>
				</Box>
			)}
			{showImage && (
				<Box sx={LOCAL_STYLES.quickSettings}>
					<GuideImage />
				</Box>
			)}
			<Box>
				<Button
					disabled={inProgress || capturing}
					sx={{
						backgroundColor: "#FF6600",
						width: "145px",
						textAlign: "center",
						marginRight: "15px",
					}}
					onClick={() =>
						{
						capture();
						setCapturing(true);
						setTimeout(() =>
							{
							setCapturing(false);
						}, 3500);
					}}
				>
					{capturing ? (
						<CircularProgress
							style={{ width: "25px", height: "25px" }}
							color="info"
						/>
					) : (
						<Typography sx={{ color: "white" }}>
							{s.tourGuide.title_capture}
						</Typography>
					)}
				</Button>

				<IconButton
					onClick={loop}
					sx={{ backgroundColor: Palette.grey44 }}
					disabled={inProgress}
				>
					<RepeatIcon sx={{ color: Palette.white }} />
				</IconButton>
			</Box>
			<Box
				sx={{
					display: "flex",
					flexDirection: "row",
					justifyContent: "space-evenly",
					gap: "8px",
				}}
			>
				<Box sx={[styles.row, { justifyContent: "space-around" }]}>
					<Box sx={[LOCAL_STYLES.ledIndicatorBox]}>
						<LEDStatus color={getIdleColor(guideStatus.status)} />
						<Typography sx={styles.text}>{s.statuses.Idle}</Typography>
					</Box>
					<Box sx={[LOCAL_STYLES.ledIndicatorBox]}>
						<LEDStatus color={getPrepColor(guideStatus.status)} />
						<Typography sx={styles.text}>{s.statuses.prep}</Typography>
					</Box>
					<Box sx={[LOCAL_STYLES.ledIndicatorBox]}>
						<LEDStatus color={getRunningColor(guideStatus.status)} />
						<Typography sx={styles.text}>{s.statuses.run}</Typography>
					</Box>
				</Box>
				<Box>
					<Button
						onClick={() => toggleSettings("Pulse")}
						sx={{
							backgroundColor: Palette.grey44,
							minWidth: "35px",
							marginLeft: "2px",
							height: "35px",
							borderRadius: "10px",
						}}
					>
						<Icon name="arrow-right" />
					</Button>
				</Box>
			</Box>

			<Box sx={[LOCAL_STYLES.buttonBox]}>
				<Box sx={LOCAL_STYLES.column}>
					<IconButton
						sx={[
							LOCAL_STYLES.imageButton,
							{
								backgroundColor: "#FFFCFA1A",
								"&.Mui-disabled": {
									opacity: 0.7,
									backgroundColor: "#FFFCFA1A",
									cursor: "not-allowed",
								},
							},
						]}
						onClick={() =>
							setState({ ...state, showGraph: !showGraph, showImage: false })
						}
					>
						<BarChartIcon sx={{ color: "#CECECE", fontSize: 20 }} />
					</IconButton>
					<IconButton
						sx={[
							LOCAL_STYLES.imageButton,
							{
								backgroundColor: "#FFFCFA1A",
								"&.Mui-disabled": {
									opacity: 0.7,
									backgroundColor: "#FFFCFA1A",
									cursor: "not-allowed",
								},
								marginTop: "10px",
							},
						]}
						onClick={() =>
							setState({ ...state, showImage: !showImage, showGraph: false })
						}
					>
						<ImageIcon sx={{ color: "#CECECE", fontSize: 20 }} />
					</IconButton>
				</Box>
				{inProgress ? (
					<Button
						onClick={stop}
						disabled={!inProgress}
						sx={[
							{
								borderRadius: "50%",
								width: "70px",
								height: "70px",
								border: "2px solid white",
								backgroundColor: Palette.red,
							},
						]}
					>
						<Stop sx={{ color: Palette.white, fontSize: 50 }} />
					</Button>
				) : starting ? (
					<CircularProgress
						sx={{ width: "70px", height: "70px", cursor: "wait" }}
						color="info"
					/>
				) : (
					<Button
						onClick={() =>
							{
							start();
							// shows loading activity indicator
							setStarting(true);
							setTimeout(() =>
								{
								setStarting(false);
							}, 10000);
						}}
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
						disabled={inProgress}
					>
						{s.connect.guide}
					</Button>
				)}
				<Box sx={LOCAL_STYLES.column}>
					<IconButton
						sx={[LOCAL_STYLES.imageButton, { backgroundColor: "#FFFCFA1A" }]}
						onClick={() => toggleSettings("Guide")}
					>
						<SettingsIcon sx={{ color: "#CECECE", fontSize: 20 }} />
					</IconButton>
					<IconButton
						onClick={() => setShowGuideModal((prevValue) => !prevValue)}
						sx={[
							LOCAL_STYLES.imageButton,
							{
								backgroundColor: showGuideModal ? "#FF6600" : "#FFFCFA1A",
								borderRadius: "50%",
								marginTop: "10px",
							},
						]}
					>
						<FastForwardIcon sx={{ color: "#CECECE", fontSize: 20 }} />
					</IconButton>
				</Box>
			</Box>
		</>
	);
};

const LOCAL_STYLES = {
	image: {
		width: "100%",
		height: "100%",
		maxWidth: "100%",
		marginLeft: "auto",
		marginRight: "auto",
		cursor: "pointer",
	},
	imageButton: { width: "40px", height: "40px", minWidth: "auto", padding: 0 },
	buttonBox: {
		display: "flex",
		flexDirection: "row",
		gap: "14px",
		justifyContent: "center",
	},
	ledIndicatorBox: {
		display: "flex",
		justifyContent: "center",
		alignItems: "center",
		gap: "4px",
	},
	column: {
		display: "flex",
		flexDirection: "column",
	},
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

export default Guide;
