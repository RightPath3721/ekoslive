import commands from "../../commands";
import { ekosConstants, settingsConstants } from "../constants";
import { wssMessageSocketActions } from "./wssMessageSocketActions";

export const focusActions = {
	start,
	stop,
	reset,
	focus_in,
	focus_out,
	focus_loop,
	focus_absolute,
	focus_capture,

	saveFocusPresets,
	saveCurrentFocusPreset,

	setFocusCrosshair,
	setFocusSettings,
	saveTargetFocusSettings,
	getAllSettings,
	setAllSettings,

	resetGraph,
};

function start()
{
	return wssMessageSocketActions.sendText({}, commands.FOCUS_START);
}

function stop()
{
	return wssMessageSocketActions.sendText({}, commands.FOCUS_STOP);
}

function reset()
{
	return wssMessageSocketActions.sendText({}, commands.FOCUS_RESET);
}

function focus_in(steps)
{
	return wssMessageSocketActions.sendText({ steps }, commands.FOCUS_IN);
}

function focus_out(steps)
{
	return wssMessageSocketActions.sendText({ steps }, commands.FOCUS_OUT);
}

function focus_loop()
{
	return wssMessageSocketActions.sendText({}, commands.FOCUS_LOOP);
}

function setFocusCrosshair(x, y)
{
	return wssMessageSocketActions.sendText(
		{ x, y },
		commands.FOCUS_SET_CROSSHAIR,
	);
}

function focus_absolute(device, property, elements)
{
	return wssMessageSocketActions.sendText(
		{
			device: device,
			property: property,
			elements: elements,
		},
		commands.DEVICE_PROPERTY_SET,
	);
}

function focus_capture()
{
	return wssMessageSocketActions.sendText({}, commands.FOCUS_CAPTURE);
}

function setFocusSettings(settings)
{
	return wssMessageSocketActions.sendText(
		settings,
		commands.FOCUS_SET_SETTINGS,
	);
}

function getAllSettings()
{
	return wssMessageSocketActions.sendText({}, commands.FOCUS_GET_ALL_SETTINGS);
}

function setAllSettings(payload)
{
	return wssMessageSocketActions.sendText(
		payload,
		commands.FOCUS_SET_ALL_SETTINGS,
	);
}

function saveTargetFocusSettings(settings)
{
	return {
		type: settingsConstants.SAVE_TARGET_FOCUS_SETTINGS,
		payload: settings,
	};
}

function saveFocusPresets(presets)
{
	return {
		type: settingsConstants.SAVE_FOCUS_PRESETS,
		payload: presets,
	};
}

function saveCurrentFocusPreset(presetName)
{
	return {
		type: settingsConstants.SAVE_CURRENT_FOCUS_PRESET,
		payload: presetName,
	};
}

function resetGraph(payload)
{
	return {
		type: ekosConstants.RESET_FOCUS_GRAPH,
		payload: payload,
	};
}
