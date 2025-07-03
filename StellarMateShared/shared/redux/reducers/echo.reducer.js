import { ekosConstants } from "../constants";

/**
 * When we trigger an achievement, it has the following information.
 * What type of Achievement is this and it data which includes points and other relevant information
 * 
 **********Sample in JSON form**********
 * {
  "data": {},
  "type": ""
}
 */
const initialState = {
    type: "",
    data: {}
};

export const echo = (state = initialState, action) =>
{
    switch (action.type)
    {
        case ekosConstants.GET_ECHO_DATA:
            const { type, data } = action;
            return { ...state, type: type, data: data };

        case ekosConstants.RESET_ECHO_DATA:
            return initialState;

        default:
            return state;
    }
};