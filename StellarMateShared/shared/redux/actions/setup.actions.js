import commands from "../../commands";
import
{
  achievementsConstants,
  ekosConstants,
  setupConstants,
} from "../constants";
import { wssMessageSocketActions } from "./wssMessageSocketActions";

export const setupActions = {
  saveLocation,
  getLocation,
  saveWeather,
  saveSkyQuality,
  saveCloudsMap,
  saveZoomLevel,
  saveHomeDirectory,
  savePicturesDirectory,
  saveProgramVersion,
  changeGuideTour,
  setGuideTour,
  toggleGuideTour,
  resetTourGuide,
  completeAllTourGuide,
  setVNCPassword,
  saveSkyMapInfoPanelPosition,
  saveDisplayMonitors,
  saveSelectedDisplay,
  removeLogsInfo,
  addLogsInfo,
  updateLogsInfo,
  closePortSelector,
  openPortSelector,
  updateRecentDirectory,
  updateHardwareInfo,
  setWifiCountry,
  saveModulesPosition,

  setSetupParameterValue,
  setStatusParameterValue,
};

function saveLocation(position)
{
  return {
    type: setupConstants.SAVE_LOCATION,
    payload: position,
  };
}

function getLocation()
{
  return wssMessageSocketActions.sendText(
    {},
    commands.ASTRO_GET_LOCATION
  );
}

function saveWeather(weather)
{
  return {
    type: setupConstants.SAVE_WEATHER,
    payload: weather,
  };
}

function saveSkyQuality(skyQuality)
{
  return {
    type: setupConstants.SAVE_SKY_QUALITY,
    payload: skyQuality,
  };
}

function setWifiCountry(payload)
{
  return {
    type: setupConstants.SET_WIFI_COUNTRY,
    payload: payload,
  };
}

function updateHardwareInfo(info)
{
  return {
    type: setupConstants.UPDATE_HARDWARE_INFO,
    payload: info,
  };
}

function openPortSelector()
{
  return {
    type: setupConstants.OPEN_PROFILE_PORT_SELECTION,
    payload: {},
  };
}

function closePortSelector()
{
  return wssMessageSocketActions.sendText(
    {},
    commands.SET_PROFILE_PORT_SELECTION
  );
}

function removeLogsInfo(payload)
{
  return {
    type: setupConstants.REMOVE_LOGS_INFO,
    payload: payload,
  };
}

function addLogsInfo(payload)
{
  return {
    type: setupConstants.ADD_LOGS_INFO,
    payload: payload,
  };
}

function updateLogsInfo(payload)
{
  return {
    type: setupConstants.UPDATE_LOGS_INFO,
    payload: payload,
  };
}

function saveDisplayMonitors(payload)
{
  return {
    type: setupConstants.SAVE_MONITOR_DISPLAY,
    payload: payload,
  };
}

function saveSelectedDisplay(payload)
{
  return {
    type: setupConstants.SAVE_SELECTED_DISPLAY,
    payload: payload,
  };
}

function updateRecentDirectory(payload)
{
  return {
    type: setupConstants.UPDATE_RECENT_DIRECTORY,
    payload: payload,
  };
}

function saveHomeDirectory(directory)
{
  return {
    type: setupConstants.SAVE_HOME_DIRECTORY,
    payload: directory,
  };
}

function savePicturesDirectory(directory)
{
  return {
    type: setupConstants.SAVE_PICTURES_DIRECTORY,
    payload: directory,
  };
}

function saveCloudsMap(map)
{
  return {
    type: setupConstants.SAVE_CLOUDS_MAP,
    payload: map,
  };
}

function saveZoomLevel(zoomLevel)
{
  return (dispatch) =>
  {
    dispatch({ type: setupConstants.SAVE_ZOOM_LEVEL, payload: zoomLevel });
    dispatch({
      type: ekosConstants.GET_ECHO_DATA,
      data: {
        type: achievementsConstants.WEATHER_CHECK_ACHIEVED,
        payload: zoomLevel,
      },
    });
  };
}

function saveProgramVersion(settings)
{
  return {
    type: setupConstants.GET_PROGRAM_VERSION,
    payload: settings,
  };
}

function saveSkyMapInfoPanelPosition(position)
{
  return {
    type: setupConstants.SAVE_SKY_MAP_INFO_PANEL_POSITION,
    payload: position,
  };
}

function changeGuideTour(value)
{
  return {
    type: setupConstants.CHANGE_TOUR_GUIDE,
    payload: value,
  };
}

function saveModulesPosition(key, value)
{
  return {
    type: setupConstants.SAVE_MODULES_POSITION,
    payload: { key, value },
  };
}

function setGuideTour(value)
{
  return {
    type: setupConstants.COMPLETED_TOUR_GUIDE,
    payload: value,
  };
}

function toggleGuideTour(value)
{
  return {
    type: setupConstants.TOGGLE_TOUR_GUIDE,
    payload: value,
  };
}

function resetTourGuide(value)
{
  return {
    type: setupConstants.RESET_TOUR_GUIDE,
    payload: value,
  };
}

function completeAllTourGuide()
{
  return {
    type: setupConstants.COMPLETE_ALL_TOUR_GUIDE,
    payload: {},
  };
}

function setVNCPassword(data)
{
  return {
    type: setupConstants.SET_VNC_PASSWORD,
    payload: data,
  };
}

// Generic parameter set for Setup reducer
function setSetupParameterValue(key, value)
{
  return {
    type: setupConstants.SET_SETUP_PARAMETER_VALUE,
    payload: { [key]: value },
  };
}

// Generic parameter set for Status reducer
function setStatusParameterValue(key, value)
{
  return {
    type: setupConstants.SET_STATUS_PARAMETER_VALUE,
    payload: { [key]: value },
  };
}