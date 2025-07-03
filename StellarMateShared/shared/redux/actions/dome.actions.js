import { wssMessageSocketActions } from "./wssMessageSocketActions";
import commands from "../../commands";

export const domeActions = {
    park,
    unpark,
    goto,
    stop,
};

function goto(az)
{
    return wssMessageSocketActions.sendText({ az }, commands.DOME_GOTO);
}

function stop()
{
    return wssMessageSocketActions.sendText({}, commands.DOME_STOP);
}

function park()
{
    return wssMessageSocketActions.sendText({}, commands.DOME_PARK);
}

function unpark()
{
    return wssMessageSocketActions.sendText({}, commands.DOME_UNPARK);
}