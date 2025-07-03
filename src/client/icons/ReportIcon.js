import React from "react";

const ReportIcon = ({ width = 25, height = 25, color = "#EA001C" }) =>
{
	return (
		<svg
			width={width}
			height={height}
			viewBox="0 0 12 16"
			fill="none"
			xmlns="http://www.w3.org/2000/svg"
		>
			<path
				d="M0.666016 10.0026C0.666016 10.0026 1.33268 9.33594 3.33268 9.33594C5.33268 9.33594 6.66602 10.6693 8.66602 10.6693C10.2179 10.6693 10.967 10.2679 11.2248 10.088C11.2973 10.0374 11.3327 9.95294 11.3327 9.86453V2.80734C11.3327 2.51037 10.9084 2.28173 10.6287 2.38155C10.2079 2.5317 9.57454 2.66927 8.66602 2.66927C6.66602 2.66927 5.33268 1.33594 3.33268 1.33594C1.33268 1.33594 0.666016 2.0026 0.666016 2.0026V10.0026ZM0.666016 10.0026V14.6693"
				stroke={color}
				strokeLinecap="round"
				strokeLinejoin="round"
			/>
		</svg>
	);
};

export default ReportIcon;
