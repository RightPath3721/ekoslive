import React, { memo } from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";

import { useNavigate } from "react-router-dom";
import { Palette } from "@common/shared/common/styles";

const Settings = ({ text = "Using limited free plan", sx = {} }) =>
{
	const navigate = useNavigate();

	const handleUpdatePlan = () =>
	{
		navigate("/pricing");
	};

	return (
		<Box
			sx={{
				display: "flex",
				gap: "6px",
				alignItems: "center",
				justifyContent: "center",
				border: "1px solid white",
				borderRadius: "12px",
				width: "fit-content",
				padding: "6px 10px",
				margin: "auto",
				...sx,
			}}
		>
			<Typography>{text}</Typography>
			<Button onClick={handleUpdatePlan} sx={{ color: Palette.orange }}>
				Upgrade
			</Button>
		</Box>
	);
};

export default memo(Settings);
