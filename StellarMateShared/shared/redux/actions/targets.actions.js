import { isEmpty } from "lodash";
import { wssMessageSocketActions } from "./wssMessageSocketActions";
import { wssMediaSocketActions } from "./wssMediaSocketActions";
import { targetConstants } from "../constants";
import commands from "../../commands";
import { logError } from "../../utils/logs";
import storage from "../../../config/storage";

export const targetsActions = {
	getAlmanac,
	searchObjects,
	getObjectsInfo,
	getObjectsObservability,
	getObjectsRiseSet,
	getObjectsImage,
	loadHiPSCache,
	removeHiPSObjects,
	loadHiPSObjects,
	setFovProfiles,
	setActiveList,
	setCurrentFOVProfile,
	clearLoadingObjects,
	clearFramingObjects,
	setFramingTarget,
	setLists,
	getObjectInfo,
	setSelectedTarget,
	getObjectsNames,
	getDesignations,
};

function getAlmanac()
{
	return wssMessageSocketActions.sendText({}, commands.ASTRO_GET_ALMANAC);
}

function searchObjects(criteria)
{
	return wssMessageSocketActions.sendText(
		criteria,
		commands.ASTRO_SEARCH_OBJECTS,
	);
}

function clearLoadingObjects()
{
	return { type: targetConstants.CLEAR_LOADING_OBJECTS };
}

function getObjectsInfo(object, exact = true)
{
	return (dispatch) =>
	{
		dispatch({
			type: targetConstants.SET_HIPS_REMOTE_LOADING_OBJECT,
			payload: object.names,
		});
		dispatch(
			wssMessageSocketActions.sendText(
				{ ...object, exact },
				commands.ASTRO_GET_OBJECTS_INFO,
			),
		);
	};
}

function getObjectsNames()
{
	return wssMessageSocketActions.sendText({}, commands.ASTRO_GET_NAMES);
}

function getDesignations()
{
	return wssMessageSocketActions.sendText({}, commands.ASTRO_GET_DESIGNATIONS);
}

function getObjectsImage(object, exact = true)
{
	return wssMediaSocketActions.sendText(
		{ ...object, exact },
		commands.ASTRO_GET_OBJECTS_IMAGE,
	);
}

function getObjectsObservability(jd, names, exact = true)
{
	return wssMessageSocketActions.sendText(
		{ jd, names, exact },
		commands.ASTRO_GET_OBJECTS_OBSERVABILITY,
	);
}

function getObjectsRiseSet(jd, names, exact = true)
{
	return wssMessageSocketActions.sendText(
		{ jd, names, exact },
		commands.ASTRO_GET_OBJECTS_RISESET,
	);
}

function loadHiPSCache(targetObjects)
{
	// targetObjects comes from state.targets.objects
	return async (dispatch) =>
	{
		let cacheToSet = []; // Default to an empty array

		try
		{
			const storedHipsCacheJson = await storage.getItem("hips:cache");

			if (storedHipsCacheJson)
			{
				// If something was retrieved
				const parsedCache = JSON.parse(storedHipsCacheJson);
				if (Array.isArray(parsedCache))
				{
					// Successfully parsed an array from storage
					const targetNamesFromObjects =
						targetObjects && Array.isArray(targetObjects)
							? targetObjects
									.map((obj) => obj && obj.info && obj.info.name)
									.filter(Boolean)
							: [];
					cacheToSet = [
						...new Set([...parsedCache, ...targetNamesFromObjects]),
					];
				}
				else
				{
					// Data in storage was not a valid array
					logError(
						"loadHiPSCache Warning: Parsed 'hips:cache' from storage was not an array.",
					);
					if (targetObjects && Array.isArray(targetObjects))
					{
						cacheToSet = [
							...new Set(
								targetObjects
									.map((obj) => obj && obj.info && obj.info.name)
									.filter(Boolean),
							),
						];
					}
				}
			}
			else
			{
				// No "hips:cache" found in storage. Initialize from targetObjects if available.
				if (targetObjects && Array.isArray(targetObjects))
				{
					cacheToSet = [
						...new Set(
							targetObjects
								.map((obj) => obj && obj.info && obj.info.name)
								.filter(Boolean),
						),
					];
				}
			}
		}
		catch (error)
		{
			logError(
				`loadHiPSCache Error: ${error}. Initializing HIPS cache from targetObjects or empty.`,
			);
			if (targetObjects && Array.isArray(targetObjects))
			{
				cacheToSet = [
					...new Set(
						targetObjects
							.map((obj) => obj && obj.info && obj.info.name)
							.filter(Boolean),
					),
				];
			}
		}
		dispatch({ type: targetConstants.SET_HIPS_CACHE, payload: cacheToSet });
	};
}

function removeHiPSObjects(names)
{
	return { type: targetConstants.REMOVE_OBJECTS, payload: names };
}

function loadHiPSObjects(names, exact = true)
{
	return async (dispatch) =>
	{
		try
		{
			dispatch({
				type: targetConstants.SET_HIPS_LOCAL_LOADING_OBJECT,
				payload: names,
			});
			const objects = [];
			const pendingInfos = [];
			const pendingImages = [];
			for (const name of names)
			{
				const oneObject = await storage.getItem("hips:" + name);
				if (oneObject)
				{
					let complete = true;
					const parsedObject = JSON.parse(oneObject);
					if (parsedObject.info === undefined)
					{
						complete = false;
						pendingInfos.push(name);
					}

					if (parsedObject.metadata === undefined)
					{
						complete = false;
						pendingImages.push(name);
					}

					if (complete) objects.push(parsedObject);
				}
			}

			if (!isEmpty(pendingInfos))
				dispatch(targetsActions.getObjectsInfo({ names: pendingInfos, exact }));
			if (!isEmpty(pendingImages))
				dispatch(
					targetsActions.getObjectsImage({ names: pendingImages, exact }),
				);
			if (!isEmpty(objects))
				dispatch({ type: targetConstants.SET_HIPS_OBJECTS, payload: objects });
		}
		catch (error)
		{
			logError(`loadHiPSObjects Error: ${JSON.stringify(error)}`);
		}
	};
}

function setActiveList(value)
{
	return {
		type: targetConstants.SET_ACTIVE_LIST,
		payload: value,
	};
}

function setFovProfiles(list)
{
	return {
		type: targetConstants.SET_FOV_PROFILES,
		payload: list,
	};
}

function setCurrentFOVProfile(name)
{
	return {
		type: targetConstants.SET_CURRENT_FOV_PROFILE,
		payload: name,
	};
}

function setLists(object)
{
	return {
		type: targetConstants.SET_LISTS,
		payload: object,
	};
}

function clearFramingObjects()
{
	return {
		type: targetConstants.CLEAR_FRAMING_OBJECTS,
	};
}

function setFramingTarget(name)
{
	return {
		type: targetConstants.SET_FRAMING_TARGET,
		payload: name,
	};
}

function setSelectedTarget(object)
{
	return {
		type: targetConstants.SET_SELECTED_TARGET,
		payload: object,
	};
}

function getObjectInfo(object)
{
	return (dispatch) =>
	{
		dispatch(
			wssMessageSocketActions.sendText(object, commands.ASTRO_GET_OBJECT_INFO),
		);
	};
}
