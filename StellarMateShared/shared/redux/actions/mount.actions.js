import { wssMessageSocketActions } from "./wssMessageSocketActions";
import { settingsConstants } from "../constants";
import commands from "../../commands";
import storage from "../../../config/storage";

export const mountActions = {
  saveRecentlyUsedCategory,
  saveRecentlyUsedTargets,
  toggleMountQClock,
  park,
  unpark,
  gotoRADE,
  gotoTarget,
  setMotion,
  setTracking,
  syncRADE,
  syncTarget,
  setSlewRate,
  stop,
  setAltitudeLimits,
  setHALimit,
  setMeridianFlip,
  setAutoPark,
  setEverydayAutoPark,
  clear,
  getSettings,
  getAllSettings,
  setAllSettings,
};

function saveRecentlyUsedCategory(setting)
{
  return {
    type: settingsConstants.SAVE_RECENTLY_USED_CATEGORY,
    payload: setting,
  };
}

function saveRecentlyUsedTargets(settings)
{
  storage.setItem("recently_used_targets", JSON.stringify(settings));
  return {
    type: settingsConstants.SAVE_RECENTLY_USED_TARGETS,
    payload: settings,
  };
}

function toggleMountQClock(setting)
{
  return {
    type: settingsConstants.TOGGLE_MOUNT_QC_LOCK,
    payload: setting,
  };
}

function park()
{
  return wssMessageSocketActions.sendText({}, commands.MOUNT_PARK);
}

function unpark()
{
  return wssMessageSocketActions.sendText({}, commands.MOUNT_UNPARK);
}

function syncRADE(payload)
{
  return wssMessageSocketActions.sendText(payload, commands.MOUNT_SYNC_RADE);
}

function syncTarget(target)
{
  return wssMessageSocketActions.sendText(
    { target },
    commands.MOUNT_SYNC_TARGET
  );
}

function gotoTarget(target)
{
  let finalTarget = target;
  if (finalTarget.includes(",")) finalTarget = target.split(",")[1];
  return wssMessageSocketActions.sendText(
    { target: finalTarget },
    commands.MOUNT_GOTO_TARGET
  );
}

function gotoRADE(ra, de, isJ2000)
{
  return wssMessageSocketActions.sendText(
    { ra, de, isJ2000 },
    commands.MOUNT_GOTO_RADE
  );
}

function setMotion(direction, action)
{
  return wssMessageSocketActions.sendText(
    { direction, action },
    commands.MOUNT_SET_MOTION
  );
}

function setTracking(enabled)
{
  return wssMessageSocketActions.sendText(
    { enabled },
    commands.MOUNT_SET_TRACKING
  );
}

function stop()
{
  return wssMessageSocketActions.sendText({}, commands.MOUNT_ABORT);
}

function setSlewRate(rate)
{
  return wssMessageSocketActions.sendText(
    { rate },
    commands.MOUNT_SET_SLEW_RATE
  );
}

function setAltitudeLimits(settings)
{
  return wssMessageSocketActions.sendText(
    settings,
    commands.MOUNT_SET_ALTITUDE_LIMITS
  );
}

function setHALimit(settings)
{
  return wssMessageSocketActions.sendText(
    settings,
    commands.MOUNT_SET_HA_LIMIT
  );
}

function setMeridianFlip(settings)
{
  return wssMessageSocketActions.sendText(
    settings,
    commands.MOUNT_SET_MERIDIAN_FLIP
  );
}

function setAutoPark(settings)
{
  return wssMessageSocketActions.sendText(
    settings,
    commands.MOUNT_TOGGLE_AUTOPARK
  );
}

function setEverydayAutoPark({ enabled })
{
  return wssMessageSocketActions.sendText(
    { enabled },
    commands.MOUNT_SET_EVERYDAY_AUTO_PARK
  );
}

function clear()
{
  return wssMessageSocketActions.sendText({}, commands.MOUNT_CLEAR);
}

function getSettings()
{
  return wssMessageSocketActions.sendText({}, commands.MOUNT_GET_SETTINGS);
}

function getAllSettings()
{
  return wssMessageSocketActions.sendText({}, commands.MOUNT_GET_ALL_SETTINGS);
}

function setAllSettings(payload)
{
  return wssMessageSocketActions.sendText(
    payload,
    commands.MOUNT_SET_ALL_SETTINGS
  );
}
