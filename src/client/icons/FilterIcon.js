import React from "react";

const FilterIcon = ({ width = 24, height = 24, color = "#CECECE" }) =>
{
	return (
		<svg
			width={width}
			height={height}
			viewBox="0 0 20 20"
			fill="none"
			xmlns="http://www.w3.org/2000/svg"
		>
			<g opacity="0.8">
				<path
					d="M15.6824 1.66797H4.31764C2.86834 1.66797 2.00388 3.26426 2.80781 4.456L7.57589 10.6908C7.97333 11.28 8.18541 11.9722 8.18541 12.6803V17.4362C8.18541 18.235 9.16269 18.6351 9.73426 18.0702L11.5489 16.2769C11.719 16.1088 11.8146 15.8807 11.8146 15.6429V12.6803C11.8146 11.9722 12.0267 11.28 12.4241 10.6908L17.1922 4.456C17.9961 3.26426 17.1317 1.66797 15.6824 1.66797Z"
					stroke={color}
					strokeWidth="1.25"
					strokeLinecap="round"
					strokeLinejoin="round"
				/>
			</g>
		</svg>
	);
};

export default FilterIcon;
