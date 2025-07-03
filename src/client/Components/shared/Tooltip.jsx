import React from "react";
import { cn } from "@utils/cn";

const Tooltip = ({ message, children, containerStyles, contentBoxStyles }) =>
{
	return (
		<div
			className={cn(
				"group relative flex max-w-max flex-col items-center justify-center mx-auto",
				containerStyles,
			)}
		>
			{children}
			<div className="absolute z-10 left-1/2 top-10 mx-auto min-w-max -translate-x-1/2 scale-0 transform rounded-lg px-3 py-2 text-xs font-medium transition-all duration-500 group-hover:scale-100">
				<div className="flex max-w-xs flex-col items-center shadow-lg">
					<div className="clip-bottom h-2 w-4 bg-black-primary" />
					<div
						className={cn(
							"rounded bg-black-primary p-2 text-center text-base text-white",
							contentBoxStyles,
						)}
					>
						{message}
					</div>
				</div>
			</div>
		</div>
	);
};

export default Tooltip;
