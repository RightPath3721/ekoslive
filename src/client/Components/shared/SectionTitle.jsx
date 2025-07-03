import React from "react";
import { motion } from "framer-motion";
import { titleAnimationConfig } from "@constants/animation";
import { cn } from "@utils/cn";

const SectionTitle = ({ title, className }) =>
{
	return (
		<motion.h2
			{...titleAnimationConfig}
			className={cn(
				"text-white raleway text-2xl sm:text-4xl lg:text-5xl font-medium",
				className,
			)}
		>
			{title}
		</motion.h2>
	);
};

export default SectionTitle;
