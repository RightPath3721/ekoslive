import React from "react";
import Tabs from "@mui/material/Tabs";
import Tab from "@mui/material/Tab";
import Box from "@mui/material/Box";
import { useTheme } from "@mui/material/styles";

const TabsView = ({
	tabValue,
	handleChange,
	tabs,
	textColor = "primary",
	indicatorColor = "primary",
	isScrollable = false,
	icon = null,
	...props
}) =>
{
	const { palette } = useTheme();

	return (
		<Tabs
			value={tabValue}
			onChange={handleChange}
			textColor={textColor}
			indicatorColor={indicatorColor}
			variant={isScrollable ? "scrollable" : "standard"}
			scrollButtons={isScrollable ? "auto" : false}
			sx={{
				"& .MuiTabs-indicator": {
					backgroundColor: "transparent",
				},
				"& .MuiTab-root": {
					color: palette.white[900], // Default color for tabs
				},
				"& .MuiTab-root.Mui-selected": {
					color: palette.white[900], // Color for the selected tab
					background: palette.primary.main,
					borderRadius: "25px",
				},
				"& .MuiTabs-scrollButtons": {
					color: palette.white[900],
				},
			}}
			{...props}
		>
			{tabs.map((tab) =>
			{
				return (
					<Tab
						key={tab.value}
						icon={
							tab.actions ? (
								tab.actions
							) : icon ? (
								icon(tab.value)
							) : undefined
						}
						iconPosition="end"
						value={tab.value}
						label={tab.label}
					/>
				);
			})}
		</Tabs>
	);
};

export default TabsView;
