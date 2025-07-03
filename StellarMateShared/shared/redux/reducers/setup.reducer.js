import { differenceBy, get, isArray, isString, unionBy } from "lodash";
import { WEBSOCKET_MESSAGE } from "redux-websocket";
import { tourGuideScreens } from "../../indi/enums";
import { settingsConstants, setupConstants } from "../constants";
import commands from "../../commands";

/**
 * All information related to Setup Tab
 **********Sample in JSON form**********
 * {
  "_persist": {
	"rehydrated": true,
	"version": -1
  },
  "modulesPosition": {
	"focus": {
	  "y": 0,
	  "x": 0
	},
	"align": {
	  "y": 0,
	  "x": 0
	},
	"guide": {
	  "y": 0,
	  "x": 0
	}
  },
  "skyMapInfoPanelPosition": {
	"y": 0,
	"x": 0
  },
  "logs": [],
  "displayMonitors": [],
  "vnc": {
	"password": "smate"
  },
  "versions": {
	"indi": "1.9.6",
	"kstars": "3.6.0"
  },
  "recentJobsDirectory": "",
  "recentSequenceDirectory": "",
  "homeDirectory": "/home/stellarmate",
  "selectedMonitor": "",
  "cloudsMap": {},
  "zoomLevel": 6,
  "tourGuide": {
	"completed": {
	  "quickControls": false,
	  "targets": false,
	  "ekos": false,
	  "profileManager": false
	},
	"active": false,
	"activeZone": 0
  },
  "hardwareInfo": [],
  "skyQuality": {},
  "location": {},
  "picturesDirectory": "/home/stellarmate/Pictures",
  "wifiCountry": "United States",
  "weatherInfo": {}
}
 */
const initialState = {
	// Weather info is here
	weatherInfo: {},

	// Current location i.e longitude and latitude
	location: {},

	// Quality of the Sky that has the bortle information
	skyQuality: {},

	// default zoom level of the Cloud map
	zoomLevel: 6,

	// Default home directory of SM
	homeDirectory: "/home/stellarmate",

	// Default Pictures directory of SM
	picturesDirectory: "/home/stellarmate/Pictures",

	// Using for Wizard in Ekos
	isSimpleMode: true,

	// In case user have seleccted a sequence from a specific directory. Next time load that directory
	recentSequenceDirectory: "",

	schedulerSequenceFile: "",

	// Same as above
	recentJobsDirectory: "",

	// Default version of Kstars and INDI
	versions: {
		kstars: "3.6.0",
		indi: "1.9.6",
	},

	// We have tour Guide for three modules only. It has the information about which zone is in progress and which modules are pending to show tour guide
	tourGuide: {
		activeZone: 0,
		active: false,
		completed: {
			stella: false,
			profileManager: false,
			ekos: false,
			align: false,
			focus: false,
			guide: false,
			targets: false,
			quickControls: false,
			basicPAA: false,
			basicTargets: false,
			basicFocus: false,
			basicGuide: false,
			basicCapture: false,
			basicSummary: false,
		},
	},

	// We store the VNC password thus users can also change the password for VNC and next time we login using new password
	vncPassword: "smate",
	vncResizeMode: "off",

	// Used for backup Cloud S3 uploads
	cloudSync: false,

	// Auto Syncing between Online Server and SM App
	autoSync: true,

	// This is for SM X, has different resolutions so we can change them and keep according to our display
	displayMonitors: [],

	// Selected monitor in case SM X display is not available
	selectedMonitor: "",

	// Logs which users send to Ekoslive online server are saved here incase no internet connection so it reuploads in the next session
	logs: [],

	// Sky map info Box can be moved to a specific position and we save the position
	skyMapInfoPanelPosition: {
		x: 0,
		y: 0,
	},

	// We can drag the modules and on the next session they are in the same position
	modulesPosition: {
		guide: { x: 0, y: 0 },
		align: { x: 0, y: 0 },
		focus: { x: 0, y: 0 },
	},

	// Hardware info is stored here
	hardwareInfo: [],

	// 12v Power LED state: Bit ORed number for the state of the 4x12v port
	// Using the following bitmasks
	// Port 1: 0x01
	// Port 2: 0x02
	// Port 3: 0x04
	// Port 4: 0x08
	powerLEDState: -1,

	// WiFi country which we can also change from Device tab
	wifiCountry: "United States",

	activeKStarsIDS: [],
	kstarsActiveID: "",
	isInternetAvailable: false,
};

export function setup(state = initialState, action)
{
	switch (action.type)
	{
		case settingsConstants.SAVE_LOCATION:
			return { ...state, location: action.payload };

		case setupConstants.SET_SETUP_PARAMETER_VALUE:
			return { ...state, ...action.payload };

		case setupConstants.SET_WIFI_COUNTRY:
			return { ...state, wifiCountry: action.payload };

		case setupConstants.UPDATE_HARDWARE_INFO:
			return { ...state, hardwareInfo: action.payload };

		case setupConstants.REMOVE_LOGS_INFO:
			return {
				...state,
				logs: differenceBy(state.logs, action.payload, "path"),
			};

		case setupConstants.ADD_LOGS_INFO:
			return { ...state, logs: [...state.logs, action.payload] };

		case setupConstants.UPDATE_LOGS_INFO:
			return {
				...state,
				logs: state.logs.map((oneLog) =>
					oneLog.name === action.payload.name ? action.payload : oneLog,
				),
			};

		case commands.SCHEDULER_SAVE_SEQUENCE_FILE:
			return {
				...state,
				schedulerSequenceFile: action.payload,
			};

		case settingsConstants.SAVE_WEATHER:
			return { ...state, weatherInfo: action.payload };

		case settingsConstants.SAVE_SKY_QUALITY:
			return { ...state, skyQuality: action.payload };

		case settingsConstants.SAVE_HOME_DIRECTORY:
			return { ...state, homeDirectory: action.payload };

		case settingsConstants.SAVE_PICTURES_DIRECTORY:
			return { ...state, picturesDirectory: action.payload };

		case settingsConstants.SAVE_ZOOM_LEVEL:
			return { ...state, zoomLevel: action.payload };

		case settingsConstants.CHANGE_TOUR_GUIDE:
			return {
				...state,
				tourGuide: { ...state.tourGuide, activeZone: action.payload },
			};

		case setupConstants.UPDATE_RECENT_DIRECTORY:
			{
				const { path, type } = action.payload;
				if (type === "SEQUENCE")
					return { ...state, recentSequenceDirectory: path };
				else return { ...state, recentJobsDirectory: path };
			}

		case setupConstants.SAVE_MONITOR_DISPLAY:
			return { ...state, displayMonitors: action.payload };

		case setupConstants.SAVE_SELECTED_DISPLAY:
			return { ...state, selectedMonitor: action.payload };

		case settingsConstants.COMPLETE_ALL_TOUR_GUIDE:
			return {
				...state,
				tourGuide: {
					...state.tourGuide,
					completed: {
						targets: true,
						ekos: true,
						guide: true,
						align: true,
						focus: true,
						profileManager: true,
						quickControls: true,
						stella: true,
						basicPAA: true,
						basicTargets: true,
						basicFocus: true,
						basicGuide: true,
						basicCapture: true,
						basicSummary: true,
					},
				},
			};

		case "reset_tour":
			return {
				...state,
				tourGuide: {
					...state.tourGuide,
					completed: {
						targets: false,
						ekos: false,
						align: false,
						guide: false,
						focus: false,
						profileManager: false,
						quickControls: false,
						stella: false,
						basicPAA: false,
						basicTargets: false,
						basicFocus: false,
						basicGuide: false,
						basicCapture: false,
						basicSummary: false,
					},
				},
			};
		case settingsConstants.COMPLETED_TOUR_GUIDE:
			if (action.payload === tourGuideScreens.ProfileManager)
				return {
					...state,
					tourGuide: {
						...state.tourGuide,
						completed: { ...state.tourGuide.completed, profileManager: true },
					},
				};
			else if (action.payload === tourGuideScreens.Ekos)
				return {
					...state,
					tourGuide: {
						...state.tourGuide,
						completed: { ...state.tourGuide.completed, ekos: true },
					},
				};
			else if (action.payload === tourGuideScreens.Targets)
				return {
					...state,
					tourGuide: {
						...state.tourGuide,
						completed: { ...state.tourGuide.completed, targets: true },
					},
				};
			else if (action.payload === tourGuideScreens.Align)
				return {
					...state,
					tourGuide: {
						...state.tourGuide,
						completed: { ...state.tourGuide.completed, align: true },
					},
				};
			else if (action.payload === tourGuideScreens.BasicPAA)
				return {
					...state,
					tourGuide: {
						...state.tourGuide,
						completed: { ...state.tourGuide.completed, basicPAA: true },
					},
				};
			else if (action.payload === tourGuideScreens.BasicTargets)
				return {
					...state,
					tourGuide: {
						...state.tourGuide,
						completed: { ...state.tourGuide.completed, basicTargets: true },
					},
				};
			else if (action.payload === tourGuideScreens.BasicFocus)
				return {
					...state,
					tourGuide: {
						...state.tourGuide,
						completed: { ...state.tourGuide.completed, basicFocus: true },
					},
				};
			else if (action.payload === tourGuideScreens.BasicGuide)
				return {
					...state,
					tourGuide: {
						...state.tourGuide,
						completed: { ...state.tourGuide.completed, basicGuide: true },
					},
				};
			else if (action.payload === tourGuideScreens.BasicCapture)
				return {
					...state,
					tourGuide: {
						...state.tourGuide,
						completed: { ...state.tourGuide.completed, basicCapture: true },
					},
				};
			else if (action.payload === tourGuideScreens.BasicSummary)
				return {
					...state,
					tourGuide: {
						...state.tourGuide,
						completed: { ...state.tourGuide.completed, basicSummary: true },
					},
				};
			else if (action.payload === tourGuideScreens.Guide)
				return {
					...state,
					tourGuide: {
						...state.tourGuide,
						completed: { ...state.tourGuide.completed, guide: true },
					},
				};
			else if (action.payload === tourGuideScreens.Focus)
				return {
					...state,
					tourGuide: {
						...state.tourGuide,
						completed: { ...state.tourGuide.completed, focus: true },
					},
				};
			else if (action.payload === tourGuideScreens.QuickControls)
				return {
					...state,
					tourGuide: {
						...state.tourGuide,
						completed: { ...state.tourGuide.completed, quickControls: true },
					},
				};
			else if (action.payload === tourGuideScreens.Stella)
				return {
					...state,
					tourGuide: {
						...state.tourGuide,
						completed: { ...state.tourGuide.completed, stella: true },
					},
				};
			else
				return {
					...state,
					tourGuide: {
						...state.tourGuide,
						completed: {
							targets: false,
							ekos: false,
							guide: false,
							align: false,
							focus: false,
							profileManager: false,
							quickControls: false,
							stella: false,
							basicPAA: false,
							basicTargets: false,
							basicFocus: false,
							basicGuide: false,
							basicCapture: false,
							basicSummary: false,
						},
					},
				};

		case settingsConstants.TOGGLE_TOUR_GUIDE:
			return {
				...state,
				tourGuide: { ...state.tourGuide, active: action.payload },
			};

		case settingsConstants.RESET_TOUR_GUIDE:
			return { ...state, tourGuide: initialState.tourGuide };

		case settingsConstants.GET_PROGRAM_VERSION:
			if (action.payload.error === true)
			{
				return { ...state, versions: initialState.versions };
			}
			return { ...state, versions: action.payload };

		case settingsConstants.SET_VNC_PASSWORD:
			const password = action.payload;
			return { ...state, vnc: password };

		case setupConstants.SAVE_SKY_MAP_INFO_PANEL_POSITION:
			return { ...state, skyMapInfoPanelPosition: action.payload };

		case setupConstants.SAVE_MODULES_POSITION:
			{
				const { key, value } = action.payload;
				return {
					...state,
					modulesPosition: { ...state.modulesPosition, [key]: value },
				};
			}

		case WEBSOCKET_MESSAGE:
			if (
				get(action, "payload.event.target.url", "").includes(
					"/message/user",
				) === false
			)
			{
				return state;
			}
			const message = JSON.parse(action.payload.data);
			switch (message.type)
			{
				case commands.SET_KSTARS_VERSION:
					return {
						...state,
						versions: { ...state.versions, kstars: message.payload },
					};

				case commands.ASTRO_GET_LOCATION:
					return { ...state, location: message.payload };

				case commands.SET_KSTARS_MACHINE_ID:
					return {
						...state,
						activeKStarsIDS: unionBy(
							state.activeKStarsIDS,
							[message.payload],
							"machineID",
						),
					};

				case commands.DELETE_KSTAR_CONNECTION:
					return {
						...state,
						activeKStarsIDS: state.activeKStarsIDS.filter(
							(KStars) => KStars.machineID !== message.payload,
						),
					};

				case commands.SCHEDULER_SAVE_SEQUENCE_FILE:
					return {
						...state,
						schedulerSequenceFile: get(message.payload, "path", ""),
					};

				case commands.SET_CONNECTED_KSTARS:
					if (isArray(message.payload))
					{
						return {
							...state,
							activeKStarsIDS: message.payload,
							kstarsActiveID: message.payload.find(
								(KStars) => KStars.machineID === state.kstarsActiveID,
							)
								? state.kstarsActiveID
								: "",
						};
					}
					else if (isString(message.payload))
					{
						return {
							...state,
							kstarsActiveID: message.payload,
						};
					}
					else return state;
			}

		default:
			{
				return state;
			}
	}
}
