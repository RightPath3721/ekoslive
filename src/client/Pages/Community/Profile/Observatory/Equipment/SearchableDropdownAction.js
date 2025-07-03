import React, { useState } from "react";
import TextField from "@mui/material/TextField";
import Autocomplete, { createFilterOptions } from "@mui/material/Autocomplete";
import { Palette } from "@common/shared/common/styles";
import ManufacturerModal from "@components/shared/Equipment/ManufacturerModal";

const filter = createFilterOptions();

/**
 *
 * @param root0
 * @param root0.id
 * @param root0.width
 * @param root0.label
 * @param root0.name
 * @param root0.options
 * @param root0.defaultValue
 * @param root0.changeValue
 */
export default function SearchableDropdownAction({
	id,
	width,
	label,
	name,
	options,
	defaultValue,
	changeValue,
})
{
	const [value, setValue] = useState(defaultValue ?? "");
	const [open, setOpen] = useState(false);

	const handleClose = () =>
	{
		setOpen(false);
	};

	return (
		<React.Fragment>
			<Autocomplete
				value={value}
				onChange={(_, newValue) =>
				{
					if (typeof newValue === "string")
					{
						setTimeout(() =>
						{
							setOpen(true);
						});
					}
					else if (newValue && newValue.inputValue)
					{
						setOpen(true);
					}
					else
					{
						setValue(newValue);
						changeValue(newValue);
					}
				}}
				filterOptions={(options, params) =>
				{
					const filtered = filter(options, params);

					if (params.inputValue !== "")
					{
						filtered.push({
							inputValue: params.inputValue,
							name: `Add "${params.inputValue}"`,
							_id: params.inputValue,
						});
					}
					return filtered;
				}}
				id={id}
				options={options}
				getOptionLabel={(option) =>
				{
					if (typeof option === "string")
					{
						return option;
					}
					if (option.inputValue)
					{
						return option.inputValue;
					}
					return option.name;
				}}
				selectOnFocus
				clearOnBlur
				handleHomeEndKeys
				renderOption={(props, option) => (
					<li {...props} style={{ color: Palette.white }} key={option._id}>
						{option.name}
					</li>
				)}
				sx={{ width: width }}
				freeSolo
				renderInput={(params) => (
					<TextField
						{...params}
						label={label}
						name={name}
						sx={{ color: "white" }}
						InputProps={{ sx: { color: "white" }, ...params.InputProps }}
						InputLabelProps={{
							sx: { color: "currentcolor" },
							...params.InputLabelProps,
						}}
						FormHelperTextProps={{
							sx: { color: "currentcolor" },
							...params.FormHelperTextProps,
						}}
					/>
				)}
			/>
			<ManufacturerModal open={open} handleClose={handleClose} />
		</React.Fragment>
	);
}
