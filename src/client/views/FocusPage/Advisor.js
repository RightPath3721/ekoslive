import React, { useEffect, useState, memo } from "react";
import { ekosActions, focusActions } from "@redux/actions";
import { useDispatch, useSelector } from "react-redux";
import { get } from "lodash";
import { Box, Button, Typography } from "@mui/material";
import s from "@common/shared/i18n/i18n";
import CloseButton from "@components/CloseButton";
import { Palette } from "@common/shared/common/styles";
import FocusImage from "./FocusImage";
import Graph from "./FocusGraph";
import { styles } from "@client/shared/styles";
import PlayCircleOutlineIcon from "@mui/icons-material/PlayCircleOutline";
import StopCircleIcon from "@mui/icons-material/StopCircle";
import Icon from "@components/Icon";
import { ArrowForward } from "@mui/icons-material";

const AdvisorArray = [
	{
		key: "focusAdvUpdateParams",
		label: "Update Parameters",
		description: s.ekos.collapse_focus.update_parameters,
	},
	{
		key: "focusAdvFindStars",
		label: "Find Stars",
		description: s.ekos.collapse_focus.find_stars,
	},
	{
		key: "focusAdvCoarseAdj",
		label: "Coarse Adjustment (without Autofocus)",
		description: s.ekos.collapse_focus.coarse_adjustment,
	},
	{
		key: "focusAdvFineAdj",
		label: "Fine Adjustment (using Autofocus)",
		description: s.ekos.collapse_focus.fine_adjustment,
	},
];

const Advisor = ({ onClose }) =>
{
	const dispatch = useDispatch();

	const focusStatus = useSelector((state) => state.status.focus);
	const chartData = get(focusStatus, "chart", []);

	const [progress, setProgress] = useState(focusStatus.status === "Progress");
	const [currentAdvisor, setCurrentAdvisor] = useState(0);

	const setSettings = (key, payload) =>
	{
		dispatch(
			focusActions.setAllSettings({
				[key]: payload,
			}),
		);
	};

	// Uncheck all boxes and set true to the Default
	useEffect(() =>
	{
		AdvisorArray.map((data) =>
		{
			dispatch(focusActions.setAllSettings({ [data.key]: false }));
		});
		dispatch(focusActions.setAllSettings({ [AdvisorArray[0].key]: true }));
	}, []);

	// Uncheck all boxes and set true to the Default
	useEffect(() =>
	{
		let nextProgress = true;
		switch (focusStatus.status) {
			case "Idle":
			case "Complete":
			case "Failed":
			case "Aborted":
				nextProgress = false;
				break;

			default:
				break;
		}
		setProgress(nextProgress);
		if (
			AdvisorArray[0].key === AdvisorArray[currentAdvisor].key &&
			!nextProgress
		)
			setProgress(false);
	}, [progress, focusStatus.status]);

	return (
		<Box>
			<CloseButton onChange={onClose} />
			<Typography sx={{ textAlign: "center", fontWeight: "bold" }}>
				{s.ekos.collapse_focus.advisor}
			</Typography>
			<Box
				sx={[
					styles.row,
					{
						padding: "25px",
						flex: 2,
					},
				]}
			>
				<Box sx={LOCAL_STYLES.box}>
					<Box
						sx={{
							flex: 0.8,
							alignItems: "center",
						}}
					>
						<Typography sx={LOCAL_STYLES.text}>
							{AdvisorArray[currentAdvisor].label}
						</Typography>

						<Typography
							sx={{ fontStyle: "italic", height: "100px", marginTop: "15px" }}
						>
							{AdvisorArray[currentAdvisor].description}
						</Typography>

						<Box
							sx={[
								styles.center,
								{
									height: "100px",
									marginTop: "15px",
								},
							]}
						>
							<Button
								sx={LOCAL_STYLES.button}
								onClick={() =>
								{
									dispatch(focusActions.resetGraph());
									setSettings(AdvisorArray[currentAdvisor].key, true);
									dispatch(
										ekosActions.invokeMethod(
											"focusAdvisorDialog",
											progress ? "stop" : "start",
										),
									);
									setProgress(!progress);
								}}
							>
								{progress ? (
									<StopCircleIcon sx={{ color: "white", fontSize: 80 }} />
								) : (
									<PlayCircleOutlineIcon
										sx={{ color: "white", fontSize: 80 }}
									/>
								)}
							</Button>
						</Box>
						<Box sx={{ marginTop: "20px" }}>
							<Typography sx={{ textAlign: "center" }}>
								{get(focusStatus, "focusAdvisorMessage", "")}
							</Typography>
						</Box>
					</Box>

					<Box sx={[styles.row, LOCAL_STYLES.arrow]}>
						<Button
							sx={{
								marginRight: "10px",
								backgroundColor: Palette.orange,
								"&:hover": {
									backgroundColor: null, // Prevent color change
								},
							}}
							disabled={currentAdvisor <= 0}
							buttonsx="danger"
							onClick={() =>
							{
								setSettings(AdvisorArray[currentAdvisor].key, false);
								setCurrentAdvisor(currentAdvisor - 1);
								setSettings(AdvisorArray[currentAdvisor - 1].key, true);
							}}
						>
							<Icon color="#fff" name="arrow-left" />
						</Button>

						<Button
							disabled={currentAdvisor >= 3}
							sx={{
								marginRight: "10px",
								backgroundColor: Palette.orange,
								"&:hover": {
									backgroundColor: Palette.orange, // Prevent color change
								},
							}}
							buttonsx="danger"
							onClick={() =>
							{
								setSettings(AdvisorArray[currentAdvisor].key, false);
								setCurrentAdvisor(currentAdvisor + 1);
								setSettings(AdvisorArray[currentAdvisor + 1].key, true);
							}}
						>
							<ArrowForward sx={{ color: "#fff" }} name="arrow-right" />
						</Button>
					</Box>
				</Box>
				<Box sx={LOCAL_STYLES.rightBox}>
					<Box sx={{ borderWidth: 0.5, borderColor: Palette.grey33, flex: 1 }}>
						<FocusImage isAdvisor />
					</Box>
					<Box sx={{ flex: 1 }}>
						<Graph chartData={chartData} isAdvisor />
					</Box>
				</Box>
			</Box>
		</Box>
	);
};

export default memo(Advisor);

const LOCAL_STYLES = {
	box: {
		flex: 1,
		borderRightWidth: 0.5,
		borderRightColor: "white",
		justifyContent: "center",
	},
	rightBox: {
		flex: 1.5,
		alignItems: "center",
		justifyContent: "space-evenly",
	},
	text: {
		textAlign: "center",
		fontWeight: "bold",
		width: "100%",
		color: Palette.orange,
	},
	button: {
		width: "50px",
		height: "50px",
		borderRadius: "50px",
		justifyContent: "center",
		alignItems: "center",
		"&:hover": {
			backgroundColor: null, // Prevent color change
		},
	},
	arrow: {
		justifyContent: "space-between",
		width: "90%",
		flex: 0.2,
		marginTop: "50px",
	},
};
