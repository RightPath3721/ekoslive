import React from "react";
import { cn } from "@utils/cn";

const PageContainer = ({ children, classOverrides, id }) =>
{
	return (
		<main
			className={cn(
				"pt-[96px] sm:pt-[96px] md:pt-[88px] lg:pt-[96px] min-h-screen bg-black-secondary",
				classOverrides,
			)}
			id={id}
		>
			{children}
		</main>
	);
};

export default PageContainer;
