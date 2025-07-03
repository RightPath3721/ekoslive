import { get } from "lodash";
import { WEBSOCKET_MESSAGE } from "redux-websocket";
import { progressConstants } from "../constants";

/**
 * We are using this to track the progress on start and to show the Splash Screen on startup
 **********Sample in JSON form**********
 * {
  "splashComplete": true,
  "isLoading": false
}
 */
const initialState =
{
    // checks if it is loading
    isLoading: false,

    // Once splash is displayed and ready to proceed. It becomes true
    splashComplete: false,
};

export function progress(state = initialState, action)
{
    let payload = action.payload || {};
    switch (action.type)
    {
        case progressConstants.SPLASH_COMPLETE:
            return { ...state, splashComplete: payload };

        case progressConstants.REMOVE_ITEM_BY_CONDITION:
            const condition = get(payload, "condition", null);
            if (condition)
            {
                return { ...state, items: state.items.filter(i => i.condition !== condition) };
            }
            return state;

        case progressConstants.REMOVE_ALL:
            return { ...initialState, splashComplete: state.splashComplete };
    }
    return state;
}