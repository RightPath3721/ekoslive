import React from "react";
import { motion } from "framer-motion";
import { useMediaQuery } from "react-responsive";
import CheckMark from "@client/icons/CheckMark";
import { listItemAnimationConfig } from "@constants/animation";
import { cn } from "@utils/cn";

const CheckBoxListItem = ({ index, text, className }) =>
{
	const isLargeScreen = useMediaQuery({ query: "(min-width: 1024px)" });
	const isMediumScreen = useMediaQuery({ query: "(min-width: 640px)" });

	return (
		<li
			className={cn(
				"flex-center grid grid-cols-[20px,1fr] sm:grid-cols-[28px,1fr] lg:grid-cols-[32px,1fr] gap-4 lg:gap-6",
				className,
			)}
		>
			<CheckMark
				width={isLargeScreen ? 32 : isMediumScreen ? 28 : 20}
				height={isLargeScreen ? 32 : isMediumScreen ? 28 : 20}
				color="#FF6600"
			/>
			<motion.p
				{...listItemAnimationConfig}
				custom={index}
				className="text-secondary max-w-[280px] xl:max-w-[400px]"
			>
				{text}
			</motion.p>
		</li>
	);
};

export default CheckBoxListItem;
