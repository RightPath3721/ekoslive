import commands from "../../commands";
import { settingsConstants } from "../constants";
import { wssMessageSocketActions } from "./wssMessageSocketActions";

export const profileActions = {
  addProfile,
  deleteProfile,
  updateProfile,
  getProfiles,
  getProfile,
  startProfile,
  stopProfile,
  setProfileMapping,
  addScope,
  deleteScope,
  updateScope,
  saveDSLRSettings,
  saveSelectedProfile,
  getStellarSolverProfiles,
  portSelectorConnectAll,
  addDSLRLens,
  deleteDSLRLens,
  getScopesAndLenses,
  updateDSLRLens,
};

function addProfile(settings)
{
  return wssMessageSocketActions.sendText(settings, commands.ADD_PROFILE);
}

function updateProfile(settings)
{
  return wssMessageSocketActions.sendText(settings, commands.UPDATE_PROFILE);
}

function deleteProfile(name)
{
  return wssMessageSocketActions.sendText({ name }, commands.DELETE_PROFILE);
}

function getProfile(name)
{
  return wssMessageSocketActions.sendText({ name }, commands.GET_PROFILE);
}

function getProfiles()
{
  return wssMessageSocketActions.sendText({}, commands.GET_PROFILES);
}

function startProfile(name)
{
  return wssMessageSocketActions.sendText({ name }, commands.START_PROFILE);
}

function stopProfile()
{
  return wssMessageSocketActions.sendText({}, commands.STOP_PROFILE);
}

function setProfileMapping(mappings)
{
  return wssMessageSocketActions.sendText(
    mappings,
    commands.SET_PROFILE_MAPPING
  );
}

function portSelectorConnectAll()
{
  // send to KStars to connect all
  return wssMessageSocketActions.sendText(
    {},
    commands.SET_PROFILE_PORT_SELECTION
  );
}

function addScope(scope)
{
  return wssMessageSocketActions.sendText(scope, commands.ADD_SCOPE);
}

function updateScope(scope)
{
  return wssMessageSocketActions.sendText(scope, commands.UPDATE_SCOPE);
}

function updateDSLRLens(lens)
{
  return wssMessageSocketActions.sendText(lens, commands.DSLR_UPDATE_LENS);
}

function deleteScope(scope)
{
  return wssMessageSocketActions.sendText(scope, commands.DELETE_SCOPE);
}

function deleteDSLRLens(lens)
{
  return wssMessageSocketActions.sendText(lens, commands.DSLR_DELETE_LENS);
}

function saveDSLRSettings(settings)
{
  return wssMessageSocketActions.sendText(settings, commands.DSLR_SET_INFO);
}

function saveSelectedProfile(selectedProfile)
{
  return {
    type: settingsConstants.SAVE_SELECTED_PROFILE,
    payload: selectedProfile,
  };
}

function getStellarSolverProfiles()
{
  return wssMessageSocketActions.sendText(
    {},
    commands.GET_STELLARSOLVER_PROFILES
  );
}

function addDSLRLens(settings)
{
  return wssMessageSocketActions.sendText(settings, commands.DSLR_ADD_LENS);
}

function getScopesAndLenses()
{
  return (dispatch) =>
  {
    dispatch(wssMessageSocketActions.sendText({}, commands.GET_SCOPES));
    dispatch(wssMessageSocketActions.sendText({}, commands.GET_DSLR_LENSES));
  };
}
