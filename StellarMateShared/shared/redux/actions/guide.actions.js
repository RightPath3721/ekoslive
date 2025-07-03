import { wssMessageSocketActions } from "./wssMessageSocketActions";
import { achievementsConstants, ekosConstants, settingsConstants } from "../constants";
import commands from "../../commands";

export const guideActions = {
    start,
    stop,
    clear,
    capture,
    loop,
    saveGuidePresets,
    saveCurrentGuidePreset,
    setGuideCalibrationSettings,
    getAllSettings,
    setAllSettings,
};

function start()
{
    return dispatch =>
    {
        dispatch(wssMessageSocketActions.sendText({}, "guide_start"));
        dispatch({ type: ekosConstants.GET_ECHO_DATA, data: { type: achievementsConstants.ACHIEVE_GUIDE_RMS, payload: {} } });
    };
}

function stop()
{
    return wssMessageSocketActions.sendText({}, "guide_stop");
}

function clear()
{
    return wssMessageSocketActions.sendText({}, "guide_clear");
}

function capture()
{
    return wssMessageSocketActions.sendText({}, commands.GUIDE_CAPTURE);
}

function loop()
{
    return wssMessageSocketActions.sendText({}, commands.GUIDE_LOOP);
}

function saveGuidePresets(presets)
{
    return {
        type: settingsConstants.SAVE_GUIDE_PRESETS,
        payload: presets
    };
}

function saveCurrentGuidePreset(presetName)
{
    return {
        type: settingsConstants.SAVE_CURRENT_GUIDE_PRESET,
        payload: presetName
    };
}

function setGuideCalibrationSettings(settings)
{
    return wssMessageSocketActions.sendText(settings, commands.GUIDE_SET_CALIBRATION_SETTINGS);
}

function getAllSettings()
{
    return wssMessageSocketActions.sendText({}, commands.GUIDE_GET_ALL_SETTINGS);
}

function setAllSettings(payload)
{
    return wssMessageSocketActions.sendText(payload, commands.GUIDE_SET_ALL_SETTINGS);
}
