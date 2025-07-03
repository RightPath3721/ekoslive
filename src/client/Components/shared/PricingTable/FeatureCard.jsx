import React from "react";
import { cn } from "@utils/cn";
import FeatureCardImageBox from "./FeatureCardImageBox";
import FeatureCardDescription from "./FeatureCardDescription";

const getContainerStyles = (align) =>
{
	switch (align)
	{
		case "left":
			return "flex-col md:flex-row xl:min-h-[45vw] lg:mt-8";
		case "top":
		default:
			return "flex-col";
	}
};

const FeatureCard = ({ feature, position }) =>
{
	return (
		<li
			className={cn(
				"relative flex-center gap-3 md:gap-8 w-full rounded-3xl p-5",
				getContainerStyles(feature.align),
			)}
		>
			<FeatureCardImageBox
				position={position}
				align={feature.align}
				{...feature.img}
			/>
			<FeatureCardDescription
				description={feature.description}
				title={feature.title}
				align={feature.align}
			/>
		</li>
	);
};

export default FeatureCard;
