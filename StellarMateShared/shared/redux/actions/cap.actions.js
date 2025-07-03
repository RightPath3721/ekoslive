import { wssMessageSocketActions } from "./wssMessageSocketActions";
import commands from "../../commands";

export const capActions = {
    park,
    unpark,
    set_light,
};

function set_light(enabled)
{
    return wssMessageSocketActions.sendText({ enabled }, commands.CAP_SET_LIGHT);
}

function park()
{
    return wssMessageSocketActions.sendText({}, commands.CAP_PARK);
}

function unpark()
{
    return wssMessageSocketActions.sendText({}, commands.CAP_UNPARK);
}