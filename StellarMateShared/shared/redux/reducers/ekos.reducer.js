import { unionBy, get } from "lodash";
import { WEBSOCKET_CLOSED, WEBSOCKET_MESSAGE } from "redux-websocket";
import { ekosConstants, settingsConstants, setupConstants } from "../constants";
import commands from "../../commands";
import storage from "../../../config/storage";

/**
 * All Information related to Ekos tab
 * 
 **********Sample in JSON form**********
 * {
  "targetCalibrationSettings": null,
  "calibrationSettings": null,
  "_persist": {
	"rehydrated": true,
	"version": -1
  },
  "liveStackingTarget": null,
  "targetAlignSettings": {
	"solverAction": 1
  },
  "dslrInfo": null,
  "schedulerSettings": {
	"sequenceEdit": "",
	"schedulerWeather": true,
	"schedulerWarmCCD": true,
	"schedulerUntilValue": "2023-12-31T18:30:00",
	"startupTimeConditionR": false,
  },
  "liveStackingSettings": {
	"contrast": 100,
	"saturation": 30,
	"sigmaClipping": false,
	"sigmaUpper": 3,
	"solve": false,
	"background": 20,
	"dark": false,
	"sigmaLower": 3
  },
  "schedulerJobs": {
	"jobs": []
  },
  "notification": {
	"uuid": "2024-03-20-04-00-32",
	"message": "",
	"severity": 1
  },
  "clientState": null,
  "dslrLenses": [
	{
	  "vendor": "canon",
	  "model": "10",
	  "focal_length": 124,
	  "name": "canon 10 124@F/22.0",
	  "id": "13",
	  "focal_ratio": 22
	},
	{
	  "vendor": "canon",
	  "model": "r10",
	  "focal_length": 24,
	  "name": "canon r10 24@F/22.0",
	  "id": "15",
	  "focal_ratio": 22
	}
  ],
  "stellarSolverProfiles": {
	"focus": [
	  "1-Focus-Default",
	  "1-Focus-Default-Donut",
	  "2-AllStars",
	  "3-SmallSizedStars",
	  "4-MidSizedStars",
	  "5-BigSizedStars"
	],
	"align": [
	  "1-Default",
	  "2-SingleThreadSolving",
	  "3-LargeScaleSolving",
	  "4-SmallScaleSolving"
	]
  },
  "limitSettings": {},
  "saveImageRequested": false,
  "sequences": [],
  "filterSettings": [],
  "guideSettings": {
	"westRAGuideEnabled": true,
	"southDECGuideEnabled": true,
	"rAGuideEnabled": true,
	"rADisplayedOnGuideGraph": true,
	"northDECGuideEnabled": true,
	"latestCheck": true,
	"kcfg_TwoAxisEnabled": false,
	"kcfg_SaveGuideLog": true,
	"kcfg_ReverseDecOnPierSideChange": false,
  },
  "logout": false,
  "mountSettings": {
	"parkEveryDay": false,
	"opticalTrainCombo": "Primary",
  },
  "connection": {
	"online": true,
	"connected": true
  },
  "profiles": {
	"selectedProfile": "Observatory",
	"profiles": [
	  {
		"remote_guiding_port": -1,
		"remote_guiding_host": "",
		"weather": "",
		"name": "Simulators",
		"mount": "Telescope Simulator",
		"mode": "local",
		"indihub": 0,
		"port_selector": false,
		"guider": "",
		"use_web_manager": true,
		"filter": "Filter Simulator",
		"ccd": "CCD Simulator",
		"dome": "",
		"remote": "",
		"aux3": "",
		"aux1": "Rotator Simulator",
		"focuser": "Focuser Simulator",
		"remote_port": 0,
		"guiding": 0,
		"aux2": "",
		"aux4": "",
		"remote_host": "",
		"ao": "",
		"auto_connect": true
	  },
	  {
		"remote_guiding_port": -1,
		"remote_guiding_host": "",
		"weather": "",
		"name": "Observatory",
		"mount": "Telescope Simulator",
		"mode": "local",
		"indihub": 0,
		"port_selector": false,
		"guider": "Guide Simulator",
		"use_web_manager": true,
		"filter": "Filter Simulator",
		"ccd": "CCD Simulator",
		"dome": "Dome Simulator",
		"remote": "",
		"aux3": "",
		"aux1": "",
		"focuser": "Focuser Simulator",
		"remote_port": 0,
		"guiding": 0,
		"aux2": "",
		"aux4": "",
		"remote_host": "",
		"ao": "",
		"auto_connect": true
	  }
	]
  },
  "captureSettings": {},
  "focusSettings": {
	"forceInSeqAF": false,
	"focusUseWeights": true,
	"focusUseFullField": true,
	"focusUnits": "Pixels",
	"focusThreshold": 140,
	"focusSuspendGuiding": false,
  },
  "recentlyUsedTargets": [
	"Vega"
  ],
  "scopes": [
	{
	  "type": "Refractor",
	  "model": "1100",
	  "focal_length": 950,
	  "name": "celestron",
	  "id": "28",
	  "vendor": "celestron",
	  "aperture": 50
	},
	{
	  "type": "Refractor",
	  "model": "C500",
	  "focal_length": 500,
	  "name": "celestron C 500@F/10.0",
	  "id": "33",
	  "vendor": "celestron",
	  "aperture": 50
	}
  ],
  "fileSettings": null,
  "showPortSelectorPanel": false,
  "options": [
	{
	  "value": true,
	  "name": "ekosLiveImageTransfer"
	},
  ],
  "mountQClock": false,
  "alignSettings": {
	"pAHRotation": 30,
	"pAHMountSpeed": "Guide",
	"pAHManualSlew": false,
	"optionsProfile": "1-Default",
	"opticalTrainCombo": "Primary",
  },
  "liveStacking": false,
  "summary": {
	"guide": {
	  "graphLimit": 0,
	  "chartData": []
	}
  },
  "drivers": [],
  "targetPAHSettings": null,
  "recentlyUsedCategory": [],
  "manualRotator": {
	"rotatorSettings": {
	  "threshold": 0,
	  "targetPA": 0,
	  "currentPA": 0
	},
	"isManualRotator": false
  }
}
 */
const initialState = {
	// Connection to Ekos, if connected returns true and if the Profile is running return true
	connection: {
		connected: false,
		online: false,
	},

	// Toggle Port Selector that is in Setup tab
	showPortSelectorPanel: false,

	// Settings of Manual Rotator when toggled or settings are changed
	manualRotator: {
		isManualRotator: false,
		rotatorSettings: {
			currentPA: 0,
			targetPA: 0,
			threshold: 0,
		},
	},

	// By default Profile is Simulators and has all profiles that are added
	profiles: {
		selectedProfile: "Simulators",
		profiles: [],
	},
	// All settings related to Capture module
	captureSettings: {},

	// Show Recent Targets that are used in Target GOTO
	recentlyUsedTargets: [],

	// Recent category is stored that is used in Target GOTO
	recentlyUsedCategory: [],
	// All settings related to Align Module
	alignSettings: {},
	// All settings related to the Guide Module
	guideSettings: {},
	mountSettings: {},

	// Sequences that are added in Capture Module
	sequences: [],

	// All Filter Settings
	filterSettings: [],
	// File Settings i.e has the Preview
	// FixMe: We may completely remove it once GET Capture settings in integrated but also need to make sure old settings work so may need it
	fileSettings: null,
	// FixMe: We may need this to store the settings locally as to support Old Kstars Capture Settings as well
	limitSettings: {},
	targetPAHSettings: null,

	// Profiles used in Focus Process
	// FixMe: Need to check whether this is required or not
	stellarSolverProfiles: {
		align: [],
		focus: [],
		guide: [],
	},
	sequenceFile: {},
	// All settings realted to the Focus Module
	focusSettings: {},

	// Scopes that are added in Telescope & Lens
	scopes: [],

	// Lens Configuration under Telescope & Lens
	dslrLenses: [],

	// When the notification is pop up it get's message using this
	notification: {
		severity: 0,
		message: "",
		uuid: "",
	},
	logout: false,
	// All drivers list for Telescope, Camera, Focuers etc
	drivers: [],

	// All Jobs added in Scheduler
	schedulerJobs: [],

	// Default settings of Live Stacking
	liveStackingSettings: {
		background: 15,
		contrast: 100,
		lhe: 63,
		median_filter: 3,
	},

	// All Settings that are related to Scheduler Module
	schedulerSettings: {
		algorithm: -1,
		state: -1,
		focusStepCheck: false,
		alignStepCheck: false,
		trackStepCheck: false,
		guideStepCheck: false,
		sequence: "",
		abortJob: {},
		fits: "",
		jobCompletion: {},
		jobContraint: {},
		jobStartup: {},
		observatoryStartup: {},
		shutdownProcedure: {},
		pa: "--",
		priority: 1,
	},

	saveSequenceFile: "",
	saveJobFile: "",

	files: {
		default: "",
		directory: {},
		list: {},
	},

	// Checks whether the Mount QC is locked or not
	mountQClock: false,

	// Option settings, in csae we use set/get for Option settings
	options: [],

	// If there is any DSLR connected, contains it's information i.e width height etc..
	dslrInfo: null,

	// We store the previous Solver Actions, so we can retreive the value.
	// FixMe: If it is not needed, we may remove it
	targetAlignSettings: { solverAction: 1 },

	// Guide chart data so we can access in Summary
	// FixMe: Might remove later, since we have it already
	summary: {
		guide: { chartData: [], graphLimit: 0 },
	},

	// Should be removed, but we also need to have the funcationality of old Kstars, this maybe useful
	calibrationSettings: null,

	// Calibration settings, we may need it to support previous Kstars capture settings
	targetCalibrationSettings: null,

	// Toggle when Live Stacking is active
	liveStacking: { enabled: false, looping: false },

	liveStackingTarget: null,
	// Client state is set to false in case we successfully connect to EkosLive server

	clientState: null,
	// When user save image from the Status bar, ask for permission
	saveImageRequested: false,

	// Active module
	currentModule: "",

	// Cloud Image UUID
	cloudImageUUID: null,
};

export const ekos = (state = initialState, action) =>
{
	switch (action.type)
	{
		case settingsConstants.SAVE_RECENTLY_USED_CATEGORY:
			return { ...state, recentlyUsedCategory: action.payload };

		case settingsConstants.SAVE_TARGET_ALIGN_SETTINGS:
			return {
				...state,
				targetAlignSettings: {
					...state.targetAlignSettings,
					solverAction: action.payload,
				},
			};

		case settingsConstants.SAVE_CAPTURE_SETTINGS:
			return {
				...state,
				captureSettings: { ...state.captureSettings, ...action.payload },
			};

		case settingsConstants.SAVE_ALIGN_SETTINGS:
			return { ...state, alignSettings: action.payload };

		case settingsConstants.SAVE_LIVESTACKING_SETTINGS:
			return { ...state, liveStackingSettings: action.payload };

		case settingsConstants.TOGGLE_MOUNT_QC_LOCK:
			return { ...state, mountQClock: action.payload };

		case settingsConstants.RESET_DSLR_INFO_SETTINGS:
			return { ...state, dslrInfo: null };

		case settingsConstants.SAVE_FILE_SETTINGS:
			return {
				...state,
				fileSettings: { ...state.fileSettings, ...action.payload },
			};

		case settingsConstants.SAVE_RECENTLY_USED_TARGETS:
			return { ...state, recentlyUsedTargets: action.payload };

		case settingsConstants.SAVE_RECENTLY_USED_CATEGORY:
			return { ...state, recentlyUsedCategory: action.payload };

		case settingsConstants.SAVE_SELECTED_PROFILE:
			return {
				...state,
				profiles: { ...state.profiles, selectedProfile: action.payload },
			};

		case ekosConstants.SET_SUMMARY_DATA:
			return { ...state, summary: { ...state.summary, guide: action.payload } };

		case settingsConstants.SAVE_IMAGE_REQUESTED:
			return { ...state, saveImageRequested: action.payload };

		case settingsConstants.SAVE_CALIBRATION_SETTINGS:
			return { ...state, targetCalibrationSettings: action.payload };

		case settingsConstants.SAVE_LIMIT_SETTINGS:
			return { ...state, targetLimitSettings: action.payload };

		case settingsConstants.SAVE_CURRENT_MODULE:
			return { ...state, currentModule: action.payload };

		case commands.NEW_NOTIFICATION:
			return { ...state, notification: action.payload };

		case settingsConstants.UPDATE_LIVESTACKING_STATUS:
			return { ...state, liveStacking: action.payload };

		case settingsConstants.UPDATE_LIVESTACKING_TARGET:
			return { ...state, liveStackingTarget: action.payload };

		case settingsConstants.UPDATE_CONNECTION_STATUS:
			return {
				...state,
				connection: { ...state.connection, ...action.payload },
			};

		case setupConstants.OPEN_PROFILE_PORT_SELECTION:
			return { ...state, showPortSelectorPanel: true };

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
				case "set_state":
					// The set_state sends a DIFF of the state
					// So we need to merge it as not to lose state of unchanged values
					// let newState = state;
					// merge(newState, message.payload);
					// return Object.assign({}, ...state, newState);

					// Doing it this way update state OK, but the state is MISSING the unchanged parameters.
					// We want the state to retain even un-changed parameters from the diff above since we have
					// many states that are mapped into props
					//return Object.assign({}, state, message.payload);
					return state;

				case commands.NEW_CLOUD_IMAGE:
					return { ...state, cloudImageUUID: message.payload };

				case commands.NEW_CONNECTION_STATE:
					return { ...state, connection: message.payload, logout: false };

				case commands.GET_PROFILES:
					return { ...state, profiles: message.payload };

				case commands.SET_CLIENT_STATE:
					return { ...state, clientState: message.payload };

				case commands.GET_DRIVERS:
					return { ...state, drivers: message.payload };

				case commands.GET_SCOPES:
					return { ...state, scopes: message.payload };

				case commands.GUIDE_REPORT:
					return { ...state, guideReport: message.payload };

				case commands.GET_DSLR_LENSES:
					return { ...state, dslrLenses: message.payload };

				case commands.NEW_NOTIFICATION:
					return { ...state, notification: message.payload };

				case commands.CAPTURE_GET_SEQUENCES:
					return { ...state, sequences: message.payload };

				case commands.FOCUS_SET_SETTINGS:
					return { ...state, focusSettings: message.payload };

				case commands.SCHEDULER_GET_ALL_SETTINGS:
					return { ...state, schedulerSettings: message.payload };

				case commands.FOCUS_GET_ALL_SETTINGS:
					return { ...state, focusSettings: message.payload };

				case commands.GET_STELLARSOLVER_PROFILES:
					return { ...state, stellarSolverProfiles: message.payload };

				case commands.CAPTURE_SET_SETTINGS:
					return { ...state, captureSettings: message.payload };

				case commands.CAPTURE_GET_FILE_SETTINGS:
					return {
						...state,
						fileSettings: { ...state.fileSettings, ...message.payload },
					};

				case commands.CAPTURE_GET_PREVIEW_LABEL:
					return {
						...state,
						fileSettings: { ...state.fileSettings, ...message.payload },
					};
				case commands.CAPTURE_GET_ALL_SETTINGS:
					storage.setItem(
						"cache:captureSettings",
						JSON.stringify(message.payload),
					);
					return { ...state, captureSettings: message.payload };

				case commands.ALIGN_SET_SETTINGS:
					return { ...state, alignSettings: message.payload };

				case commands.ALIGN_GET_ALL_SETTINGS:
					return { ...state, alignSettings: message.payload };

				case commands.GUIDE_SET_SETTINGS:
					return { ...state, guideSettings: message.payload };

				case commands.GUIDE_GET_ALL_SETTINGS:
					return { ...state, guideSettings: message.payload };

				case commands.MOUNT_GET_SETTINGS:
					return { ...state, mountSettings: message.payload };

				case commands.MOUNT_GET_ALL_SETTINGS:
					return { ...state, mountSettings: message.payload };

				case commands.SCHEDULER_GET_JOBS:
					return { ...state, schedulerJobs: message.payload };

				case commands.SCHEDULER_UPDATE_SETTINGS:
					return {
						...state,
						schedulerSettings: {
							...state.schedulerSettings,
							...action.payload,
						},
					};

				case commands.SCHEDULER_GET_SETTINGS:
					return { ...state, schedulerSettings: message.payload };

				case commands.PAH_SET_SETTINGS:
					return { ...state, pahSettings: message.payload };

				case commands.FM_GET_DATA:
					storage.setItem(
						"cache:filterSettings",
						JSON.stringify(message.payload),
					);
					return { ...state, filterSettings: message.payload };

				case commands.CAPTURE_GET_LIMITS:
					return {
						...state,
						limitSettings: message.payload,
					};

				case commands.CAPTURE_GET_CALIBRATION_SETTINGS:
					return {
						...state,
						calibrationSettings: message.payload,
					};

				case ekosConstants.CLOSE_MANUAL_ROTATOR:
					return {
						...state,
						manualRotator: { ...state.manualRotator, isManualRotator: false },
					};

				case commands.ALIGN_MANUAL_ROTATOR_STATUS:
					return {
						...state,
						manualRotator: {
							rotatorSettings: message.payload,
							isManualRotator: true,
						},
					};

				case settingsConstants.SAVE_TARGET_POLAR_SETTINGS:
					return { ...state, targetPAHSettings: action.payload };

				case commands.SET_PROFILE_PORT_SELECTION:
					return { ...state, showPortSelectorPanel: false };

				case commands.OPTION_GET:
					{
						const result = unionBy(message.payload, state.options, "name");
						return { ...state, options: result };
					}

				case commands.GET_PROFILE_PORT_SELECTION:
					return { ...state, showPortSelectorPanel: message.payload };

				case commands.DSLR_GET_INFO:
					return {
						...state,
						dslrInfo: message.payload,
					};

				case commands.DIALOG_GET_INFO:
					return {
						...state,
						dialogInfo: message.payload,
					};

				case commands.LOGOUT:
					return { ...state, logginOut: true };

				case commands.FILE_DEFAULT_PATH:
					return {
						...state,
						files: { ...state.files, default: message.payload },
					};

				case commands.FILE_DIRECTORY_OPERATION:
					const operation = get(message.payload, "operation", "default");
					return {
						...state,
						files: { ...state.files, [operation]: message.payload },
					};

				case commands.CAPTURE_LOAD_SEQUENCE_FILE:
					return {
						...state,
						sequenceFile: message.payload,
					};

				case commands.CAPTURE_SAVE_SEQUENCE_FILE:
					return {
						...state,
						saveSequenceFile: message.payload,
					};

				case commands.SCHEDULER_SAVE_FILE:
					return {
						...state,
						saveJobFile: message.payload,
					};

				default:
					return state;
			}

		case WEBSOCKET_CLOSED:
			if (action.payload.event.target.url.includes("/message/user") === false)
				return state;
			return initialState;

		case ekosConstants.EKOS_CLEAR_NOTIFICATION:
			return { ...state, notification: {} };

		case ekosConstants.REMOVE_DIALOG:
			return { ...state, dialogInfo: null };

		default:
			return state;
	}
};
