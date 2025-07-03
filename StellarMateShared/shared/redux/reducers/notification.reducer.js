import moment from "moment";
import { notificationConstants } from "../constants";
import { WEBSOCKET_MESSAGE } from "redux-websocket";
import commands from "../../commands";

/**
 * Used when we need to pop up a notification
 **********Sample in JSON form**********
 * {
  "savedNotifications": [
    {
      "ts": 1710941567147,
      "duration": 1000,
      "uuid": "2024-03-20-04-32-44",
      "severity": 1,
      "message": "Image Recieved."
    }
  ],
  "maxNotifications": 4,
  "notifications": [
    {
      "ts": 1710941567147,
      "duration": 1000,
      "uuid": "2024-03-20-04-32-44",
      "severity": 1,
      "message": "Image Recieved."
    }
  ]
}
 */
const initialState =
{
    // All recent notifications. Each notification has duration, message, ts etc
    notifications: [],

    // All unread notifications
    unReadNotifications: [],

    // Number of maximum notifications at once
    maxNotifications: 4,

    // We save the recent notications and display it in the app. We can also clear this 
    savedNotifications: [],
    dnd: false
};

export const notifications = (state = initialState, action) =>
{
    switch (action.type)
    {
        case WEBSOCKET_MESSAGE:
            if (action.payload.event.target.url.includes("/message/user") === false)
                return state;
            const message = JSON.parse(action.payload.data);
            // Watch for logout command
            if (message.type === commands.NEW_UNREAD_NOTIFICATION)
            {
                return {...state, unReadNotifications: [message.notification, ...state.unReadNotifications]}
            }
            else
                return state;
        case notificationConstants.ADD_NOTIFICATION:
            {
                let notifications = [...state.notifications, action.payload];
                // Sort by priority
                notifications = notifications.sort((a, b) =>
                {
                    if (!a.priority && b.priority) return 1;
                    if (a.priority && !b.priority) return -1;
                    return 0;
                });

                notifications = notifications.slice(0, state.maxNotifications);

                // Remove older notifications if they have been there for a while
                if (notifications.length > 1)
                {
                    notifications = notifications.filter(oneNotification => moment().diff(oneNotification.ts, 'seconds') < 5);
                };

                let savedNotifications = state.savedNotifications;
                // Limit Notifications to 15 max
                if (state.savedNotifications.length >= 15)
                    savedNotifications.pop();
                return { ...state, notifications, savedNotifications: [action.payload, ...savedNotifications] };
            };

        case notificationConstants.SET_MAX_NOTIFICATIONS:
            {
                return { ...state, maxNotifications: action.payload };
            };

        case notificationConstants.REMOVE_NOTIFICATION:
            {
                return {
                    ...state,
                    notifications: state.notifications.filter(oneNotification => oneNotification.uuid !== action.payload)
                };
            };

        case notificationConstants.REMOVE_SAVED_NOTIFICATION:
            {
                return {
                    ...state,
                    savedNotifications: []
                };
            };

        case notificationConstants.SET_UNREAD_NOTIFICATIONS:
            {
                return {
                    ...state,
                    unReadNotifications: action.payload
                };
            }

        case notificationConstants.SET_DND: 
            {
                return {
                    ...state,
                    dnd: !state.dnd
                };
            }

        default:
            {
                return state;
            }

    }
};
