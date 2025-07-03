import React from "react";

const TargetsIcon = ({ width = 25, height = 25, color = "#CECECE" }) =>
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
			<path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z" />
			<path d="M6 12H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2" />
			<path d="M18 9h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-2" />
			<path d="M10 6h4" />
			<path d="M10 10h4" />
			<path d="M10 14h4" />
			<path d="M10 18h4" />
		</svg>
	);
};

export default TargetsIcon;
