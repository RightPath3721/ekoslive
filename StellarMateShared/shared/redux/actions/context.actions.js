import { contextConstants } from "../constants";

export const contextActions = {
    setContext,
};

function setContext(key, value)
{
    return dispatch =>
    {
        dispatch({ type: contextConstants.SET_CONTEXT, payload: { key: key, value: value } });
    }
};