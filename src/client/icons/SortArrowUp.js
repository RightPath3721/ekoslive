import React from "react";

const SortArrowUp = ({ width = 24, height = 24, color = "#CECECE" }) =>
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
		>
			<path d="m3 8 4-4 4 4" />
			<path d="M7 4v16" />
			<path d="M11 12h10" />
			<path d="M11 16h7" />
			<path d="M11 20h4" />
		</svg>
	);
};

export default SortArrowUp;
