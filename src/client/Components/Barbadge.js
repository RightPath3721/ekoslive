import Box from "@mui/material/Box";
import CircularProgress from "@mui/material/CircularProgress";
import Typography from "@mui/material/Typography";
import React from "react";
import s from "@common/shared/i18n/i18n";
import { styles } from "../shared/styles";
import { Palette } from "@common/shared/common/styles";

const BGCOLORMAP = {
	Idle: Palette.white50,

	Aborted: Palette.error,
	"Calibration error": Palette.error,

	Capturing: Palette.running,
	"In Progress": Palette.running,
	"Setting Temperature": Palette.running,
	Slewing: Palette.running,
	Calibrating: Palette.running,
	Tracking: Palette.complete,
	Guiding: Palette.running,
	Parking: Palette.running,
	UnParking: Palette.running,
	Moving: Palette.running,
	Loading: Palette.running,

	"User Input": Palette.userinput,

	Complete: Palette.complete,

	Suspended: Palette.suspended,
	Parked: Palette.suspended,
	Streaming: Palette.complete,
};

const validStatues = Object.keys(BGCOLORMAP);
const inProgressStatues = [
	"Capturing",
	"Tracking",
	"Slewing",
	"Calibrating",
	"In Progress",
	"Setting Temperature",
	"Guiding",
	"Parking",
	"UnParking",
	"Moving",
	"Loading",
	"Streaming",
];
const Barbadge = ({
	children = null,
	source = null,
	style = {},
	textStyle = {},
}) =>
{
	let overrideTextStyle = null;
	let overrideStyle = null;
	let showProcessing = false;
	if (typeof children === "string" && validStatues.includes(children))
	{
		overrideStyle = { backgroundColor: BGCOLORMAP[children] };
		// overrideTextStyle = { color: FGCOLORMAP[children] };
		showProcessing = inProgressStatues.includes(children);
		if (showProcessing)
			overrideTextStyle = {
				marginLeft: "4px",
			};
	}
	else if (children.slice(0, 3) === "Mov")
	{
		overrideStyle = { backgroundColor: BGCOLORMAP["Moving"] };
		showProcessing = inProgressStatues.includes("Moving");
		if (showProcessing)
			overrideTextStyle = {
				marginLeft: "4px",
			};
	}
	return (
		<Box
			sx={[
				styles.center,
				{
					height: "26px",
					paddingInline: "14px",
					backgroundColor: Palette.white50,
					borderRadius: "16px",
					alignItems: "center",
					justifyContent: "center",
					flexDirection: "row",
				},
				overrideStyle,
				{ ...style },
			]}
		>
			{showProcessing ? (
				<Box sx={[styles.center, { paddingLeft: "4px", paddingRight: "5px" }]}>
					<CircularProgress
						style={{ width: "15px", height: "15px" }}
						color="info"
					/>
				</Box>
			) : null}
			{source && (
				<img
					style={{
						marginRight: "5px",
						width: "15px",
						height: "15px",
						color: Palette.grey11,
						filter: "grayscale(100%) brightness(0) invert(0)",
					}}
					src={source}
				/>
			)}
			<Typography
				sx={[
					styles.center,
					{
						color: Palette.grey11,
						fontSize: "12px",
						overflow: "visible",
					},
					overrideTextStyle,
					{ ...textStyle },
				]}
			>
				{typeof children === "string"
					? s.statuses[children]
						? s.statuses[children]
						: children
					: children}
			</Typography>
		</Box>
	);
};

export default Barbadge;
