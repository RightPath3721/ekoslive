import { alertConstants } from '../constants';

export function alert(state = {}, action)
{
  switch (action.type)
  {
    case alertConstants.SUCCESS:
      return {
        type: 'Success',
        message: action.message,
        title: action.title,
        size: action.size,
        onAccept: action.onAccept
      };
    case alertConstants.ERROR:
      return {
        type: 'Error',
        message: action.message,
        title: action.title
      };
    case alertConstants.CLEAR:
      return {};
    default:
      return state
  }
};