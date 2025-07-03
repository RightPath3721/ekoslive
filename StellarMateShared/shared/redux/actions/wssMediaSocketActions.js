import { get } from "lodash";
import
{
  WEBSOCKET_SEND_TEXT,
  WEBSOCKET_SEND_BINARY,
  WEBSOCKET_CONNECT,
  WEBSOCKET_DISCONNECT,
} from "redux-websocket";
import { APP_MODE } from "../../../config";
import { ekosConstants } from "../constants";
import { appInfo } from "../../utils/appInfo";
import { store } from "../store";

export const wssMediaSocketActions = {
  connect,
  disconnect,
  sendData,
  sendText,
  clearLiveStacking,
  updateImage,
  clearImageData,
};

const getWebUrl = (user, machineID) =>
{
  const prefix = {
    // Legacy 1 + 2 from using type
    1: "wss://ekoslive.com/media/user",
    2: "wss://ekoslive.com/media/user",
    online: "wss://ekoslive.com/media/user",
    live: "wss://ekoslive.com/media/user",
    local: "ws://" + window.location.hostname + ":5000/media/user",
    staging: "wss://staging.ekoslive.com/media/user",
  };

  const url = `${prefix[get(user, "type", "live")]}?username=${user.username
    }&token=${user.token}&type=${user.type}&machine_id=${machineID}`;
  return url;
};

const getAppUrl = (user, ip) =>
{
  const url = `ws://${ip}:3000/media/user?username=${encodeURIComponent(user.username)}&token=${user.token}&version=${appInfo.version}&type=${user.type}&client_type=2&remoteToken=${user.remoteToken}`;
  return url;
};

function connect(user, ip, machineID)
{
  const url =
    APP_MODE === "1" ? getWebUrl(user, machineID) : getAppUrl(user, ip);
  return {
    type: WEBSOCKET_CONNECT,
    payload: { url },
    url,
  };
}

function disconnect()
{
  const url = store.getState().wsMedia.wsMediaUrl;
  return {
    type: WEBSOCKET_DISCONNECT,
    payload: {
      url,
    },
    url,
  };
}

function sendData(payload)
{
  const url = store.getState().wsMedia.wsMediaUrl;
  return {
    type: WEBSOCKET_SEND_BINARY,
    payload,
    url,
  };
}

function sendText(message, type)
{
  const url = store.getState().wsMedia.wsMediaUrl;
  return {
    type: WEBSOCKET_SEND_TEXT,
    payload: { type: type, payload: message },
    url,
  };
}

function clearLiveStacking()
{
  return {
    type: ekosConstants.LIVESTACK_CLEAR_DATA,
  };
}

/**
 * Updates the image for LiveStacking when the user select it from Live stacking images array
 * @param {*} message
 * @returns
 */
function updateImage(message)
{
  return {
    type: ekosConstants.LIVESTACK_UPDATE_IMAGE,
    payload: message,
  };
}

/**
 * Clear Capture Image Data when LiveStacking is running
 * @param {*} type To match switch case i.e ImageModule.CAPTURE
 * @returns
 */
function clearImageData(type)
{
  return {
    type: ekosConstants.CLEAR_IMAGE_DATA,
    payload: type,
  };
}
