import { get, union } from "lodash";
import
{
  WEBSOCKET_CLOSED,
  WEBSOCKET_MESSAGE,
  WEBSOCKET_OPEN,
  WEBSOCKET_CONNECTING,
} from "redux-websocket";
import commands from "../../commands";
import { ekosConstants, targetConstants } from "../constants";
import { LevelsMap } from "../../common/common";
import { ImageModule } from "../../common/enums";
import storage from "../../../config/storage";

/**
 * It is a media server, controls the images, metadata, hips cache, histogram, met and much more
 * 
 **********Sample in JSON form**********
 * {
  "wsMediaURL": "",
  "wsMediaUrl": "ws://10.0.2.2:3000/media/user?username=naheedsa&token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJuYW1lIjoibmFoZWVkc2EiLCJpYXQiOjE3MTA5NDIxOTEsImV4cCI6MTcxMTAyODU5MX0.2YJra6hznAwkxoEdfZsnVNMh-6Iz9KF2NSyhawc7Sao&version=undefined&type=2&client_type=2&remoteToken=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJuYW1lIjoibmFoZWVkc2EiLCJpYXQiOjE3MTA5NDIxOTEsImV4cCI6MTcxMTAyODU5MX0.JDtsHOf5nk1f_YmaLRCb45jwURk11jAY5FFBGYQzu80",
  "loading": false,
  "token": "",
  "darkLibraryData": 0,
  "url": "ws://10.0.2.2:3000/media/user?username=naheedsa&token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJuYW1lIjoibmFoZWVkc2EiLCJpYXQiOjE3MTA5NDIxOTEsImV4cCI6MTcxMTAyODU5MX0.2YJra6hznAwkxoEdfZsnVNMh-6Iz9KF2NSyhawc7Sao&version=undefined&type=2&client_type=2&remoteToken=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJuYW1lIjoibmFoZWVkc2EiLCJpYXQiOjE3MTA5NDIxOTEsImV4cCI6MTcxMTAyODU5MX0.JDtsHOf5nk1f_YmaLRCb45jwURk11jAY5FFBGYQzu80",
  "imagesCount": 0,
  "darkLibCache": [],
  "framingObjects": [
    {
      "metadata": {
        "preview": "/hips/hips_9bff936cc428b54164a331c1fdfbc476",
        "resolution": "512x512",
        "fov_w": "1.84112",
        "zoom": 5000,
        "fov_h": "1.83797",
        "uuid": "hips_9bff936cc428b54164a331c1fdfbc476",
        "name": "M 33",
        "ext": "jpg",
        "bin": "1x1"
      }
    }
  ],
  "hipsCache": [
    "M 31",
    "M 83",
    "NGC 5128",
    "NGC 300",
    "M 101",
    "NGC 55",
    "NGC 2403",
    "M 110",
    "M 94",
    "M 106",
    "M 32",
    "NGC 1316",
    "M 82",
    "M 64",
    "M 63",
    "M 51",
    "NGC 3621",
    "M 104",
    "M 77",
    "M 87",
    "M 65",
    "NGC 247",
    "M 66",
    "NGC 2903",
    "NGC 1399",
    "NGC 5102",
    "NGC 4631",
    "NGC 7793",
    "NGC 1269",
    "NGC 3521",
    "NGC 2997",
    "M 86",
    "NGC 1097",
    "NGC 253",
    "M 81",
    "M 33"
  ],
  "liveStackingImageIndex": 0,
  "captureMetadata": {
    "preview": "/images/preview/351240f436054df0b89f78805b03a572",
    "uuid": "351240f436054df0b89f78805b03a572",
    "size": "2.5 MiB",
    "shadows": 0,
    "midtones": 0.00022884691134095192,
    "mean": 4.506812286376953,
    "resolution": "1280x1024",
    "median": 4,
    "pixel_size": "5.2000",
    "max": 44,
    "gain": "0",
    "min": 0,
    "focal_length": "500",
    "ext": "jpg",
    "hfr": -1,
    "stddev": 2.8773193521536244,
    "bpp": "16",
    "exposure": "1",
    "highlights": 1,
    "bin": "1x1",
    "hasWCS": false,
    "histogram": "/images/histogram/351240f436054df0b89f78805b03a572",
    "aperture": "50",
    "channels": 1
  },
  "connecting": false,
  "connected": true,
  "data": 0,
  "images": null,
  "guideData": 0,
  "metadata": {},
  "liveStacking": [],
  "darkLibraryMetaData": {},
  "captureData": 0,
  "focusMetadata": {},
  "rawImage": null,
  "alignMetadata": {},
  "currentFramingTarget": "M 33",
  "alignData": 0,
  "guideMetadata": {},
  "_persist": {
    "rehydrated": true,
    "version": -1
  },
  "focusData": 0
}
 */
const initialState = {
  focusData: 0,
  focusMetadata: {},
  guideData: 0,
  guideMetadata: {},
  alignData: 0,
  alignMetadata: {},
  darkLibraryData: 0,
  darkLibraryMetaData: {},
  captureData: 0,
  captureMetadata: {},
  data: 0,
  metadata: {},
  images: [],
  connected: false,
  connecting: false,
  liveStacking: [],
  liveStackingImageIndex: 0,
  hipsCache: [],
  currentFramingTarget: "",
  framingObjects: [],
  darkLibCache: [],
  imagesCount: 0,
  url: "",
  token: "",
  loading: false,
  rawImage: null,
  wsMediaUrl: "",
};

export const wsMedia = (state = initialState, action) =>
{
  switch (action.type)
  {
    case targetConstants.SET_HIPS_CACHE:
      return { ...state, hipsCache: action.payload };

    case ekosConstants.LIVESTACK_CLEAR_DATA:
      return { ...state, liveStacking: [], liveStackingImageIndex: 0 };

    case ekosConstants.CLEAR_RAW_DATA:
      return { ...state, rawImage: null };

    case ekosConstants.SET_IMAGE_LOADING:
      return { ...state, loading: action.payload };

    case ekosConstants.CLEAR_IMAGE_DATA:
      switch (action.payload)
      {
        case ImageModule.CAPTURE:
          return { ...state, captureData: null };
        case ImageModule.FOCUS:
          return { ...state, focusData: null };
        case ImageModule.GUIDE:
          return { ...state, guideData: null };
        case ImageModule.ALIGN:
          return { ...state, alignData: null };
        case ImageModule.DARK:
          return { ...state, darkLibraryData: null };
        default:
          return state;
      }

    case targetConstants.CLEAR_FRAMING_OBJECTS:
      return { ...state, framingObjects: [] };

    case targetConstants.SET_FRAMING_TARGET:
      return { ...state, currentFramingTarget: action.payload };

    case WEBSOCKET_CONNECTING:
      if (action.payload.event.target.url.includes("/media/user") === false)
        return state;
      return { ...state, connecting: true };

    case WEBSOCKET_OPEN: {
      const messageURL = get(action, "payload.event.target.url", "");
      if (messageURL.includes("/media/user") === false) return state;

      return {
        ...state,
        connected: true,
        url: messageURL,
        loading: false,
        wsMediaUrl: messageURL,
      };
    }

    case WEBSOCKET_CLOSED: {
      const messageURL = get(action, "payload.event.target.url", "");
      if (messageURL.includes("/media/user") === false) return state;

      // If we get another token for prior connection, let us not disconnect
      if (messageURL !== state.url) return state;

      return { ...state, connected: false, url: "", wsMediaUrl: "" };
    }

    case WEBSOCKET_MESSAGE:
      if (
        get(action, "payload.event.target.url", "").includes("/media/user") ===
        false
      )
        return state;
      else if (action.payload.data instanceof Blob)
        return { ...state, data: action.payload.data };
      else
      {
        let payload = get(action, "payload.data", null);
        if (typeof payload === "string" && payload.substr(0, 1) === "{")
        {
          // JSON
          const data = JSON.parse(action.payload.data);
          if (data.type === commands.GET_IMAGES)
            return {
              ...state,
              images: data.payload,
              imagesCount: data.payload.length,
            };
          else if (data.type === commands.NEW_IMAGE_METADATA)
          {
            const metadata = data.payload;
            let module = "/images";

            if (metadata.preview.startsWith(module))
            {
              if (metadata.uuid === "+F")
              {
                return {
                  ...state,
                  focusMetadata: data.payload,
                };
              }
              else if (metadata.uuid === "+A")
              {
                return {
                  ...state,
                  alignMetadata: data.payload,
                };
              }
              else if (metadata.uuid === "+G")
              {
                return {
                  ...state,
                  guideMetadata: data.payload,
                };
              }
              else if (metadata.uuid === "+D")
              {
                return {
                  ...state,
                  darkLibraryMetaData: data.payload,
                };
              }
              else
              {
                return {
                  ...state,
                  metadata: data.payload,
                  captureMetadata: data.payload,
                  loading: true,
                };
              }
            }
            else if (metadata.preview.startsWith("/hips"))
            {
              // Store the image in long term storage
              let name = metadata["name"];

              // In case a framing target is set and framing objects are pending (less than 3 items)
              // then store them in the framing objects array
              // otherwise treat it as a normal HIPS image.
              if (
                state.currentFramingTarget === name &&
                state.framingObjects.length < LevelsMap.length
              )
              {
                return {
                  ...state,
                  framingObjects: [
                    ...state.framingObjects,
                    {
                      metadata: metadata,
                    },
                  ],
                };
              }
              else
              {
                const newHIPSCache = union(state.hipsCache, [name]);
                // Now update cached hips so that we know we have this image stored.
                // Next time up start, we read the values stored here, so that if an image
                // is required, we load from storage instead of asking KStars to generate it for us.
                storage.setItem("hips:cache", JSON.stringify(newHIPSCache));
                storage.mergeItem(
                  "hips:" + name,
                  JSON.stringify({
                    metadata: metadata,
                  }),
                );


                // Also save the name in the redux store
                return {
                  ...state,
                  hipsCache: newHIPSCache,
                };
              }
            }
            // If uuid = livestacking then it's a livestacking metadata
            else if (
              "raw" in metadata &&
              metadata.raw.includes("livestacking/")
            )
            {
              let liveStacking = state.liveStacking;
              const id =
                state.liveStacking.length === 0
                  ? 1
                  : state.liveStacking[state.liveStacking.length - 1].metadata
                    .id + 1;
              // Limit livestacking images to 10 max
              if (state.liveStacking.length >= 10) liveStacking.shift();

              return {
                ...state,
                captureMetadata: data.payload,
                liveStacking: [
                  ...liveStacking,
                  { metadata: { ...data.payload, id: id } },
                ],
                liveStackingImageIndex: state.liveStacking.length,
              };
            }
          }
          else if (
            data.type === commands.UPDATE_METADATA &&
            state.images !== undefined
          )
          {
            return {
              ...state,
              images: state.images.map((image) =>
              {
                if (image.metadata.uuid === data.payload.uuid)
                  image.metadata = data.payload;
                return image;
              }),
            };
          }
          else if (data.type === commands.NEW_METADATA)
          {
            let metadata = data.payload;
            if (metadata.uuid.startsWith("hips"))
            {
              // Store the image in long term storage
              const name = metadata["name"];

              // In case a framing target is set and framing objects are pending (less than 3 items)
              // then store them in the framing objects array
              // otherwise treat it as a normal HIPS image.
              if (
                state.currentFramingTarget === name &&
                state.framingObjects.length < LevelsMap.length
              )
              {
                return {
                  ...state,
                  framingObjects: [
                    ...state.framingObjects,
                    {
                      metadata: metadata,
                    },
                  ],
                };
              }
              else
              {
                const newHIPSCache = union(state.hipsCache, [name]);
                // Now update cached hips so that we know we have this image stored.
                // Next time up start, we read the values stored here, so that if an image
                // is required, we load from storage instead of asking KStars to generate it for us.
                storage.setItem("hips:cache", JSON.stringify(newHIPSCache));
                storage.mergeItem(
                  "hips:" + name,
                  JSON.stringify({
                    metadata: metadata,
                  }),
                );


                // Also save the name in the redux store
                return {
                  ...state,
                  hipsCache: newHIPSCache,
                };
              }
            }
            else if (metadata.histogram)
            {
              return {
                ...state,
                captureMetadata: data.payload,
                metadata: data.payload,
                loading: false,
              };
            }
            return { ...state, metadata: data.payload, loading: false };
          }
        }
      }
      return state;

    case ekosConstants.LIVESTACK_UPDATE_IMAGE:
      const index = action.payload;
      return {
        ...state,
        liveStackingImageIndex: index,
        captureMetadata: state.liveStacking[index].metadata,
      };
    default:
      return state;
  }
};
