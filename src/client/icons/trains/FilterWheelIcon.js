import React from "react";

const FilterWheelIcon = ({ width = 25, height = 25, color = "#CECECE" }) =>
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
			<path d="M22 12a1 1 0 0 1-10 0 1 1 0 0 0-10 0" />
			<path d="M7 20.7a1 1 0 1 1 5-8.7 1 1 0 1 0 5-8.6" />
			<path d="M7 3.3a1 1 0 1 1 5 8.6 1 1 0 1 0 5 8.6" />
			<circle cx="12" cy="12" r="10" />
		</svg>
	);
};

export default FilterWheelIcon;
