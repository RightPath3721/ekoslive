import { get } from "lodash";
import { wssMessageSocketActions } from "./wssMessageSocketActions";
import { wssMediaSocketActions } from "./wssMediaSocketActions";
import commands from "../../commands";
import { deviceConstants } from "../constants";

export const deviceActions = {
  addDevice,
  updateDevice,
  removeDevice,
  clearDevices,
  getDevices,
  getDevice,
  setKStarsStatus,
  setEkosLiveStatus,
  saveToken,
  sendPlanID,
  getConnectionStatus,
};

function getDevices()
{
  return wssMessageSocketActions.sendText({}, commands.GET_DEVICES);
}

function getDevice(device, compact = false)
{
  return wssMessageSocketActions.sendText(
    { device, compact },
    commands.DEVICE_GET
  );
}

function addDevice(oneDevice)
{
  return { type: deviceConstants.DEVICE_ADD, payload: oneDevice };
}

function updateDevice(oneDevice)
{
  return { type: deviceConstants.DEVICE_UPDATE, payload: oneDevice };
}

function removeDevice(ip)
{
  return (dispatch) =>
  {
    const selectedDeviceIP = get(
      store.getState().devices,
      "selectedDevice.ip",
      ""
    );
    if (selectedDeviceIP === ip)
    {
      dispatch(logout());
    }
    dispatch({ type: deviceConstants.DEVICE_REMOVE, payload: { ip } });
  };
}

function clearDevices()
{
  return { type: deviceConstants.DEVICE_CLEAR_ALL };
}

function setKStarsStatus(status)
{
  return { type: deviceConstants.KSTARS_STATUS, payload: status };
}

function setEkosLiveStatus(status)
{
  return { type: deviceConstants.EKOSLIVE_STATUS, payload: status };
}

function saveToken(token)
{
  return (dispatch) =>
  {
    dispatch(
      wssMediaSocketActions.sendText(token, commands.SAVE_NOTIFICATION_TOKEN)
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
