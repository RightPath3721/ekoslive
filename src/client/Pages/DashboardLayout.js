import React, { useState, useEffect, Suspense } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useLocation } from "react-router-dom";
import { Outlet } from "react-router-dom";
import { isEmpty } from "lodash";

import {
	wssMessageSocketActions,
	wssMediaSocketActions,
	indiActions,
	setupActions,
	captureActions,
	optionActions
} from "@redux/actions";
import { deviceActions } from "@redux/actions/devices.web.actions";
import { userConstants } from "@redux/constants";
import commands from "@commands";
import { trainModules, DEVICE_TYPE } from "@indi/enums";
import Notifier from "@components/Notifier";
import EkosDialogHandler from "@components/EkosDialogHandler";
import s from "@common/shared/i18n/i18n";

//Selectors
import {
	selectIsLoggedIn,
	selectSocketsConnecting,
	selectSocketsConnected,
	selectConnectionOnline,
	selectDevicesInfo,
	selectUser,
	selectDevicesNames,
	selectTrainDeviceName,
	selectActiveKStarID,
} from "@redux/selectors";

const cameraProperties = [
	"CCD_TEMPERATURE",
	"CCD_BINNING",
	"CCD_CONTROLS",
	"CCD_GAIN",
	"CCD_OFFSET",
	"CCD_EXPOSURE",
	"CCD_INFO",
	"CCD_FRAME",
	"CCD_CAPTURE_FORMAT",
	"CCD_VIDEO_STREAM",
	"RECORD_STREAM",
	"CCD_FRAME",
	"CCD_ISO",
	"FPS",
];

const DashboardLayout = ({renter}) =>
{
	const dispatch = useDispatch();
	const location = useLocation();

	// User authentication and is logged in. We have users objects.
	const loggedIn = useSelector(selectIsLoggedIn);
	// Websockets are trying to connect to online server
	const socketsConnecting = useSelector(selectSocketsConnecting);
	// Websockets are connected to online server
	const socketsConnected = useSelector(selectSocketsConnected);
	// Ekos profile is running
	const ekosProfileRunning = useSelector(selectConnectionOnline);
	const activeKstarID = useSelector(selectActiveKStarID);
	const captureDirectory = useSelector(state => state.ekos.captureSettings.fileDirectoryT);

	const devicesInfo = useSelector(selectDevicesInfo);
	const activeCameraName = useSelector((state) =>
		selectTrainDeviceName(state, {
			trainType: trainModules.CaptureOpticalTrain,
			deviceType: DEVICE_TYPE.CAMERA,
		}),
	);
	const user = useSelector(selectUser);

	// Subscribe to CONNECTION property for all devices since this is a critical function
	const deviceNames = useSelector(selectDevicesNames);

	const [subscribedDevices, setSubscribedDevices] = useState([]);
	const [requestedDevices, setRequestedDevices] = useState([]);
	const [subscribedCamera, setSubscribedCamera] = useState("--");

	useEffect(() => {
		if (renter) {
			dispatch(optionActions.setOption(s.settings.cloud_storage, true));
		}
	}, []);

	/*
	 * Subscribe to CONNECTION property for all devices
	 */
	useEffect(() =>
	{
		if (ekosProfileRunning)
		{
			let toSubscribe = [];
			for (const oneDevice of deviceNames)
			{
				// Check whether we're already subscribed or not.
				if (subscribedDevices.includes(oneDevice) === false)
				{
					toSubscribe.push(oneDevice);
					dispatch(
						indiActions.subscribeToProperty(oneDevice, "CONNECTION", true),
					);
				}
			}

			setSubscribedDevices([...subscribedDevices, ...toSubscribe]);
		}
	}, [deviceNames, ekosProfileRunning]);

	useEffect(() => {
		if (renter && captureDirectory && !captureDirectory.includes(user.username)) {
			dispatch(captureActions.setAllSettings({
				"fileDirectoryT": `${captureDirectory}/${user.username}`
			}));
		}
	}, [renter, captureDirectory]);

	useEffect(() =>
	{
		if (isEmpty(activeCameraName) || activeCameraName === "--") return;

		/// If we have existing subscribed properties, let's unsubscribe first.
		if (subscribedCamera !== "--")
			dispatch(
				indiActions.unsubscribeToProperty(subscribedCamera, cameraProperties),
			);

		if (ekosProfileRunning)
		{
			dispatch(
				indiActions.subscribeToProperty(
					activeCameraName,
					cameraProperties,
					true,
				),
			);
			setSubscribedCamera(activeCameraName);
		}
	}, [activeCameraName, ekosProfileRunning]);

	/*
	 * Action to take when logged state or websocket state changes
	 */
	useEffect(() =>
	{
		// Are we logged in?
		if (loggedIn === false)
		{
			// On logout, we must disconnect sockets
			if (socketsConnected)
			{
				dispatch(wssMessageSocketActions.disconnect());
				dispatch(wssMediaSocketActions.disconnect());
			}
			return;
		}
		

		// If sockets are off, we must reconnect.
		if (socketsConnected === false && renter) {
			const queryParams = new URLSearchParams(location.search);
			const machineId = queryParams.get('machine_id');
			const observatoryName = queryParams.get('observatory');
			const observatoryId = location.pathname.substring(1); // Remove the leading slash
			
			if (machineId && observatoryName) {
				dispatch(wssMessageSocketActions.connect(user, observatoryName, machineId));
				dispatch(wssMediaSocketActions.connect(user, observatoryName, machineId));
				localStorage.setItem("currentUser", JSON.stringify(user));
				if (machineId)
				{
					dispatch(
						wssMessageSocketActions.sendText(
							machineId,
							commands.SET_ACTIVE_KSTARS_CONNECTION,
						),
					);
					dispatch(
						wssMediaSocketActions.sendText(
							machineId,
							commands.SET_ACTIVE_KSTARS_CONNECTION,
						),
					);
				}
			}
		}
		else if (socketsConnected === false)
		{
			if (!isEmpty(user) && socketsConnecting === false)
			{
				dispatch(wssMessageSocketActions.connect(user, null, activeKstarID));
				dispatch(wssMediaSocketActions.connect(user, null, activeKstarID));
				localStorage.setItem("currentUser", JSON.stringify(user));
				if (activeKstarID && socketsConnected)
				{
					dispatch(
						wssMessageSocketActions.sendText(
							activeKstarID,
							commands.SET_ACTIVE_KSTARS_CONNECTION,
						),
					);
					dispatch(
						wssMediaSocketActions.sendText(
							activeKstarID,
							commands.SET_ACTIVE_KSTARS_CONNECTION,
						),
					);
				}
			}
		}
		else dispatch(deviceActions.getConnectionStatus());
	}, [loggedIn, socketsConnected, renter]);

	/*
	 * Whenever we get a new device info, we ask to retrieve its properties
	 */
	useEffect(() =>
	{
		if (!isEmpty(devicesInfo))
		{
			let newDevices = [];
			for (const oneInfo of devicesInfo)
			{
				if (requestedDevices.includes(oneInfo.name)) continue;
				dispatch(deviceActions.getDevice(oneInfo.name));
				newDevices.push(oneInfo.name);
			}

			setRequestedDevices([...requestedDevices, newDevices]);
		}
	}, [devicesInfo]);

	useEffect(() =>
	{
		if (socketsConnected) dispatch(setupActions.getLocation());
	}, [socketsConnected]);

	useEffect(() =>
	{
		const currentUser = localStorage.getItem("currentUser");
		if (currentUser && currentUser !== "null")
		{
			const user = JSON.parse(currentUser);
			dispatch({ type: userConstants.USER_LOGIN_SUCCEEDED, user });
		}
	}, []);

	return (
		<>
			<Suspense>
				<Outlet />
			</Suspense>
			<Notifier />
			<EkosDialogHandler />
		</>
	);
};

export default DashboardLayout;
