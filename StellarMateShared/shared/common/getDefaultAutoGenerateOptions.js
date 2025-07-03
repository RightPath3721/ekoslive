import isEmpty from "lodash/isEmpty";
import isArray from "lodash/isArray";
import get from "lodash/get";
import s from "../i18n/i18n";

/**
 * @typedef {Object} Option
 * @property {string} key - The key name for the option.
 * @property {boolean} defaultValue - The default value for the option.
 * @property {string} label - The label for the option from translation string.
 */

/**
 * Options object that defines each setting with a key and its default value.
 * @type {Object<string, Option>}
 */
export const autoGeneratingPresetOptions = {
    Exposure: { key: "exposure", defaultValue: true, label: s.general.exposure },
    Frame: { key: "frame", defaultValue: true, label: s.general.frame },
    Format: { key: "format", defaultValue: false, label: s.general.format },
    Binning: { key: "binning", defaultValue: false, label: s.general.binning },
    Filter: { key: "filter", defaultValue: true, label: s.general.filter },
    Gain: { key: "gain", defaultValue: true, label: s.general.gain },
    Offset: { key: "offset", defaultValue: true, label: s.general.offset },
    Temperature: {
        key: "temperature",
        defaultValue: false,
        label: s.general.temperature,
    },
    ISO: { key: "iso", defaultValue: false, label: s.general.iso },
};

/**
 * Default options with keys set to their respective default values.
 * Used when the `arrayList` in `preset` is empty.
 * @type {Object<string, boolean>}
 */
const defaultOptions = Object.values(autoGeneratingPresetOptions).reduce(
    (acc, { key, defaultValue }) => ({ ...acc, [key]: defaultValue }),
    {},
);

/**
 * Options with all values set to `false`.
 * Used when the `arrayList` in `preset` has configuration.
 * @type {Object<string, boolean>}
 */
const uncheckedOptions = Object.values(autoGeneratingPresetOptions).reduce(
    (acc, { key }) => ({ ...acc, [key]: false }),
    {},
);

/**
 * Returns a default set of options for auto-generation based on the given preset.
 * If `arrayList` in the preset is empty, returns `defaultOptions`.
 * If `arrayList` has values, returns a state where all options are unchecked
 * except those present in `arrayList`, which are set to `true`.
 *
 * @param {Object} preset - The preset configuration.
 * @param {Array} preset.arrayList - The array containing option names to include.
 * @returns {Object<string, boolean>} An object with option keys set to boolean values.
 */
const getDefaultAutoGenerateOptions = (preset) =>
{
    const list = get(preset, "arrayList", {});

    if (isEmpty(list)) return defaultOptions;
    else
    {
        // Define all possible keys, including those not in the array
        const allPossibleKeys = [
            "exposure",
            "frame",
            "binning",
            "filter",
            "gain",
            "offset",
            "iso",
            "format",
            "temperature",
        ];

        // Create the result object
        const result = allPossibleKeys.reduce((acc, key) =>
        {
            acc[key] = list.includes(key) ? true : false; // Set true or false based on presence in keysToCheck
            return acc;
        }, {});

        return {
            ...uncheckedOptions,
            ...result,
            ...Object.keys(list).reduce((acc, key) =>
            {
                const option = autoGeneratingPresetOptions[list[key]];
                if (!option) return acc;

                return { ...acc, [option.key]: true };
            }, {}),
        };
    }
};

export default getDefaultAutoGenerateOptions;
