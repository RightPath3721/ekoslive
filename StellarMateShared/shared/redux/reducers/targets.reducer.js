import { get, isEqual, union, unionBy } from "lodash";
import { WEBSOCKET_MESSAGE } from "redux-websocket";
import { targetConstants } from "../constants";
import commands from "../../commands";
import storage from "../../../config/storage";
import { APP_MODE } from "../../../config";

/**
 * All Targets tab Info 
 * 
 **********Sample in JSON form**********
 * {
  "activeList": "",
  "tab": "",
  "_persist": {
    "rehydrated": true,
    "version": -1
  },
  "infoUpdateTS": null,
  "selectedTarget": {
    "de": "",
    "ra": "",
    "name": ""
  },
  "names": [
    "M 31",
    "M 33",
    "M 81",
    "NGC 253",
    "M 83",
    "M 101",
    "NGC 2403",
    "M 110",
    "M 94",
    "M 32",
  ],
  "currentFOVProfile": "CCD Simulator",
  "lists": {
    "My Searches": [],
    "Favorites": []
  },
  "fovProfiles": [],
  "localLoadingObjects": [],
  "remoteLoadingObjects": [],
  "risetime": [],
  "objects": [],
  "almanac": {
    "SunRise": 0.3002430555555556,
    "SunMinAlt": -52.517706932273036,
    "MoonSet": 0.2414236111111111,
    "MoonPhase": 125.30843197933913,
    "Dusk": -0.13291666666666666,
    "SunMaxAlt": 52.63791046560669,
    "MoonRise": 0.5901504629629629,
    "SunSet": 0.8054629629629629,
    "MoonIllum": 0.7889888628342225,
    "Dawn": 0.23791666666666667
  },
  "observability": []
}
 */
const initialState = {
  // Names of current targets
  names: [],

  // Each target has it's own ovservability
  observability: [],

  // Risetime of each targets
  risetime: [],

  // Almanac that is recieved from Kstars
  almanac: null,

  // Objects Info and it's metadata
  objects: [],

  // If there are any remote objects, that we search for
  remoteLoadingObjects: [],

  // Locally loaded objects as per the settings
  localLoadingObjects: [],

  // All FOV profiles are here
  fovProfiles: [],

  // Current FOV profile
  currentFOVProfile: "",

  // Lists where we can add our favourite targets and our searches, can also create new lists from Targets tab
  lists: [
    {
      name: "Favorites",
      payload: [],
    },
    {
      name: "My Searches",
      payload: [],
    },
  ],

  // We use this as it saves the selected target here. It is used in Mount GOTO so we store that information once the target info is recieved from Kstars
  selectedTarget: {
    name: "",
    ra: "",
    de: "",
  },

  // Update TS ro re-render FOV Profiles

  ts: null,

  // Update TS to re-render the component
  infoUpdateTS: null,

  // Active list i.e Favorites etc.
  activeList: "",
};

export function targets(state = initialState, action)
{
  switch (action.type)
  {
    case targetConstants.SET_HIPS_REMOTE_LOADING_OBJECT:
      return {
        ...state,
        remoteLoadingObjects: union(state.remoteLoadingObjects, action.payload),
      };

    case targetConstants.SET_ACTIVE_LIST:
      return { ...state, activeList: action.payload };

    case targetConstants.SET_HIPS_LOCAL_LOADING_OBJECT:
      return {
        ...state,
        localLoadingObjects: union(state.localLoadingObjects, action.payload),
      };

    case targetConstants.CLEAR_LOADING_OBJECTS:
      return { ...state, localLoadingObjects: [], remoteLoadingObjects: [] };

    case targetConstants.SET_HIPS_OBJECT:
      // We need to put [action.payload] FIRST so that it replaces whatever values in state.objects that mathces
      // info.name. i.e. when we get an object with the same name but with updated metadata, then it will
      // OVERWRITE the existing object which is what we want.
      return {
        ...state,
        objects: unionBy([action.payload], state.objects, "info.name"),
      };

    case targetConstants.SET_HIPS_OBJECTS:
      {
        const objects = action.payload;
        return {
          ...state,
          objects: unionBy(state.objects, objects, "info.name"),
        };
      }

    case targetConstants.REMOVE_OBJECTS:
      {
        const names = action.payload;
        return {
          ...state,
          objects: state.objects.filter(
            (oneObject) => !names.includes(oneObject.info?.name),
          ),
        };
      }

    case targetConstants.SET_FOV_PROFILES:
      {
        if (!isEqual(state.fovProfiles, action.payload))
        {
          return { ...state, fovProfiles: action.payload };
        }
        else return state;
      }

    case targetConstants.SET_CURRENT_FOV_PROFILE:
      return { ...state, currentFOVProfile: action.payload };

    case targetConstants.SET_LISTS:
      if (!isEqual(state.lists, action.payload))
        return { ...state, lists: action.payload };
      else return state;

    case targetConstants.SET_SELECTED_TARGET:
      return { ...state, selectedTarget: action.payload };

    case WEBSOCKET_MESSAGE:
      if (
        get(action, "payload.event.target.url", "").includes(
          "/message/user",
        ) === false
      )
      {
        return state;
      }
      const message = JSON.parse(action.payload.data);

      switch (message.type)
      {
        case commands.ASTRO_GET_ALMANAC:
          return { ...state, almanac: message.payload };

        case commands.ASTRO_SEARCH_OBJECTS:
          return { ...state, names: message.payload };

        case commands.ASTRO_GET_OBJECTS_OBSERVABILITY:
          // Combine arrays and make sure no duplicates. If there are, then the values
          // in message.payload are the ones included in the final array and older values discarded
          return {
            ...state,
            observability: unionBy(
              message.payload,
              state.observability,
              "name",
            ),
          };

        case commands.ASTRO_GET_OBJECTS_RISESET:
          return {
            ...state,
            risetime: unionBy(message.payload, state.risetime, "name"),
          };

        case commands.ASTRO_GET_OBJECT_INFO:
          return { ...state, selectedTarget: message.payload };

        case commands.ASTRO_GET_OBJECTS_INFO:
          const infos = message.payload;
          for (const oneInfo of infos)
          {
            if (APP_MODE === "1")
            {
              const hipsData = JSON.parse(
                localStorage.getItem("hips:" + oneInfo.name) ?? "{}",
              );
              // Merge new metadata into existing data
              const updatedHipsData = {
                ...hipsData,
                info: oneInfo,
              };
              storage.setItem(
                "hips:" + oneInfo.name,
                JSON.stringify(updatedHipsData),
              );
            }
            else
            {
              storage.setItem(
                "hips:" + oneInfo.name,
                JSON.stringify({ info: oneInfo }),
              );
            }
          }

          return {
            ...state,
            infoUpdateTS: Date.now(),
          };

        case commands.ASTRO_GET_NAMES:
          storage.setItem("astro_names", JSON.stringify(message.payload));
          return state;

        case commands.ASTRO_GET_DESIGNATIONS:
          storage.setItem(
            "astro_designations",
            JSON.stringify(message.payload),
          );
          return state;

        default:
          return state;
      }

    default:
      {
        return state;
      }
  }
}
