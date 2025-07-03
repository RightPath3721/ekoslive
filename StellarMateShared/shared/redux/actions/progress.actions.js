import { progressConstants } from "../constants";

export const removeProgressItemByCondition = (condition = null) =>
{
  return {
    type: progressConstants.REMOVE_ITEM_BY_CONDITION,
    payload: {
      condition,
    },
  };
};

export const removeAll = () =>
{
  return {
    type: progressConstants.REMOVE_ALL,
    payload: {},
  };
};
