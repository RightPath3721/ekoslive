import React from "react";
import Grid from "@mui/material/Grid";
import { useTheme } from "@mui/material";

const SetupBoxWrapper = ({ children, ...props }) =>
{
	const { palette } = useTheme();

	return (
		<Grid
			item
			xs={6}
			sx={{
				padding: "1rem",
				backgroundColor: palette.common.black,
				border: `1px solid ${palette.black[500]}`,
				height: "240px",
				borderRadius: "10px",
			}}
			{...props}
		>
			{children}
		</Grid>
	);
};

export default SetupBoxWrapper;
