import React from "react";
import { cn } from "@utils/cn";

const ImageIcon = ({
	width = 24,
	height = 24,
	color = "currentColor",
	classname,
}) =>
{
	return (
		<svg
			xmlns="http://www.w3.org/2000/svg"
			width={width}
			height={height}
			viewBox="0 0 24 24"
			fill="none"
			stroke={color}
			strokeWidth="2"
			strokeLinecap="round"
			strokeLinejoin="round"
			className={cn(classname)}
		>
			<path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" />
			<path d="M14 2v4a2 2 0 0 0 2 2h4" />
			<circle cx="10" cy="12" r="2" />
			<path d="m20 17-1.296-1.296a2.41 2.41 0 0 0-3.408 0L9 22" />
		</svg>
	);
};

export default ImageIcon;
