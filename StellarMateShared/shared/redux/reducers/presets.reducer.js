import { isEqual } from "lodash";
import { settingsConstants } from "../constants";

/**
 * Presets are not only in Capture Module
 **********Sample in JSON form**********
 * {
  "previewPreset": {
    "transferFormat": "",
    "captureFormat": "--",
    "dark": false,
    "iso": 0,
    "offset": "--",
    "gain": "--",
    "frameType": 0,
    "exp": 1,
    "temperature": "--",
    "bin": 1,
    "filter": "--"
  },

  "currentCapturePreset": "Default",
  "capturePresets": [
    {
       "name": "Default"
    }
  ]
}
 */
const initialState = {
    // All Capture presets are added here
    capturePresets: [
        {
            name: "Default",
        },
    ],

    // Current Capture Preset  that is selected
    currentCapturePreset: "Default",

    // Preview Preset that is controlled from Quick Camera Settings
    previewPreset: {
        frameType: 0,
        exp: 1,
        bin: 1,
        filter: "--",
        temperature: "--",
        gain: "--",
        offset: "--",
        iso: 0,
        dark: false,
        captureFormat: "--",
        transferFormat: "",
    },
};

export const presets = (state = initialState, action) =>
{
    switch (action.type)
    {
        case settingsConstants.SAVE_CAPTURE_PRESETS:
            if (!isEqual(state.capturePresets, action.payload))
                return { ...state, capturePresets: action.payload };
            else return state;

        case settingsConstants.SAVE_CAPTURE_PRESET:
            return {
                ...state,
                capturePresets: [...state.capturePresets, action.payload],
            };

        case settingsConstants.DELETE_CAPTURE_PRESET:
            return {
                ...state,
                capturePresets: state.capturePresets.filter(
                    (preset) => preset.name !== action.payload,
                ),
            };

        case settingsConstants.UPDATE_CAPTURE_PRESET:
            return {
                ...state,
                capturePresets: state.capturePresets.map((preset) =>
                    preset.uuid === action.payload.uuid
                        ? { ...preset, ...action.payload }
                        : preset,
                ),
            };

        case settingsConstants.SAVE_CURRENT_CAPTURE_PRESET:
            return { ...state, currentCapturePreset: action.payload };

        case settingsConstants.UPDATE_PREVIEW_PRESET:
            let currentPreviewPreset = state.previewPreset;
            if (action.payload.type === "all")
            {
                currentPreviewPreset = action.payload.value;
                return { ...state, previewPreset: currentPreviewPreset };
            }
            else
            {
                currentPreviewPreset[action.payload.type] = action.payload.value;
                return { ...state, previewPreset: currentPreviewPreset };
            }

        default:
            return state;
    }
};
