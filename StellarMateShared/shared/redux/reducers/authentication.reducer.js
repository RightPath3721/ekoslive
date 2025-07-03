import { WEBSOCKET_MESSAGE } from "redux-websocket";
import { userConstants } from "../constants";
import commands from "../../commands";
import { APP_MODE } from "../../../config";

// It is use for authentication, when the user login is successful or user is logging
/**
**********Sample in JSON form**********
 * {
  "isLogging": false,
  "_persist": {
    "rehydrated": true,
    "version": -1
  },
  "loggedIn": true
}
 */
const initialState = {
	// It is true when the user is logged in
	loggedIn: false,

	// True when it is in process to log in and waiting for the response from the server
	isLogging: false,
	user: null,
	// session expired?
	expired: false,
};

export function authentication(state = initialState, action)
{
	switch (action.type) {
		case userConstants.USER_LOGIN_REQUESTED:
			return {
				isLogging: true,
				loggedIn: false,
				expired: false,
				user: action.user,
			};
		case userConstants.USER_LOGIN_SUCCEEDED:
			if (!action.user)
				return {
					loggedIn: false,
					isLogging: false,
					user: null,
					expired: false,
				};
			return {
				loggedIn: true,
				isLogging: false,
				expired: false,
				user: action.user,
			};
		case userConstants.USER_LOGIN_FAILED:
		case userConstants.REGISTER_FAILURE:
		case userConstants.LOGOUT:
			return { loggedIn: false, isLogging: false, user: null, expired: false };
		case WEBSOCKET_MESSAGE:
			if (action.payload.event.target.url.includes("/message/user") === false)
				return state;
			const message = JSON.parse(action.payload.data);
			// Watch for logout command
			if (message.type === commands.LOGOUT)
			{
				if (APP_MODE === "1")
				{
					localStorage.removeItem("currentUser");
				}
				return {
					loggedIn: false,
					isLogging: false,
					user: null,
					expired: false,
				};
			}
			else if (message.type === commands.SESSION_EXPIRED)
			{
				return { loggedIn: false, isLogging: false, expired: true };
			}
			else return state;
		default:
			return state;
	}
}
