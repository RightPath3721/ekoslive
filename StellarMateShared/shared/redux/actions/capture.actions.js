import {
	achievementsConstants,
	ekosConstants,
	settingsConstants,
} from "../constants";
import { wssMessageSocketActions } from "./wssMessageSocketActions";
import { wssMediaSocketActions } from "./wssMediaSocketActions";
import commands from "../../commands";

export const captureActions = {
	clearNotification,
	capturePreview,
	toggleVideo,
	start,
	stop,
	addSequence,
	removeSequence,
	getCalibrationSettings,
	getFileSettings,
	getLimitSettings,
	loop,
	toggleCamera,
	toggleFilterWheel,
	resetDSLRInfo,
	saveCapturePresets,
	saveCapturePreset,
	deleteCapturePreset,
	updateCapturePreset,
	saveCurrentCapturePreset,
	saveFileSettings,
	saveCalibrationSettings,
	saveLimitSettings,
	setLimitSettings,
	saveSequenceFile,
	loadSequenceFile,
	clearSequences,
	updatePreviewPreset,
	toggleLiveStacker,
	updateLiveStackingStatus,
	updateLiveStackingTarget,
	setProperty,
	getFilterSettings,
	setFilterSettings,
	saveCurrentModule,
	setCaptureSettings,
	setLivestackingSettings,
	generateDarkFlats,
	darkLibraryStart,
	darkLibraryStop,
	darkLibrarySetCameraPresets,
	darkLibraryGetCameraPresets,
	darkLibraryGetDarkSettings,
	darkLibrarySetDefectSettings,
	darkLibraryGetDefectSettings,
	darkLibrarySaveMap,
	darkLibraryGetViewMasters,
	darkLibraryGetMastersImage,
	darkLibrarySetDefectPixels,
	darkLibraryClearMasterRow,
	darkLibrarySetDefectFrame,
	getAllDarkLibrarySettings,
	setDarkLibrarySettings,
	setFileSettings,

	mountGotoPixel,
	sendNotification,

	requestSaveImage,
	saveCaptureSettings,
	updatePresetIndex,

	setAllSettings,
	getAllSettings,
};

function clearNotification()
{
	return {
		type: ekosConstants.EKOS_CLEAR_NOTIFICATION,
		payload: {},
	};
}

function capturePreview(settings)
{
	return (dispatch) =>
	{
		dispatch(
			wssMessageSocketActions.sendText(settings, commands.CAPTURE_PREVIEW),
		);
		dispatch({
			type: ekosConstants.GET_ECHO_DATA,
			data: {
				type: achievementsConstants.CAPTURE_PREVIEW_ACHIEVED,
				payload: {},
			},
		});
	};
}

function toggleVideo(enabled, maxBufferSize = 512, maxPreviewFPS = 10)
{
	return wssMessageSocketActions.sendText(
		{ enabled, maxBufferSize, maxPreviewFPS },
		commands.CAPTURE_TOGGLE_VIDEO,
	);
}

function toggleCamera(camera)
{
	return wssMessageSocketActions.sendText(
		{ camera },
		commands.CAPTURE_TOGGLE_CAMERA,
	);
}

function toggleFilterWheel(fw)
{
	return wssMessageSocketActions.sendText(
		{ fw },
		commands.CAPTURE_TOGGLE_FILTER_WHEEL,
	);
}

function start()
{
	return (dispatch) =>
	{
		dispatch(wssMessageSocketActions.sendText({}, commands.CAPTURE_START));
		dispatch({
			type: ekosConstants.GET_ECHO_DATA,
			data: { type: achievementsConstants.TEN_SEQUENCES_ACHIEVED, payload: {} },
		});
	};
}

function stop()
{
	return wssMessageSocketActions.sendText({}, commands.CAPTURE_STOP);
}

function loop(settings)
{
	return wssMessageSocketActions.sendText(settings, commands.CAPTURE_LOOP);
}

function addSequence(settings)
{
	return wssMessageSocketActions.sendText(
		settings,
		commands.CAPTURE_ADD_SEQUENCE,
	);
}

function removeSequence(index)
{
	return wssMessageSocketActions.sendText(
		{ index },
		commands.CAPTURE_REMOVE_SEQUENCE,
	);
}

function getCalibrationSettings()
{
	return wssMessageSocketActions.sendText(
		{},
		commands.CAPTURE_GET_CALIBRATION_SETTINGS,
	);
}

function getFileSettings()
{
	return wssMessageSocketActions.sendText(
		{},
		commands.CAPTURE_GET_FILE_SETTINGS,
	);
}

function getLimitSettings()
{
	return wssMessageSocketActions.sendText({}, commands.CAPTURE_GET_LIMITS);
}

function setLimitSettings(limitSettings)
{
	return wssMessageSocketActions.sendText(
		limitSettings,
		commands.CAPTURE_SET_LIMITS,
	);
}

function saveSequenceFile(filepath)
{
	return wssMessageSocketActions.sendText(
		{ filepath },
		commands.CAPTURE_SAVE_SEQUENCE_FILE,
	);
}

function loadSequenceFile(filepath, filedata)
{
	if (filedata)
		return wssMessageSocketActions.sendText(
			{ filedata },
			commands.CAPTURE_LOAD_SEQUENCE_FILE,
		);
	return wssMessageSocketActions.sendText(
		{ filepath },
		commands.CAPTURE_LOAD_SEQUENCE_FILE,
	);
}

function clearSequences()
{
	return wssMessageSocketActions.sendText({}, commands.CAPTURE_CLEAR_SEQUENCES);
}

function setFileSettings(data)
{
	return wssMessageSocketActions.sendText(
		data,
		commands.CAPTURE_SET_FILE_SETTINGS,
	);
}

function updateLiveStackingStatus(value)
{
	return {
		type: settingsConstants.UPDATE_LIVESTACKING_STATUS,
		payload: value,
	};
}

function updateLiveStackingTarget(value)
{
	return {
		type: settingsConstants.UPDATE_LIVESTACKING_TARGET,
		payload: value,
	};
}

function toggleLiveStacker(enabled, looping, target)
{
	return (dispatch) =>
	{
		dispatch(
			wssMediaSocketActions.sendText(
				{ target },
				enabled ? commands.LIVESTACK_START : commands.LIVESTACK_STOP,
			),
		);
		dispatch(updateLiveStackingStatus({ enabled, looping }));
		dispatch(updateLiveStackingTarget(enabled ? target : ""));
	};
}

function updatePresetIndex(value)
{
	return {
		type: settingsConstants.UPDATE_PRESET_INDEX,
		payload: value,
	};
}

function sendNotification(data)
{
	return (dispatch) =>
	{
		dispatch(
			wssMediaSocketActions.sendText(data, commands.SEND_NOTIFICATION_TOKEN),
		);
	};
}

function setProperty(device, propName, element, value)
{
	let prop = {
		device: device,
		property: propName,
		elements: [{ name: element, value: value }],
	};
	return wssMessageSocketActions.sendText(prop, commands.DEVICE_PROPERTY_SET);
}

function getFilterSettings()
{
	return wssMessageSocketActions.sendText({}, commands.FM_GET_DATA);
}

function setFilterSettings(settings)
{
	return wssMessageSocketActions.sendText(settings, commands.FM_SET_DATA);
}

function saveCapturePresets(presets)
{
	return {
		type: settingsConstants.SAVE_CAPTURE_PRESETS,
		payload: presets,
	};
}

function saveCapturePreset(preset)
{
	return {
		type: settingsConstants.SAVE_CAPTURE_PRESET,
		payload: preset,
	};
}

function deleteCapturePreset(presetName)
{
	return {
		type: settingsConstants.DELETE_CAPTURE_PRESET,
		payload: presetName,
	};
}

function updateCapturePreset(preset)
{
	return {
		type: settingsConstants.UPDATE_CAPTURE_PRESET,
		payload: preset,
	};
}

function saveCurrentCapturePreset(presetName)
{
	return {
		type: settingsConstants.SAVE_CURRENT_CAPTURE_PRESET,
		payload: presetName,
	};
}

function saveFileSettings(fileSettings)
{
	return {
		type: settingsConstants.SAVE_FILE_SETTINGS,
		payload: fileSettings,
	};
}

function saveCalibrationSettings(calibrationSettings)
{
	return {
		type: settingsConstants.SAVE_CALIBRATION_SETTINGS,
		payload: calibrationSettings,
	};
}

function saveLimitSettings(limitSettings)
{
	return {
		type: settingsConstants.SAVE_LIMIT_SETTINGS,
		payload: limitSettings,
	};
}

function updatePreviewPreset(type, value)
{
	return {
		type: settingsConstants.UPDATE_PREVIEW_PRESET,
		payload: { type: type, value: value },
	};
}

function resetDSLRInfo()
{
	return {
		type: settingsConstants.RESET_DSLR_INFO_SETTINGS,
	};
}

function saveCurrentModule(currentModule)
{
	return {
		type: settingsConstants.SAVE_CURRENT_MODULE,
		payload: currentModule,
	};
}

function saveCaptureSettings(settings)
{
	return {
		type: settingsConstants.SAVE_CAPTURE_SETTINGS,
		payload: settings,
	};
}

function setCaptureSettings(settings)
{
	return wssMessageSocketActions.sendText(
		settings,
		commands.CAPTURE_SET_SETTINGS,
	);
}

function setLivestackingSettings(settings)
{
	return (dispatch) =>
	{
		dispatch(
			wssMediaSocketActions.sendText(settings, commands.LIVESTACK_SET_OPTIONS),
		);
		dispatch({
			type: settingsConstants.SAVE_LIVESTACKING_SETTINGS,
			payload: settings,
		});
		dispatch({
			type: ekosConstants.GET_ECHO_DATA,
			data: { type: achievementsConstants.LIVE_STACK_ACHIEVED, payload: {} },
		});
	};
}

function generateDarkFlats()
{
	return wssMessageSocketActions.sendText(
		{},
		commands.CAPTURE_GENERATE_DARK_FLATS,
	);
}

function darkLibraryStart(settings)
{
	return (dispatch) =>
	{
		dispatch(
			wssMessageSocketActions.sendText(settings, commands.DARK_LIBRARY_START),
		);
		dispatch({
			type: ekosConstants.GET_ECHO_DATA,
			data: {
				type: achievementsConstants.CREATE_DARKS_ACHIEVED,
				payload: settings,
			},
		});
	};
}

function darkLibrarySetCameraPresets(payload)
{
	return wssMessageSocketActions.sendText(
		payload,
		commands.DARK_LIBRARY_SET_CAMERA_PRESETS,
	);
}

function darkLibraryGetCameraPresets(payload)
{
	return wssMessageSocketActions.sendText(
		{},
		commands.DARK_LIBRARY_GET_CAMERA_PRESETS,
	);
}

function darkLibraryStop()
{
	return wssMessageSocketActions.sendText({}, commands.DARK_LIBRARY_STOP);
}

function darkLibraryGetDarkSettings()
{
	return wssMessageSocketActions.sendText(
		{},
		commands.DARK_LIBRARY_GET_DARK_SETTINGS,
	);
}

function darkLibrarySetDefectSettings(payload)
{
	return wssMessageSocketActions.sendText(
		payload,
		commands.DARK_LIBRARY_SET_DEFECT_SETTINGS,
	);
}

function darkLibrarySetDefectPixels(payload)
{
	return (dispatch) =>
	{
		dispatch(
			wssMessageSocketActions.sendText(
				payload,
				commands.DARK_LIBRARY_SET_DEFECT_PIXELS,
			),
		);
		dispatch({
			type: ekosConstants.GET_ECHO_DATA,
			data: {
				type: achievementsConstants.CREATE_DEFECT_ACHIEVED,
				payload: payload,
			},
		});
	};
}

function darkLibraryGetDefectSettings()
{
	return wssMessageSocketActions.sendText(
		{},
		commands.DARK_LIBRARY_GET_DEFECT_SETTINGS,
	);
}

function darkLibrarySaveMap()
{
	return wssMessageSocketActions.sendText({}, commands.DARK_LIBRARY_SAVE_MAP);
}

function darkLibraryGetViewMasters()
{
	return wssMessageSocketActions.sendText(
		{},
		commands.DARK_LIBRARY_GET_VIEW_MASTERS,
	);
}

function darkLibraryGetMastersImage(row)
{
	return wssMessageSocketActions.sendText(
		row,
		commands.DARK_LIBRARY_GET_MASTERS_IMAGE,
	);
}

function darkLibraryClearMasterRow(rowIndex)
{
	return wssMessageSocketActions.sendText(
		rowIndex,
		commands.DARK_LIBRARY_CLEAR_MASTERS_ROW,
	);
}

function darkLibrarySetDefectFrame()
{
	return wssMessageSocketActions.sendText(
		{},
		commands.DARK_LIBRARY_SET_DEFECT_FRAME,
	);
}

function getAllDarkLibrarySettings()
{
	return wssMessageSocketActions.sendText(
		{},
		commands.DARK_LIBRARY_GET_ALL_SETTINGS,
	);
}

function setDarkLibrarySettings(payload)
{
	return wssMessageSocketActions.sendText(
		payload,
		commands.DARK_LIBRARY_SET_ALL_SETTINGS,
	);
}

function mountGotoPixel(payload)
{
	return (dispatch) =>
	{
		dispatch(
			wssMessageSocketActions.sendText(payload, commands.MOUNT_GOTO_PIXEL),
		);
		dispatch({
			type: ekosConstants.GET_ECHO_DATA,
			data: { type: achievementsConstants.MOUNT_GOTO_ACHIEVED, payload: {} },
		});
	};
}

function requestSaveImage(payload)
{
	return {
		type: settingsConstants.SAVE_IMAGE_REQUESTED,
		payload: payload,
	};
}

function setAllSettings(payload)
{
	return wssMessageSocketActions.sendText(
		payload,
		commands.CAPTURE_SET_ALL_SETTINGS,
	);
}

function getAllSettings()
{
	return wssMessageSocketActions.sendText(
		{},
		commands.CAPTURE_GET_ALL_SETTINGS,
	);
}
