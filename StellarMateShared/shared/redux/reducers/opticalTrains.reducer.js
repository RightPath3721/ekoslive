import { get } from "lodash";
import { WEBSOCKET_MESSAGE } from "redux-websocket";
import commands from "../../commands";

/**
 * Optical trains that are used in all modules except Scheduler Module. You can also check: https://stellarmate.com/help/OpticalTrains.html
 **********Sample in JSON form**********
 * {
  "_persist": {
    "rehydrated": true,
    "version": -1
  },
  "selectedLens": {},
  "showTrainModal": false,
  "selectedScope": {},
  "selectedTrains": {
    "0": 129,
    "1": 129,
    "2": 129,
    "3": 129,
    "4": 130,
    "5": 129,
    "6": 129
  },
  "selectedTrain": "",
  "allTrains": [
    {
      "focuser": "Focuser Simulator",
      "id": 129,
      "reducer": 1,
      "profile": 83,
      "lightbox": "--",
      "mount": "Telescope Simulator",
      "guider": "Guide Simulator",
      "name": "Primary",
      "filterwheel": "CCD Simulator",
      "scope": "celestron c 500@F/10.0",
      "dustcap": "--",
      "rotator": "--",
      "camera": "CCD Simulator"
    },
    {
      "profile": 83,
      "mount": "Telescope Simulator",
      "reducer": 1,
      "focuser": "Focuser Simulator",
      "id": 130,
      "guider": "Guide Simulator",
      "name": "Secondary",
      "filterwheel": "CCD Simulator",
      "scope": "celestron c 500@F/10.0",
      "dustcap": "--",
      "rotator": "--",
      "camera": "Guide Simulator",
      "lightbox": "--",
      "adaptiveoptics": null
    }
  ]
}
 */
const initialState = {
	// All trains that are added in Optical Trains
	allTrains: [],

	// Toggle the Optical Train Editor Modal under it;s component
	showTrainModal: false,

	// FixMe: Might remove this since we need to use selectedTrains Object as it has all trains
	selectedTrain: "",

	// All selected Trains of the Modules
	selectedTrains: {},

	// The selected train settings
	selectedTrainSettings: {},
};

export const opticalTrain = (state = initialState, action) =>
{
	switch (action.type) {
		case commands.TRAIN_SET:
			const { name, module } = action.payload;
			if (module === "focus")
				return {
					...state,
					selectedTrain: { ...state.selectedTrain, focus: name },
				};
			else if (module === "align")
				return {
					...state,
					selectedTrain: { ...state.selectedTrain, align: name },
				};
			else if (module === "capture")
				return {
					...state,
					selectedTrain: { ...state.selectedTrain, capture: name },
				};
			else if (module === "guide")
				return {
					...state,
					selectedTrain: { ...state.selectedTrain, guide: name },
				};
			else if (module === "mount")
				return {
					...state,
					selectedTrain: { ...state.selectedTrain, mount: name },
				};
			else return state;

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

			switch (message.type) {
				case commands.TRAIN_GET_ALL:
					return { ...state, allTrains: message.payload };
				case commands.TRAIN_CONFIGURATION_REQUESTED:
					return { ...state, showTrainModal: message.payload };
				case commands.TRAIN_GET_PROFILES:
					return { ...state, selectedTrains: message.payload };
				case commands.TRAIN_SETTINGS_GET:
					return { ...state, selectedTrainSettings: message.payload };
				default:
					return state;
			}
		default:
			return state;
	}
};
