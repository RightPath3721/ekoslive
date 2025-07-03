import React from 'react';
import { Box, Typography, Autocomplete, Chip, TextField } from '@mui/material';
import { useTheme } from '@mui/material/styles';

const TagsView = ({
	label,
	value,
	options = [],
	onChange,
	rows = 1,
	sx = {},
	...props
}) => {
	const { palette } = useTheme();

	return (
		<Box
			sx={{
				display: "flex",
				justifyContent: "flex-start",
				flexDirection: "column",
				gap: ".5rem",
				my: 2,
				...sx, 
			}}
		>
			<Typography sx={{ textTransform: "capitalize" }}>
				{label}
			</Typography>
			<Autocomplete
				multiple
				freeSolo
				options={options}
				value={value}
				sx={{
					width: "100%",
					"& .MuiAutocomplete-clearIndicator": {
						color: palette.white[900],
					},
					"& .MuiAutocomplete-popupIndicator": {
						color: palette.white[900],
					},
					// "& .MuiInputBase-root": {
					// 	paddingY: "12px",
					// 	paddingLeft: "16px",
					// }
				}}
				onChange={onChange}
				renderTags={(value, getTagProps) =>
					value.map((option, index) => (
						<Chip
							sx={{
								color: palette.white[900],
								"& .MuiChip-deleteIcon": {
									color: palette.grey[300] + " !important",
								}
							}}
							key={index}
							variant="standard"
							label={option}
							{...getTagProps({ index })}
						/>
					))
				}
				renderInput={(params) => (
					<TextField
						{...params}
						multiline
						rows={rows}
						sx={{
							"& .MuiInputLabel-root": {
								color: palette.common.white,
							},
							"& .MuiInputBase-root": {
								color: palette.common.white,
								caretColor: palette.primary.main,
							},
							// "& .MuiInputBase-input": {
							// 	padding: "0px 0px !important",
							// },
						}}
					/>
				)}
				{...props}
			/>
		</Box>
	);
};

export default TagsView;