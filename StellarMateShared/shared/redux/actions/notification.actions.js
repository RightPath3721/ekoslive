import { notificationConstants } from "../constants/notifications.constants";

export const notificationAction = {
    setUnreadNotification,
    setDND
};

function setUnreadNotification(notifications)
{
    return {
        type: notificationConstants.SET_UNREAD_NOTIFICATIONS,
        payload: notifications
    }
}

function setDND()
{
    return {
        type: notificationConstants.SET_DND,
        payload: null,
    }
}