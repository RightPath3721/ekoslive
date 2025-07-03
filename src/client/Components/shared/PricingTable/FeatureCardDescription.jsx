import React from "react";
import { cn } from "@utils/cn";

const getContainerStyles = (align) =>
{
	switch (align)
	{
		case "left":
			return "md:w-full md:pl-[46.875vw] md:pr-5 md:pt-5 xl:min-h-[40vw] xl:flex xl:flex-col xl:justify-center";
		case "top":
		default:
			return "md:pt-40 lg:pt-28 md:px-14 xl:w-[85%]";
	}
};

const FeatureCardDescription = ({ title, description, align }) =>
{
	return (
		<div
			className={cn(
				"pt-10 pb-5 px-4 w-full border-solid border border-primary-orange rounded-3xl",
				getContainerStyles(align),
			)}
		>
			<h3
				className={cn(
					"text-primary-orange raleway text-2xl sm:text-4xl lg:text-5xl font-semibold text-center",
					align === "left" ? "lg:text-left" : "",
				)}
			>
				{title}
			</h3>
			<p
				className={cn(
					"mt-2 md:mt-5 text-center text-white-80 text-base sm:text-xl",
					align === "left" ? "text-left" : "",
				)}
			>
				{description}
			</p>
		</div>
	);
};

export default FeatureCardDescription;
