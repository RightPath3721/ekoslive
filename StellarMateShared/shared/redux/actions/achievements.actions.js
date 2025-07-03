import { achievementsConstants, ekosConstants } from "../constants";

export const achievementActions = {
    setAchievement,
    setAchievements,
    resetAchievement,
    updateTotalImages,
    updateTotalMessiers,
};

function setAchievement(payload)
{
    return {
        type: achievementsConstants.SET_ACHIEVEMENT,
        payload: payload,
    };
}

function setAchievements(payload)
{
    return {
        type: achievementsConstants.SET_ACHIEVEMENTS,
        payload: payload,
    };
}

function resetAchievement(payload)
{
    return (dispatch) =>
    {
        dispatch({
            type: achievementsConstants.RESET_ACHIEVEMENTS,
            payload: payload,
        });
        dispatch({ type: ekosConstants.RESET_ECHO_DATA, payload: {} });
    };
}

function updateTotalImages(payload)
{
    return (dispatch) =>
    {
        dispatch({
            type: achievementsConstants.TOTAL_IMAGES_CAPTURED,
            payload: payload,
        });
    };
}

function updateTotalMessiers(payload)
{
    return (dispatch) =>
    {
        dispatch({
            type: achievementsConstants.TOTAL_MESSIER_CAPTURED,
            payload: payload,
        });
    };
}
