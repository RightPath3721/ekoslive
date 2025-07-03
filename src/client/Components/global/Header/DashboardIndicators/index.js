import React from "react";
import { useSelector } from "react-redux";
import Grid from "@mui/material/Grid";
import ComputerIcon from "@mui/icons-material/Computer";
import CloudIcon from "@mui/icons-material/Cloud";
import CameraAltIcon from "@mui/icons-material/CameraAlt";
import { grey, red, green } from "@mui/material/colors";
import {
	selectSocketsConnected,
	selectConnected,
	selectConnectionOnline,
} from "@redux/selectors";

// Styles
const styles = {
	serverOnline: {
		margin: 5,
		color: green[600],
	},
	serverOffline: {
		margin: 5,
		color: grey[200],
	},
	ekosProfileConnected: {
		margin: 5,
		color: green[600],
	},
	ekosOffline: {
		margin: 5,
		color: red[500],
	},
};

const DashboardIndicators = () =>
{
	const socketsConnected = useSelector(selectSocketsConnected);
	// KStars is running and connected to online server
	const kstarsRunning = useSelector(selectConnected);
	// Ekos profile is running
	const ekosProfileRunning = useSelector(selectConnectionOnline);

	return (
		<Grid
			xs={2}
			xl={2}
			item
			sx={{
				width: "50%",
				display: "flex",
				flexDirection: "row",
				alignItems: "center",
				gap: "0.25rem",
			}}
		>
			<CloudIcon
				style={socketsConnected ? styles.serverOnline : styles.serverOffline}
			/>
			<ComputerIcon
				style={kstarsRunning ? styles.ekosProfileConnected : styles.ekosOffline}
			/>
			<CameraAltIcon
				style={
					ekosProfileRunning ? styles.ekosProfileConnected : styles.ekosOffline
				}
			/>
		</Grid>
	);
};

export default DashboardIndicators;
