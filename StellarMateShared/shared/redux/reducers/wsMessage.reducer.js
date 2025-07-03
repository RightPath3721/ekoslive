import { get } from "lodash";
import
{
  WEBSOCKET_OPEN,
  WEBSOCKET_CLOSED,
  WEBSOCKET_CONNECTING,
} from "redux-websocket";

/**
 * Connection status of Message server
 **********Sample in JSON form**********
 * {
  "url": "ws://10.0.2.2:3000/message/user?username=naheedsa&token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJuYW1lIjoibmFoZWVkc2EiLCJpYXQiOjE3MTA5NDIxOTEsImV4cCI6MTcxMTAyODU5MX0.2YJra6hznAwkxoEdfZsnVNMh-6Iz9KF2NSyhawc7Sao&version=undefined&remoteToken=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJuYW1lIjoibmFoZWVkc2EiLCJpYXQiOjE3MTA5NDIxOTEsImV4cCI6MTcxMTAyODU5MX0.JDtsHOf5nk1f_YmaLRCb45jwURk11jAY5FFBGYQzu80",
  "connecting": false,
  "_persist": {
    "rehydrated": true,
    "version": -1
  },
  "wsMessageURL": "ws://10.0.2.2:3000/message/user?username=naheedsa&token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJuYW1lIjoibmFoZWVkc2EiLCJpYXQiOjE3MTA5NDIxOTEsImV4cCI6MTcxMTAyODU5MX0.2YJra6hznAwkxoEdfZsnVNMh-6Iz9KF2NSyhawc7Sao&version=undefined&remoteToken=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJuYW1lIjoibmFoZWVkc2EiLCJpYXQiOjE3MTA5NDIxOTEsImV4cCI6MTcxMTAyODU5MX0.JDtsHOf5nk1f_YmaLRCb45jwURk11jAY5FFBGYQzu80",
  "connected": true
}
 */
const initialState =
{
  connected: false,
  connecting: false,
  url: "",
  wsMessageURL: "",
};

export function wsMessage(state = initialState, action)
{
  switch (action.type)
  {
    case WEBSOCKET_CONNECTING:
      if (action.payload.event.target.url.includes("/message/user") === false)
        return state;
      return { ...state, connecting: true };

    case WEBSOCKET_OPEN: {
      const messageURL = get(action, "payload.event.target.url", "");
      if (messageURL.includes("/message/user") === false) return state;
      return {
        ...state,
        connected: true,
        connecting: false,
        url: messageURL,
        wsMessageURL: messageURL,
      };
    }

    case WEBSOCKET_CLOSED: {
      const messageURL = get(action, "payload.event.target.url", "");
      if (messageURL.includes("/message/user") === false) return state;
      if (messageURL !== state.url) return state;

      return {
        ...state,
        connected: false,
        connecting: false,
        url: "",
        wsMessageURL: "",
      };
    }
    default:
      return state;
  }
}
