import React from "react";
import AccessIcon from "@client/icons/AccessIcon";
import Cloud from "@client/icons/Cloud";
import Community from "@client/icons/Community";
import Lease from "@client/icons/Lease";

export const featuresList = [
	{
		title: "24/7 observatory access",
		icon: <AccessIcon />,
		description:
			"Unlimited access to your equipment at any time. 99.9% reliable uptime with our global servers.",
		comingSoon: false,
	},
	{
		title: "Cloud Storage",
		icon: <Cloud />,
		description: [
			"Unlimited access to your equipment at any time.",
			"99.9% reliable uptime with our global servers.",
		],
		comingSoon: false,
	},
	{
		title: "Observatory lease",
		icon: <Lease />,
		description: [
			"Earn income by leasing your observatory.",
			"Flexible plans suited for every need.",
		],
		comingSoon: true,
	},
	{
		title: "Community engagement",
		icon: <Community />,
		description: [
			"Discover nearby astrophotographers and engage with them.",
			"Host virtual star parties. Broadcast live sessions to Youtube and 3rd party video sharing services.",
			"Follow, star, and tip your favorite astrophotographers and content creators.",
		],
		comingSoon: true,
	},
];
