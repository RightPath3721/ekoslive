import { alertConstants } from "../constants";

export const alertActions = {
  success,
  error,
  clear
};

function success(message, title = "", options = {})
{
  return { type: alertConstants.SUCCESS, message, title, size: "sm", ...options };
}

function error(message, title)
{
  return { type: alertConstants.ERROR, message, title };
}

function clear()
{
  return { type: alertConstants.CLEAR };
}
