import { get, isEmpty } from "lodash";
import NetInfo from "@react-native-community/netinfo";
import Zeroconf from "react-native-zeroconf";
import { Platform } from "react-native";
import api from "@common/shared/utils/api";
import { logError, logInfo } from "../../utils/logs";
import { deviceConstants } from "../constants";
import commands from "../../commands";
import { store } from "../store";
import { logout } from "./user.actions";
import { wssMessageSocketActions } from "./wssMessageSocketActions";
import { wssMediaSocketActions } from "./wssMediaSocketActions";
import s from "../../i18n/i18n";

const zeroconf = new Zeroconf();
export const deviceActions = {
	startScan,
	stopScan,
	addDevice,
	updateDevice,
	removeDevice,
	clearDevices,
	syncGPS,
	getDevices,
	getDevice,
	setKStarsStatus,
	setEkosLiveStatus,
	clearDriverConfigs,
	saveToken,
	sendPlanID,
	getConnectionStatus,
	logoutUserAccount,
	clearServerMessage,
};

function getDevices()
{
	return wssMessageSocketActions.sendText({}, commands.GET_DEVICES);
}

function getDevice(device, compact = false)
{
	return wssMessageSocketActions.sendText(
		{ device, compact },
		commands.DEVICE_GET,
	);
}

function getDeviceIP()
{
	return new Promise(async (resolve, reject) =>
	{
		try
		{
			const networkInfo = await NetInfo.fetch();
			const ip = networkInfo.details.ipAddress;
			resolve(ip);
		}
		catch (err)
		{
			reject(err);
			logError(`getDeviceIP Error: ${JSON.stringify(err)}`);
		}
	});
}

function scanSubnet(ip)
{
	return (dispatch) =>
	{
		// Make sure we don't process empty IP
		if (isEmpty(ip))
		{
			dispatch({
				type: deviceConstants.DEVICE_SCAN_TOGGLED,
				payload: false,
			});
			return;
		}
		// TODO need to handle IPv6
		let subnet = ip.slice(0, ip.lastIndexOf("."));
		let counter = 0;
		dispatch({ type: deviceConstants.DEVICE_SCAN_PROGRESS, payload: 1 });
		for (let i = 1; i < 256; i++)
		{
			let ip = `${subnet}.${i}`;
			api
				.getHostname(ip)
				.then((hostname) =>
				{
					let device = {
						hostname,
						ip,
						connected: false,
						reachable: true,
						registered: false,
						logged: false,
						manual: false,
						default: false,
						user: {},
					};

					dispatch({ type: deviceConstants.DEVICE_ADD, payload: device });
				})
				.catch((err) =>
				{
					logInfo(`No response from ${ip}`);
				})
				.finally(() =>
				{
					const isScanning = get(store.getState().devices, "isScanning", false);

					if (isScanning)
					{
						counter++;
						const percent = (counter / 255) * 100.0;
						if (percent % 10 === 0)
						{
							dispatch({
								type: deviceConstants.DEVICE_SCAN_PROGRESS,
								payload: percent,
							});
						}

						if (counter >= 255)
						{
							dispatch({
								type: deviceConstants.DEVICE_SCAN_TOGGLED,
								payload: false,
							});
						}
					}
				});
		}
	};
}

function startDeepScan()
{
	return async (dispatch) =>
	{
		try
		{
			const ip = await getDeviceIP();
			// If it is a 10.X.X.X type IP address and does not start with 10.250
			// then try to get an IP address from the OS directly
			if (isEmpty(ip))
			{
				// No network detected!
				dispatch({
					type: deviceConstants.DEVICE_SCAN_FAILED,
					payload: s.connect.device_scanner.no_network_found,
				});
			}
			else
			{
				dispatch({ type: deviceConstants.DEVICE_SCAN_TOGGLED, payload: true });
				dispatch(scanSubnet(ip));
			}
		}
		catch (error)
		{
			dispatch({
				type: deviceConstants.DEVICE_SCAN_FAILED,
				payload: s.connect.device_scanner.no_network_found + ": " + error,
			});
			logError(`startDeepScan error: ${error}`);
		}
	};
}

async function syncGPS(ip)
{
	try
	{
		const location = await api.getLocation();
		await api.setLocation(ip, location);
		await api.setTimeZone(ip);
		// Turn off NTP so that we can sync time.
		await api.setNTP(ip, false);
		// Now set Time
		await api.setTime(ip);
		// Now Sync KStars
		await api.syncKStarsTimeToNow(ip);
		// Turn NTP back on
		await api.setNTP(ip, true);
	}
	catch (error)
	{
		logError(`syncGPS Error: ${JSON.stringify(error)}`);
	}
}

function stopScan()
{
	return (dispatch) =>
	{
		api.cancelAllRequests();
		dispatch({ type: deviceConstants.DEVICE_SCAN_TOGGLED, payload: false });
	};
}

function addDevice(oneDevice)
{
	return { type: deviceConstants.DEVICE_ADD, payload: oneDevice };
}

function clearServerMessage()
{
	return { type: deviceConstants.CLEAR_SERVER_MESSAGE, payload: "" };
}

function updateDevice(oneDevice)
{
	return { type: deviceConstants.DEVICE_UPDATE, payload: oneDevice };
}

function removeDevice(ip)
{
	return (dispatch) =>
	{
		dispatch(logout());
		dispatch({ type: deviceConstants.DEVICE_REMOVE, payload: { ip } });
	};
}

function clearDevices()
{
	return { type: deviceConstants.DEVICE_CLEAR_ALL };
}

function scanHotSpot()
{
	const ip = "10.250.250.1";

	return (dispatch) =>
	{
		api
			.getHostname(ip)
			.then((hostname) =>
			{
				let device = {
					hostname,
					ip,
					connected: false,
					connecting: false,
					reachable: true,
					registered: false,
					logged: false,
					manual: false,
					default: false,
					user: {},
				};

				dispatch({ type: deviceConstants.DEVICE_ADD, payload: device });

				// If it is the HotSpot IP address then no need to search further
				dispatch({
					type: deviceConstants.DEVICE_SCAN_PROGRESS,
					payload: 100.0,
				});
				dispatch({ type: deviceConstants.DEVICE_SCAN_TOGGLED, payload: false });
			})
			.catch((err) =>
			{
				logInfo(`No response from ${ip}`);
			});
	};
}

function startScan()
{
	let deviceDetected = 0;

	// JM 2020-11-08: Apparently zeroconf crashes iOS, so we start
	// deep scan immediately
	if (Platform.OS === "android")
	{
		return async (dispatch) =>
		{
			dispatch(scanHotSpot());
			dispatch(startDeepScan());
		};
	}

	return async (dispatch) =>
	{
		const foundSub = zeroconf.on("resolved", async (service) =>
		{
			logInfo(`Service Resolved: ${JSON.stringify(service)}`);
			// Only select SM ports
			if (service.port !== 8624 && service.port !== 3000) return;
			const ip = service.addresses[0];

			try
			{
				const hostname = await api.getHostname(ip);
				let device = {
					hostname,
					ip,
					connected: false,
					connecting: false,
					reachable: true,
					registered: false,
					logged: false,
					manual: false,
					default: false,
					user: {},
				};

				deviceDetected++;
				dispatch({ type: deviceConstants.DEVICE_ADD, payload: device });
			}
			catch (error)
			{
				logInfo(`${ip} : No response. ${JSON.stringify(error)}`);
			}
		});

		logInfo("Starting Zeroconf Search...");
		zeroconf.on("start", () =>
		{
			logInfo("Zeroconf: Scan started...");
		});

		zeroconf.scan("http", "tcp", "local.");
		dispatch(scanHotSpot());
		dispatch({ type: deviceConstants.DEVICE_SCAN_TOGGLED, payload: true });

		let counter = 0,
			maxCount = 30;
		let timerID = setInterval(() =>
		{
			const isScanning = get(store.getState().devices, "isScanning", false);
			if (!isScanning)
			{
				logInfo("Scanning was externally aborted.");
				zeroconf.stop();
				zeroconf.on("stop", () =>
				{
					logInfo("Zeroconf: Scan stopped.");
				});
				foundSub.removeDeviceListeners();
				clearInterval(timerID);
				return;
			}

			counter++;
			dispatch({
				type: deviceConstants.DEVICE_SCAN_PROGRESS,
				payload: (counter / 30.0) * 100.0,
			});

			if (counter === maxCount)
			{
				logInfo("Stopping Zeroconf Search...");
				// DNSSD.stopSearch();
				// foundSub.remove();
				foundSub.removeDeviceListeners();
				clearInterval(timerID);

				// We're still scanning, stop it.
				if (deviceDetected === 0)
				{
					dispatch(startDeepScan());
				}
				else if (isScanning)
				{
					dispatch({
						type: deviceConstants.DEVICE_SCAN_TOGGLED,
						payload: false,
					});
				}
			}
		}, 1000);
	};
}

function setKStarsStatus(status)
{
	return { type: deviceConstants.KSTARS_STATUS, payload: status };
}

function setEkosLiveStatus(status)
{
	return { type: deviceConstants.EKOSLIVE_STATUS, payload: status };
}

function logoutUserAccount()
{
	return { type: deviceConstants.LOGOUT_USER_ACCOUNT };
}

async function clearDriverConfigs(ip)
{
	try
	{
		await api.deleteDriverConfigs(ip);
	}
	catch (error)
	{
		logError(`clearDriverConfigs Error: ${JSON.stringify(error)}`);
	}
}

function saveToken(token)
{
	return (dispatch) =>
	{
		dispatch(
			wssMediaSocketActions.sendText(token, commands.SAVE_NOTIFICATION_TOKEN),
		);
		dispatch({ type: commands.SAVE_NOTIFICATION_TOKEN, payload: token });
	};
}

function sendPlanID(id)
{
	return (dispatch) =>
	{
		dispatch(wssMediaSocketActions.sendText(id, commands.SAVE_USER_PLAN_ID));
	};
}

function getConnectionStatus()
{
	return wssMessageSocketActions.sendText({}, commands.GET_CONNECTION);
}
