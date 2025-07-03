import React from "react";
import { cn } from "@utils/cn";

const SubscriptionManagerButton = ({ onClick, label, text, className }) => (
	<button
		aria-label={label}
		onClick={onClick}
		className={cn(
			"primary-btn focus-button focus-within:text-white focus:text-white rounded-lg p-2",
			className,
		)}
		type="button"
	>
		{text}
	</button>
);

export default SubscriptionManagerButton;
