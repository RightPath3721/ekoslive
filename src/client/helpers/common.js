import React from "react";
import EkosIcon from "@client/icons/EkosIcon";
import SettingsIcon from "@client/icons/SettingsIcon";
import SetupIcon from "@client/icons/SetupIcon";
import TargetsIcon from "@client/icons/ManufacturerIcon";
import ViewIcon from "@client/icons/ViewIcon";
import DashboardIcon from "@mui/icons-material/Dashboard";
import PsychologyIcon from "@mui/icons-material/Psychology";
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';

export const ListItemType = {
	profileManager: 0,
	portSelector: 1,
	opticalTrain: 2,
	scopelens: 3,
};

export const ListItems = [
	{
		icon: <SetupIcon width={16} height={16} />,
		title: "Setup",
		component: React.lazy(
			() => import("../views/Setup/ProfileManager/Profile"),
		),
	},
	{
		icon: <EkosIcon width={16} height={16} />,
		title: "Ekos",
		component: React.lazy(() => import("../views/EkosPage/Ekos")),
	},
	{
		icon: <TargetsIcon width={16} height={16} />,
		title: "Targets",
		component: React.lazy(() => import("../views/Targets/Targets")),
	},
	{
		icon: <AutoAwesomeIcon sx={{ color: "#CECECE", fontSize: 16 }} />,
		title: "Sky",
		component: React.lazy(() => import("../views/SkyMapPage/SkyMap")),
	},
	{
		icon: <PsychologyIcon sx={{ color: "#CECECE", fontSize: 16 }} />,
		title: "Stella",
		component: React.lazy(() => import("../views/StellaPage/Stella")),
	},
	{
		icon: <ViewIcon width={16} height={16} />,
		title: "View",
		component: React.lazy(() => import("../views/ViewPage/View")),
	},
	{
		icon: <SettingsIcon width={16} height={16} />,
		title: "Settings",
		component: React.lazy(() => import("../views/SettingsPage/Settings")),
	},
	{
		icon: <DashboardIcon sx={{ color: "#CECECE", fontSize: 16 }} />,
		title: "Admin",
		component: React.lazy(() => import("../views/AdminPage")),
		isAdminRoute: true,
	},
];

export const ListCaptureType = {
	capture: 0,
	darkLibrary: 1,
	opticalTrain: 2,
	settings: 3,
};

export const ListAlignType = {
	align: 0,
	paa: 1,
	opticalTrain: 2,
	settings: 3,
};

export const ListGuideType = {
	guide: 0,
	opticalTrain: 1,
	settings: 2,
};

export const ListMountType = {
	mount: 0,
	opticalTrain: 1,
};

export const ListSchedulerType = {
	scheduler: 0,
	mosaic: 1,
	settings: 2,
};

export const ListFocusType = {
	focus: 0,
	opticalTrain: 1,
	settings: 2,
};

export const ScopeLensType = {
	vendor: 0,
	model: 1,
	type: 2,
	aperture: 3,
	focalLength: 4,
	focalRatio: 5,
};

export const LOCATION_ACCURACY = {
	COARSE: "COARSE",
	FINE: "FINE",
};

export const generateUUID = () =>
{
	return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c)
	{
		var r = (Math.random() * 16) | 0,
			v = c == "x" ? r : (r & 0x3) | 0x8;
		return v.toString(16);
	});
};
