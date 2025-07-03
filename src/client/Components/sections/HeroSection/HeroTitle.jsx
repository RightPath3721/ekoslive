import React from "react";
import { motion } from "framer-motion";
import {
	subtitleAnimationConfig,
	titleAnimationConfig,
} from "../../../constants/animation";

const HeroTitle = () =>
{
	return (
		<div className="flex flex-col gap-3">
			<motion.h2
				{...titleAnimationConfig}
				className="flex flex-col font-raleway text-[1.5rem] sm:text-[2.125rem] lg:text-[3.25rem] leading-[2.25rem] sm:leading-[3.125rem] lg:leading-[3.875rem] font-normal capitalize"
			>
				<span>
					Your ultimate
					<span className="text-primary-orange"> cloud</span>
				</span>
				<span>astrophotography platform</span>
			</motion.h2>
			<motion.h3
				{...subtitleAnimationConfig}
				className="font-manrope text-sm sm:text-base font-normal text-white-70"
			>
				Capture, share, and explore the sky from anywhere and at any time.
			</motion.h3>
		</div>
	);
};

export default HeroTitle;
