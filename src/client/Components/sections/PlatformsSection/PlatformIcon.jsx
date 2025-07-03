import React from "react";
import { motion } from "framer-motion";
import { platformAnimationConfig } from "../../../constants/animation";
import { cn } from "@utils/cn";

const PlatformIcon = ({ icon, position, className }) =>
{
	return (
		<motion.span
			{...platformAnimationConfig}
			custom={position}
			className={cn("os-icon absolute", className)}
		>
			{icon}
		</motion.span>
	);
};

export default PlatformIcon;
