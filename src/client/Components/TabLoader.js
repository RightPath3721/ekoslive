import React from "react";
import Box from "@mui/material/Box";
import CircularProgress from "@mui/material/CircularProgress";
import { Palette } from "@common/shared/common/styles";

const TabLoader = () =>
{
	return (
		<Box
			sx={{
				width: "100%",
				height: "100%",
				display: "grid",
				placeItems: "center",
			}}
		>
			<CircularProgress size={80} sx={{ color: Palette.orange }} />
		</Box>
	);
};

export default TabLoader;
