import React from "react";
import ApertureIcon from "@client/icons/ApertureIcon";
import CalendarIcon from "@client/icons/CalendarIcon";
import OrbitIcon from "@client/icons/OrbitIcon";
import SetupIcon from "@client/icons/SetupIcon";

export const stellaFeatures = [
	{
		icon: <SetupIcon width={30} height={30} />,
		title: "Deep understanding of your data, equipment, and environment",
		description:
			"Stella makes it easy to understand your data, you can ask it any complex information about your images, targets, and equipment like never before.",
	},
	{
		icon: <ApertureIcon width={30} height={30} />,
		title: "Capturing frames",
		description:
			"You can ask Stella to capture frames, using any number of parameters, using natural language",
	},
	{
		icon: <CalendarIcon width={30} height={30} />,
		title: "Scheduling",
		description:
			"Stella can plan and schedule your targets from observatory startup to observatory shutdown",
	},
	{
		icon: <OrbitIcon width={30} height={30} />,
		title: "Solving Images",
		description: "Stella can recognize the objects in the image and solve it",
	},
];
