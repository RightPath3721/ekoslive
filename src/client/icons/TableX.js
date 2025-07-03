import React from "react";

const TableX = ({
	width = 29,
	height = 29,
	color = "currentColor",
	className = "",
}) =>
{
	return (
		<svg
			width={width}
			height={height}
			viewBox="0 0 29 29"
			fill={color}
			xmlns="http://www.w3.org/2000/svg"
			className={className}
		>
			<path d="M22.7829 6.33438C18.2329 1.78438 10.7662 1.78438 6.21621 6.33438C1.66621 10.8844 1.66621 18.351 6.21621 22.901C10.7662 27.451 18.1162 27.451 22.6662 22.901C27.2162 18.351 27.3329 10.8844 22.7829 6.33438ZM17.7662 19.5177L14.4995 16.251L11.2329 19.5177L9.59955 17.8844L12.8662 14.6177L9.59955 11.351L11.2329 9.71771L14.4995 12.9844L17.7662 9.71771L19.3995 11.351L16.1329 14.6177L19.3995 17.8844L17.7662 19.5177Z" />
		</svg>
	);
};

export default TableX;
