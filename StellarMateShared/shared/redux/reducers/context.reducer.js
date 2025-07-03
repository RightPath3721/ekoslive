import { contextConstants } from "../constants";

/**
 * This reducer is used when we need to toggle or share the values to child or parent components
 * This will allow us to avoid props and set the value into redux, so it can be accessible to all other components
 * 
 **********Sample in JSON form**********
 * {
  "ALIGN_RECOMMENDED_SETTINGS": false,
  "FOCUS_GRAPH_DATA": [],
  "SETUP_ROUTE": "Profiles",
  "SCHEDULER_SETTINGS": {},
  "WARNING_FOV_SIZE": false,
  "TELESCOPE_LENS": false,
  "OPTICAL_TRAIN": false,
  "CHECK_ASTROMETRY_INDEX": false,
  "GALLERY_DATA": {},
  "DSLR_INFO": false,
  "ALIGN_GRAPH_DATA": [],
  "EKOS_OPTICAL_TRAIN": false,
  "CLOUD_MAP": false,
  "HARDWARE_INFO": false,
  "WARNING_CELESTIAL_POLE": false,
  "SCOPE_DIALOG_TYPE": "",
  "SCOPE_INFO": {
    "lens": {
      "focal_length": 0,
      "focal_ratio": 0,
      "model": "",
      "vendor": ""
    },
    "scope": {
      "focal_length": 0,
      "model": "",
      "aperture": 0,
      "type": "Refractor",
      "vendor": ""
    }
  }
}
 */
const initialState = {
  // These are used to setup Telescope and Lens which can be configured under Optical trains
  SCOPE_INFO:
  {
    scope: { vendor: "", model: "", type: "Refractor", aperture: 0, focal_length: 0 },
    lens: { vendor: "", model: "", focal_ratio: 0, focal_length: 0 },
  },

  // Contains the various gallery data in Viewer tab,i.e current active path, whether to show the full image, type i.e File or a folder 
  GALLERY_DATA: {},

  // Toggle Hardware Info Screen in Device management
  HARDWARE_INFO: false,

  // Toggle Cloud Map in Device management
  CLOUD_MAP: false,

  // Toggle DSLR Info which shows in Setup tab
  DSLR_INFO: false,

  // Toggle Optical Train component for Setup Tab
  OPTICAL_TRAIN: false,

  // Specifies whether the type is Telescope or Lens in order to use both together
  SCOPE_DIALOG_TYPE: "",

  // Toggle Telescope and Lens component
  TELESCOPE_LENS: false,

  // Contains Scheduler Settings i.e Focus, Align, Guide steps etc
  // FixMe: We have now Scheduler GET/SET all settings, need to check whether these settings 
  SCHEDULER_SETTINGS: {},

  // Toggles Optical Train component for Ekos tab
  // FixMe: Might use one Toggle for Optical Train component
  EKOS_OPTICAL_TRAIN: false,

  // Update routes for Setup tab as it has many screens i.e Page welcome, Login, Profie manager etc..
  SETUP_ROUTE: "Login",

  // Align Graph data is stored here so it can also be accessible in summary
  ALIGN_GRAPH_DATA: [],

  // Focus Graph data to show as Full screen in Drag module
  FOCUS_GRAPH_DATA: [],

  // Alert warning for Celestrial pole when user start's solving if it is nearby Polaris
  WARNING_CELESTIAL_POLE: false,

  // Alert warning if FOV size is too small or large
  WARNING_FOV_SIZE: false,

  // Update Align settings as recommended only once per session
  ALIGN_RECOMMENDED_SETTINGS: false,

  // Check for missing Index files once per session
  CHECK_ASTROMETRY_INDEX: false,

  // Saving the last used file names
  SAVE_JOB_SEQUENCE_NAME: {},

  // Increase or decrease the text size for Logs - Default is 22
  LOGS_TEXT_SIZE: 22
};

export function context(state = initialState, action)
{
  if (action.type === contextConstants.SET_CONTEXT)
    return { ...state, [action.payload.key]: action.payload.value };
  else return state;
}