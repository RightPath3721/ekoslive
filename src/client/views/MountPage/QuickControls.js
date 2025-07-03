import { Box, Checkbox, IconButton, Typography } from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import React, { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import CustomizedSwitch from "../../Components/CustomSwitch";
import Dropdown from "../../Components/Dropdown";
import { mountActions, opticalTrainActions } from "@redux/actions";
import {
	selectTrains,
	selectTrainDeviceName,
	selectMountStatus,
	selectTrainName,
} from "@redux/selectors";
import s from "@common/shared/i18n/i18n";
import { trainModules, DEVICE_TYPE } from "@indi/enums";
import { get } from "lodash";

const QuickControls = ({ toggleOpticalTrain }) =>
{
	const dispatch = useDispatch();
	const allTrains = useSelector(selectTrains);
	const activeMount = useSelector((state) =>
		selectTrainDeviceName(state, {
			trainType: trainModules.MountOpticalTrain,
			deviceType: DEVICE_TYPE.MOUNT,
		}),
	);
	const activeTrain = useSelector((state) =>
		selectTrainName(state, { trainType: trainModules.MountOpticalTrain }),
	);

	const mountStatus = useSelector(selectMountStatus);
	const mountSettings = useSelector((state) => state.ekos.mountSettings);

	const [source, setSource] = useState({
		timeSource: get(mountSettings, "timeSource", "KStars"),
		locationSource: get(mountSettings, "locationSource", "KStars"),
		useTime: get(mountSettings, "useTimeUpdate", false),
		useLocation: get(mountSettings, "useGeographicUpdate", false),
		sourceArray: [
			{ label: "KStars", value: "KStars" },
			{ label: activeMount, value: activeMount },
		],
	});

	const { timeSource, locationSource, useTime, useLocation, sourceArray } =
		source;

	const setSettings = (key, value) =>
	{
		dispatch(mountActions.setAllSettings({ [key]: value }));
		dispatch(mountActions.getAllSettings());
	};
	const toggleTracking = (track) =>
	{
		if (track && mountStatus !== "Tracking")
			dispatch(mountActions.setTracking(true));

		if (!track && mountStatus === "Tracking")
			dispatch(mountActions.setTracking(false));
	};

	const toggleMountPark = (park) =>
	{
		if (park && mountStatus !== "Parked") dispatch(mountActions.park());

		if (!park && mountStatus === "Parked") dispatch(mountActions.unpark());
	};

	return (
		<Box>
			<Box sx={[LOCAL_STYLES.gridItem]}>
				<Typography sx={{ color: "white", width: "130px" }}>
					{s.general.train}
				</Typography>
				<Dropdown
					width="175px"
					options={allTrains}
					value={activeTrain}
					onChange={(e) =>
					{
						const payload = {
							name: e.label,
							module: "mount",
						};
						dispatch(opticalTrainActions.setTrain(payload));
						dispatch(opticalTrainActions.getAllTrains());
					}}
				/>
				<IconButton
					onClick={() => toggleOpticalTrain()}
					sx={[
						LOCAL_STYLES.imageButton,
						{ backgroundColor: "#FFFCFA1A", borderRadius: "4px" },
					]}
				>
					<EditIcon sx={{ color: "#CECECE", fontSize: 25 }} />
				</IconButton>
			</Box>
			<Box sx={[LOCAL_STYLES.gridItem]}>
				<Typography sx={{ color: "white", width: "130px" }}>
					{s.ekos.collapse_mount.time_source}
				</Typography>
				<Dropdown
					options={sourceArray}
					style={{ marginRight: "15px" }}
					width="175px"
					value={timeSource}
					onChange={(data) =>
					{
						setSource({ ...source, timeSource: data.label });
						setSettings("timeSource", data.value);
					}}
				/>
				<Checkbox
					checked={useTime}
					onClick={() =>
					{
						setSource({ ...source, useTime: !useTime });
						setSettings("useTimeUpdate", !useTime);
					}}
				/>
			</Box>
			<Box sx={[LOCAL_STYLES.gridItem]}>
				<Typography sx={{ color: "white", width: "130px" }}>
					{s.ekos.collapse_mount.location_source}
				</Typography>
				<Dropdown
					options={sourceArray}
					style={{ marginRight: "15px" }}
					width="175px"
					value={locationSource}
					onChange={(data) =>
					{
						setSource({ ...source, locationSource: data.label });
						setSettings("locationSource", data.value);
					}}
				/>
				<Checkbox
					checked={useLocation}
					onClick={() =>
					{
						setSource({ ...source, useLocation: !useLocation });
						setSettings("useGeographicUpdate", !useLocation);
					}}
				/>
			</Box>

			<Box sx={[LOCAL_STYLES.gridItem]}>
				<Typography sx={{ color: "white", width: "130px" }}>
					{s.statuses.Tracking}
				</Typography>
				<CustomizedSwitch
					options={[
						{ label: s.general.on, value: true },
						{ label: s.general.off, value: false },
					]}
					onChange={(value) =>
					{
						toggleTracking(value);
					}}
					value={mountStatus === "Tracking"}
				/>
			</Box>

			<Box sx={[LOCAL_STYLES.gridItem]}>
				<Typography sx={{ color: "white", width: "130px" }}>
					{s.statuses.Parking}
				</Typography>
				<CustomizedSwitch
					options={[
						{ label: s.general.parked, value: true },
						{ label: s.general.unparked, value: false },
					]}
					onChange={(value) =>
					{
						toggleMountPark(value);
					}}
					value={mountStatus === "Parked"}
				/>
			</Box>
		</Box>
	);
};

const LOCAL_STYLES = {
	gridItem: {
		display: "flex",
		alignItems: "center",
		gap: "16px",
		marginTop: "10px",
	},
	imageButton: { width: "36px", height: "36px", minWidth: "auto", padding: 0 },
};

export default QuickControls;
