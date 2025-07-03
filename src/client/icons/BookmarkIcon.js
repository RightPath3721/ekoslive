import React from "react";

const BookmarkIcon = ({ width = 25, height = 25, color = "#FF6600" }) =>
{
	return (
		<svg
			width={width}
			height={height}
			viewBox="0 0 24 24"
			fill="none"
			xmlns="http://www.w3.org/2000/svg"
		>
			<path
				d="M4 19V5C4 3.89543 4.89543 3 6 3H18C19.1046 3 20 3.89543 20 5V19C20 20.6481 18.1185 21.5889 16.8 20.6L13.2 17.9C12.4889 17.3667 11.5111 17.3667 10.8 17.9L7.2 20.6C5.88153 21.5889 4 20.6481 4 19Z"
				stroke={color}
				strokeWidth="1.5"
				strokeLinejoin="round"
			/>
			<path
				d="M4 8H20"
				stroke={color}
				strokeWidth="1.5"
				strokeLinecap="round"
				strokeLinejoin="round"
			/>
		</svg>
	);
};

export default BookmarkIcon;
