import commands from "../../commands";
import { achievementsConstants, ekosConstants, settingsConstants } from "../constants";
import { wssMessageSocketActions } from "./wssMessageSocketActions";

export const polarActions = {
  start,
  stop,
  refresh,
  resetView,
  setCrosshair,
  setStarSelectDone,
  refreshingDone,
  setManualSlewDone,
  setZoom,
  setAlgorithm,
  saveSettings,
  clearUpdatedErrors,
};

function start()
{
  return wssMessageSocketActions.sendText({}, commands.PAH_START);
}

function stop()
{
  return wssMessageSocketActions.sendText({}, commands.PAH_STOP);
}

function refresh(value)
{
  return (dispatch) =>
  {
    dispatch(wssMessageSocketActions.sendText({ value }, commands.PAH_REFRESH));
    dispatch({
      type: ekosConstants.GET_ECHO_DATA,
      data: { type: achievementsConstants.POLAR_ALIGNMENT_BOX, payload: {} },
    });
  };
}

function setCrosshair(x, y)
{
  return wssMessageSocketActions.sendText({ x, y }, commands.PAH_SET_CROSSHAIR);
}

function setStarSelectDone()
{
  return wssMessageSocketActions.sendText({}, commands.PAH_SELECT_STAR_DONE);
}

function resetView()
{
  return wssMessageSocketActions.sendText({}, commands.PAH_RESET_VIEW);
}

function refreshingDone()
{
  return wssMessageSocketActions.sendText({}, commands.PAH_REFRESHING_DONE);
}

function setManualSlewDone()
{
  return wssMessageSocketActions.sendText({}, commands.PAH_SLEW_DONE);
}

function setZoom(scale)
{
  return wssMessageSocketActions.sendText({ scale }, commands.PAH_SET_ZOOM);
}

function saveSettings(settings)
{
  return {
    type: settingsConstants.SAVE_POLAR_SETTINGS,
    payload: settings,
  };
}

function setAlgorithm(payload)
{
  return wssMessageSocketActions.sendText(payload, commands.PAH_SET_ALGORITHM);
}

// Clear updated errors values, whenever PAA is started
function clearUpdatedErrors(payload)
{
  return {
    type: settingsConstants.CLEAR_UPDATED_POLAR_ERRORS,
    payload: {},
  };
}
