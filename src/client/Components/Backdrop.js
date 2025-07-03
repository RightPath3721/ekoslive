import React from "react";
import Box from "@mui/material/Box";

/**
 * Backdrop component for displaying a translucent overlay over the parent component.
 * @returns {JSX.Element} The rendered backdrop element.
 */
const Backdrop = ({}) =>
{
	return (
		<Box
			sx={{
				position: "absolute",
				inset: 0,
				backgroundColor: "rgba(0, 0, 0, 0.5)",
				cursor: "wait",
				zIndex: 999999,
				pointerEvents: "auto",
				":hover": {
					pointerEvents: "none",
				},
			}}
		/>
	);
};

export default Backdrop;
