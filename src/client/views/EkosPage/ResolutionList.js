import s from "@common/shared/i18n/i18n";
import Dropdown from "@components/Dropdown";
import { DEVICE_TYPE, trainModules } from "@indi/enums";
import { Box, Grid, Typography } from "@mui/material";
import { selectTrainDevice } from "@redux/selectors";
import React from "react";
import { useEffect } from "react";
import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";

const ResolutionList = ({ onClose }) =>
{
	const dispatch = useDispatch();
	const activeCamera = useSelector((state) =>
		selectTrainDevice(state, {
			trainType: trainModules.CaptureOpticalTrain,
			deviceType: DEVICE_TYPE.CAMERA,
		}),
	);
	const [availableResolutions, setAvailableResolutions] = useState([]);
	const [activeResolution, setActiveResolution] = useState("");

	useEffect(() =>
	{
		const resolutions = activeCamera.toArray("CCD_RESOLUTION");
		if (resolutions)
		{
			setAvailableResolutions(resolutions);

			// also set the active state
			resolutions.filter(({ label, state }) =>
			{
				if (state) setActiveResolution(label);
			});
		}
	}, []);
	return (
		<Grid>
			<Box sx={{ display: "flex", flexDirection: "row" }}>
				<Typography sx={{ padding: "10px" }}>{s.general.resolution}</Typography>
				<Dropdown
					options={availableResolutions.map(({ label, state }) => ({
						label: label,
						value: state,
					}))}
					onChange={(value) =>
					{
						dispatch(activeCamera.sendProperty("CCD_RESOLUTION", value.label));
						setActiveResolution(value.label);
						onClose();
					}}
					width="300px"
					value={activeResolution}
				/>
			</Box>
		</Grid>
	);
};

export default ResolutionList;
