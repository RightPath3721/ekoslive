import React from "react";
import { useNavigate } from "react-router-dom";
import s from "@common/shared/i18n/i18n";
import { Box, Typography, Button } from "@mui/material";
import { useTheme } from "@mui/system";

const NotFound = () =>
{
	const navigate = useNavigate();
	const { palette } = useTheme();
	const handleGoBack = () => {
        navigate(-1);
    };

	return (
		<Box
			sx={{
				display: "flex",
				flexDirection: "column",
				alignItems: "center",
				justifyContent: "center",
				height: "80vh",
				width: "100%",
				textAlign: "center",
			}}
		>
			<Typography sx={{fontSize: "8rem"}}>404</Typography>
			<Typography variant="h1">{s.general.absent_user}</Typography>
			<Button
				onClick={handleGoBack}
				style={{
					textDecoration: "none",
					color: palette.primary.main, 
				}}
			>
				{s.general.go_back}
			</Button>
		</Box>
	);
};
export default NotFound;
