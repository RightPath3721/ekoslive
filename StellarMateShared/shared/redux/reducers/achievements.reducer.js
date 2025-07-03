import { isArray, isEmpty, isEqual } from "lodash";
import achievementsInfo from "../../common/achievements";
import badges from "../../common/badges";
import { achievementsConstants } from "../constants";

/**
 *Initial State: It is used to track the record of Achieevements.
  We have many achievements listed in Settings --> Achievements. You can also check: https://stellarmate.com/help/Achievements.html
  Each Achievement has it's own status. It demonstrates the followings:
  type: Type of Achievement i.e ACHIEVE_GUIDE_RMS 
  title: Achievement's title i.e Bullseye!
  description: Gives more details about the achievement
  points: 10 i.e Each achievement has it's points. It will let the users to compete 
  key: identification of an achievement: guide_rms

  **********Sample in JSON form**********
  {
  "recentAchievementDescription": "",
  "recentActivity": {
    "points": 0,
    "title": ""
  },
  "statistics": {
    "total_images_captured": 0,
    "captured_messiers": [],
    "total_messiers_captured": 0
  },
  "gallery_image": {
    "status": false
  },
  "guide_rms": {
    "status": false
  },
  "paa_arcsec": {
    "status": false
  },
  "capture_legend": {
    "status": false
  },
  "live_stacking": {
    "status": false
  },
  "mount_goto": {
    "status": false
  },
  "capture_messier": {
    "status": false
  },
  "video_recording": {
    "status": false
  },
  "import_mosaic": {
    "status": false
  },
  "all_messiers": {
    "status": false
  },
  "create_darks": {
    "status": false
  },
  "weather_check": {
    "status": false
  },
  "filtered_image": {
    "status": false
  },
  "capture_master": {
    "status": false
  },
  "ten_sequences": {
    "status": false
  },
  "create_defects": {
    "status": false
  },
  "capture_preview": {
    "status": false
  }
}
 */

const initialState = {
	// Achievements are considered completed when:

	// The preview is captured
	capture_preview: { status: false },

	// Capture ten sequences
	ten_sequences: { status: false },

	// Capture & Solve first, Captue a preview and Go to a specific object using gesture. Tap and hold in the Mobile App to perform GOTO
	mount_goto: { status: false },

	// Stream for atleast 2 minutes i.e Start Video Recording
	video_recording: { status: false },

	// Check the weather from Weather Bar in Setup tab and Zoom in for atleast 8x
	weather_check: { status: false },

	// Perform atleast 5 images
	live_stacking: { status: false },

	// Create Darks of total 50 images from the Dark library
	create_darks: { status: false },

	// Perform Cold and Hot pixels > 80
	create_defects: { status: false },

	// Import Mosaic using a CSV file, that can be created and copied from https://telescopius.com/
	import_mosaic: { status: false },

	// A messier is captured
	capture_messier: { status: false },

	// Triggers when all messiers are captured
	all_messiers: { status: false },

	// 500 of total images are captured
	capture_master: { status: false },

	// 1000 of total images are captured
	capture_legend: { status: false },

	// Complete PAA with error < 30 arcsecs
	paa_arcsec: { status: false },

	// Ekoslive tour guide status
	explorer: { status: false },

	// Achieve total RMS guiding below 0.5
	guide_rms: { status: false },
	filtered_image: { status: false },
	gallery_image: { status: false },

	// Has the status of Images, messiers captured
	statistics: {
		total_messiers_captured: 0,
		total_images_captured: 0,
		captured_messiers: [],
	},

	// When the recent Achievement is completed, it has the title and points of that Achievement
	recentActivity: { title: "", points: 0 },

	// Description of recent Achievement
	recentAchievementDescription: "",
};

export const achievements = (state = initialState, action) =>
{
	switch (action.type) {
		case achievementsConstants.SET_ACHIEVEMENT:
			const { type, title, points, badge } = action.payload;

			// Fetch number from the string to match the Messier key
			const number = title.match(/\d+/);
			let newState = state;
			achievementsInfo.map((oneAchievement) =>
			{
				let key = oneAchievement.key;
				if (type === oneAchievement.type)
				{
					if (type === "ALL_MESSIER_CAPTURED") key = `m${number[0]}`;
					newState = {
						...state,
						[key]: action.payload,
						recentActivity: {
							title: title,
							points: points,
							badge: badges[key],
						},
					};
				}
			});
			return newState;

		case achievementsConstants.SET_ACHIEVEMENTS:
		{
			let achievementObject = {};
			if (isArray(action.payload) && !isEmpty(action.payload))
			{
				achievementObject = Object.fromEntries(
					action.payload.map((item) => [item.key, item]),
				);
			}
			// Only merge if there are actual differences in the achievement items
			const hasChanges = Object.entries(achievementObject).some(
				([key, value]) => !isEqual(state[key], value),
			);
			if (hasChanges) return { ...state, ...achievementObject };
			return state;
		}

		case achievementsConstants.RESET_ACHIEVEMENTS:
			return initialState;

		case achievementsConstants.TOTAL_IMAGES_CAPTURED:
			return {
				...state,
				statistics: {
					...state.statistics,
					total_images_captured: action.payload,
				},
			};

		case achievementsConstants.TOTAL_MESSIER_CAPTURED:
			return {
				...state,
				statistics: {
					...state.statistics,
					total_messiers_captured: action.payload,
				},
			};

		default:
			return state;
	}
};
