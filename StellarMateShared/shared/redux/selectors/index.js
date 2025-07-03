import { get, isEmpty } from "lodash";
import { createSelector } from "reselect";
import { deviceType, planType, trainModules } from "../../indi/enums";
import { defaultVersion } from "../../indi/enums";
import { compareVersions } from "compare-versions";

export const selectDevicesNames = createSelector(
  (state) => state.indi.devices,
  (devices) => devices.map((device) => device.name)
);

export const selectTrains = createSelector(
  (state) => state.opticalTrain.allTrains,
  (trains) =>
  {
    if (!isEmpty(trains))
    {
      const arr = [];
      for (const oneTrain of trains)
      {
        if (oneTrain) arr.push({ label: oneTrain.name, value: oneTrain.name });
      }
      return arr;
    } else return [];
  }
);

export const selectCamerasResolution = createSelector(
  (state) => state.opticalTrain.allTrains,
  (state) => state.opticalTrain.selectedTrains,
  (state) => state.indi.devices,
  (trains, selectedTrains, devices) =>
  {
    if (!isEmpty(trains) && !isEmpty(selectedTrains))
    {
      for (const oneTrain of trains)
      {
        if (
          oneTrain &&
          oneTrain.id === selectedTrains[trainModules.CaptureOpticalTrain]
        )
        {
          const oneCamera = devices.find(
            (device) =>
              device.name === oneTrain.camera &&
              deviceType.CAMERA === device.type
          );
          if (oneCamera && get(oneCamera, "isConnected", false))
          {
            const resolution = oneCamera.getResolution();
            const pixel = oneCamera.getPixelWH();
            if (!isEmpty(resolution) && !isEmpty(pixel))
            {
              return {
                name: oneCamera.name,
                width: resolution.width.value,
                height: resolution.height.value,
                pixelW: pixel.width.value,
                pixelH: pixel.height.value,
              };
            }
          }
        }
      }
    }
  }
);

export const selectTelescopeInfo = createSelector(
  (state) => state.opticalTrain.allTrains,
  (state) => state.opticalTrain.selectedTrains,
  (state) => state.ekos.scopes,
  (trains, selectedTrains, scopes) =>
  {
    if (!isEmpty(trains) && !isEmpty(selectedTrains) && !isEmpty(scopes))
    {
      for (const oneTrain of trains)
      {
        if (
          oneTrain &&
          oneTrain.id === selectedTrains[trainModules.CaptureOpticalTrain]
        )
          return scopes.find((scope) => scope.name === oneTrain.scope);
      }
    }
  }
);

export const selectMountOptions = createSelector(
  (state) => state.indi.devices,
  (devices) =>
  {
    const mount = [];
    mount.push({ label: "--", value: "Mount" });
    if (!isEmpty(devices))
    {
      for (const device of devices)
      {
        if (device.type === deviceType.MOUNT)
          mount.push({ label: device.name, value: "Mount" });
      }
      return mount;
    }
  }
);

export const selectLightBoxOptions = createSelector(
  (state) => state.indi.devices,
  (devices) =>
  {
    const lightbox = [];
    lightbox.push({ label: "--", value: "Light box" });
    if (!isEmpty(devices))
    {
      for (const device of devices)
      {
        if (device.type === deviceType.LIGHTBOX)
          lightbox.push({ label: device.name, value: "Light box" });
      }
      return lightbox;
    }
  }
);

export const selectFocuserOptions = createSelector(
  (state) => state.indi.devices,
  (devices) =>
  {
    const focuser = [];
    focuser.push({ label: "--", value: "Focuser" });
    if (!isEmpty(devices))
    {
      for (const device of devices)
      {
        if (device.type === deviceType.FOCUSER)
          focuser.push({ label: device.name, value: "Focuser" });
      }
      return focuser;
    }
  }
);

export const selectCameraOptions = createSelector(
  (state) => state.indi.devices,
  (devices) =>
  {
    const cameras = [];
    cameras.push({ label: "--", value: "Camera" });
    if (!isEmpty(devices))
    {
      for (const device of devices)
      {
        if (device.type === deviceType.CAMERA)
          cameras.push({ label: device.name, value: "Camera" });
      }
      return cameras;
    }
  }
);

export const selectDustCapOptions = createSelector(
  (state) => state.indi.devices,
  (devices) =>
  {
    const dustcap = [];
    dustcap.push({ label: "--", value: "dust" });
    if (!isEmpty(devices))
    {
      for (const device of devices)
      {
        if (device.type === deviceType.DUSTCAP)
          dustcap.push({ label: device.name, value: "dust" });
      }
      return dustcap;
    }
  }
);

export const selectRotatorOptions = createSelector(
  (state) => state.indi.devices,
  (devices) =>
  {
    const rotator = [];
    rotator.push({ label: "--", value: "rotator" });
    if (!isEmpty(devices))
    {
      for (const device of devices)
      {
        if (device.type === deviceType.ROTATOR)
          rotator.push({ label: device.name, value: "rotator" });
      }
      return rotator;
    }
  }
);

export const selectGuiderOptions = createSelector(
  (state) => state.indi.devices,
  (devices) =>
  {
    const guider = [];
    guider.push({ label: "--", value: "guider" });
    if (!isEmpty(devices))
    {
      for (const device of devices)
      {
        if (device.type === deviceType.GUIDER)
          guider.push({ label: device.name, value: "guider" });
      }
      return guider;
    }
  }
);

export const selectFilterWheelOptions = createSelector(
  (state) => state.indi.devices,
  (devices) =>
  {
    const filters = [];
    filters.push({ label: "--", value: "filterwheel" });
    if (!isEmpty(devices))
    {
      for (const device of devices)
      {
        if (device.type === deviceType.FILTER)
          filters.push({ label: device.name, value: "filterwheel" });
      }
      return filters;
    }
  }
);

export const selectScopeOptions = createSelector(
  (state) => state.ekos.scopes,
  (state) => state.ekos.dslrLenses,
  (scopes, lenses) =>
  {
    const telescopes = [];
    telescopes.push({ label: "--", value: "Scope" });

    if (!isEmpty(scopes))
    {
      for (const oneScope of scopes)
      {
        if (oneScope) telescopes.push({ label: oneScope.name, value: "Scope" });
      }
    }

    if (!isEmpty(lenses))
    {
      for (const oneLens of lenses)
      {
        if (oneLens) telescopes.push({ label: oneLens.name, value: "Scope" });
      }
    }
    return telescopes;
  }
);

export const selectFilterWheelNames = createSelector(
  (state) => state.indi.devices,
  (devices) =>
  {
    if (!isEmpty(devices))
    {
      const fw = devices.filter((device) => device.type === deviceType.FILTER);
      if (!isEmpty(fw)) return fw.map((oneCamera) => oneCamera.name);
    }
  }
);

export const DomeNamesSelector = createSelector(
  (state) => state.indi.devices,
  (devices) =>
  {
    const domes = new Set();

    for (const device of devices)
    {
      if (device.type === deviceType.DOME) domes.add(device.name);
    }

    return Array.from(domes);
  }
);

export const selectCheckStatus = createSelector(
  (state) => state.status.capture,
  (state) => state.status.capture.status,
  (capture, status) =>
  {
    if (!isEmpty(capture))
      return ![
        "Idle",
        "Paused",
        "Complete",
        "Image Received",
        "Aborted",
      ].includes(status);
  }
);

export const selectElementAttribute = createSelector(
  (state) => state.indi.devices,
  (_, props) => props.device,
  (_, props) => props.property,
  (_, props) => props.element,
  (_, props) => props.attribute,
  (devices, device, property, element, attribute) =>
  {
    const selectedDevice = devices.find(
      (oneDevice) => oneDevice.name === device
    );
    if (selectedDevice)
    {
      const selectedElement = selectedDevice.getElement(property, element);
      if (selectedElement) return selectedElement[attribute];
    }
  }
);

export const selectCameraNames = createSelector(
  (state) => state.indi.devices,
  (devices) =>
  {
    const cameras = new Set();

    for (const device of devices)
    {
      if (device.type === deviceType.CAMERA) cameras.add(device.name);
    }

    return Array.from(cameras);
  }
);

export const selectAnyFlats = createSelector(
  (state) => state.ekos.sequences,
  (sequences) =>
    sequences?.find((oneSequence) => oneSequence.Type === "Flat") !== undefined
);

export const selectActiveFilterWheelName = createSelector(
  (state) => state.opticalTrain.allTrains,
  (state) => state.opticalTrain.selectedTrains,
  (state) => state.indi.devices,
  (trains, selectedTrains, devices) =>
  {
    if (!isEmpty(trains) && !isEmpty(selectedTrains))
    {
      for (const oneTrain of trains)
      {
        if (
          oneTrain &&
          oneTrain.id === selectedTrains[trainModules.CaptureOpticalTrain]
        )
        {
          const fw = devices.find(
            (device) =>
              device.name === oneTrain.filterwheel &&
              deviceType.FILTER === device.type
          );
          if (fw) return fw.name;
        }
      }
    }
  }
);

export const selectOptionValue = createSelector(
  (state) => state.ekos.options,
  (_, names) => names,
  (options, name) =>
  {
    if (!isEmpty(options) && !isEmpty(name))
    {
      for (const oneObject of options)
      {
        if (oneObject["name"] === name && oneObject["value"] !== null)
          return oneObject;
      }
    }
  }
);

export const selectCameras = createSelector(
  (state) => state.opticalTrain.allTrains,
  (state) => state.opticalTrain.selectedTrains,
  (state) => state.indi.devices,
  (trains, selectedTrains, devices) =>
  {
    if (!isEmpty(trains) && !isEmpty(selectedTrains))
    {
      for (const oneTrain of trains)
      {
        if (
          oneTrain &&
          oneTrain.id === selectedTrains[trainModules.CaptureOpticalTrain]
        )
        {
          const camera = devices.find(
            (device) =>
              device.name === oneTrain.camera &&
              deviceType.CAMERA === device.type
          );
          if (camera && get(camera, "isConnected", false)) return camera;
        }
      }
    }
  }
);

export const selectRotatorsCount = createSelector(
  (state) => state.indi.devices,
  (devices) =>
    devices.filter((device) => device.type === deviceType.ROTATOR).length
);

export const selectIsAlignSolved = createSelector(
  (state) => state.status.align.solution,
  (solution) => solution && solution.pix > 0
);

export const selectFocusersCount = createSelector(
  (state) => state.indi.devices,
  (devices) =>
    devices.filter((device) => device.type === deviceType.FOCUSER).length
);

export const getKstarsVersion = createSelector(
  (state) => state.setup.versions,
  (versions) =>
  {
    if (!isEmpty(versions))
    {
      return versions.kstars;
    } else return defaultVersion.kstars;
  }
);

export const deviceNamesSelector = createSelector(
  (state) => state.indi.devices,
  (devices) =>
  {
    const names = [];
    for (const device of devices)
    {
      if (!device.subDevice)
      {
        names.push(device.name);
      }
    }
    return names.filter((oneName, index) => names.indexOf(oneName) === index);
  }
);

export const groupNamesSelector = createSelector(
  (state) => state.indi.devices,
  (_, selectedDevice) => selectedDevice,
  (devices, activeDevice) =>
  {
    const selectedDevice = devices.find(
      (oneDevice) => oneDevice.name === activeDevice
    );
    const deviceGroups = new Set();

    const properties = get(selectedDevice, "properties", false);
    if (properties)
    {
      for (const oneProperty of properties)
      {
        deviceGroups.add(oneProperty.group);
      }
      return Array.from(deviceGroups);
    }
  }
);

export const getINDIMessages = createSelector(
  (state) => state.indi,
  (oneDevice) => oneDevice?.logs
);

export const selectMount = createSelector(
  (state) => state.opticalTrain.allTrains,
  (state) => state.opticalTrain.selectedTrains,
  (state) => state.indi.devices,
  (trains, selectedTrains, devices) =>
  {
    if (!isEmpty(trains) && !isEmpty(selectedTrains))
    {
      for (const oneTrain of trains)
      {
        if (
          oneTrain &&
          oneTrain.id === selectedTrains[trainModules.MountOpticalTrain]
        )
        {
          const mount = devices.find(
            (device) =>
              device.name === oneTrain.mount && deviceType.MOUNT === device.type
          );
          if (mount && get(mount, "isConnected", false)) return mount;
        }
      }
    }
  }
);

export const elementSelector = createSelector(
  (state) => state.indi.devices,
  (_, props) => props.device,
  (_, props) => props.property,
  (_, props) => props.element,
  (devices, device, property, element) =>
  {
    const selectedDevice = devices.find(
      (oneDevice) => oneDevice.name === device
    );
    if (selectedDevice)
    {
      return selectedDevice.getElement(property, element);
    }
  }
);

export const propertySelector = createSelector(
  (state) => state.indi.devices,
  (_, props) => props.device,
  (_, props) => props.property,
  (devices, device, property) =>
  {
    const selectedDevice = devices.find(
      (oneDevice) => oneDevice.name === device
    );
    if (selectedDevice)
    {
      return selectedDevice.getProperty(property);
    }
  }
);

export const elementAttributeSelector = createSelector(
  (state) => state.indi.devices,
  (_, props) => props.device,
  (_, props) => props.property,
  (_, props) => props.element,
  (_, props) => props.attribute,
  (devices, device, property, element, attribute) =>
  {
    const selectedDevice = devices.find(
      (oneDevice) => oneDevice.name === device
    );
    if (selectedDevice)
    {
      const selectedElement = selectedDevice.getElement(property, element);
      if (selectedElement) return selectedElement[attribute];
    }
  }
);

export const selectRotatorElementAttributeSelector = createSelector(
  (state) => state.indi.devices,
  (_, props) => props.device,
  (_, props) => props.property,
  (_, props) => props.element,
  (_, props) => props.attribute,
  (devices, device, property, element, attribute) =>
  {
    const selectedDevice = devices.find(
      (oneDevice) =>
        oneDevice.type === deviceType.ROTATOR && oneDevice.name === device
    );
    if (selectedDevice)
    {
      const selectedElement = selectedDevice.getElement(property, element);
      if (selectedElement) return selectedElement[attribute];
    }
  }
);

export const getAchievementInfo = createSelector(
  (state) => state.achievements,
  (achievements) =>
  {
    if (!isEmpty(achievements))
    {
      return achievements;
    } else
      return {
        capture_preview: { status: false },
        ten_sequences: { status: false },
        mount_goto: { status: false },
        video_recording: { status: false },
        weather_check: { status: false },
        live_stacking: { status: false },
        create_darks: { status: false },
        create_defects: { status: false },
        import_mosaic: { status: false },
        capture_messier: { status: false },
        all_messiers: { status: false },
        capture_master: { status: false },
        capture_legend: { status: false },
        paa_arcsec: { status: false },
        guide_rms: { status: false },
        recentAchievementTitle: "none",
      };
  }
);

export const selectEchoData = createSelector(
  (state) => state.echo,
  (echo) =>
  {
    if (!isEmpty(echo.type) && !isEmpty(echo.data))
    {
      return echo.data;
    } else
    {
      return { type: "", payload: {} };
    }
  }
);

export const getMonitorDisplays = createSelector(
  (state) => state.setup.displayMonitors,
  (monitors) =>
  {
    if (isEmpty(monitors)) return [];
    else return monitors;
  }
);

export const getSelectedMonitor = createSelector(
  (state) => state.setup.selectedMonitor,
  (monitor) =>
  {
    if (!isEmpty(monitor)) return monitor;
    else return "";
  }
);

export const getPythonVersion = createSelector(
  (state) => state.setup.versions,
  (versions) =>
  {
    if (!isEmpty(versions))
      return get(versions, "python", defaultVersion.python);
  }
);

export const getTotalMessiers = createSelector(
  (state) => state.achievements.statistics,
  (stats) =>
  {
    if (!isEmpty(stats.total_messiers_captured))
    {
      return stats.total_messiers_captured;
    } else
    {
      return [];
    }
  }
);

// get EchoData
export const getEchoData = createSelector(
  (state) => state.echo,
  (echo) =>
  {
    if (!isEmpty(echo.type) && !isEmpty(echo.data))
    {
      return echo.data;
    } else
    {
      return { type: "", payload: {} }
    }
  }
);

// get total Images Captured
export const getTotalImages = createSelector(
  (state) => state.achievements.statistics,
  (stats) =>
  {
    if (!isEmpty(stats))
    {
      return stats.total_images_captured;
    } else
    {
      return 0;
    }
  }
);

export const selectDslrInfo = createSelector(
  (state) => state.ekos.dslrInfo,
  (dslr) =>
  {
    if (!isEmpty(dslr)) return dslr;
    return false;
  }
);

export const selectListObjectNames = createSelector(
  (state) => state.targets.lists,
  (_, name) => name,
  (lists, name) => get(lists[name], "payload", [])
);

export const selectOptions = (state) => state.options;
export const selectAllTrains = (state) => state.opticalTrain.allTrains;

// CONNECTION SELECTORS
export const selectIsLoggedIn = (state) => state.authentication.loggedIn;
export const selectSocketsConnecting = (state) =>
  state.wsMessage.connecting || state.wsMedia.connecting;
export const selectSocketsConnected = (state) =>
  state.wsMessage.connected && state.wsMedia.connected;
export const selectConnected = (state) => state.ekos.connection.connected;
export const selectConnectionOnline = (state) => state.ekos.connection.online;
export const selectUser = (state) => state.authentication.user;
export const selectDevicesInfo = (state) => state.indi.device_info;
export const selectDeviceIP = (state) => state.devices.selectedDevice.ip;
export const selectIsLogging = (state) => state.authentication.isLogging;
export const selectSelectedDevice = (state) => state.devices.selectedDevice;
export const selectIsProPlan = (state) =>
  get(state.authentication, "user.plan_id", planType.DEFAULT) !==
  planType.DEFAULT;
export const selectConnectionModeSP = (state) =>
  propertySelector(state, {
    device: device.name,
    property: "CONNECTION_MODE",
  });
export const selectConnectionSP = (state) =>
  propertySelector(state, {
    device: device.name,
    property: "CONNECTION",
  });
export const ConnectionModeSerialS = (state) =>
  elementSelector(state, {
    device: device.name,
    property: "CONNECTION_MODE",
    element: "CONNECTION_SERIAL",
  });
export const ConnectionModeNetworkS = (state) =>
  elementSelector(state, {
    device: device.name,
    property: "CONNECTION_MODE",
    element: "CONNECTION_TCP",
  });
export const selectDevicePortTP = (state) =>
  propertySelector(state, {
    device: device.name,
    property: "DEVICE_PORT",
  });
export const selectDevicePortText = (state) =>
  elementAttributeSelector(state, {
    device: device.name,
    property: "DEVICE_PORT",
    element: "PORT",
    attribute: "text",
  });
export const selectBaudRateSP = (state) =>
  propertySelector(state, {
    device: device.name,
    property: "DEVICE_BAUD_RATE",
  });
export const selectDeviceAddressTP = (state) =>
  propertySelector(state, {
    device: device.name,
    property: "DEVICE_ADDRESS",
  });
export const selectDeviceHostT = (state) =>
  elementAttributeSelector(state, {
    device: device.name,
    property: "DEVICE_ADDRESS",
    element: "ADDRESS",
    attribute: "text",
  });
export const selectDevicePortT = (state) =>
  elementAttributeSelector(state, {
    device: device.name,
    property: "DEVICE_ADDRESS",
    element: "PORT",
    attribute: "text",
  });
export const selectConnectionTypeSP = (state) =>
  propertySelector(state, {
    device: device.name,
    property: "CONNECTION_TYPE",
  });
export const selectActiveKStarID = (state) => state.setup.kstarsActiveID;
export const selectConnectedKStarInstances = (state) => state.setup.activeKStarsIDS;

export const selectUnitystem = (state) => state.options.unitSystem;
export const selectSkyQuality = (state) => state.setup.skyQuality;
export const selectWeatherInfo = (state) => state.setup.weatherInfo;
export const selectLocation = (state) => state.setup.location;
export const selectZoomLevel = (state) => state.setup.zoomLevel;

// WS SELECTORS
export const selectMetadata = (state) => state.wsMedia.metadata;
export const selectMediaData = (state) => state.wsMedia.data;
export const selectWsMediaLoading = (state) => state.wsMedia.loading;
export const selectCurrentFramingTarget = (state) =>
  state.wsMedia.currentFramingTarget;
export const selectFramingObjects = (state) => state.wsMedia.framingObjects;
export const selectHipsCache = (state) => state.wsMedia.hipsCache;
export const selectCaptureMetadata = (state) => state.wsMedia.captureMetadata;
export const selectWsMediaLiveStacking = (state) => state.wsMedia.liveStacking;

// EKOS SELECTORS
export const selectEkosScopes = (state) => state.ekos.scopes;
export const selectEkosSolvers = (state) => state.ekos.solvers;
export const selectEkosCurrentModule = (state) => state.ekos.currentModule;
export const selectIsManualRotator = (state) =>
  state.ekos.manualRotator.isManualRotator;
export const selectCalibrationSettings = (state) =>
  state.ekos.calibrationSettings;
export const selectTargetCalibrationSettings = (state) =>
  state.ekos.targetCalibrationSettings;
export const selectSequences = (state) => state.ekos.sequences;
export const selectFileSettings = (state) => state.ekos.fileSettings;
export const selectHomeDir = (state) => state.setup.homeDirectory;
export const selectFocusStatus = (state) => state.status.focus;
export const selectGuideStatus = (state) => state.status.guide;
export const selectMeridianFlipText = (state) =>
  state.status.mount.meridianFlipText;
export const selectEkosSummary = (state) => state.ekos.summary;
export const selectStellarSolverProfiles = (state) =>
  state.ekos.stellarSolverProfiles.focus;
export const selectRecentlyUsedCategory = (state) =>
  state.ekos.recentlyUsedCategory;
export const selectRecentlyUsedTargets = (state) =>
  state.ekos.recentlyUsedTargets;
export const selectProfiles = (state) => state.ekos.profiles.profiles;
export const selectAlmanac = (state) => state.targets.almanac;
export const selectPicturesDirectory = (state) => state.setup.picturesDirectory;
export const selectNotification = (state) => state.ekos.notification;
export const selectSelectedProfile = (state) =>
  state.ekos.profiles.selectedProfile;
export const selectShowPortSelectorPanel = (state) =>
  state.ekos.showPortSelectorPanel;
export const selectDrivers = (state) => state.ekos.drivers;
export const selectDslrLenses = (state) => state.ekos.dslrLenses;
export const selectEkosOptions = (state) => state.ekos.options;
export const selectEkosDialogInfo = (state) => state.ekos.dialogInfo;

// ALIGN SELECTORS
export const selectAlignTargetDiff = (state) =>
  state.status.align.solution.targetDiff;
export const selectAlignSettings = (state) => state.ekos.alignSettings;
export const selectPolarStage = (state) => state.status.polar.stage;
export const selectAlignPresets = (state) => state.presets.alignPresets;
export const selectCurrentAlignPreset = (state) =>
  state.presets.currentAlignPreset;
export const selectTargetAlignSettings = (state) =>
  state.ekos.targetAlignSettings;
export const selectPolarMessage = (state) => state.status.polar.message;
export const selectMountSpeed = (state) => state.status.mount.slewRate;
export const selectManualSlew = (state) =>
  state.ekos.targetPAHSettings
    ? state.ekos.targetPAHSettings.manualslew
    : false;
export const selectTargetPAHSettings = (state) => state.ekos.targetPAHSettings;
export const selectPolar = (state) => state.status.polar;
export const selectAlignSolution = (state) => state.status.align.solution;
export const selectAlignAccuracyThreshold = (state) =>
  get(state.ekos.alignSettings, "alignAccuracyThreshold", 30);
export const selectAlignState = (state) => state.status.align.status;
export const selectAlignPA = (state) => state.status.align.solution.PA;
export const selectAlignFOV = (state) => state.status.align.solution.fov;
export const selectAlignCamera = (state) => state.status.align.solution.camera;

// MOUNT SELECTORS
export const selectMountStatus = (state) => state.status.mount.status;
export const selectPierSide = (state) => state.status.mount.pierSide;
export const selectMountAz = (state) => state.status.mount.az;
export const selectMountAt = (state) => state.status.mount.at;
export const selectMountHa = (state) => state.status.mount.ha;
export const selectMountTarget = (state) => state.status.mount.target;
export const selectMountRa = (state) => state.status.mount.ra;
export const selectMountDe = (state) => state.status.mount.de;
export const selectSelectedTarget = (state) => state.targets.selectedTarget;
export const selectAutoParkCountdown = (state) =>
  state.status.mount.autoParkCountdown;
export const selectMountSettings = (state) => state.ekos.mountSettings;
export const selectMountQClock = (state) => state.ekos.mountQClock;

// CAPTURE SELECTORS
export const selectDarkLibraryTableData = (state) =>
  state.darkLibrary.viewMasters;
export const selectCaptureStatus = (state) => state.status.capture.status;
export const selectDarkLibraryCameraSettings = (state) =>
  state.darkLibrary.cameraSettings;
export const selectDefectSettings = (state) =>
  state.darkLibrary.createDefectMaps;
export const selectDarkLibraryAllSettings = (state) =>
  state.darkLibrary.allSettings;
export const selectPreviewPreset = (state) => state.presets.previewPreset;
export const selectExposureDuration = (state) => state.status.capture.expr;
export const selectExposureRemaining = (state) => state.status.capture.expv;
export const selectCurrentPreset = (state) =>
  state.presets.currentCapturePreset;
export const selectCapturePresets = (state) => state.presets.capturePresets;
export const selectCaptureSettings = (state) => state.ekos.captureSettings;
export const selectCaptureCount = (state) => state.ekos.captureSettings.count;
export const selectCaptureDelay = (state) => state.ekos.captureSettings.delay;
export const selectFilterSettings = (state) => state.ekos.filterSettings;
export const selectLimitSettings = (state) => state.ekos.limitSettings;
export const selectLiveStackingSettings = (state) =>
  state.ekos.liveStackingSettings;
export const selectLiveStacking = (state) => state.ekos.liveStacking;
export const selectLiveStackingTarget = (state) =>
  state.ekos.liveStackingTarget;
export const selectSeqr = (state) => state.status.capture.seqr;
export const selectSeqv = (state) => state.status.capture.seqv;
export const selectSeqt = (state) => state.status.capture.seqt;
export const selectOvp = (state) => state.status.capture.ovp;
export const selectOvl = (state) => state.status.capture.ovl ?? 0;
export const selectOvt = (state) => state.status.capture.ovt;
export const selectCaptureLog = (state) => state.status.capture.log;

// FOCUS SELECTORS
export const selectFocusSettings = (state) => state.ekos.focusSettings;
export const selectFocusCurrentPreset = (state) =>
  state.presets.currentFocusPreset;
export const selectTargetFocusSettings = (state) =>
  state.ekos.targetFocusSettings;

// GUIDE SELECTORS
export const selectGuideSettings = (state) => state.ekos.guideSettings;
export const selectGuideTs = (state) => state.status.guide.ts;
export const selectGuidePresets = (state) => state.presets.guidePresets;
export const selectGuideCurrentPreset = (state) =>
  state.presets.currentGuidePreset;

// INDI SELECTORS
export const selectPermanentSubscriptions = (state) =>
  state.indi.permanent_subscriptions;
export const selectIndiDevices = (state) => state.indi.devices;
export const selectIndiDevicesCount = (state) => state.indi.devices.length;

// SCHEDULER SELECTORS
export const selectAbortedJob = (state) =>
  state.ekos.schedulerSettings.abortJob;
export const selectSchedulerStatus = (state) => state.status.scheduler.status;
export const selectSchedulerSettings = (state) => state.ekos.schedulerSettings;
export const selectSchedulerLog = (state) => state.status.scheduler.log;
export const selectJobCompletionSettings = (state) =>
  state.ekos.schedulerSettings.jobCompletion;
export const selectConstraintSettings = (state) =>
  state.ekos.schedulerSettings.jobConstraint;
export const selectJobs = (state) => state.ekos.schedulerJobs.jobs;
export const selectSchedulerAlgorithm = (state) =>
  state.ekos.schedulerSettings.algorithm;
export const selectShutdownProcedure = (state) =>
  state.ekos.schedulerSettings.shutdownProcedure;
export const selectObservatoryStartup = (state) =>
  state.ekos.schedulerSettings.observatoryStartup;

// TARGETS SELECTORS
export const selectFovProfiles = (state) => state.targets.fovProfiles;
export const selectCurrentFOVProfile = (state) =>
  state.targets.currentFOVProfile;
export const selectTargetsListNames = (state) => state.targets.lists;
export const rotatorProperty = (state) =>
  propertySelector(state, {
    device: isEmpty(rotators) ? "" : rotators[0].name,
    property: "ABS_ROTATOR_ANGLE",
  });
export const rotatorAngle = (state) =>
  elementAttributeSelector(state, {
    device: isEmpty(rotators) ? "" : rotators[0].name,
    property: "ABS_ROTATOR_ANGLE",
    element: "ANGLE",
    attribute: "value",
  });
export const selectTargetsObjects = (state) => state.targets.objects;
export const selectTargetsSearchResults = (state) => state.targets.names ?? [];
export const selectLocalLoadingObjects = (state) =>
  state.targets.localLoadingObjects;
export const selectRemoteLoadingObjects = (state) =>
  state.targets.remoteLoadingObjects;
export const selectObservability = (state) => state.targets.observability;
export const selectRisetime = (state) => state.targets.risetime;
export const selectInfoUpdateTS = (state) => state.targets.infoUpdateTS;
export const selectActiveTargetsTab = (state) => state.targets.tab;

// VIEW SELECTORS
export const selectSortDirection = (state) => state.viewer.sortDirection;
export const selectImages = state => state.wsMedia.images;
export const selectActiveSortBy = createSelector(
  (state) => state.viewer.sortFilter,
  (_, props) => props,
  (index, props) => props.list[index]
);

/**
 * Returns a connected Train Device
 * props: {trainType: trainModules.CaptureOpticalTrain, deviceType: 'camera}
 */
export const selectTrainDevice = createSelector(
  (state) => state.opticalTrain.allTrains,
  (state) => state.opticalTrain.selectedTrains,
  (state) => state.indi.devices,
  (_, props) => props,
  (trains, selectedTrains, devices, props) =>
  {
    if (!isEmpty(trains) && !isEmpty(selectedTrains))
    {
      for (const oneTrain of trains)
      {
        if (oneTrain && oneTrain.id === selectedTrains[props.trainType])
        {
          let device_interface = undefined;
          switch (props.deviceType)
          {
            case "focuser":
              device_interface = deviceType.FOCUSER;
              break;
            case "mount":
              device_interface = deviceType.MOUNT;
              break;
            case "filterwheel":
              device_interface = deviceType.FILTER;
              break;
            case "dustcap":
              device_interface = deviceType.DUSTCAP;
              break;
            case "lightbox":
              device_interface = deviceType.LIGHTBOX;
              break;
            case "camera":
              device_interface = deviceType.CAMERA;
              break;
            case "guider":
              device_interface = deviceType.GUIDER;
              break;
            case "rotator":
              device_interface = deviceType.ROTATOR;
              break;
          }

          const device = devices.find((device) => device.name === oneTrain[props.deviceType] && (device_interface === undefined || device.type === device_interface));
          if (device && device.isConnected())
            return device;
        }
      }
    }
  }
);

export const selectTrainDeviceName = createSelector(
  (state) => state.opticalTrain.allTrains,
  (state) => state.opticalTrain.selectedTrains,
  (state) => state.indi.devices,
  (_, props) => props,
  (trains, selectedTrains, devices, props) =>
  {
    const train = trains?.find(oneTrain => oneTrain.id === selectedTrains[props.trainType]);
    if (train)
      return train[props.deviceType];
  }
);

export const selectTrainName = createSelector(
  (state) => state.opticalTrain.allTrains,
  (state) => state.opticalTrain.selectedTrains,
  (_, props) => props,
  (trains, selectedTrains, props) =>
  {
    const train = trains?.find(oneTrain => oneTrain.id === selectedTrains[props.trainType]);
    if (train)
      return train.name;
  }
);

export const selectActiveDevice = createSelector(
  (state) => state.devices.devices,
  (state) => state.devices.selectedDevice,
  (devices, selectedDevice) =>
    devices?.find(device => device.hostname === selectedDevice)
);

// return the list of completed tour guide
export const getCompletedTours = createSelector(
  (state) => state.setup.tourGuide,
  (tourGuide) =>
  {
    if (!isEmpty(tourGuide))
    {
      return tourGuide.completed;
    } else
      return true;
  }
);

// DSLR info?
export const dslrInfo = createSelector(
  (state) => state.ekos.dslrInfo,
  (dslr) =>
  {
    if (!isEmpty(dslr))
      return dslr;
    else return false;
  }
);

// return active guide tour zone
export const getActiveGuideTour = createSelector(
  (state) => state.setup.tourGuide,
  (tourGuide) =>
  {
    if (!isEmpty(tourGuide))
    {
      return tourGuide.activeZone;
    } else
      return 0;
  }
);

// checks if the tour guide is activated or not
export const isTourGuideActive = createSelector(
  (state) => state.setup.tourGuide,
  (tourGuide) =>
  {
    if (!isEmpty(tourGuide))
    {
      return tourGuide.active;
    } else
      return false;
  }
);

// is Registration OK?
export const isRegistrationOK = createSelector(
  (state) => state.devices.regInfo,
  (regInfo) =>
  {
    return !isEmpty(regInfo);
  }
);

export const selectActiveDeviceValue = createSelector(
  (state) => state.devices.devices,
  (state) => state.devices.selectedDevice,
  (_, key) => key,
  (devices, selectedDevice, key) =>
  {
    const device = devices?.find(device => device.hostname === selectedDevice);
    if (device)
      return device[key];
    return null;
  }
);

// Select devices by type
export const selectDomesCount = createSelector(
  (state) => state.indi.devices,
  (devices) =>
    devices.filter(device => device.type === deviceType.DOME).length
);

// Get Number of Mounts
export const selectMountsCount = createSelector(
  (state) => state.indi.devices,
  (devices) =>
    devices.filter(device => device.type === deviceType.MOUNT).length
);

// Select devices by type
export const selectCapsCount = createSelector(
  (state) => state.indi.devices,
  (devices) =>
    devices.filter(device => device.type === deviceType.DUSTCAP).length
);

// Select devices by type
export const selectGuidersCount = createSelector(
  (state) => state.indi.devices,
  (devices) =>
    devices.filter(device => device.type === deviceType.GUIDER || device.type === deviceType.CAMERA).length
);

// Select devices by type
export const selectCamerasCount = createSelector(
  (state) => state.indi.devices,
  (devices) =>
    devices.filter(device => device.type === deviceType.CAMERA).length
);

// Check if new capture settings are supported 
export const checkNewCaptureSettings = createSelector(
  (state) => state.setup.versions,
  (versions) => compareVersions(get(versions, "kstars", "3.6.9"), "3.7.0") >= 0
);

// Get the list of all trains
export const getTrains = createSelector(
  (state) => state.opticalTrain.allTrains,
  (trains) =>
  {
    return trains?.map(oneTrain => ({ text: oneTrain.name, value: oneTrain.name }));
  }
);

export const selectDome = createSelector(
  (state) => state.indi.devices,
  (devices) =>
  {
    return devices.find(device => (device.type === deviceType.DOME));
  }
);

export const selectSavedNotifications = (state) => state.notifications.savedNotifications;

/**
 * Get logs for each module
 * props: i.e {module: "align"}
 */
export const getLogs = createSelector(
  (state) => state.status,
  (_, props) => props,
  (status, props) =>
  {
    return get(status[props.module], "log", []);
  }
);

/**
 * Returns SM OS version
 */
export const getStellarMateVersion = createSelector(
  (state) => state.setup.versions,
  (versions) =>
  {
    if (!isEmpty(versions.stellarmate))
    {
      return versions.stellarmate;
    } else return defaultVersion.stellarmate;
  }
);

/**
 * Get INDI device value, Using in INDI to get activeDevice and activeGroup name
 */
export const getINDIDeviceValue = createSelector(
  (state) => state.indi,
  (_, props) => props,
  (indi, props) =>
  {
    return get(indi, [props.key], "");
  }
)