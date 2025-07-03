import React from "react";

const SortArrowDown = ({ width = 24, height = 24, color = "#CECECE" }) =>
{
	return (
		<svg
			xmlns="http://www.w3.org/2000/svg"
			width={height}
			height={width}
			viewBox="0 0 24 24"
			fill="none"
			stroke={color}
			strokeWidth="2"
			strokeLinecap="round"
			strokeLinejoin="round"
		>
			<path d="m3 16 4 4 4-4" />
			<path d="M7 20V4" />
			<path d="M11 4h10" />
			<path d="M11 8h7" />
			<path d="M11 12h4" />
		</svg>
	);
};

export default SortArrowDown;
