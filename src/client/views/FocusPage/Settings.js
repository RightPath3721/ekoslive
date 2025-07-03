import React from "react";
import AdvancedSettings from "./AdvancedSettings";
import Process from "./Process";
import Mechanics from "./Mechanics";
import TabView from "../../Components/TabView";
import DonutBuster from "./DonutBuster";

const containerStyle = {
	width: "700px",
	display: "grid",
	placeItems: "center",
};

const headers = [
	{
		title: "Advanced Settings",
		component: <AdvancedSettings />,
		containerStyle,
	},
	{
		title: "Process",
		component: <Process />,
		containerStyle,
	},
	{
		title: "Mechanics",
		component: <Mechanics />,
		containerStyle,
	},
	{
		title: "Donut Buster",
		component: <DonutBuster />,
		containerStyle,
	},
];

const Settings = ({ onClose }) =>
{
	return <TabView onClose={onClose} sx={{ width: "50rem" }} tabs={headers} />;
};

export default Settings;
