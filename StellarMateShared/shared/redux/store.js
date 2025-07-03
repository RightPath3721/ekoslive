import { applyMiddleware, createStore } from "redux";
import thunkMiddleware from "redux-thunk";
import webSocketMiddleware from "redux-websocket";
import { persistStore } from "redux-persist";
import { composeWithDevToolsDevelopmentOnly  } from "@redux-devtools/extension";
import initReducer from "./reducers";

const defaulMiddlewares = [webSocketMiddleware, thunkMiddleware];

export let store;

/**
 * Initializes the Redux store with optional middleware and encryption.
 *
 * @param {Object} options.storage - The storage engine to be used for persistence.
 * @param {Object} options.encrypt - The encryption algorithm to be used for data encryption.
 * @param {Array} [options.middlewares=[]] - Additional Redux middleware to be applied.
 *
 * @returns {Object} The persisted Redux store object.
 */
export const initStore = (storage, encrypt, middlewares = []) =>
{
  // Initialize reducer with provided storage and encryption
  const reducer = initReducer(storage, encrypt);

  // Create Redux store with middleware and DevTools support
  store = createStore(
    reducer,
    composeWithDevToolsDevelopmentOnly(applyMiddleware(...defaulMiddlewares, ...middlewares))
  );

  // Return persisted store
  return persistStore(store);
};