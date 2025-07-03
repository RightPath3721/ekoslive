import { Button, IconButton, Box } from "@mui/material";
import { Stop } from "@mui/icons-material";
import FastForwardIcon from "@mui/icons-material/FastForward";
import SettingsIcon from "@mui/icons-material/Settings";
import { get, isEmpty, isEqual } from "lodash";
import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { alignActions, opticalTrainActions } from "@redux/actions";
import s from "@common/shared/i18n/i18n";
import Settings from "./Settings";
import Graph from "./Graph";
import SolutionBar from "./SolutionBar";
import AlignModal from "./AlignModal";
import {
	selectTrainDeviceName,
	selectAlignState,
	selectAlignTargetDiff,
	selectAlignSettings,
	selectMediaData,
	selectTargetAlignSettings,
	selectTrains,
} from "@redux/selectors";
import { trainModules } from "@indi/enums";
import GraphBox from "../../Components/GraphBox";
import LoadSlewInput from "./LoadSlewInput";
import { Palette } from "@common/shared/common/styles";
import ImageIcon from "@mui/icons-material/Image";
import BarChartIcon from "@mui/icons-material/BarChart";
import AlignImage from "./AlignImage";

const LOCAL_STYLES = {
	btn: {
		backgroundColor: "#ff6600",
		color: "#FFFFFF",
		textTransform: "none",
		flex: 1,
		height: "43px",
		border: "1px solid #2d2d2d",
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
	image: {
		objectFit: "fill",
	},
	imageButton: { width: "40px", height: "40px", minWidth: "auto", padding: 0 },
	gridItem: {
		justifyContent: "space-between",
		alignItems: "center",
		gap: "14px",
	},
	buttonBox: {
		display: "flex",
		flexDirection: "row",
		gap: "14px",
		justifyContent: "center",
	},
	column: {
		display: "flex",
		flexDirection: "column",
	},
};

const Align = ({
	settings,
	toggleSettings,
	type,
	toggleOpticalTrain,
	setShowPAA,
}) =>
{
	const dispatch = useDispatch();

	const status = useSelector(selectAlignState);
	const targetDiff = useSelector(selectAlignTargetDiff);
	const alignSettings = useSelector(selectAlignSettings);
	const data = useSelector(selectMediaData, isEqual);
	const allTrains = useSelector(selectTrains);
	const activeTrain = useSelector((state) =>
		selectTrainDeviceName(state, { trainType: trainModules.AlignOpticalTrain }),
	);
	const targetAlignSettings = useSelector(selectTargetAlignSettings);

	// State Hooks
	const [state, setState] = useState({
		showSettings: false,
		showPAA: false,
		showImage: false,
		showGraph: false,
	});

	const { showSettings, showPAA, showImage, showGraph } = state;
	const [inProgress, setInProgress] = useState(false);
	// const [initialAccuracy, setInitialAccuracy] = useState(get(alignSettings, "alignAccuracyThreshold", 30));
	const initialAccuracy = get(alignSettings, "alignAccuracyThreshold", 30);
	const [chartData, setChartData] = useState([]);
	const payLoadState = {
		exp: 1,
		bin: 1,
		camera: null,
		fw: null,
		filter: null,
		solverAction: 1,
		solverBackend: 1,
		solverType: 1,
		accuracy: 30,
		settle: 1500,
		dark: false,
	};
	// const [payLoadState, setPayloadState] = useState({
	//   exp: 1,
	//   bin: 1,
	//   camera: null,
	//   fw: null,
	//   filter: null,
	//   solverAction: 1,
	//   solverBackend: 1,
	//   solverType: 1,
	//   accuracy: 30,
	//   settle: 1500,
	//   dark: false,
	// });

	const [showAlignModal, setShowAlignModal] = useState(false);

	const solve = () =>
	{
		// JM 2022.09.30 No need to send settings as user can change at any time
		//dispatch(alignActions.setAlignSettings(targetAlignSettings));
		dispatch(alignActions.solve());
	};

	const stop = () =>
	{
		dispatch(alignActions.stop());
	};

	useEffect(() =>
	{
		dispatch(opticalTrainActions.getAllTrains());
	}, []);

	useEffect(() =>
	{
		let prevChartData = [...chartData];

		if (status && ["Complete", "Failed", "Aborted", "Idle"].includes(status))
		{
			// If we just started 'In Progress' clear prior data
			if (status === "In Progress")
			{
				setChartData([]);
				prevChartData.length = 0;
			}
		}

		// sets inProgress to false, according to the following cases
		if (status)
		{
			let inProgressState = true;
			switch (status)
			{
				case "Idle":
				case "Complete":
				case "Failed":
				case "Aborted":
					inProgressState = false;
					break;

				default:
					break;
			}

			// state["status"] = nextProps.status;
			setInProgress(inProgressState);
		}

		// if status is In Progress and targetDiff is more than 0, that means we have new data
		if (status === "In Progress" && targetDiff > 0)
		{
			// We check if the value is within the accuracy limit, 1.5 times above, or 2 times above the limit
			// and we set the color of the point accordingly (green, yellow and red)

			const index =
				chartData.length === 0 ? 1 : chartData[chartData.length - 1].index + 1;
			let data = {
				y: targetDiff,
				x: chartData.length + 1,
				fill:
					targetDiff <= payLoadState.accuracy
						? "#0f0"
						: targetDiff <= payLoadState.accuracy * 1.5
							? "#ff0"
							: "#f00",
				index,
			};

			// concatenate previous chartData with the new data
			setChartData(prevChartData.concat(data));
		}

		// Increase align accuracy threshold value by 15 arcsecs for each failed attempt after 3rd frame
		if (
			get(data, "pos", 0) >= 4 &&
			data.targetDiff > alignSettings.alignAccuracyThreshold
		)
		{
			dispatch(
				alignActions.setAllSettings({
					alignAccuracyThreshold: alignSettings.alignAccuracyThreshold + 15,
				}),
			);
		}
		// If we fall within initial accuracy and we changed alignAccuracyThreshold to a larger value before, let us reset it
		// back to initial Accuracy (30)
		else if (
			data?.targetDiff < initialAccuracy &&
			alignSettings.alignAccuracyThreshold > initialAccuracy
		)
		{
			dispatch(
				alignActions.setAllSettings({
					alignAccuracyThreshold: initialAccuracy,
				}),
			);
		}
	}, [status, targetDiff]);

	const setSolverAction = (val) =>
	{
		let payload = {};
		// get value from the store
		if (val === undefined || val === null)
			val = get(targetAlignSettings, "solverAction", 1);
		else if (val === 0) payload = { syncR: true };
		else if (val === 1) payload = { slewR: true };
		else if (val === 2) payload = { nothingR: true };

		dispatch(alignActions.setAllSettings(payload));
	};

	// set action on mount
	useEffect(() =>
	{
		setSolverAction();
	}, []);

	/*
	 * Reduce align accuracy to 120 arcsec.
	 */
	useEffect(() =>
	{
		if (!isEmpty(activeTrain) && !isEmpty(allTrains))
		{
			const oneTrain = allTrains.find((train) => train.name === activeTrain);
			if (oneTrain && oneTrain.mount.includes("GTi"))
				dispatch(alignActions.setAllSettings({ accuracy: 120 }));
		}
	}, [activeTrain]);

	if (type === "chart")
		return (
			<GraphBox>
				<Graph chartData={chartData} />
			</GraphBox>
		);

	return (
		<>
			{settings ? (
				<Settings />
			) : (
				<>
					{showImage && (
						<Box sx={LOCAL_STYLES.quickSettings}>
							<AlignImage sx={{ maxWidth: "350px", maxHeight: "450px" }} />
						</Box>
					)}
					{showGraph && (
						<Box sx={LOCAL_STYLES.quickSettings}>
							<GraphBox>
								<Graph chartData={chartData} />
							</GraphBox>
						</Box>
					)}

					{showAlignModal && (
						<AlignModal toggleOpticalTrain={toggleOpticalTrain} />
					)}
					<Button
						sx={[
							LOCAL_STYLES.btn,
							{ backgroundColor: "#1e1e1e", fontSize: "14px" },
						]}
						onClick={() =>
							{
							setShowPAA();
						}}
						fullWidth
					>
						{s.ekos.collapse_polar.heading}
					</Button>
					<LoadSlewInput />
					<Box sx={LOCAL_STYLES.buttonBox}>
						<Box sx={LOCAL_STYLES.column}>
							<Button
								onClick={() =>
									{
									setState({
										...state,
										showGraph: !showGraph,
									});
								}}
								sx={[
									LOCAL_STYLES.imageButton,
									{ backgroundColor: "#FFFCFA1A", borderRadius: "50%" },
								]}
							>
								<BarChartIcon sx={{ color: "#CECECE", fontSize: 20 }} />
							</Button>

							<IconButton
								onClick={() => setState({ ...state, showImage: !showImage })}
								sx={[
									LOCAL_STYLES.imageButton,
									{
										backgroundColor: "#FFFCFA1A",
										borderRadius: "50%",
										marginTop: "10px",
									},
								]}
							>
								<ImageIcon sx={{ color: "#CECECE", fontSize: 20 }} />
							</IconButton>
						</Box>
						{inProgress ? (
							<Button
								disabled={!inProgress}
								onClick={stop}
								sx={[
									{
										borderRadius: "50%",
										width: "70px",
										height: "70px",
										backgroundColor: Palette.red,
										border: "1px solid white",
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
									border: "1px solid white",
								}}
								onClick={solve}
								disabled={inProgress}
							>
								{s.ekos.collapse_align.solve}
							</Button>
						)}

						<Box sx={LOCAL_STYLES.column}>
							<Button
								onClick={() =>
									{
									setState({
										...state,
										showSettings: !showSettings,
										showPAA: false,
									});
									toggleSettings("Align");
								}}
								sx={[
									LOCAL_STYLES.imageButton,
									{ backgroundColor: "#FFFCFA1A", borderRadius: "50%" },
								]}
							>
								<SettingsIcon sx={{ color: "#CECECE", fontSize: 20 }} />
							</Button>

							<IconButton
								onClick={() => setShowAlignModal((prevValue) => !prevValue)}
								sx={[
									LOCAL_STYLES.imageButton,
									{
										backgroundColor: showAlignModal ? "#FF6600" : "#FFFCFA1A",
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
			)}
			{!showPAA && <SolutionBar />}
		</>
	);
};

export default Align;
