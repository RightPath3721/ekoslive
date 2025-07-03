import { get } from "lodash";
import
{
  WEBSOCKET_SEND_TEXT,
  WEBSOCKET_CONNECT,
  WEBSOCKET_DISCONNECT,
} from "redux-websocket";
import { appInfo } from "../../utils/appInfo";
import { store } from "../store";
import { APP_MODE } from "../../../config";

const getWebURL = (user, machineID) =>
{
  const prefix = {
    // Legacy 1 + 2 from using type
    1: "wss://ekoslive.com/message/user",
    2: "wss://ekoslive.com/message/user",
    online: "wss://ekoslive.com/message/user",
    live: "wss://ekoslive.com/message/user",
    local: "ws://" + window.location.hostname + ":5000/message/user",
    staging: "wss://staging.ekoslive.com/message/user",
  };
  const url = `${prefix[get(user, "type", "live")]}?username=${encodeURIComponent(user.username)
    }&token=${user.token}&type=${user.type}&machine_id=${machineID}`;
  return url;
};

const getAppURL = (user, ip) =>
{
  const url = `ws://${ip}:3000/message/user?username=${encodeURIComponent(user.username)}&token=${user.token}&version=${appInfo.version}&remoteToken=${user.remoteToken}`;
  return url;
};

export const wssMessageSocketActions = {
  connect,
  disconnect,
  sendText,
};

function connect(user, ip, machineID)
{
  const url = APP_MODE === "1" ? getWebURL(user, machineID) : getAppURL(user, ip);

  return {
    type: WEBSOCKET_CONNECT,
    payload: {
      url,
    },
    url,
  };
}

function disconnect()
{
  const url = store.getState().wsMessage.wsMessageURL;
  return {
    type: WEBSOCKET_DISCONNECT,
    payload: {
      url: url,
    },
    url: url,
  };
}

function sendText(message, type)
{
  const url = store.getState().wsMessage.wsMessageURL;
  return {
    type: WEBSOCKET_SEND_TEXT,
    payload: {
      type: type,
      payload: message,
    },
    url: url,
  };
}
