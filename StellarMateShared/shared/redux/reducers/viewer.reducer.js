import { viewerConstants } from "../constants";

/**
 * Viewer tab relevant info
 * 
 **********Sample in JSON form**********
 * {
  "dbrules": [],
  "rules": [],
  "showForward": false,
  "showBack": false,
  "currentPage": 0,
  "maxImages": 1,
  "sortFilter": 1,
  "sortDirection": 0,
  "showFilter": 0
}
 */
const initialState =
{
  // Whether to show the filter or no
  showFilter: 0,

  // Sorting filter index
  sortFilter: 1,

  // Direction i.e A-Z or Z-A
  sortDirection: 0,

  // These are probably used for Web app 
  maxImages: 1,
  currentPage: 0,
  showBack: false,
  showForward: false,

  // Rules for DB i.e Offline or online and other filtering rules
  rules: [],
  dbrules: [],
};

export function viewer(state = initialState, action) 
{
  if (action.type === viewerConstants.SET_DB_RULES) 
  {
    return { ...state, dbrules: action.payload };
  }
  if (action.type === viewerConstants.ADD_RULE) 
  {
    return {
      ...state,
      rules: [...state.rules, action.payload],
    };
  } else if (action.type === viewerConstants.REMOVE_RULE)
  {
    return {
      ...state,
      rules: state.rules.filter((_, index) => index !== action.payload),
      dbrules: state.dbrules.filter((_, index) => index !== action.payload),
    };
  } else if (Object.values(viewerConstants).includes(action.type))
    return { ...state, [action.type]: action.payload };
  else return state;
}
