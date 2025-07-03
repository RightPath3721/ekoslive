import React, { memo } from "react";
import { IconButton } from "@mui/material";
import { Repeat, Stop, PlayArrow } from "@mui/icons-material";
import { Palette } from "@common/shared/common/styles";

const StartButton = ({
	inProgress,
	stop,
	start,
	loop = false,
	disabled = false,
	iconSize = 48,
	width = 50,
	height = 50,
	opacity = 1,
}) =>
{
	// Define colors (replacing Palette import)
	const colors = {
		red: Palette.red, // Example red color, adjust as needed
		orange: Palette.orange, // Example orange color, adjust as needed
	};

	return (
		<IconButton
			sx={{
				width: `${width}px`,
				height: `${height}px`,
				borderRadius: "50px",
				border: "2px solid white",
				backgroundColor: inProgress && !loop ? colors.red : colors.orange,
				"&:hover": {
					backgroundColor: inProgress && !loop ? colors.red : colors.orange,
					opacity: 0.9,
				},
				justifyContent: "center",
				alignItems: "center",
				opacity: opacity,
			}}
			disabled={disabled}
			onClick={inProgress && !loop ? stop : start}
			disableRipple={false}
		>
			{loop ? (
				<Repeat sx={{ fontSize: iconSize, color: Palette.white }} />
			) : inProgress ? (
				<Stop sx={{ fontSize: iconSize, color: Palette.white }} />
			) : (
				<PlayArrow sx={{ fontSize: iconSize, color: Palette.white }} />
			)}
		</IconButton>
	);
};

export default memo(StartButton);
