import React from "react";
import PopularIcon from "@client/icons/PopularIcon";
import SatelliteIcon from "@client/icons/SatelliteIcon";
import StuffIcon from "@client/icons/StuffIcon";
import TargetIcon from "@client/icons/TargetIcon";
import TopRatedIcon from "@client/icons/TopRatedIcon";

export const communityFeatures = [
	{
		icon: <PopularIcon />,
		title: "Popular",
		description:
			"Discover most popular images per region, target, mount, and sensor size.",
	},
	{
		icon: <TopRatedIcon />,
		title: "Top Rated",
		description: "Find trending top rated images voted by the community.",
	},
	{
		icon: <StuffIcon />,
		title: "Staff Picks",
		description:
			"Unique and memorable photos selected by our astrophotography staff.",
	},
	{
		icon: <TargetIcon />,
		title: "Targets",
		description:
			"Comprehensive and easy to use target search with advanced planning and filtering capabilities.",
	},
	{
		icon: <SatelliteIcon />,
		title: "Nearby",
		description:
			"Find who is imaging nearby. Engage with your local community!",
	},
];
