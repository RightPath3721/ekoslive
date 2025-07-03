import React from "react";
import { Link } from "react-router-dom";
import s from "@common/shared/i18n/i18n";
import { Box, Typography } from "@mui/material";
import { useTheme } from "@mui/system";

const NotFoundPage = () =>
{
	const { palette } = useTheme();
	return (
		<Box
			sx={{
				display: "flex",
				flexDirection: "column",
				alignItems: "center",
				justifyContent: "center",
				height: "100vh",
				width: "100%",
				backgroundColor: palette.black[900],
				textAlign: "center",
			}}
		>
			<Typography sx={{fontSize: "8rem"}}>404</Typography>
			<Typography variant="h1">{s.general.absent_page}</Typography>
			<Link
				to="/"
				style={{
					textDecoration: "none",
					color: palette.primary.main,
				}}
			>
				{s.general.go_home}
			</Link>
		</Box>
	);
};
export default NotFoundPage;
