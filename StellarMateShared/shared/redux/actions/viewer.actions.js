import { viewerConstants } from "../constants";
import { wssMediaSocketActions } from "./wssMediaSocketActions";
import commands from "../../commands";

export const viewerActions = {
  getImages,
  deleteImages,
  setOption,

  addRule,
  removeRule,
  setRules,

  addTag,
  removeTag,
};

function getImages(query, options)
{
  return wssMediaSocketActions.sendText({ query, options }, commands.GET_IMAGES);
}

function deleteImages(uuids, options)
{
  return wssMediaSocketActions.sendText(
    { uuids, options },
    commands.DELETE_IMAGES
  );
}

function setOption(option, value)
{
  return { type: option, payload: value };
}

function addRule(rule)
{
  return { type: viewerConstants.ADD_RULE, payload: rule };
}

function removeRule(index)
{
  return { type: viewerConstants.REMOVE_RULE, payload: index };
}

function setRules(rules)
{
  return { type: viewerConstants.SET_DB_RULES, payload: rules };
}

function addTag(uuid, tag, options)
{
  return wssMediaSocketActions.sendText(
    { uuid, tag, options },
    commands.ADD_TAG
  );
}

function removeTag(uuid, tag, options)
{
  return wssMediaSocketActions.sendText(
    { uuid, tag, options },
    commands.REMOVE_TAG
  );
}
