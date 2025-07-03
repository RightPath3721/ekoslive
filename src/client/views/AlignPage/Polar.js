import React, { useEffect, useState } from "react";
import { Button, IconButton, Typography, Box } from "@mui/material";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import StopIcon from "@mui/icons-material/Stop";
import { get, isEmpty, isEqual } from "lodash";
import { useDispatch, useSelector } from "react-redux";
import { alignActions, mountActions, polarActions } from "@redux/actions";
import s from "@common/shared/i18n/i18n";
import CustomizedSwitch from "../../Components/CustomSwitch";
import NumericControl from "../../Components/NumericControl";
import { SelectInput } from "../../Components/Select";
import PolarStages from "./polarStages";
import { trainModules, DEVICE_TYPE } from "@indi/enums";
import {
	selectAlignSettings,
	selectTrainDevice,
	selectPolarStage,
	selectTargetPAHSettings,
	selectPolarMessage,
	selectMountSpeed,
	selectMountStatus,
} from "@redux/selectors";
import AlignImage from "./AlignImage";
import { styles } from "@client/shared/styles";
import CloseButton from "@components/CloseButton";
import { Palette } from "@common/shared/common/styles";
import VisibilityIcon from "@mui/icons-material/Visibility";
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";
import Icon from "@components/Icon";

const inactiveStatus = ["Idle", "Aborted", "Complete", "Failed"];

const Polar = ({ onClose }) =>
{
	const dispatch = useDispatch();
	const alignSettings = useSelector(selectAlignSettings);

	const activeMount = useSelector((state) =>
		selectTrainDevice(state, {
			trainType: trainModules.MountOpticalTrain,
			deviceType: DEVICE_TYPE.MOUNT,
		}),
	);
	const status = useSelector(selectPolarStage);
	const targetPAHSettings = useSelector(selectTargetPAHSettings, isEqual);
	const message = useSelector(selectPolarMessage);
	const mountSpeed = useSelector(selectMountSpeed, isEqual);

	const [inProgress, setInProgress] = useState(false);
	const [showFullImage, setShowFullImage] = useState(true);
	const mountStatus = useSelector(selectMountStatus);
	const [mountDirection, setMountDirection] = useState(
		isEmpty(alignSettings) ? "West" : alignSettings.pAHDirection,
	);
	const [mountRotation, setMountRotation] = useState(
		isEmpty(alignSettings) ? 0 : alignSettings.pAHRotation,
	);
	const [speed, setSpeed] = useState(
		isEmpty(alignSettings) ? 0 : alignSettings.pAHMountSpeed,
	);
	// const [refresh, setRefresh] = useState(1);
	const refresh = 1;
	const [manualslew, setManualslew] = useState(
		isEmpty(alignSettings) ? false : alignSettings.pAHManualSlew,
	);
	const [slewRates, setSlewRates] = useState(null);
	// const [imageHeight, setImageHeight] = useState(250);
	// const [imageWidth, setImageWidth] = useState(400);

	const start = () =>
	{
		dispatch(polarActions.clearUpdatedErrors());
		dispatch(alignActions.setPAHSettings(targetPAHSettings));
		dispatch(polarActions.start());
		setInProgress(true);
	};

	const stop = () =>
	{
		if (status === "Refreshing") dispatch(polarActions.refreshingDone());
		else
		{
			dispatch(polarActions.stop());
			dispatch(alignActions.stop());
		}
		setInProgress(false);
	};

	const park = () =>
	{
		dispatch(mountActions.park());
	};

	// const handleTouch = (event) =>
	// {
	//     if (status === "Select Star")
	//     {
	//         const locationX = event.nativeEvent.layerX;
	//         const locationY = event.nativeEvent.layerY;

	//         const x = locationX / imageWidth;
	//         const y = locationY / imageHeight;

	//         if (x >= 0 && x <= 1 && y >= 0 && y <= 1)
	//             dispatch(polarActions.setCrosshair(x, y));
	//     }
	// };

	const handleChange = (data) =>
	{
		const payload = {
			mountDirection,
			mountSpeed,
			mountRotation,
			refresh,
			manualslew,
			...data,
		};

		if (status === "Refreshing") dispatch(polarActions.refresh(refresh));

		dispatch(alignActions.saveTargetPAHSettings(payload));
	};

	// on startup
	useEffect(() =>
	{
		if (!isEmpty(activeMount))
		{
			if (activeMount.hasSlewRates())
			{
				const slewRates = activeMount.slewRates().getRangeList();
				setSlewRates(slewRates);
			}
		}
		setInProgress(!inactiveStatus.includes(status));
	}, []);

	useEffect(() =>
	{
		setInProgress(!inactiveStatus.includes(status));
	}, [status, inProgress]);

	useEffect(() =>
	{
		let payload = {
			pAHDirection: mountDirection,
			pAHRotation: mountRotation,
			pAHManualSlew: manualslew,
			pAHMountSpeed: speed,
		};
		dispatch(alignActions.setAllSettings(payload));
	}, [mountDirection, mountRotation, manualslew, speed]);

	return (
		<Box
			sx={{
				display: "flex",
				flexDirection: "column",
				flex: 2,
				padding: "20px",
				overflow: "scroll",
				height: "100%",
			}}
		>
			<CloseButton onChange={onClose} />
			<Box sx={[styles.center, { flex: 1 }]}>
				<AlignImage sx={{ width: "500px" }} />
			</Box>
			{showFullImage && (
				<Box
					sx={[
						styles.row,
						{
							flex: 2,
							marginTop: "15px",
							borderTop: `.5px solid ${Palette.grey44}`,
						},
					]}
				>
					<Box
						sx={{
							width: "100%",
							rowGap: "16px",
							padding: "25px",
							flex: 0.9,
						}}
					>
						<Box
							sx={[
								styles.row,
								{ justifyContent: "space-between", paddingRight: "15px" },
							]}
						>
							<Box
								sx={{
									gap: "12px",
									alignItems: "center",
								}}
							>
								<Typography sx={{ color: "white", width: "max-content" }}>
									{s.ekos.collapse_polar.mount_direction}
								</Typography>
								<CustomizedSwitch
									options={[
										{ label: s.ekos.collapse_polar.west, value: "West" },
										{ label: s.ekos.collapse_polar.east, value: "East" },
									]}
									value={mountDirection}
									onChange={(value) =>
									{
										if (value === "West") setMountDirection("West");
										else setMountDirection("East");
									}}
								/>
							</Box>

							{/* Mount Speed */}
							{slewRates && (
								<Box
									sx={{
										display: "flex",
										gap: "12px",
										justifyContent: "start",
										alignItems: "center",
									}}
								>
									<Typography sx={{ color: "white", width: "max-content" }}>
										{s.ekos.controls_bar.mount_speed}
									</Typography>
									<SelectInput
										options={slewRates.map((speed, index) => ({
											label: speed,
											value: index,
										}))}
										onChange={(e) =>
										{
											handleChange({
												mountSpeed: e.value,
											});
											setSpeed(e.label);
										}}
										value={speed}
									/>
								</Box>
							)}
						</Box>
						<Box
							sx={[
								styles.row,
								{
									justifyContent: "space-between",
									marginTop: "10px",
									paddingRight: "15px",
								},
							]}
						>
							<Box
								sx={{
									gap: "12px",
								}}
							>
								<Typography sx={{ color: "white", width: "max-content" }}>
									{s.ekos.collapse_polar.mount_rotation}
								</Typography>
								<NumericControl
									initialValue={`${mountRotation || ""}`}
									onChange={(value) =>
									{
										setMountRotation(value);
									}}
									steps={[15, 15]}
									customLimit={[15, 60]}
								/>
							</Box>
							<Box
								sx={{
									justifyContent: "start",
									alignItems: "center",
								}}
							>
								<Typography sx={{ color: "white", width: "max-content" }}>
									{s.ekos.collapse_polar.manual_slew}
								</Typography>
								<CustomizedSwitch
									options={[
										{ label: s.general.on, value: true },
										{ label: s.general.off, value: false },
									]}
									value={manualslew}
									onChange={(value) =>
									{
										setManualslew(value);
									}}
								/>
							</Box>
						</Box>
					</Box>

					<Box
						sx={{
							display: "flex",
							gap: "8px",
							flexDirection: "column",
							borderLeft: `.5px solid ${Palette.grey44}`,
							borderRight: `.5px solid ${Palette.grey44}`,
							justifyContent: "space-around",
							flex: 0.1,
						}}
					>
						<IconButton
							sx={{
								backgroundColor: inProgress ? Palette.red : Palette.orange,
								width: "50px",
								height: "50px",
								marginLeft: "10px",
							}}
							onClick={inProgress ? stop : start}
						>
							{!inProgress ? (
								<PlayArrowIcon sx={{ color: "white", fontSize: "35px" }} />
							) : (
								<StopIcon sx={{ color: "white", fontSize: "35px" }} />
							)}
						</IconButton>

						{get(alignSettings, "pAHManualSlew", false) &&
							(status === "First Rotation" || status === "Second Rotation") && (
								<Box>
									<Button
										style={{
											height: "30px",
											width: "70px",
											marginTop: "10px",
										}}
										onClick={() => dispatch(polarActions.setManualSlewDone())}
									>
										<Icon name="check" color="black" size={25} />
									</Button>
								</Box>
							)}
						<Button
							sx={[
								!["Parking", "Parked", "Slewing"].includes(mountStatus)
									? {
											borderColor: "#f60",
											backgroundColor: "#f60",
											width: "45px",
											height: "45px",
											justifyContent: "center",
											alignSelf: "center",
										}
									: null,
							]}
							onClick={park}
						>
							<Typography
								sx={{
									textAlign: "center",
									color: "white",
									width: "max-content",
								}}
							>
								{s.ekos.capture_auto_calibration.park_mount}
							</Typography>
						</Button>
					</Box>

					<Box sx={{ flex: 0.9, padding: "25px" }}>
						<Typography sx={{ color: "white" }}>{message}</Typography>
					</Box>
				</Box>
			)}

			<Box
				sx={{
					marginTop: "10px",
				}}
			>
				<PolarStages />
			</Box>
			<Box sx={{ position: "absolute", bottom: "25px", right: "25px" }}>
				<Button onClick={() => setShowFullImage(!showFullImage)}>
					{showFullImage ? <VisibilityIcon /> : <VisibilityOffIcon />}
				</Button>
			</Box>
		</Box>
	);
};

export default Polar;
