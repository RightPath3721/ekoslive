import React from "react";
import { useSelector } from "react-redux";
import { Box, Typography } from "@mui/material";
import Icon from "../../Components/Icon";
import { Palette } from "@common/shared/common/styles";
import { selectPolarStage } from "@redux/selectors";

const stages = {
	Idle: 0,
	"First Capture": 1,
	"First Solve": 2,
	"First Rotation": 3,
	"First Settle": 4,
	"Second Capture": 5,
	"Second Solve": 6,
	"Second Rotation": 7,
	"Second Settle": 8,
	"Third Capture": 9,
	"Third Solve": 10,
	"Select Star": 11,
	"Select Refresh": 12,
	Refreshing: 13,
};
const handleStageColor = (statusStage, activeStage) =>
{
	const activeIndex = stages[activeStage];
	const stageIndex = stages[statusStage];

	if (stageIndex > activeIndex) return LOCAL_STYLES.stageIcon;
	else if (stageIndex === activeIndex)
		return [LOCAL_STYLES.stageIcon, { backgroundColor: "orange" }];
	else return [LOCAL_STYLES.stageIcon, { backgroundColor: "green" }];
};

const PolarStages = () =>
{
	const stage = useSelector(selectPolarStage);

	return (
		<Box
			sx={{
				display: "flex",
				flexDirection: "row",
				justifyContent: "center",
				width: "100%",
				flex: 1,
			}}
		>
			<Box sx={handleStageColor("Idle", stage)}>
				<Icon name="hourglass-bottom" color="black" size="18px" />
			</Box>

			<Box sx={handleStageColor("First Capture", stage)}>
				<Typography sx={{ fontSize: "12px", color: "black" }}>1st</Typography>
				<Icon name="camera" color="black" size="18px" />
			</Box>

			<Box sx={handleStageColor("First Rotation", stage)}>
				<Typography sx={{ fontSize: "12px", color: "black" }}>1st</Typography>
				<Icon name="flip-camera-ios" color="black" size="18px" />
			</Box>

			<Box sx={handleStageColor("Second Capture", stage)}>
				<Typography sx={{ fontSize: "12px", color: "black" }}>2nd</Typography>
				<Icon name="camera" color="black" size="18px" />
			</Box>

			<Box sx={handleStageColor("Second Rotation", stage)}>
				<Typography sx={{ fontSize: "12px", color: "black" }}>2nd</Typography>
				<Icon name="flip-camera-ios" color="black" size="18px" />
			</Box>

			<Box sx={handleStageColor("Third Capture", stage)}>
				<Typography sx={{ fontSize: "12px", color: "black" }}>3rd</Typography>
				<Icon name="camera" color="black" size="18px" />
			</Box>

			<Box sx={handleStageColor("Select Star", stage)}>
				<Icon name="star" color="black" size="18px" />
			</Box>

			<Box sx={handleStageColor("Select Refresh", stage)}>
				<Icon name="slow-motion-video" color="black" size="18px" />
			</Box>

			<Box sx={handleStageColor("Refreshing", stage)}>
				<Icon name="refresh" color="black" size="18px" />
			</Box>
		</Box>
	);
};

const LOCAL_STYLES = {
	stageIcon: {
		display: "flex",
		backgroundColor: "grey",
		width: "85px",
		height: "20px",
		border: `1px solid ${Palette.grey33}`,
		borderRadius: "4px",
		justifyContent: "center",
		flexDirection: "row",
		alignItems: "center",
	},
};

export default PolarStages;
