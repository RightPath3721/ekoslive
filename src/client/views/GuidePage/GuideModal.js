import { Box, IconButton, Typography } from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import isEmpty from "lodash/isEmpty";
import s from "@common/shared/i18n/i18n";
import Dropdown from "@components/Dropdown";
import { guideActions, opticalTrainActions } from "@redux/actions";
import { DEVICE_TYPE, numericControls, trainModules } from "@indi/enums";
import NumericControl from "@components/NumericControl";
import CustomizedSwitch from "@components/CustomSwitch";
import {
	selectTrains,
	selectGuideSettings,
	selectTrainDevice,
	selectTrainName,
} from "@redux/selectors";

const GuideModal = ({ toggleOpticalTrain }) =>
{
	const dispatch = useDispatch();

	const allTrains = useSelector(selectTrains);
	const activeTrain = useSelector((state) =>
		selectTrainName(state, { trainType: trainModules.GuideOpticalTrain }),
	);

	const guideSettings = useSelector(selectGuideSettings);
	const activeCamera = useSelector((state) =>
		selectTrainDevice(state, {
			trainType: trainModules.AlignOpticalTrain,
			deviceType: DEVICE_TYPE.CAMERA,
		}),
	);

	const [exp, setExp] = useState(
		isEmpty(guideSettings) ? 0 : guideSettings.guideExposure,
	);
	const [delay, setDelay] = useState(
		isEmpty(guideSettings) ? 0 : guideSettings.guideDelay,
	);
	const [bin, setBin] = useState(
		isEmpty(guideSettings) ? "1x1" : guideSettings.guideBinning,
	);

	useEffect(() =>
	{
		let payload = {
			guideExposure: exp,
			guideDelay: delay,
			guideBinning: bin,
		};
		dispatch(guideActions.setAllSettings(payload));
	}, [exp, delay, bin]);

	return (
		<Box
			sx={{
				position: "absolute",
				left: "calc(100% + 1px)",
				top: "50%",
				transform: "translateY(-50%)",
				backgroundColor: "rgb(16, 16, 16)",
				padding: "18px 12px",
				display: "flex",
				gap: "12px",
				flexDirection: "column",
				borderRadius: "4px",
			}}
		>
			<Box sx={[LOCAL_STYLES.gridItem]}>
				<Typography sx={{ color: "white" }}>{s.general.train}</Typography>
				<Dropdown
					options={allTrains}
					value={activeTrain}
					onChange={(e) =>
					{
						let payload = {
							name: e.label,
							module: "guide",
						};
						dispatch(opticalTrainActions.setTrain(payload));
						dispatch(opticalTrainActions.getAllTrains());
					}}
				/>
				<IconButton
					onClick={() =>
					{
						toggleOpticalTrain();
					}}
					sx={[
						LOCAL_STYLES.imageButton,
						{ backgroundColor: "#FFFCFA1A", borderRadius: "4px" },
					]}
				>
					<EditIcon sx={{ color: "#CECECE", fontSize: 25 }} />
				</IconButton>
			</Box>

			<Box sx={[LOCAL_STYLES.gridItem]}>
				<Typography sx={{ color: "white" }}>{s.general.exposure}</Typography>
				<NumericControl
					device={activeCamera}
					type={numericControls.EXPOSURE}
					onChange={(value) =>
					{
						setExp(value);
					}}
					initialValue={exp}
				/>
			</Box>

			<Box sx={[LOCAL_STYLES.gridItem]}>
				<Typography sx={{ color: "white" }}>{s.general.delay}</Typography>
				<NumericControl
					device={activeCamera}
					onChange={(value) =>
					{
						setDelay(value);
					}}
					steps={[1, 1]}
					initialValue={delay}
					customLimit={[0, 60]}
				/>
			</Box>

			<Box sx={[LOCAL_STYLES.gridItem]}>
				<Typography sx={{ color: "white" }}>{s.general.binning}</Typography>
				<CustomizedSwitch
					options={[
						{ label: "1x1", value: "1x1" },
						{ label: "2x2", value: "2x2" },
						{ label: "4x4", value: "4x4" },
					]}
					onChange={(value) =>
					{
						setBin(value);
					}}
					value={bin}
				/>
			</Box>
		</Box>
	);
};

const LOCAL_STYLES = {
	gridItem: {
		display: "flex",
		justifyContent: "space-between",
		alignItems: "center",
		gap: "16px",
	},
	imageButton: { width: "40px", height: "40px", minWidth: "auto", padding: 0 },
};

export default GuideModal;
