import React from "react";
import Box from "@mui/material/Box";
import TabView from "../../Components/TabView";
import StellaTab from "./StellaTab";
import UsersTab from "./UsersTab";
import EkosTab from "./EkosTab";
import AdminContextProvider from "./AdminTabContext";
import SubscribersChart from "./SubscribersChart";

const tabs = [
	{
		title: "Stella feedback",
		component: <StellaTab />,
		containerStyle: {
			padding: "10px",
		},
	},
	{
		title: "Users",
		component: <UsersTab />,
		containerStyle: {
			padding: "10px",
		},
	},
	{
		title: "Ekos",
		component: <EkosTab />,
		containerStyle: {
			padding: "10px",
		},
	},
];

const AdminPanel = ({ active }) =>
{
	if (!active) return null;

	return (
		<AdminContextProvider>
			<Box sx={{ position: "relative", width: "calc(100vw - 200px)" }}>
				<TabView tabs={tabs} />

				<SubscribersChart />
			</Box>
		</AdminContextProvider>
	);
};

export default AdminPanel;
