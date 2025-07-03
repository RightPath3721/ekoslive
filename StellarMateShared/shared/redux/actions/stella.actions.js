import { stellaConstants } from "../constants/stella.constants";

export const stellaActions = {
    setPromptId,
    setScheduler,
    addExecutedPrompt,
    setShowExamples,
    setParameterValue
};

function setPromptId(id)
{
    return {
        type: stellaConstants.SET_PROMPT_ID,
        payload: id,
    }
}

function setScheduler(scheduler)
{
    return {
        type: stellaConstants.SET_SCHEDULER,
        payload: scheduler,
    }
}

function addExecutedPrompt(id)
{
    return {
        type: stellaConstants.ADD_EXECUTED_PROMPT,
        payload: id
    }
}

function setShowExamples(value)
{
    return {
        type: stellaConstants.SET_SHOW_EXAMPLES,
        payload: value,
    }
}

function setParameterValue(key, value)
{
    return {
        type: stellaConstants.SET_STELLA_PARAMETER_VALUE,
        payload: { [key]: value },
    }
}