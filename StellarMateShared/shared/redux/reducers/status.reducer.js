import { get, isEmpty, merge } from "lodash";
import { WEBSOCKET_MESSAGE } from "redux-websocket";
import { ekosConstants, settingsConstants, setupConstants } from "../constants";
import commands from "../../commands";
import { AdvisorStages, SchedulerStates } from "../../indi/enums";

/**
 * Status of all modules
 **********Sample in JSON form**********
 * {
  "scheduler": {
    "log": "",
    "status": 0
  },
  "indi": {
    "status": 0
  },
  "align": {
    "solution": {
      "targetDiff": 0,
      "fov": "0 x 0'",
      "rot": 0,
      "pix": 0,
      "ts": 0,
      "dRA": 0,
      "de": "DD:MM:SS",
      "dDE": 0,
      "ra": "HH:MM:SS"
    },
    "status": "Idle"
  },
  "cap": {
    "status": "Idle"
  },
  "focus": {
    "ts": 0,
    "pos": 0,
    "hfr": 0,
    "status": "Idle"
  },
  "polar": {
    "message": "",
    "vector": {},
    "enabled": false,
    "stage": "Idle"
  },
  "guide": {
    "ts": 0,
    "drift_de": 0,
    "derms": 0,
    "rarms": 0,
    "drift_ra": 0,
    "status": "Idle"
  },
  "mount": {
    "autoParkCountdown": "00:00:00",
    "meridianFlipText": "",
    "slewRate": 0,
    "at": 0,
    "mountSettings": {
      "displayTotalValue": -1,
      "totalValue": -1,
      "speedIndex": -1
    },
    "target": "",
    "az": 0,
    "de": 0,
    "pierSide": "",
    "ra": 0,
    "status": "Idle"
  },
  "overallStatus": {
    "status": "",
    "source": ""
  },
  "dome": {
    "az": 0,
    "status": "Idle"
  },
  "capture": {
    "ovl": "--",
    "expv": 0,
    "seql": "-",
    "seqt": "--:--:--",
    "expr": 0,
    "seqr": 0,
    "seqv": 0,
    "ovp": 0,
    "log": "",
    "loading": false,
    "ovt": "--:--:--",
    "status": "Idle"
  }
}
 */
const initialState = {
  // When the capture sequences are performed, we can see the status from here
  capture: {
    status: "Idle",
    loading: false,
    log: "",
    expr: 0,
    expv: 0,
    seqr: 0,
    seqv: 0,
    seql: "-",
    seqt: "--:--:--",
    ovp: 0,
    ovt: "--:--:--",
    ovl: "--",
  },

  // Status of current active mount from the Optical train
  mount: {
    status: "Idle",
    target: "",
    ra: 0,
    de: 0,
    az: 0,
    at: 0,
    slewRate: 0,
    pierSide: "",
    meridianFlipText: "",
    autoParkCountdown: "00:00:00",
    mountSettings: {
      speedIndex: -1,
      displayTotalValue: -1,
      totalValue: -1,
    },
  },

  // Focus graph status
  focus: {
    status: "Idle",
    looping: false,
    hfr: 0,
    pos: 0,
    ts: 0,
    log: "",
    chart: [],
    reset: false,
    resetTitle: "",
  },

  // When the Guide is in progress, it has it's infomration
  guide: {
    status: "Idle",
    rarms: 0,
    derms: 0,
    drift_ra: 0,
    drift_de: 0,
    ts: 0,
    log: "",
    progress: false,
    chart: {
      ra: [],
      de: [],
      rms: [],
      data: [],
      limit: 0,
    },
  },

  // Align solution and Solve information
  align: {
    status: "Idle",
    solution: {
      ra: "HH:MM:SS",
      de: "DD:MM:SS",
      dRA: 0,
      dDE: 0,
      pix: 0,
      rot: 0,
      fov: "0 x 0'",
      targetDiff: 0,
      ts: 0,
      log: "",
    },
  },

  // PAA status information related to Refreshing and Module message
  polar: {
    stage: "Idle",
    enabled: false,
    message: "",
    vector: {},
  },

  // Dome status
  dome: {
    status: "Idle",
    az: 0,
  },

  // Cap status
  cap: {
    status: "Idle",
  },

  // INDI status if any
  indi: {
    status: 0,
  },

  // Scheduler logs status
  scheduler: {
    status: SchedulerStates.SCHEDULER_IDLE,
    log: "",
  },

  // Now, we use Overall status in the Camera status bar next to battery details
  overallStatus: { source: "", status: "" },
};

export const status = (state = initialState, action) =>
{
  switch (action.type)
  {
    case settingsConstants.CLEAR_UPDATED_POLAR_ERRORS:
      {
        return {
          ...state,
          polar: {
            ...state.polar,
            updatedALTError: -1,
            updatedAZError: -1,
            updatedError: -1,
          },
        };
      }

    case settingsConstants.OVERRIDE_CAPTURE_STATUS:
      {
        return {
          ...state,
          capture: { ...state.capture, status: action.payload },
        };
      }

    case settingsConstants.SET_MOUNT_SETTINGS:
      {
        return {
          ...state,
          mount: { ...state.mount, mountSettings: action.payload },
        };
      }

    case setupConstants.SET_STATUS_PARAMETER_VALUE:
      return { ...state, ...action.payload };

    case ekosConstants.RESET_FOCUS_GRAPH:
      return {
        ...state,
        focus: {
          ...state.focus,
          chart: [],
          hfr: 0,
          reset: false,
          resetTitle: "",
        },
      };

    case ekosConstants.RESET_GUIDE_GRAPH:
      return {
        ...state,
        guide: {
          ...state.guide,
          chart: initialState.guide.chart,
        },
      };

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
        case commands.NEW_CONNECTION_STATE:
          {
            if (message.payload.online === false)
              return {
                ...state,
                overallStatus: { source: "", status: "" },
              };
            else return state;
          }

        case commands.NEW_FOCUS_STATE:
          {
            let newFocusState = state.focus;
            const overallStatus =
              "status" in message.payload
                ? { source: "focus", status: message.payload.status }
                : state.overallStatus;
            merge(newFocusState, message.payload);

            const hfr = get(newFocusState, "hfr", -1);
            const pos = get(newFocusState, "pos", -1);
            const status = get(newFocusState, "status", false);
            const havePosition = pos >= 0;
            const inProgress = status === "In Progress";
            let looping = state.focus.looping;

            if (status === "Framing")
              looping = true;
            else if (status === "Idle" || status === "Aborted")
              looping = false;

            const useIterations = looping || !havePosition;
            let focusinitHFRPlot = get(
              message.payload,
              "focusinitHFRPlot",
              false,
            );
            const stage = get(newFocusState, "focusAdvisorStage", false);
            let prevChartData = state.focus.chart;

            if (hfr > 0 && inProgress)
            {
              if (focusinitHFRPlot)
              {
                if (stage === AdvisorStages.COARSE_ADJUSTMENT)
                {
                  return {
                    ...state,
                    overallStatus,
                    focus: {
                      ...newFocusState,
                      chart: [],
                      pos: 0,
                      hfr: 0,
                      useIterations,
                      looping,
                    },
                  };
                }
                else
                {
                  prevChartData = [];
                }
              }
              // Ensure prevChartData is sorted by index
              prevChartData.sort((a, b) => a.index - b.index);

              // Check if the data point already exists
              const isDuplicate = prevChartData.some((point) =>
              {
                if (useIterations) return point.x === pos || point.y === hfr;
                else return point.x === pos && point.y === hfr;
              });

              if (!isDuplicate)
              {
                if (prevChartData.length >= 21) prevChartData.shift();
                const index =
                  prevChartData.length === 0
                    ? 1
                    : prevChartData[prevChartData.length - 1].index + 1;
                prevChartData = [
                  ...prevChartData,
                  {
                    x: useIterations ? index : pos,
                    y: hfr,
                    symbol: "circle",
                    size: 16,
                    index,
                    useIterations
                  },
                ];
              }
            }

            return {
              ...state,
              overallStatus,
              focus: {
                ...newFocusState,
                chart: prevChartData,
                useIterations,
                looping,
              },
            };
          }

        case commands.NEW_GUIDE_STATE:
          {
            let newGuideState = state.guide;
            const overallStatus =
              "status" in message.payload
                ? { source: "guide", status: message.payload.status }
                : state.overallStatus;
            merge(newGuideState, message.payload);
            const status = get(newGuideState, "status", "");
            const ts = get(newGuideState, "ts", "");

            let prevChartData = [...state.guide.chart.data];
            let raChartData = [...state.guide.chart.ra];
            let deChartData = [...state.guide.chart.de];
            let rmsChartData = [...state.guide.chart.rms];
            let fullChart = [];
            let ra = [];
            let de = [];
            let rms = [];
            let higherValue = 0;
            let newProgressState = false;

            if (status === "Guiding" && ts && get(newGuideState, "drift_ra"))
            {
              newProgressState = true;

              switch (status)
              {
                case "Idle":
                case "Connected":
                // Not sure why this was there in EKOSLive, could be because there is
                // spelling mistake on server-side too so just added another one with
                // fixed spelling.
                case "Discnnected":
                case "Disconnected":
                case "Suspended":
                case "Complete":
                case "Dithering successful":
                case "Calibrated":
                case "Aborted":
                case "Calibration error":
                case "Dithering error":
                  newProgressState = false;
                  break;

                default:
                  break;
              }

              if (newProgressState === false)
              {
                fullChart = [];
                ra = [];
                de = [];
                rms = [];
                prevChartData.length = 0;
              }

              let data = {
                drift_ra: newGuideState.drift_ra,
                drift_de: newGuideState.drift_de,
                totalrms: Math.sqrt(
                  newGuideState.rarms * newGuideState.rarms +
                  newGuideState.derms * newGuideState.derms,
                ),
                pos: ts,
              };

              // Keep only up to 60 elements in the array ( a minute if exposure is 1 )
              if (prevChartData.length >= 60) prevChartData.shift();
              if (raChartData.length >= 60) raChartData.shift();
              if (deChartData.length >= 60) deChartData.shift();
              if (rmsChartData.length >= 60) rmsChartData.shift();

              fullChart = [
                ...prevChartData,
                {
                  pos: data.pos,
                  ra: data.drift_ra,
                  de: data.drift_de,
                  rms: data.totalrms,
                },
              ];

              ra = fullChart.map((info) => ({ x: info.pos, y: info.ra }));
              de = fullChart.map((info) => ({ x: info.pos, y: info.de }));
              rms = fullChart.map((info) => ({ x: info.pos, y: info.rms }));

              // Take all the max drift_de or drift_ra values from current chartData and store in chartDataArray
              const chartDataArray = prevChartData.map((item) =>
                Math.max(
                  Math.abs(item.de),
                  Math.abs(item.ra),
                  Math.abs(item.rms),
                ),
              );
              higherValue = Math.max(...chartDataArray);
            }
            return {
              ...state,
              overallStatus,
              guide: {
                ...newGuideState,
                progress: newProgressState,
                chart: {
                  ...state.guide.chart,
                  data: fullChart,
                  limit: higherValue,
                },
                ts: +new Date(),
              },
            };
          }

        case commands.NEW_ALIGN_STATE:
          {
            let newAlignState = state.align;
            const overallStatus =
              "status" in message.payload
                ? { source: "align", status: message.payload.status }
                : state.overallStatus;
            merge(newAlignState, message.payload);
            return {
              ...state,
              overallStatus,
              align: {
                ...newAlignState,
                solution: { ...newAlignState.solution },
              },
            };
          }

        case commands.NEW_POLAR_STATE:
          {
            let newPolarState = state.polar;
            merge(newPolarState, message.payload);
            return {
              ...state,
              polar: newPolarState,
            };
          }

        case commands.NEW_CAPTURE_STATE:
          {
            let newCaptureState = state.capture;
            const overallStatus =
              "status" in message.payload
                ? { source: "capture", status: message.payload.status }
                : state.overallStatus;
            merge(newCaptureState, message.payload);
            return {
              ...state,
              overallStatus,
              capture: newCaptureState,
            };
          }

        case commands.NEW_MOUNT_STATE:
          {
            let newMountState = state.mount;
            merge(newMountState, message.payload);
            return {
              ...state,
              mount: newMountState,
            };
          }

        case commands.NEW_DOME_STATE:
          {
            let newDomeState = state.dome;
            const overallStatus =
              "status" in message.payload
                ? { source: "observatory", status: message.payload.status }
                : state.overallStatus;
            merge(newDomeState, message.payload);
            return {
              ...state,
              overallStatus,
              dome: newDomeState,
            };
          }

        case commands.NEW_CAP_STATE:
          {
            let newCapState = state.cap;
            const overallStatus =
              "status" in message.payload
                ? { source: "observatory", status: message.payload.status }
                : state.overallStatus;
            merge(newCapState, message.payload);
            return {
              ...state,
              overallStatus,
              cap: newCapState,
            };
          }

        case commands.NEW_INDI_STATE:
          {
            return {
              ...state,
              indi: message.payload,
            };
          }

        case commands.NEW_SCHEDULER_STATE:
          {
            let newSchedulerState = state.scheduler;
            const overallStatus =
              "status" in message.payload
                ? { source: "scheduler", status: message.payload.status }
                : state.overallStatus;
            merge(newSchedulerState, message.payload);
            return {
              ...state,
              overallStatus,
              scheduler: newSchedulerState,
            };
          }

        default:
          return state;
      }
    default:
      return state;
  }
};
