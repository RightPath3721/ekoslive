import React, { cloneElement } from "react";
import { motion } from "framer-motion";
import { useMediaQuery } from "react-responsive";
import { featuresListItemAnimationConfig } from "../../../constants/animation";

const FeaturesListItem = ({ feature, index }) =>
{
	const isLargeScreen = useMediaQuery({ query: "(min-width: 1024px)" });

	return (
		<motion.li
			{...featuresListItemAnimationConfig}
			whileHover={{ y: -15 }}
			custom={index}
			className="group bg-black-primary/[77] flex flex-col h-[318px] lg:h-auto rounded-2xl backdrop-blur-md py-6 lg:py-8 px-5"
		>
			<span className="flex-center text-white w-12 h-12 lg:w-16 lg:h-16 rounded-full bg-[#FFEEE32B] group-hover:text-primary-orange transition-colors">
				{cloneElement(feature.icon, {
					width: isLargeScreen ? 38 : 24,
					height: isLargeScreen ? 38 : 24,
				})}
			</span>
			<p className="font-raleway text-base lg:text-xl text-left font-semibold capitalize group-hover:text-primary-orange mt-[0.875rem] lg:mt-[1.375rem] transition-colors">
				{feature.title}
			</p>
			{Array.isArray(feature.description) ? (
				<ul className="mt-2 lg:mt-[0.875rem]">
					{feature.description.map((item, idx) => (
						<li
							className="font-manrope text-sm lg:text-base font-normal text-left text-[#FFFCFA]/70 max-w-[237px]"
							key={idx}
						>{`${idx + 1}. ${item}`}</li>
					))}
				</ul>
			) : (
				<p className="mt-2 lg:mt-[0.875rem] font-manrope text-sm lg:text-base font-normal text-left text-[#FFFCFA]/70 max-w-[237px]">
					{feature.description}
				</p>
			)}
			{feature.comingSoon ? (
				<p className="mt-auto text-primary-orange text-xs">
					(Available Q4 2025)
				</p>
			) : null}
		</motion.li>
	);
};

export default FeaturesListItem;
