import { WEBSOCKET_MESSAGE } from "redux-websocket";
import { get } from "lodash";
import commands from "../../commands";
/**
 * Refucer for Dark Library that is a child component for Dark Library
 * 
 **********Sample in JSON form**********
 *
 * {
  "allSettings": {},
  "viewMasters": [],
  "createDefectMaps": {
    "coldPixelsEnabled": null,
    "aggresivenessHotSpin": null,
    "hotPixelsCount": null,
    "hotPixelsEnabled": null,
    "masterMedian": null,
    "aggresivenessColdSpin": null,
    "coldPixelsCount": null,
    "masterDeviation": null,
    "masterExposure": null,
    "masterMean": null,
    "masterTempreture": null,
    "masterTime": null
  },
  "createDarks": {
    "darkProgress": 0,
    "totalTime": null,
    "preferDarksRadio": false,
    "countSpin": null,
    "totalImages": null,
    "bin4Check": null,
    "bin2Check": null,
    "maxTempretureRange": null,
    "bin1Check": null,
    "minTempretureRange": null,
    "maxExposureRange": null,
    "minExposureRange": null,
    "preferDefectsRadio": false
  },
  "cameraSettings": {
    "preferDefectsRadio": false,
    "preferDarksRadio": false,
    "camera": "Default"
  }
}
 */
const initialState = {
    // Stores camera name and other settings like Radio button
    // FixMe: get cameraName for the selector
    cameraSettings: {
        camera: 'Default',
        preferDarksRadio: false,
        preferDefectsRadio: false
    },

    // All Settings in Create Darks component
    createDarks: {
        preferDarksRadio: false,
        preferDefectsRadio: false,
        minExposureRange: null,
        maxExposureRange: null,
        minTempretureRange: null,
        maxTempretureRange: null,
        bin1Check: null,
        bin2Check: null,
        bin4Check: null,
        countSpin: null,
        totalImages: null,
        totalTime: null,
        darkProgress: 0
    },

    // All Settings under Create Defect map component
    createDefectMaps: {
        masterTime: null,
        masterExposure: null,
        masterTempreture: null,
        masterMean: null,
        masterMedian: null,
        masterDeviation: null,
        hotPixelsCount: null,
        coldPixelsCount: null,
        aggresivenessHotSpin: null,
        aggresivenessColdSpin: null,
        hotPixelsEnabled: null,
        coldPixelsEnabled: null
    },

    // Captured Dark files, has the image metadata for each 
    viewMasters: [],
    allSettings: {}
};

export const darkLibrary = (state = initialState, action) =>
{
    switch (action.type)
    {
        case WEBSOCKET_MESSAGE:
            if (get(action, "payload.event.target.url", "").includes("/message/user") === false)
            {
                return state;
            }
            const message = JSON.parse(action.payload.data);

            switch (message.type)
            {
                case commands.DARK_LIBRARY_GET_DARK_SETTINGS:
                    return { ...state, createDarks: message.payload }
                case commands.DARK_LIBRARY_GET_DEFECT_SETTINGS:
                    return { ...state, createDefectMaps: message.payload }
                case commands.DARK_LIBRARY_GET_VIEW_MASTERS:
                    return { ...state, viewMasters: message.payload }
                case commands.DARK_LIBRARY_GET_CAMERA_PRESETS:
                    return { ...state, cameraSettings: message.payload }
                case commands.DARK_LIBRARY_GET_ALL_SETTINGS:
                    return { ...state, allSettings: message.payload }
                default:
                    return state;
            }
        default:
            return state;
    }
};