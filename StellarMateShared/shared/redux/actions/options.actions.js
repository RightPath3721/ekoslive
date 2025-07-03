import { wssMessageSocketActions } from "./wssMessageSocketActions";
import { wssMediaSocketActions } from "./wssMediaSocketActions";
import { store } from "../store";
import { optionsConstants } from "../constants";
import commands from "../../commands";

export const optionActions = {
  setOption,
  syncAllSettings,
  setOptions,
  getOptions,
  setEkosLiveProSettings,
  setEkosLiveProDB,
};

/**
 * Generic KStars Options set. Must send a list even if setting a single option
 * @param options should be a list in key:value pairs to set any KStars option found in kstars.kcfg file
 * For example [{"name": "ShowStars", "value": true}]
 * This ONLY sets the option and does not necessary results in updated GUI.
 * dispatch(optionActions.setOptions([{"name": "showStars", "value": true}]));
 */
function setOptions(options)
{
  return wssMessageSocketActions.sendText(
    { options: options },
    commands.OPTION_SET
  );
}

/**
 * Get KStars options by sending a list
 * @param options should be a list of key:value pairs that include only the "name" attribute
 * For example [{"name": "ShowStars"}] to get whether ShowStars is true or false.
 */
function getOptions(options)
{
  return wssMessageSocketActions.sendText(
    { options: options },
    commands.OPTION_GET
  );
}

function setOption(option, value)
{
  return (dispatch) =>
  {
    dispatch({ type: option, payload: value });

    switch (option)
    {
      case optionsConstants.ekosLiveHighBandwidth:
        dispatch(
          setOptions([
            { name: optionsConstants.ekosLiveHighBandwidth, value: value },
          ])
        );
        break;

      case optionsConstants.ekosLiveImageTransfer:
        dispatch(
          setOptions([
            { name: optionsConstants.ekosLiveImageTransfer, value: value },
          ])
        );
        break;
      case optionsConstants.ekosLiveNotifications:
        dispatch(
          setOptions([
            { name: optionsConstants.ekosLiveNotifications, value: value },
          ])
        );
        break;
      case optionsConstants.ekosLiveCloud:
        dispatch(
          setOptions([{ name: optionsConstants.ekosLiveCloud, value: value }])
        );
        break;
    }
  };
}

function syncAllSettings()
{
  return (dispatch) =>
  {
    dispatch(syncBandwidth());
    dispatch(syncImageTransfer());
    dispatch(syncNotifications());
    dispatch(syncCloudStorage());
  };
}

function syncBandwidth()
{
  return wssMessageSocketActions.sendText(
    { value: store.getState().options.highBandwidth },
    commands.OPTION_SET_HIGH_BANDWIDTH
  );
}

function syncImageTransfer()
{
  return wssMessageSocketActions.sendText(
    { value: store.getState().options.imageTransfer },
    commands.OPTION_SET_IMAGE_TRANSFER
  );
}

function syncNotifications()
{
  return wssMessageSocketActions.sendText(
    { value: store.getState().options.notifications },
    commands.OPTION_SET_NOTIFICATIONS
  );
}

function syncCloudStorage()
{
  return (dispatch) =>
  {
    dispatch(
      wssMessageSocketActions.sendText(
        { value: store.getState().options.cloudStorage },
        commands.OPTION_SET_CLOUD_STORAGE
      )
    );
    dispatch(
      wssMediaSocketActions.sendText(
        { value: store.getState().options.cloudStorage },
        commands.OPTION_SET_CLOUD_STORAGE
      )
    );
  };
}

function setEkosLiveProSettings(option, value, state)
{
  return (dispatch) =>
  {
    dispatch({ type: option, payload: value });
  };
}

function setEkosLiveProDB(state)
{
  return (dispatch) =>
  {
    dispatch(
      wssMediaSocketActions.sendText(
        state,
        optionsConstants.SET_EKOSLIVE_PRO_SETTINGS
      )
    );
  };
}
