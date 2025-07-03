import React from "react";

const MinusIcon = ({ width = 25, height = 25, color = "inherit" }) =>
{
	return (
		<svg
			width={width}
			height={height}
			viewBox="0 0 16 16"
			fill="none"
			xmlns="http://www.w3.org/2000/svg"
			color={color}
		>
			<path
				d="M12 8L4 8"
				stroke="currentColor"
				strokeLinecap="round"
				strokeLinejoin="round"
			/>
		</svg>
	);
};

export default MinusIcon;
