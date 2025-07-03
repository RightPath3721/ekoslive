// noinspection JSBitwiseOperatorUsage

import { difference, find, findIndex, get, isEmpty, union } from "lodash";
import { WEBSOCKET_CLOSED, WEBSOCKET_MESSAGE } from "redux-websocket";
import
{
	AO,
	Auxiliary,
	BitFlag,
	Camera,
	Correlator,
	Detector,
	Dome,
	DustCap,
	FilterWheel,
	Focuser,
	GPS,
	Guider,
	LightBox,
	Mount,
	Rotator,
	Spectograph,
	Weather,
} from "../../indi/devices";
import commands from "../../commands";
import { deviceType } from "../../indi/enums";
import { indiConstants } from "../constants";

/**
 * Has all of the Information related to the Devices connected to SM
 * 
 **********Sample in JSON form**********
 * {
  "logs": {
	"Telescope Simulator": [
	  "2024-03-20T13:32:44: [SCOPE] mountToApparentRaDec 90.000000, 90.000000 to ha 153.434879, ra -133.976438, 89.776393 ",
	]
  },
  "permanent_subscriptions": [],
  "devices": [],
  "device_info": [
	{
	  "version": "1.0",
	  "interface": 5,
	  "name": "Telescope Simulator",
	  "connected": true
	},
	{
	  "version": "1.0",
	  "interface": 8,
	  "name": "Focuser Simulator",
	  "connected": true
	},
  ]
}
 */
const initialState = {
	// Status of the device i.e Telescope Simulator, version 1.0, connected true etc..
	device_info: [],

	// All INDI devices and it's Child properties
	devices: [],

	// We subscribe to the Properties initially, so we can access the Device's property
	permanent_subscriptions: [],

	// Recent Logs for the modules are saved here and we display them in INDI Module
	logs: {},
	activeDevice: "",
	activeGroup: {},

	// Need refresh due to DRIVER_INFO getting updated
	devicesNeedingRefresh: [],
};

// Check if device in container, if yes, then replace existing device
// If not, then append it
const appendDevice = (container, device) =>
{
	const index = findIndex(container, (oneDevice) =>
	{
		return oneDevice.name === device.name && oneDevice.type === device.type;
	});

	if (index === -1) container.push(device);
	else container.splice(index, 1, device);
};

export const indi = (state = initialState, action) =>
{
	switch (action.type)
	{
		case commands.DEVICE_PROPERTY_SUBSCRIBE:
			{
				if (action.payload.permanent)
				{
					const existingSub = state.permanent_subscriptions.find(
						(oneSub) => oneSub.name === action.payload.device,
					);
					const properties =
						action.payload.property instanceof Array
							? action.payload.property
							: [action.payload.property];
					const existingSubIndex = state.permanent_subscriptions.findIndex(
						(oneSub) => oneSub.name === action.payload.device,
					);
					const newSub = {
						name: action.payload.device,
						properties: union(properties, existingSub?.properties),
					};
					return {
						...state,
						permanent_subscriptions:
							existingSubIndex === -1
								? [...state.permanent_subscriptions, newSub]
								: state.permanent_subscriptions.map((oneSub) =>
									oneSub.name === newSub.name ? newSub : oneSub,
								),
					};
				}
				return state;
			}

		case commands.DEVICE_PROPERTY_UNSUBSCRIBE:
			{
				const existingSub = state.permanent_subscriptions.find(
					(oneSub) => oneSub.name === action.payload.device,
				);
				if (isEmpty(existingSub)) return state;

				const properties =
					action.payload.property instanceof Array
						? action.payload.property
						: [action.payload.property];
				const newSub = {
					name: existingSub.name,
					properties: difference(existingSub.properties, properties),
				};
				return {
					...state,
					permanent_subscriptions: state.permanent_subscriptions.map((oneSub) =>
						oneSub.name === newSub.name ? newSub : oneSub,
					),
				};
			}

		case indiConstants.SET_INDI_PARAMETER_VALUE:
			return { ...state, ...action.payload };

		case indiConstants.CLEAR_DEVICES_NEEDING_REFRESH:
			// Only update if the array isn't already empty
			if (state.devicesNeedingRefresh.length === 0)
			{
				return state;
			}
			return { ...state, devicesNeedingRefresh: [] };

		case WEBSOCKET_MESSAGE:
			//   if (action.payload.event.target.url.includes("/message/user") === false) return state;
			//console.log("Server Message with type:" + message.type);
			if (
				get(action, "payload.event.target.url", "").includes(
					"/message/user",
				) === false
			)
			{
				return state;
			}
			const message = JSON.parse(action.payload.data);
			// console.warn(message.type, message.payload);
			switch (message.type)
			{
				case commands.GET_DEVICES:
					return { ...state, device_info: message.payload, devices: [] };

				case commands.DEVICE_MESSAGE:
					{
						let device = get(message.payload, "device", "");
						if (isEmpty(state.logs[device]))
						{
							return {
								...state,
								logs: { ...state.logs, [device]: [message.payload.message] },
							};
						}
						else
						{
							let arr = state.logs[device];
							if (arr.length >= 20 && !isEmpty(arr)) arr.shift();

							// Also reverse an array to show the latest logs on the top
							return {
								...state,
								logs: {
									...state.logs,
									[device]: [message.payload.message, ...arr],
								},
							};
						}
					}
				case commands.DEVICE_GET:
					{
						// let deviceName = message.payload[groupIndex].texts[groupNameIndex].value;
						let newDevice = message.payload;
						let existingDevices = state.devices;

						// 1. Find the property called DRIVER_INFO for the device
						const driverInfoProperty = find(newDevice.properties, (prop) =>
						{
							return prop.name === "DRIVER_INFO";
						});

						// 2. Check if it's initialized, if not, then ignore it
						if (driverInfoProperty === undefined) return { ...state };

						// 3. Get the Device Interface from the property
						const newDeviceInterface = parseInt(driverInfoProperty.texts[3].text);

						// 4. Classify the Device according to it's Device Interface
						//    If the Device already exists in our devices list, then update its information,
						//    else, add the new device

						// Mount
						if (newDeviceInterface & BitFlag.TELESCOPE_INTERFACE)
						{
							const newMount = new Mount(
								newDevice.device,
								newDevice.properties,
								deviceType.MOUNT,
							);
							appendDevice(existingDevices, newMount);
						}
						// Camera
						if (newDeviceInterface & BitFlag.CCD_INTERFACE)
						{
							const newCamera = new Camera(
								newDevice.device,
								newDevice.properties,
								deviceType.CAMERA,
							);
							appendDevice(existingDevices, newCamera);
						}
						// Guider
						if (newDeviceInterface & BitFlag.GUIDER_INTERFACE)
						{
							const newGuider = new Guider(
								newDevice.device,
								newDevice.properties,
								deviceType.GUIDER,
							);
							appendDevice(existingDevices, newGuider);
						}
						// Focuser
						if (newDeviceInterface & BitFlag.FOCUSER_INTERFACE)
						{
							appendDevice(
								existingDevices,
								new Focuser(
									newDevice.device,
									newDevice.properties,
									deviceType.FOCUSER,
								),
							);
						}
						// Filter Wheel
						if (newDeviceInterface & BitFlag.FILTER_INTERFACE)
						{
							appendDevice(
								existingDevices,
								new FilterWheel(
									newDevice.device,
									newDevice.properties,
									deviceType.FILTER,
								),
							);
						}
						// Dome
						if (newDeviceInterface & BitFlag.DOME_INTERFACE)
						{
							appendDevice(
								existingDevices,
								new Dome(newDevice.device, newDevice.properties, deviceType.DOME),
							);
						}
						// GPS
						if (newDeviceInterface & BitFlag.GPS_INTERFACE)
						{
							appendDevice(
								existingDevices,
								new GPS(newDevice.device, newDevice.properties, deviceType.GPS),
							);
						}
						// Weather
						if (newDeviceInterface & BitFlag.WEATHER_INTERFACE)
						{
							appendDevice(
								existingDevices,
								new Weather(
									newDevice.device,
									newDevice.properties,
									deviceType.WEATHER,
								),
							);
						}
						// AO
						if (newDeviceInterface & BitFlag.AO_INTERFACE)
						{
							appendDevice(
								existingDevices,
								new AO(newDevice.device, newDevice.properties, deviceType.AO),
							);
						}
						// Dust Cap
						if (newDeviceInterface & BitFlag.DUSTCAP_INTERFACE)
						{
							appendDevice(
								existingDevices,
								new DustCap(
									newDevice.device,
									newDevice.properties,
									deviceType.DUSTCAP,
								),
							);
						}
						// Light Box
						if (newDeviceInterface & BitFlag.LIGHTBOX_INTERFACE)
						{
							appendDevice(
								existingDevices,
								new LightBox(
									newDevice.device,
									newDevice.properties,
									deviceType.LIGHTBOX,
								),
							);
						}
						// Detector
						if (newDeviceInterface & BitFlag.DETECTOR_INTERFACE)
						{
							appendDevice(
								existingDevices,
								new Detector(
									newDevice.device,
									newDevice.properties,
									deviceType.DETECTOR,
								),
							);
						}
						// Rotator
						if (newDeviceInterface & BitFlag.ROTATOR_INTERFACE)
						{
							appendDevice(
								existingDevices,
								new Rotator(
									newDevice.device,
									newDevice.properties,
									deviceType.ROTATOR,
								),
							);
						}
						// Spectrograph
						if (newDeviceInterface & BitFlag.SPECTROGRAPH_INTERFACE)
						{
							appendDevice(
								existingDevices,
								new Spectograph(
									newDevice.device,
									newDevice.properties,
									deviceType.SPECTROGRAPH,
								),
							);
						}
						// Correlator
						if (newDeviceInterface & BitFlag.CORRELATOR_INTERFACE)
						{
							appendDevice(
								existingDevices,
								new Correlator(
									newDevice.device,
									newDevice.properties,
									deviceType.CORRELATOR,
								),
							);
						}
						// Auxiliary
						if (newDeviceInterface & BitFlag.AUX_INTERFACE)
						{
							appendDevice(
								existingDevices,
								new Auxiliary(
									newDevice.device,
									newDevice.properties,
									deviceType.AUX,
								),
							);
						}
						// Check if the device was actually in the list before filtering
						const deviceWasPresent = state.devicesNeedingRefresh.includes(
							newDevice.device,
						);
						const updatedDevicesNeedingRefresh = deviceWasPresent
							? state.devicesNeedingRefresh.filter(
								(device) => device !== newDevice.device,
							)
							: state.devicesNeedingRefresh;

						return {
							...state,
							devices: existingDevices.map((oneDevice) => oneDevice),
							// Only return new array reference if its content actually changed
							devicesNeedingRefresh:
								updatedDevicesNeedingRefresh.length !==
									state.devicesNeedingRefresh.length
									? updatedDevicesNeedingRefresh
									: state.devicesNeedingRefresh,
						};
					}
				case commands.DEVICE_PROPERTY_ADD:
					{
						// 1. Fetch the devices array for manipulation
						// 2. Find the device to add the property to
						// 3. If the property already exists, update it, else add a new property
						let existingDevices = state.devices;
						const name = message.payload.device;
						if (name === undefined) return state;
						for (let i = 0; i < existingDevices.length; i++)
						{
							if (existingDevices[i].name === name)
								existingDevices[i].addProperty(message.payload);
						}
						return { ...state, devices: existingDevices };
					}
				case commands.DEVICE_PROPERTY_REMOVE:
					{
						// 1. Fetch the devices array for manipulation
						// 2. Find the device to add the property to
						// 3. If the property exists, remove it
						let existingDevices = state.devices;
						const name = message.payload.device;
						for (let i = 0; i < existingDevices.length; i++)
						{
							if (existingDevices[i].name === name)
								existingDevices[i].removeProperty(message.payload);
						}
						return { ...state, devices: existingDevices };
					}
				case commands.DEVICE_PROPERTY_GET:
					{
						// 1. Fetch the devices array for manipulation
						// 2. Find the device to add/update the property to
						// 3. Check if the property exists
						// 4. Check if the element exists, if it does, update it, else, return the current state
						let existingDevices = state.devices;
						const name = message.payload.device;

						let currentDevicesNeedingRefresh = state.devicesNeedingRefresh || [];
						let devicesNeedingRefreshChanged = false;

						// Check for DRIVER_INFO update
						if (message.payload.name === "DRIVER_INFO")
						{
							// Only add if not already present
							if (!currentDevicesNeedingRefresh.includes(name))
							{
								currentDevicesNeedingRefresh = [
									...currentDevicesNeedingRefresh,
									name,
								];
								devicesNeedingRefreshChanged = true;
							}
						}

						for (let i = 0; i < existingDevices.length; i++)
						{
							if (existingDevices[i].name === name)
							{
								const activeProperty = existingDevices[i].properties.find(
									(oneProperty) => oneProperty.name === message.payload.name,
								);
								if (!isEmpty(activeProperty))
									activeProperty.syncJSONProperty(message.payload);
							}
						}
						// N.B. we must use map otherwise state is not updated and INDI properties do not update
						// without this. DO NOT REMOVE
						// N.B. we must use map otherwise state is not updated and INDI properties do not update
						// without this. DO NOT REMOVE
						return {
							...state,
							devices: state.devices.map((oneDevice) => oneDevice),
							// Only return new array reference if it actually changed
							devicesNeedingRefresh: devicesNeedingRefreshChanged
								? currentDevicesNeedingRefresh
								: state.devicesNeedingRefresh,
						};
					}

				case commands.NEW_CONNECTION_STATE:
					if (message.payload.online === false) return initialState;
			}
			return state;

		case WEBSOCKET_CLOSED:
			//   if (action.payload.event.target.url.includes("/message/user") === false) return state;
			//return Object.assign({}, ...state, initialState);
			return initialState;

		default:
			return state;
	}
};
