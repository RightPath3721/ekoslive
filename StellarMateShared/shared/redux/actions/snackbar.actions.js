import
{
  ENQUEUE_SNACKBAR,
  CLOSE_SNACKBAR,
  REMOVE_SNACKBAR,
  CLEAR_SNACKBAR,
} from "../constants";
export const snackbarActions = {
  enqueueSnackbar,
  closeNotifier,
  removeSnackbar,
  clearSnackbar,
};

function enqueueSnackbar(notification)
{
  const key = new Date().getTime() + Math.random();
  return {
    type: ENQUEUE_SNACKBAR,
    notification: {
      ...notification,
      key,
    },
  };
}

function closeNotifier(key)
{
  return {
    type: CLOSE_SNACKBAR,
    dismissAll: !key, // dismiss all if no key has been defined
    key,
  };
}

function removeSnackbar(key)
{
  return {
    type: REMOVE_SNACKBAR,
    key,
  };
}

function clearSnackbar()
{
  return {
    type: CLEAR_SNACKBAR,
  };
}
