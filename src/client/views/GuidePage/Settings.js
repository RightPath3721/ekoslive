import React from "react";
import Preset from "./Preset";
import AdvancedSettings from "./AdvancedSettings";
import CalibrationSettings from "./CalibrationSettings";
import TabView from "../../Components/TabView";

const containerStyle = {
	width: "650px",
	display: "grid",
	placeItems: "center",
};

const headers = [
	{
		title: "Preset",
		component: <Preset />,
		containerStyle,
	},
	{
		title: "Advanced Settings",
		component: <AdvancedSettings />,
		containerStyle,
	},
	{
		title: "Calibration Settings",
		component: <CalibrationSettings />,
		containerStyle,
	},
];

const GuideSettings = ({ onClose }) =>
{
	return <TabView onClose={onClose} tabs={headers} />;
};

export default GuideSettings;
