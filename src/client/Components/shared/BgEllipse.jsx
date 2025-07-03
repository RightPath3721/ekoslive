import React from "react";
import { cn } from "@utils/cn";

const BgEllipse = ({
	width = 250,
	height = 250,
	position = { x: 0, y: 0 },
	className,
}) =>
{
	return (
		<div
			style={{
				width,
				height,
				top: position.y,
				left: position.x,
				background:
					"radial-gradient(circle, #FF6600C5 0%, #FF6600C5 60%, #00000000 100%)",
			}}
			className={cn(
				"absolute overflow-hidden -z-10 rounded-full [filter:blur(100px)]",
				className,
			)}
		/>
	);
};

export default BgEllipse;
