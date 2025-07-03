import React from "react";
import { cn } from "@utils/cn";

const FormField = ({
	type,
	placeholder,
	name,
	register,
	error,
	valueAsNumber = false,
	className,
	required = false,
	label,
	...props
}) => (
	<label className="text-white text-sm font-medium flex flex-col gap-2">
		{label}
		<input
			className={cn("input", className)}
			type={type}
			placeholder={placeholder}
			required={required}
			{...props}
			{...register(name, { valueAsNumber })}
		/>
		{error && <span className="text-red-500">{error.message}</span>}
	</label>
);
export default FormField;
