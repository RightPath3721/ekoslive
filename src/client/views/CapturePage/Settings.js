import React from "react";
import AutoCalibration from "./AutoCalibration";
import FilterSettings from "./FilterSettings";
import GeneralSettings from "./GeneralSettings";
import TabView from "../../Components/TabView";
import FocusLimit from "./FocusLimit";
import GuideLimit from "./GuideLimit";

const containerStyle = {
	width: "800px",
	display: "grid",
	placeItems: "center",
};

const headers = [
	{
		title: "General Settings",
		component: <GeneralSettings />,
		containerStyle,
	},
	{
		title: "Auto Calibration",
		component: <AutoCalibration />,
		containerStyle,
	},
	{
		title: "Filter Settings",
		component: <FilterSettings />,
		containerStyle,
	},
	{
		title: "Guide limit",
		component: <GuideLimit />,
		containerStyle,
	},
	{
		title: "Focus limit",
		component: <FocusLimit />,
		containerStyle,
	},
];

const Settings = ({ index = 0, onClose }) =>
{
	return <TabView onClose={onClose} defaultValue={index} tabs={headers} />;
};

export default Settings;
