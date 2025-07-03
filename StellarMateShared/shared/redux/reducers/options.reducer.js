import { optionsConstants } from '../constants';

/**
 * Use in Settings Tab to save options that are set
 **********Sample in JSON form**********
 * {
  "_persist": {
    "rehydrated": true,
    "version": -1
  },
  "isWarn": false,
  "isAlert": false,
  "schedulerCategory": false,
  "isDebug": false,
  "guideCategory": false,
  "focusCategory": false,
  "indiCategory": false,
  "generalCategory": false,
  "captureCategory": false,
  "colorSchemeSkyMap": 3,
  "isInfo": false,
  "mountCategory": false,
  "currentTheme": "dark",
  "ekosLiveSound": true,
  "tourguide": true,
  "unitSystem": "imperial",
  "ekosLiveImageTransfer": true,
  "language": "English",
  "locationSync": true,
  "ekosLiveNotifications": true,
  "timeSync": true,
  "pushNotification": false,
  "ekosLiveCloud": false,
  "observatoryCategory": false,
  "alignCategory": false,
  "fileLogging": false,
  "ekosLiveHighBandwidth": true
}
 */
const initialState =
{
  // Toggle Ekoslive hiht bandwidth
  ekosLiveHighBandwidth: true,

  // Toggle Notifications that are sent to Android and iOS apps 
  ekosLiveNotifications: true,

  // To enable or disable recieving images
  ekosLiveImageTransfer: true,

  // Toggle Sounds in the app
  ekosLiveSound: true,

  // For Pro users only, so users can access cloud images as well
  ekosLiveCloud: false,

  // Change unit system
  unitSystem: "metric",

  // Sync time automatically as per location
  timeSync: true,

  // Sync locations as per your current location
  locationSync: true,

  // App langauge
  language: "English",

  // Used inside the Notification settings, if true show all settings related to the notification
  pushNotification: false,

  // If true, displays Tour guide which introduce to the user so they can know more details about the functionality. Please check: https://stellarmate.com/help/TourGuide.html
  tourguide: true,

  // Change App theme to dark or night
  currentTheme: "dark",

  // File Logging, creates a file that is shared when the logs are sent. It has the followings LogError, LogDebug etc..
  fileLogging: false,

  // Color scheme of the Sky Map
  colorSchemeSkyMap: 3,

  /**
   * All categories below. So we can send notifcations for those Modules i.e Guide, Capture, Focus etc..
   */
  generalCategory: false,
  indiCategory: false,
  focusCategory: false,
  alignCategory: false,
  guideCategory: false,
  captureCategory: false,
  mountCategory: false,
  observatoryCategory: false,
  schedulerCategory: false,
  isAlert: false,
  isInfo: false,
  isWarn: false,
  isDebug: false,
};



export function options(state = initialState, action)
{
  if (Object.values(optionsConstants).includes(action.type))
    return { ...state, [action.type]: action.payload };
  else
    return state;
};