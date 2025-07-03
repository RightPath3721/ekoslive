import React, { useEffect, useState } from "react";
import axios from "axios";
import TextField from "@mui/material/TextField";
import Autocomplete, { createFilterOptions } from "@mui/material/Autocomplete";
import { Palette } from "@common/shared/common/styles";
import useActiveUser from "@hooks/useActiveUser";

const filter = createFilterOptions();

export default function EquipmentSearchableDropdown({
	typeId,
	id,
	width,
	label,
	name,
	defaultValue,
})
{
	const user = useActiveUser();
	const [value, setValue] = useState(defaultValue ?? "");
	const [options, setOptions] = useState([]);

	useEffect(() =>
	{
		(async () =>
		{
			if (!user) return;
			
			try
			{
				const { data } = await axios.get(
					`/api/equipments/equipment-values/${typeId}/${name}?username=${encodeURIComponent(user.username)}&token=${user.token}`,
				);
				if (data.result?.[0] && "_id" in data.result?.[0])
				{
					return setOptions(data.result.map(({ label }) => label));
				}
				setOptions(data.result);
			}
			catch (error)
			{
				console.error(error);
			}
		})();
	}, []);

	return (
		<Autocomplete
			value={value}
			onChange={(_, newValue) =>
			{
				if (typeof newValue === "string")
				{
					if (newValue.startsWith("Add"))
					{
						const formattedValue = newValue.replace('Add "', "");
						setValue(formattedValue.slice(0, -1));
						return;
					}
					setValue(newValue);
				}
				else if (newValue && newValue.inputValue)
				{
					setValue(newValue.inputValue);
				}
				else
				{
					setValue(newValue);
				}
			}}
			filterOptions={(options, params) =>
			{
				const filtered = filter(options, params);

				const { inputValue } = params;
				const isExisting = options.some((option) => inputValue === option);
				if (inputValue !== "" && !isExisting)
				{
					filtered.push(`Add "${inputValue}"`);
				}
				return filtered;
			}}
			selectOnFocus
			handleHomeEndKeys
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
			}}
			renderOption={(props, option) => <li {...props}>{option}</li>}
			sx={{ width: width }}
			freeSolo
			renderInput={(params) => (
				<TextField
					{...params}
					label={label}
					name={name}
					required
					sx={{ color: Palette.white }}
					InputProps={{ sx: { color: Palette.white }, ...params.InputProps }}
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
			ListboxProps={{ sx: { color: Palette.white } }}
		/>
	);
}
