import * as React from "react";
import Tabs from "@mui/material/Tabs";
import Tab from "@mui/material/Tab";
import Box from "@mui/material/Box";
import { Palette } from "@common/shared/common/styles";
import CloseButton from "./CloseButton";

function TabPanel({ children, value, index, styles = {}, ...other })
{
	return (
		<div
			role="tabpanel"
			hidden={value !== index}
			id={`simple-tabpanel-${index}`}
			aria-labelledby={`simple-tab-${index}`}
			style={{ ...styles, display: value !== index ? "none" : "grid" }}
			{...other}
		>
			{value === index && children}
		</div>
	);
}

function a11yProps(index)
{
	return {
		id: `simple-tab-${index}`,
		"aria-controls": `simple-tabpanel-${index}`,
	};
}

export default function TabView({
	tabs,
	isScrollable = false,
	sx = {},
	defaultValue = 0,
	showXButton = true,
	onClose,
})
{
	const [value, setValue] = React.useState(defaultValue);

	const handleChange = React.useCallback(
		(_, newValue) =>
		{
			setValue(newValue);
		},
		[setValue],
	);

	return (
		<Box
			sx={{
				width: isScrollable ? tabs[0].containerStyle.width : "100%",
				...sx,
			}}
		>
			{showXButton && <CloseButton onChange={onClose} />}
			<Tabs
				value={value}
				onChange={handleChange}
				aria-label="basic tabs"
				variant={isScrollable ? "scrollable" : "standard"}
				scrollButtons={isScrollable}
				sx={{
					".MuiButtonBase-root": { color: Palette.white },
					".Mui-selected": { color: `${Palette.orange} !important` },
				}}
				TabIndicatorProps={{ sx: { backgroundColor: Palette.orange } }}
			>
				{tabs.map((oneTab, i) => (
					<Tab
						sx={{ textTransform: "none", color: Palette.white }}
						label={oneTab.title}
						{...a11yProps(i)}
						key={oneTab.title}
					/>
				))}
			</Tabs>
			{tabs.map((oneTab, i) => (
				<TabPanel
					key={oneTab.title}
					value={value}
					index={i}
					styles={oneTab.containerStyle}
				>
					{React.cloneElement(oneTab.component, { changeTab: handleChange })}
				</TabPanel>
			))}
		</Box>
	);
}
