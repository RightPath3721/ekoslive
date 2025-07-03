import { wssMessageSocketActions } from "./wssMessageSocketActions";
import commands from "../../commands";
import { ekosConstants } from "../constants";

export const dialogActions = {
    sendResponse,
    dialogTimeout
};

function sendResponse(button)
{
    return dispatch =>
    {
        dispatch(wssMessageSocketActions.sendText({ button }, commands.DIALOG_GET_RESPONSE));
        dispatch({ type: ekosConstants.REMOVE_DIALOG });
    };
}

function dialogTimeout()
{
    return {
        type: ekosConstants.REMOVE_DIALOG
    };
}
