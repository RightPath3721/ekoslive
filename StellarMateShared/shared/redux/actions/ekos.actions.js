import { wssMessageSocketActions } from "./wssMessageSocketActions";
import { ekosConstants, settingsConstants } from "../constants";
import commands from "../../commands";

export const ekosActions = {
    invokeMethod,
    setProperty,
    getProperty,
    setMountQuickControls,
    getPreviewLabel,
    resetGuideChart,
    getDefaultFilePath,
    fileDirectoryOperation,
    saveJob,
    saveSequenceFile

};

function invokeMethod(object, name, args)
{
    let payload = { object: object, name: name };
    if (args !== undefined) payload["args"] = args;

    return wssMessageSocketActions.sendText(payload, commands.INVOKE_METHOD);
}

function setProperty(object, name, value)
{
    return wssMessageSocketActions.sendText(
        { object, name, value },
        commands.SET_PROPERTY,
    );
}

function getProperty(object, name)
{
    return wssMessageSocketActions.sendText(
        { object, name },
        commands.GET_PROPERTY,
    );
}

function setMountQuickControls(payload)
{
    return {
        type: settingsConstants.SET_MOUNT_QC_SETTINGS,
        payload: payload,
    };
}

function getPreviewLabel()
{
    return wssMessageSocketActions.sendText(
        {},
        commands.CAPTURE_GET_PREVIEW_LABEL,
    );
}

function resetGuideChart()
{
    return {
        type: ekosConstants.RESET_GUIDE_GRAPH,
        payload: {},
    };
}

function getDefaultFilePath(payload)
{
    return wssMessageSocketActions.sendText(payload, commands.FILE_DEFAULT_PATH);
}

function fileDirectoryOperation(payload)
{
    return wssMessageSocketActions.sendText(
        payload,
        commands.FILE_DIRECTORY_OPERATION,
    );
}

function saveSequenceFile(payload)
{
    return wssMessageSocketActions.sendText(
        payload,
        commands.SCHEDULER_SAVE_SEQUENCE_FILE,
    );
}

function saveJob(directory, filepath)
{
    return wssMessageSocketActions.sendText(
        { directory, filepath },
        commands.SCHEDULER_SAVE_FILE,
    );
}