import Grid from "@mui/material/Grid";
import Typography from "@mui/material/Typography";
import React from "react";
import { useSelector } from "react-redux";
import get from "lodash/get";
import isEmpty from "lodash/isEmpty";
import s from "@common/shared/i18n/i18n";
import { styles } from "../../shared/styles";
import { Palette } from "@common/shared/common/styles";
import MountStatusBottomBar from "./MountStatusBottomBar";
import CameraStatusBottomBar from "./CameraStatusBottomBar";
import { selectCaptureStatus, selectTrainDevice } from "@redux/selectors";
import { trainModules, DEVICE_TYPE } from "@indi/enums";

const Statusbar = () =>
{
	const status = useSelector(selectCaptureStatus);
	const activeCamera = useSelector((state) =>
		selectTrainDevice(state, {
			trainType: trainModules.CaptureOpticalTrain,
			deviceType: DEVICE_TYPE.CAMERA,
		}),
	);

	if (
		isEmpty(activeCamera) ||
		isEmpty(status) ||
		get(activeCamera, "isConnected", "") === false
	)
		return (
			<Typography sx={[styles.text, styles.center, { color: Palette.grey66 }]}>
				{s.status.no_camera_detected}
			</Typography>
		);
	return (
		<Grid
			item
			sx={[
				{
					display: "flex",
					width: "100%",
					backgroundColor: "#1d1d1d",
					padding: "6px",
					flexWrap: "nowrap",
				},
			]}
		>
			<MountStatusBottomBar />
			<CameraStatusBottomBar />
		</Grid>
	);
};

export default Statusbar;
