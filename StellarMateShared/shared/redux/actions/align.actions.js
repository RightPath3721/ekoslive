import { wssMessageSocketActions } from "./wssMessageSocketActions";
import { wssMediaSocketActions } from "./wssMediaSocketActions";
import commands from "../../commands";
import { ekosConstants, settingsConstants } from "../constants";

export const alignActions = {
    solve,
    loadAndSlew,
    setFileExtension,
    stop,

    setAlignSettings,
    setAlignOptionSettings,
    setPAHSettings,

    saveTargetAlignSettings,
    saveTargetPAHSettings,

    saveAlignPresets,
    saveCurrentAlignPreset,
    toggleManualRotator,
    closeManualRotator,
    getAllSettings,
    setAllSettings,
    loadAndSlewByPath,
};

function solve()
{
    return wssMessageSocketActions.sendText({}, "align_solve");
}

function setAlignSettings(settings)
{
    return wssMessageSocketActions.sendText(settings, commands.ALIGN_SET_SETTINGS);
}


function setAlignOptionSettings(settings)
{
    return wssMessageSocketActions.sendText(settings, commands.ALIGN_SET_ASTROMETRY_SETTINGS);
}

function getAllSettings()
{
    return wssMessageSocketActions.sendText({}, commands.ALIGN_GET_ALL_SETTINGS);
}

function setAllSettings(payload)
{
    return wssMessageSocketActions.sendText(payload, commands.ALIGN_SET_ALL_SETTINGS);
}

function setPAHSettings(settings)
{
    return wssMessageSocketActions.sendText(settings, commands.PAH_SET_SETTINGS);
}

function stop()
{
    return wssMessageSocketActions.sendText({}, commands.ALIGN_STOP);
}

function setFileExtension(ext)
{
    return wssMediaSocketActions.sendText(ext, commands.ALIGN_SET_FILE_EXTENSION);
}

function loadAndSlew(data)
{
    return wssMediaSocketActions.sendData(data);
}

function loadAndSlewByPath(payload)
{
    return wssMessageSocketActions.sendText(payload, commands.ALIGN_LOAD_AND_SLEW);
}

function saveTargetAlignSettings(settings)
{
    return {
        type: settingsConstants.SAVE_TARGET_ALIGN_SETTINGS,
        payload: settings
    };
}

function saveTargetPAHSettings(settings)
{
    return {
        type: settingsConstants.SAVE_TARGET_POLAR_SETTINGS,
        payload: settings
    };
}

function saveAlignPresets(presets)
{
    return {
        type: settingsConstants.SAVE_ALIGN_PRESETS,
        payload: presets
    };
}

function saveCurrentAlignPreset(presetName)
{
    return {
        type: settingsConstants.SAVE_CURRENT_ALIGN_PRESET,
        payload: presetName
    };
}

/**
 * Internal, to close manual rotator dialog.
 * @returns {{type: string}}
 */
function closeManualRotator()
{
    return {
        type: ekosConstants.CLOSE_MANUAL_ROTATOR
    }
}

/**
 * Toggle remote Ekos Manual Rotator on or off
 * @param settings {toggled: true | false}
 * @returns {{payload: {payload: *, type: *}, type: string, url: null}}
 */
function toggleManualRotator(settings)
{
    return wssMessageSocketActions.sendText(settings, commands.ALIGN_MANUAL_ROTATOR_TOGGLE);
}