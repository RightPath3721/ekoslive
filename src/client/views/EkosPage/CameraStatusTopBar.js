import React, { useCallback, useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { get, isEmpty } from "lodash";
import { Grid, Typography, Button } from "@mui/material";
import Barbadge from "../../Components/Barbadge";
import Icon from "../../Components/Icon";
import { styles } from "../../shared/styles";
import { Palette } from "@common/shared/common/styles";
import Reactor from "@indi/events";
import { captureActions } from "@redux/actions";
import {
	selectTrainDevice,
	selectCaptureStatus,
	selectWsMediaLoading,
	selectDeviceIP,
	selectSavedNotifications,
} from "@redux/selectors";
import { trainModules, DEVICE_TYPE, ModuleNames } from "@indi/enums";
import focus from "@images/focus.webp";
import align from "@images/align.webp";
import capture from "@images/capture.webp";
import guide from "@images/guide.webp";
import scheduler from "@images/scheduler.webp";
import mount from "@images/mount-on.webp";
import observatory from "@images/observatory.webp";
import EkosModal from "@components/EkosModal";
import s from "@common/shared/i18n/i18n";
import { returnSchedulerStatus } from "@common/shared/common/common";

const LOCAL_STYLES = {
	text: {
		fontSize: "1rem",
		marginLeft: "6px",
	},
	row: {
		justifyContent: "center",
		flexDirection: "row",
		alignItems: "center",
	},
};

const FilterNames = React.lazy(() => import("./FilterNames"));

const icons = {
	focus,
	align,
	guide,
	capture,
	mount,
	observatory,
	scheduler,
};

const CameraStatusTopBar = ({ showHistory }) =>
{
	const activeCamera = useSelector((state) =>
		selectTrainDevice(state, {
			trainType: trainModules.CaptureOpticalTrain,
			deviceType: DEVICE_TYPE.CAMERA,
		}),
	);

	const dispatch = useDispatch();
	const status = useSelector(selectCaptureStatus);
	const overallStatus = useSelector(
		(state) => state.status.overallStatus.status,
	);
	const overallSource = useSelector(
		(state) => state.status.overallStatus.source,
	);
	const captureStatus = useSelector((state) => state.status.capture.status);
	const statusTimeout = useRef(0);

	const loading = useSelector(selectWsMediaLoading);
	const activeFilterWheel = useSelector((state) =>
		selectTrainDevice(state, {
			trainType: trainModules.CaptureOpticalTrain,
			deviceType: DEVICE_TYPE.FILTER_WHEEL,
		}),
	);
	const savedNotifications = useSelector(selectSavedNotifications);
	const deviceIP = useSelector(selectDeviceIP);
	const [temperature, setTemperature] = useState(
		isEmpty(activeCamera) ? null : get(activeCamera, "getTemperature", ""),
	);
	const [displayStatus, setDisplayStatus] = useState(s.statuses.Idle);
	const [displaySource, setDisplaySource] = useState(icons.capture);
	const [showFilterNames, setShowFilterNames] = useState(false);
	const white70IconColor = "white70Icon";

	const [activeFilterName, setActiveFilterName] = useState("");
	const filterwheelUUID = "filter";
	const cameraUUID = "camera";

	const refreshStatus = () =>
	{
		if (
			!["Idle", "Complete", "Aborted", "Suspended", "Paused"].includes(
				captureStatus,
			)
		)
		{
			setDisplayStatus(captureStatus);
			setDisplaySource(icons.capture);
		}
	};

	/**
	 * Pass enum to get the Scheduler status
	 * @param {*} status
	 */
	const fetchSchedulerStatus = (status) =>
	{
		if (overallSource === ModuleNames.scheduler)
			setDisplayStatus(returnSchedulerStatus(status));
		else setDisplayStatus(status);
	};

	/**
	 * Capture status is the highest priority and supersedes all other statuses.
	 */
	useEffect(() =>
	{
		fetchSchedulerStatus(overallStatus);
		setDisplaySource(icons[overallSource]);
		clearTimeout(statusTimeout.current);
		statusTimeout.current = setTimeout(refreshStatus, 3000);
	}, [overallStatus, captureStatus]);

	/**
	 * Update temperature from the given property.
	 * @param device
	 * @param property
	 */
	const updateTemperature = (device, property) =>
	{
		// Make sure the temperature is for our active camera
		if (device.name === property.device)
			setTemperature(property.numbers[0].value);
	};

	/**
	 * Watch for property updates registered in the addEventListener.
	 * @type {(function(*=): void)|*}
	 */
	const onPropertyUpdate = useCallback((device, property) =>
	{
		// Must use timeout since we can not update any state value in a callback
		if (property.name === "CCD_TEMPERATURE")
			setTimeout(updateTemperature, 10, device, property);
	});

	/**
	 * Update FilterWheel Name
	 * @param {*} device
	 * @param {*} property INDI Driver Property
	 */
	const updateFilterWheelName = (device, property) =>
	{
		// We need to update the state. So, just use the name from activeFilterWheel
		if (device.name === property.device)
		{
			const filters = activeFilterWheel.availableFilters();
			const index = property.numbers[0].value;
			if (filters && index > 0 && index <= filters.length)
				setActiveFilterName(filters[index - 1].text);
		}
	};

	/**
	 * Watch for FilterWheel property updates
	 */
	const onFilterWheelPropertyUpdate = useCallback((device, property) =>
	{
		// Must use timeout since we can not update any state value in a callback
		if (property.name === "FILTER_SLOT")
			setTimeout(updateFilterWheelName, 10, device, property);
		else if (property.name === "FILTER_NAME")
		{
			const filter = device.activeFilter();
			setActiveFilterName(get(filter, "targetText", "--"));
		}
	});

	const useEffectAsync = (effect, inputs) =>
	{
		useEffect(() =>
		{
			effect();
		}, inputs);
	};

	/**
	 *
	 */
	useEffectAsync(async () =>
	{
		if (activeCamera)
		{
			if (activeCamera.hasTemperature())
			{
				setTemperature(get(activeCamera, "getTemperature", ""));
				Reactor.addEventListener(
					"propertyUpdate",
					onPropertyUpdate,
					activeCamera,
				);
			}

			if (activeCamera.isDSLR())
			{
				const pixelWH = activeCamera.getPixelWH();
				if (isEmpty(pixelWH) || pixelWH.width.value === 0)
				{
					try
					{
						const info = await api.queryCameraInfo(deviceIP, activeCamera.name);
						dispatch(
							profileActions.saveDSLRSettings({
								model: activeCamera.name,
								width: Number(info.width),
								height: Number(info.height),
								pixelw: Number(info.pitch),
								pixelh: Number(info.pitch),
							}),
						);
						dispatch(captureActions.resetDSLRInfo());
					}
					catch (err)
					{
						LOG(
							"Failed to query camera info for camera " +
								this.props.dslrInfo +
								": " +
								err,
						);
					}
				}
			}

			if (activeFilterWheel)
			{
				setActiveFilterName(
					get(activeFilterWheel.activeFilter(), "text", "N/A"),
				);
				Reactor.addEventListener(
					"propertyUpdate",
					onFilterWheelPropertyUpdate,
					activeFilterWheel,
					filterwheelUUID,
				);
			}

			return () =>
			{
				Reactor.removeEventListener("propertyUpdate", cameraUUID);
				Reactor.removeEventListener("propertyUpdate", filterwheelUUID);
			};
		}
	}, [activeCamera, activeFilterWheel]);

	if (
		isEmpty(activeCamera) ||
		isEmpty(status) ||
		activeCamera.isConnected() === false
	)
		return (
			<Typography sx={[LOCAL_STYLES.text, { padding: "5px" }]}>
				{s.status.no_camera_detected}
			</Typography>
		);

	return (
		<Grid container sx={[{ justifyContent: "space-evenly" }]}>
			<Grid item sx={[styles.center]}>
				<Icon
					name="camera"
					color={loading ? Palette.yellow : Palette.orange}
					size="20px"
				/>
				<Typography sx={[LOCAL_STYLES.text]}>
					{activeCamera?.name?.substring(0, 16)}
				</Typography>
			</Grid>

			{!isEmpty(activeFilterWheel) &&
				get(activeFilterWheel, "activeFilter", "") && (
					<Grid item sx={[styles.center, { padding: 0 }]}>
						<Button
							sx={{ padding: 0 }}
							onClick={() => setShowFilterNames(true)}
						>
							<Icon name="filter" color={Palette.orange} size="20px" />
							<Typography sx={[LOCAL_STYLES.text]}>
								{activeFilterName}
							</Typography>
						</Button>
					</Grid>
				)}

			{showFilterNames && (
				<EkosModal
					initialValue={{ x: "30%", y: "10%" }}
					onClose={() => setShowFilterNames(false)}
					outsideClick={false}
				>
					<FilterNames />
				</EkosModal>
			)}

			{get(activeCamera, "hasTemperature", false) &&
				temperature !== null &&
				temperature >= -100 &&
				temperature <= 100 && (
					<Grid item sx={styles.center}>
						<Icon name="temperature" color={Palette.orange} size="20px" />
						<Typography sx={[LOCAL_STYLES.text]}>
							{parseInt(temperature)}
						</Typography>
					</Grid>
				)}

			<Grid
				item
				sx={[
					styles.center,
					{
						cursor: savedNotifications.length > 0 ? "pointer" : "default",
						padding: 0,
					},
				]}
				onClick={() => savedNotifications.length && showHistory(true)}
			>
				<Barbadge source={displaySource} style={{ width: "120px" }}>
					{displayStatus}
				</Barbadge>
			</Grid>
		</Grid>
	);
};

export default CameraStatusTopBar;
