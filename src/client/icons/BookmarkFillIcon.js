import React from "react";

const BookmarkFillIcon = ({ width = 25, height = 25, color = "#FF6600" }) =>
{
	return (
		<svg
			width={width}
			height={height}
			viewBox="0 0 18 20"
			fill="none"
			xmlns="http://www.w3.org/2000/svg"
		>
			<path
				d="M1 17V3C1 1.89543 1.89543 1 3 1H15C16.1046 1 17 1.89543 17 3V17C17 18.6481 15.1185 19.5889 13.8 18.6L10.2 15.9C9.48889 15.3667 8.51111 15.3667 7.8 15.9L4.2 18.6C2.88153 19.5889 1 18.6481 1 17Z"
				fill={color}
				stroke={color}
				strokeWidth="1.5"
				strokeLinejoin="round"
			/>
		</svg>
	);
};

export default BookmarkFillIcon;
