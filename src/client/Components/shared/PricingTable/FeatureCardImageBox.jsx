import React from "react";
import { cn } from "@utils/cn";

const getContainerStyles = (align) =>
{
	switch (align)
	{
		case "left":
			return "md:left-0 md:absolute top-1/2 md:-translate-y-1/2";

		case "top":
		default:
			return "md:translate-y-40 lg:translate-y-1/4";
	}
};

const getImageStyle = (align) =>
{
	switch (align)
	{
		case "left":
			return "md:w-[45vw] md:h-[45vw]";

		case "top":
		default:
			return "lg:w-[80vw] xl:w-[65vw] lg:h-[30vw]";
	}
};

const Badge = ({ position, align }) => (
	<span
		className={cn(
			"absolute rounded-full grid place-items-center left-1/2 -translate-y-[70%] font-bold text-xl xl:text-3xl -translate-x-1/2 w-10 xl:w-16 h-10 xl:h-16 bg-white text-black-primary",
			align == "left"
				? "md:top-[10%] md:right-0 md:left-auto md:translate-x-1/2 md:translate-y-0 lg:top-1/4"
				: "",
		)}
	>
		{String(position).padStart(2, "0")}
	</span>
);

const FeatureCardImageBox = ({
	position,
	containerOverrideStyles,
	align,
	...rest
}) =>
{
	return (
		<div
			className={cn(
				"relative translate-y-10 border-[0.25rem] border-solid border-primary-orange rounded-2xl max-w-max max-h-max",
				getContainerStyles(align),
				containerOverrideStyles,
			)}
		>
			<img
				className={cn(
					"rounded-2xl w-[62.5vw] h-[43.75vw]",
					getImageStyle(align),
				)}
				{...rest}
			/>
			<Badge position={position} align={align} />
		</div>
	);
};

export default FeatureCardImageBox;
