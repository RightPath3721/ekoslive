import React from "react";
import { motion } from "framer-motion";
import { featuresListItemAnimationConfig } from "../../../constants/animation";
import { cn } from "@utils/cn";

const CommunityFeaturesListItem = ({ feature, index, className }) =>
{
	return (
		<motion.li
			{...featuresListItemAnimationConfig}
			custom={index}
			className={cn("flex-center grid gap-5 sm:gap-10", className)}
		>
			{feature.icon}
			<div>
				<p className="font-raleway text-primary-orange text-base sm:text-xl leading-5 font-semibold text-left">
					{feature.title}
				</p>
				<p className="text-secondary text-white-primary mt-2">
					{feature.description}
				</p>
			</div>
		</motion.li>
	);
};

export default CommunityFeaturesListItem;
