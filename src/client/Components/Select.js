import { Box } from "@mui/material";
import React from "react";

import Select from "react-select";

export const SelectInput = ({
	options,
	width = "300px",
	isClearable = false,
	disabled = false,
	onChange,
	type = "",
	value,
}) =>
{
	const customStyles = {
		control: (base) => ({
			...base,
			background: "#1d1d1d",
			borderColor: "#1d1d1d",
			color: "white",
		}),
		option: (provided) => ({
			...provided,
			backgroundColor: "#1d1d1d",
			color: "white",
		}),
		container: (base) => ({
			...base,
			color: "white",
			background: "#1d1d1d",
		}),
		menuList: (base) => ({
			...base,
			// kill the white space on first and last option
			padding: 0,
			background: "#1d1d1d",
			color: "white",
		}),
		singleValue: (provided) => ({
			...provided,
			color: "white",
		}),
		input: (base) => ({
			...base,
			color: "white",
		}),
	};
	return (
		<Box sx={{ width: width }}>
			<Select
				className="basic-single"
				classNamePrefix="select"
				defaultValue={{ label: value, value: value }}
				value={{ label: value, value: value }}
				isDisabled={disabled}
				isLoading={false}
				isClearable={isClearable}
				noOptionsMessage={() => null}
				isRtl={false}
				isSearchable={true}
				name="color"
				onChange={(item) => onChange(item, type)}
				styles={customStyles}
				options={options}
				components={{
					DropdownIndicator: () => null,
					IndicatorSeparator: () => null,
				}}
			/>
		</Box>
	);
};
