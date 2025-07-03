import { WEBSOCKET_MESSAGE } from "redux-websocket";
import { get } from "lodash";
import { stellaConstants } from "../constants/stella.constants";

const initialState = {
    sequenceTmpPath: "",
    promptId: "",
    executedPrompts: [],
    showExamples: true,
    confirmPrompt: false,
    narrateResponse: true
};

export const stella = (state = initialState, action) =>
{
    switch (action.type)
    {
        case stellaConstants.SET_STELLA_PARAMETER_VALUE:
            return { ...state, ...action.payload };
        case stellaConstants.SET_SCHEDULER:
            return { ...state, scheduler: action.payload }
        case stellaConstants.SET_PROMPT_ID:
            return { ...state, promptId: action.payload }
        case stellaConstants.ADD_EXECUTED_PROMPT:
            return { ...state, executedPrompts: [...state.executedPrompts, action.payload] }
        case stellaConstants.SET_SHOW_EXAMPLES:
            return { ...state, showExamples: action.payload }
        case WEBSOCKET_MESSAGE:
            if (
                get(action, "payload.event.target.url", "").includes(
                    "/message/user"
                ) === false
            ) return state;
            const message = JSON.parse(action.payload.data);
            switch (message.type)
            {
                case stellaConstants.SET_SEQUENCE_TMP_FILE:
                    return {
                        ...state,
                        sequenceTmpPath: message.payload.path,
                    }
                default:
                    return state
            }
        default:
            return state;
    }
};