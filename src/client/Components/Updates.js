import { Box, ListItemButton, ListItemIcon, ListItemText } from "@mui/material";
import React from "react";
import NotificationsActiveIcon from "@mui/icons-material/NotificationsActive";
import s from "@common/shared/i18n/i18n";
import { useNavigate } from "react-router-dom";
import { Palette } from "@common/shared/common/styles";

const Updates = () =>
{
	const navigate = useNavigate();
	return (
		<ListItemButton
			onClick={() => navigate("/updates")}
			sx={{
				mt: 1,
				mb: 1,
				display: "flex",
				width: "100%",
				"@media (max-height: 800px)": {
					mt: 0.5,
					mb: 0.5,
					py: 0.5,
				}
			}}
		>
			<ListItemIcon sx={{ color: "white" }}>
				<Box
					sx={{
						borderRadius: "20px",
						backgroundColor: "#FFFFFF33",
						width: "35px",
						height: "35px",
						display: "inline-grid",
						placeItems: "center",
						"@media (max-height: 800px)": {
							width: "30px",
							height: "30px",
						}
					}}
				>
					<NotificationsActiveIcon
						sx={{ 
							color: Palette.white, 
							fontSize: 16,
							"@media (max-height: 800px)": {
								fontSize: 14,
							}
						}}
					/>
				</Box>
			</ListItemIcon>
			<ListItemText 
				style={{ color: "white" }} 
				primary={s.status.updates}
				primaryTypographyProps={{
					sx: {
						"@media (max-height: 800px)": {
							fontSize: "0.875rem",
						}
					}
				}}
			/>
		</ListItemButton>
	);
};

export default Updates;
