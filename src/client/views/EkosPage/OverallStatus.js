import React, { useState } from "react";
import Grid from "@mui/material/Grid";
import NotificationHistory from "../../Components/NotificationHistory";
import MountStatusTopBar from "./MountStatusTopBar";
import CameraStatusTopBar from "./CameraStatusTopBar";
import { Box } from "@mui/material";

const OverallStatus = () =>
{
	const [showNotificationHistory, setShowNotificationHistory] = useState(false);

	return (
		<Grid
			sx={{
				display: "flex",
				flexDirection: "row",
				width: "100%",
				backgroundColor: "#1d1d1d",
				padding: "5px",
			}}
		>
			<Box sx={{ flex: 1 / 2 }}>
				<MountStatusTopBar />
			</Box>
			<Box sx={{ flex: 1 / 2 }}>
				<CameraStatusTopBar showHistory={setShowNotificationHistory} />
			</Box>
			{showNotificationHistory && (
				<NotificationHistory
					onClose={() => setShowNotificationHistory(false)}
				/>
			)}
		</Grid>
	);
};

export default OverallStatus;
