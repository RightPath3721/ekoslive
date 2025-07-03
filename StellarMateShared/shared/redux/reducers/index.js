import { combineReducers } from "redux";
import { persistReducer } from "redux-persist";
import { achievements } from "./achievements.reducer";
import { alert } from "./alert.reducer";
import { authentication } from "./authentication.reducer";
import { context } from "./context.reducer";
import { darkLibrary } from "./darkLibrary.reducer";
import { devices } from "./devices.reducer";
import { echo } from "./echo.reducer";
import { ekos } from "./ekos.reducer";
import { indi } from "./indi.reducer";
import { notifications } from "./notification.reducer";
import { opticalTrain } from "./opticalTrains.reducer";
import { options } from "./options.reducer";
import { presets } from "./presets.reducer";
import { progress } from "./progress.reducer";
import { setup } from "./setup.reducer";
import { smpro } from "./smpro.reducer";
import { snackbar } from "./snackbar.reducer";
import { status } from "./status.reducer";
import { stella } from "./stella.reducer";
import { targets } from "./targets.reducer";
import { viewer } from "./viewer.reducer";
import { wsMedia } from "./wsMedia.reducer";
import { wsMessage } from "./wsMessage.reducer";
import { bookings } from "./booking.reducer";
import { messages } from "./messages.reducer";

export default (reduxStorage, encrypt) =>
{
  const messagePersistConfig = {
    key: "wsMessage",
    storage: reduxStorage,
    blacklist: ["connected", "connecting"],
  };

  const mediaPersistConfig = {
    key: "wsMedia",
    storage: reduxStorage,
    blacklist: ["connected", "connecting", "metadata", "captureMetadata"],
  };

  const authPersistConfig = {
    key: "authentication",
    storage: reduxStorage,
    blacklist: ["isLogging"],
    ...(encrypt && {
      transforms: [encrypt({
        secretKey: "Em^%%HRuHe!HdH&G7t8P",
      })]
    }),
  };

  const optionsPersistConfig = {
    key: "options",
    storage: reduxStorage,
    blacklist: ["drawerOpen", "connectionsOpen", "settingsOpen"],
  };

  const rootPersistConfig = {
    key: "root",
    storage: reduxStorage,
    blacklist: [
      "indi",
      "notifications",
      "wsMessage",
      "wsMedia",
      "progress",
      "devices",
      "alert",
      "ekos",
      "targets",
      "opticalTrain",
      "setup",
      "status",
      "context",
      "authentication",
      "options",
      "snackbar",
      "stella",
    ],
  };

  const ekosPersistConfig = {
    key: "ekos",
    storage: reduxStorage,
    blacklist: [
      "showPortSelectorPanel",
      "connection",
      "dslrInfo",
      "status",
      "logout",
      "liveStacking",
      "dialogInfo",
      "cameras",
      "sequences",
      "filter_wheels",
      "mounts",
      "scopes",
      "domes",
      "caps",
      "notification",
      "schedulerSettings",
      "logginOut",
    ],
    whiteList: ["captureSettings", "schedulerSettings", "filterSettings"],
  };

  const devicesPersistConfig = {
    key: "devices",
    storage: reduxStorage,
    blacklist: [
      "isScanning",
      "isRegistering",
      "isLogging",
      "serverMessage",
      "scannerMessage",
      "connecting",
      "kstarsStatus",
      "ekosliveStatus",
    ],
    whiteList: ["selectedDevice", "regInfo", "devices"],
  };

  const opticalTrainsPersistConfig = {
    key: "opticalTrain",
    storage: reduxStorage,
    blacklist: ["showTrainModal"],
  };

  const setupPersistConfig = {
    key: "setup",
    storage: reduxStorage,
    whiteList: ["tourGuide", "vnc"],
  };

  const contextPersistConfig = {
    key: "context",
    storage: reduxStorage,
    blacklist: ["WARNING_CELESTIAL_POLE", "WARNING_FOV_SIZE", "ALIGN_RECOMMENDED_SETTINGS", "CHECK_ASTROMETRY_INDEX"]
  };

  const targetsPersistConfig = {
    key: "targets",
    storage: reduxStorage,
    blacklist: [
      "names",
      "observability",
      "risetime",
      "almanac",
      "remoteLoadingObjects",
      "localLoadingObjects",
    ],
  };

  const stellaPersistConfig = {
    key: "stella",
    storage: reduxStorage,
    whitelist: ["showExamples"],
  };

  const rootReducer = combineReducers({
    authentication: persistReducer(authPersistConfig, authentication),
    alert,
    wsMessage: persistReducer(messagePersistConfig, wsMessage),
    wsMedia: persistReducer(mediaPersistConfig, wsMedia),
    options: persistReducer(optionsPersistConfig, options),
    notifications,
    messages,
    bookings,
    viewer,
    indi,
    progress,
    devices: persistReducer(devicesPersistConfig, devices),
    echo: echo,
    ekos: persistReducer(ekosPersistConfig, ekos),
    // JM 2021.09.01: Targets saving not behaving normally, so currently just save the whole state.
    targets: persistReducer(targetsPersistConfig, targets),
    presets,
    setup: persistReducer(setupPersistConfig, setup),
    status,
    darkLibrary,
    achievements,
    smpro,
    opticalTrain: persistReducer(opticalTrainsPersistConfig, opticalTrain),
    context: persistReducer(contextPersistConfig, context),
    snackbar,
    stella: persistReducer(stellaPersistConfig, stella),
  });

  return persistReducer(rootPersistConfig, rootReducer)
};
