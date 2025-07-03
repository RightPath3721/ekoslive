import { wssMessageSocketActions } from "./wssMessageSocketActions";
import { opticalTrainsConstants } from "../constants";
import commands from "../../commands";

export const opticalTrainActions = {
	getOpticalTrainNames,
	getOpticalTrainInfo,
	removeOpticalTrain,
	getAllTrains,
	addOpticalTrain,
	resetOpticalTrain,
	updateTrain,
	setTrain,
	trainAccept,
	getSelectedTrains,
	getSelectedTrainSettings,
	setSelectedScope,
	setSelectedLens,
};

function getOpticalTrainNames(id)
{
	return wssMessageSocketActions.sendText(
		{ id: id },
		commands.OPTICAL_TRAIN_GET_NAMES,
	);
}

function getOpticalTrainInfo()
{
	return wssMessageSocketActions.sendText({}, commands.OPTICAL_TRAIN_GET_INFO);
}

function removeOpticalTrain(index)
{
	return wssMessageSocketActions.sendText(index, commands.TRAIN_DELETE);
}

function getAllTrains()
{
	return wssMessageSocketActions.sendText({}, commands.TRAIN_GET_ALL);
}

function addOpticalTrain(payload)
{
	return wssMessageSocketActions.sendText(payload, commands.TRAIN_ADD);
}

function resetOpticalTrain(payload)
{
	return wssMessageSocketActions.sendText(payload, commands.TRAIN_RESET);
}

function updateTrain(payload)
{
	return wssMessageSocketActions.sendText(payload, commands.TRAIN_UPDATE);
}

function setTrain(payload)
{
	return (dispatch) =>
	{
		dispatch(wssMessageSocketActions.sendText(payload, commands.TRAIN_SET));
	};
}

function trainAccept(payload)
{
	return wssMessageSocketActions.sendText(payload, commands.TRAIN_ACCEPT);
}

function getSelectedTrains()
{
	return wssMessageSocketActions.sendText({}, commands.TRAIN_GET_PROFILES);
}

function getSelectedTrainSettings(id)
{
	return wssMessageSocketActions.sendText({ id }, commands.TRAIN_SETTINGS_GET);
}

function setSelectedScope(item)
{
	return {
		type: opticalTrainsConstants.SET_SELECTED_SCOPE,
		payload: item,
	};
}

function setSelectedLens(item)
{
	return {
		type: opticalTrainsConstants.SET_SELECTED_LENS,
		payload: item,
	};
}
