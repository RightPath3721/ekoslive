import React from "react";
import Box from "@mui/material/Box";
import wizardSteps from "./wizardSteps";

const WizardTabs = ({ active, next }) =>
{
	return wizardSteps.map((step, idx) =>
	{
		const Tab = step.content;
		return (
			<Box
				sx={{ placeItems: "center" }}
				display={idx === active ? "grid" : "none"}
				key={step.title}
			>
				<Tab next={next} step={step} activeStep={active} index={idx} />
			</Box>
		);
	});
};

export default WizardTabs;
