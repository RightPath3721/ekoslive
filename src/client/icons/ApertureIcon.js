import React from "react";

const ApertureIcon = ({
	width = 24,
	height = 24,
	color = "currentColor",
	className = "",
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
			className={className}
		>
			<circle cx="12" cy="12" r="10" />
			<path d="m14.31 8 5.74 9.94" />
			<path d="M9.69 8h11.48" />
			<path d="m7.38 12 5.74-9.94" />
			<path d="M9.69 16 3.95 6.06" />
			<path d="M14.31 16H2.83" />
			<path d="m16.62 12-5.74 9.94" />
		</svg>
	);
};

export default ApertureIcon;
