import { isEmpty } from "lodash";
import { captureException } from "@sentry/browser";
import { schedulerActions, captureActions, stellaActions } from "@redux/actions";
import storage from "../../config/storage";

/**
 * Handles the execution of a prompt, managing both scheduler and sequence scenarios
 * @param {Object} params Configuration object
 * @param {Object} params.prompt The prompt to execute
 * @param {Function} params.dispatch Redux dispatch function
 * @param {string} params.captureStatus Current capture status
 * @param {Function} params.setExecutedPrompt Function to set executed prompt ID
 * @param {Function} params.setIsExecuting Function to set executing state
 * @param {Function} params.executed Function to mark prompt as executed on backend
 * @param {Function} params.getPrompts Optional function to refresh prompts
 * @returns {Promise<void>}
 */
export const executePrompt = async ({
    prompt,
    dispatch,
    captureStatus,
    schedulerStatus,
    setExecutedPrompt,
    setIsExecuting,
    executed,
    getPrompts = null
}) => {
    const hasScheduler = !isEmpty(prompt.scheduler);
    const hasSequence = !isEmpty(prompt.sequence);

    if (hasScheduler) {
        if (
            schedulerStatus === 0 || // SCHEDULER_IDLE
            schedulerStatus === 5 || // SCHEDULER_ABORTED  
            schedulerStatus === 6    // SCHEDULER_LOADING
        ) {
            await storage.setItem("executedPromptId", JSON.stringify(prompt._id));
            setExecutedPrompt(prompt._id);
            setIsExecuting(true);
            executed(prompt._id);
    
            const path = `Documents/sequences/stella_${prompt._id}.esq`;
            dispatch(
                schedulerActions.saveSequenceFile({
                    path,
                    filedata: prompt.sequence,
                })
            );
            dispatch(stellaActions.setScheduler(prompt.scheduler));
            dispatch(stellaActions.setPromptId(prompt._id));
            
            if (getPrompts) {
                await getPrompts();
            }
        } else {
            dispatch(schedulerActions.toggleScheduler());
        }
    }
    else if (hasSequence) {
        if (
            captureStatus === "Complete" ||
            captureStatus === "Idle" ||
            captureStatus === "Aborted"
        ) {
            await storage.setItem("executedPromptId", JSON.stringify(prompt._id));
            setExecutedPrompt(prompt._id);
            setIsExecuting(true);
            executed(prompt._id);
            dispatch(captureActions.loadSequenceFile("", prompt.sequence));
            dispatch(captureActions.start());
            dispatch(stellaActions.addExecutedPrompt(prompt._id));
           
            if (getPrompts) {
                await getPrompts();
            }
        } else {
            dispatch(captureActions.stop());
        }
    }
    
};

/**
 * Makes API call to mark a prompt as executed
 * @param {Object} params Configuration object
 * @param {string} params.promptId ID of the prompt
 * @param {string} params.username Username
 * @param {string} params.token Auth token
 * @param {Object} params.ekosliveServer API client instance
 * @returns {Promise<void>}
 */
export const markPromptExecuted = async ({
    promptId,
    username,
    token,
    ekosliveServer
}) => {
    try {
        const url = `/api/stella/executed/${promptId}?username=${encodeURIComponent(username)}&token=${token}`;
        await ekosliveServer.get(url);
    } catch (error) {
        captureException(error);
        throw error;
    }
};
