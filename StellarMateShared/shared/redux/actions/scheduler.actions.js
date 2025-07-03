import commands from "../../commands";
import { wssMessageSocketActions } from "./wssMessageSocketActions";
import { achievementsConstants, ekosConstants } from "../constants";

export const schedulerActions = {
	addJobs,
	getJobs,
	removeJob,
	toggleScheduler,
	importMosiacPlanner,
	getAllSettings,
	setAllSettings,
	loadFilePath,
	loadFileData,
	saveSequenceFile,
};

function getAllSettings()
{
	return wssMessageSocketActions.sendText(
		{},
		commands.SCHEDULER_GET_ALL_SETTINGS,
	);
}

function setAllSettings(payload)
{
	return wssMessageSocketActions.sendText(
		payload,
		commands.SCHEDULER_SET_ALL_SETTINGS,
	);
}

function getJobs()
{
	return wssMessageSocketActions.sendText({}, commands.SCHEDULER_GET_JOBS);
}

function addJobs()
{
	return wssMessageSocketActions.sendText({}, commands.SCHEDULER_ADD_JOBS);
}

function removeJob(settings)
{
	return wssMessageSocketActions.sendText(
		settings,
		commands.SCHEDULER_REMOVE_JOBS,
	);
}

function toggleScheduler()
{
	return wssMessageSocketActions.sendText({}, commands.SCHEDULER_START_JOB);
}

function importMosiacPlanner(payload)
{
	return (dispatch) =>
	{
		dispatch(
			wssMessageSocketActions.sendText(
				payload,
				commands.SCHEDULER_IMPORT_MOSAIC,
			),
		);
		dispatch({
			type: ekosConstants.GET_ECHO_DATA,
			data: {
				type: achievementsConstants.IMPORT_MOSAIC_ACHIEVED,
				payload: payload,
			},
		});
	};
}

/**
 * Load Scheduler esl file by its absolute path
 * @param {} filepath
 * @returns
 */
function loadFilePath(filepath)
{
	return wssMessageSocketActions.sendText(
		{ filepath },
		commands.SCHEDULER_LOAD_FILE,
	);
}

/**
 * Load scheduler file directly from XML by first creating a temporay path
 * @param {} filedata
 * @returns
 */
function loadFileData(filedata, filepath)
{
	return wssMessageSocketActions.sendText(
		{ filedata, filepath },
		commands.SCHEDULER_LOAD_FILE,
	);
}

function saveSequenceFile(payload)
{
	return wssMessageSocketActions.sendText(
		payload,
		commands.SCHEDULER_SAVE_SEQUENCE_FILE,
	);
}
