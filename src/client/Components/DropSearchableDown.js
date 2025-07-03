import React from "react";
import { Box, Typography, Autocomplete, TextField } from "@mui/material";
import { useTheme } from "@mui/material/styles";

const DropSearchableDown = ({
	label,
	options,
	value,
	handleChange,
	multiple = false,
	sx = {},
	...props
}) =>
{
	const { palette } = useTheme();
	const updatedOptions = options?.map((option) => {
		if (typeof option === "object" && option !== null) {
			// Create a new object with label and value fields
			const keys = Object.keys(option);
	
			// Determine the label; prioritize 'name' over 'label'
			const label = option.name ?? option.label;
	
			// Determine the value; find the first key that is neither 'name' nor 'label'
			const valueKey = keys.find((key) => key !== "name" && key !== "label");
			const value = option[valueKey];
	
			// Return the transformed object
			return { label, value };
		} else {
			// If the option is not an object, return it as is
			return option;
		}
	});

	return (
		<Box
			sx={{
				display: "flex",
				alignItems: "flex-start",
				justifyContent: "flex-start",
				flexDirection: "column",
				gap: ".5rem",
				my: 2,
				"& .MuiAutocomplete-noOptions": {
					color: `${palette.white[900]} !important`,
				},
				...sx,
			}}
		>
			{label && (
				<Typography sx={{ textTransform: "capitalize" }}>{label}</Typography>
			)}
			<Autocomplete
				sx={{
					width: "100%",
					"& .MuiAutocomplete-clearIndicator": {
						color: palette.white[900],
					},
					"& .MuiAutocomplete-popupIndicator": {
						color: palette.white[900],
					},
					"& .MuiInputBase-root": {
						paddingY: "16.5px",
						paddingLeft: "14px",
					},
				}}
				disablePortal
				options={updatedOptions}
				value={value}
				onChange={handleChange}
				multiple={multiple}
				renderInput={(params) => (
					<TextField
						{...params}
						sx={{
							"& .MuiChip-root": {
								color: palette.common.white,
							},
							"& .MuiChip-deleteIcon": {
								color: palette.grey[300] + " !important",
							},
							"& .MuiInputLabel-root": {
								color: palette.common.white,
							},
							"& .MuiInputBase-root": {
								color: palette.common.white,
								caretColor: palette.primary.main,
							},
							"& .MuiInputBase-input": {
								padding: "0px 0px !important",
							},
						}}
					/>
				)}
				{...props}
			/>
		</Box>
	);
};

export default DropSearchableDown;
