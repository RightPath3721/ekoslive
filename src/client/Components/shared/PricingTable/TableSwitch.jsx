import React from "react";
import Switch from "react-switch";
import { cn } from "@utils/cn";

const TableSwitch = ({ value, setValue }) =>
{
	return (
		<div className="flex-center gap-3">
			<p
				className={cn(
					"text-white-primary font-semibold text-lg",
					value ? "opacity-60" : "text-primary-orange",
				)}
			>
				Monthly
			</p>
			<Switch onChange={setValue} checked={value} onColor="#FF6600" />
			<p
				className={cn(
					"text-white-primary font-semibold text-lg",
					value ? "text-primary-orange" : "opacity-60",
				)}
			>
				Yearly
				<sup className="text-white-primary">15% off</sup>
			</p>
		</div>
	);
};

export default TableSwitch;
