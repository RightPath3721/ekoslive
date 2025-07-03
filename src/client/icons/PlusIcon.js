import { cn } from "@utils/cn";
import React from "react";

const PlusIcon = ({
	width = 24,
	height = 24,
	color = "inherit",
	className,
}) =>
{
	return (
		<svg
			width={width}
			height={height}
			viewBox="0 0 45 44"
			fill="none"
			xmlns="http://www.w3.org/2000/svg"
			className={cn(className)}
			color={color}
		>
			<path
				d="M22.5 11V33M33.5 22L11.5 22"
				stroke="currentColor"
				strokeWidth="2.75"
				strokewinecap="round"
				strokeLinejoin="round"
			/>
		</svg>
	);
};

export default PlusIcon;
