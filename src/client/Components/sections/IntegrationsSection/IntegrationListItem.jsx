import React from "react";
import { motion } from "framer-motion";
import { featuresListItemAnimationConfig } from "../../../constants/animation";

const IntegrationListItem = ({ integration, index }) =>
{
	return (
		<motion.li
			{...featuresListItemAnimationConfig}
			whileHover={{ y: -10 }}
			custom={index}
			className="group"
		>
			<a
				className="grid grid-rows-[1fr,auto] justify-center items-center gap-4 lg:gap-8 py-8 px-12 lg:py-10 lg:px-16 bg-white-10 rounded-2xl h-full w-full"
				href={integration.link}
				target="_blank"
				rel="noopener noreferrer"
			>
				<img
					src={integration.icon}
					alt={integration.description}
					{...integration.iconSize}
					loading="lazy"
					className="filter grayscale justify-self-center"
				/>
				<p className="font-raleway text-[#FFFCFA] text-lg lg:text-2xl leading-6 text-center group-hover:text-primary-orange">
					{integration.title}
				</p>
			</a>
		</motion.li>
	);
};

export default IntegrationListItem;
