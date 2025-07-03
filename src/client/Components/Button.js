import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import isEmpty from "lodash/isEmpty";
import React, { memo, useEffect, useState } from "react";
import { styles } from "../shared/styles";
import { Palette } from "@common/shared/common/styles";
import Icon from "./Icon";

const AnimatedButton = ({
	onClick,
	animate = false,
	hover,
	icon = "",
	text = "",
	left = "18%",
	bottom = "10%",
	sx = {},
	textStyles = {},
}) =>
{
	const [isAnimating, setIsAnimating] = useState(false);

	useEffect(() =>
	{
		if (isAnimating)
		{
			const timer = setTimeout(() =>
			{
				setIsAnimating(false); // Remove the animation after 5 seconds
			}, 5000);

			return () => clearTimeout(timer); // Cleanup the timer
		}
	}, [isAnimating]);
	return (
		<Button
			onClick={() =>
			{
				if (animate) setIsAnimating(true);
				onClick();
			}}
			sx={{
				position: "absolute",
				left: left,
				bottom: bottom,
				zIndex: 1,
				backgroundColor: hover ? Palette.orange : Palette.grey33,
				"&:hover": { backgroundColor: hover ? Palette.orange : "" },
				"&::before": {
					content: '""',
					position: "absolute",
					top: 0,
					left: 0,
					right: 0,
					bottom: 0,
					border: isAnimating ? `2px solid ${Palette.green}` : "none",
					borderRadius: "4px",
					opacity: isAnimating ? 1 : 0,
					transition: "opacity 0.5s ease-in-out",
				},
				...sx,
			}}
		>
			{animate && <Icon name={icon} size={20} color={Palette.white} />}
			{!isEmpty(text) && (
				<Typography
					sx={[
						styles.center,
						styles.text,
						{ fontWeight: "bold", ...textStyles },
					]}
				>
					{text}
				</Typography>
			)}
		</Button>
	);
};

export default memo(AnimatedButton);
