import React from "react";
import { cn } from "@utils/cn";

const Logout = ({
	width = 24,
	height = 24,
	color = "currentColor",
	className,
}) =>
{
	return (
		<svg
			xmlns="http://www.w3.org/2000/svg"
			width={width}
			height={height}
			viewBox="0 0 24 24"
			fill="none"
			className={cn(className)}
		>
			<path
				d="M14 9C14 10.1046 13.1046 11 12 11C10.8954 11 10 10.1046 10 9C10 7.89543 10.8954 7 12 7C13.1046 7 14 7.89543 14 9Z"
				stroke={color}
				strokeWidth="1.5"
			/>
			<path
				d="M19 8.85714C19 11.1415 17.302 13.9966 15.4424 15.9028C14.2191 17.1567 12.9259 18 12 18C11.0741 18 9.78087 17.1567 8.55756 15.9028C6.69796 13.9966 5 11.1415 5 8.85714C5 5.07005 8.13401 2 12 2C15.866 2 19 5.07005 19 8.85714Z"
				stroke={color}
				strokeWidth="1.5"
			/>
		</svg>
	);
};

export default Logout;
