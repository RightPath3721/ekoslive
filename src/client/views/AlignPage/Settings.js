import React from "react";
import Preset from "./Preset";
import RotatorControl from "./RotatorControl";
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
		title: "Rotator control",
		component: <RotatorControl />,
		containerStyle,
	},
];

const AlignSettings = ({ onClose }) =>
{
	return <TabView onClose={onClose} tabs={headers} />;
};

export default AlignSettings;
