import React from "react";
import {
	Box,
	Typography,
	Select,
	MenuItem,
	Checkbox,
	ListItemText,
} from "@mui/material";
import { useTheme } from "@mui/system";

const MultiSelect = ({
	label,
	value,
	handleChange,
	options,
	multiple = true,
	sx = {},
	renderValue,
	gap = ".5rem",
	...props
}) =>
{
	const { palette } = useTheme();
	return (
		<Box
			sx={{
				display: "flex",
				alignItems: "flex-start",
				justifyContent: "center",
				flexDirection: "column",
				mt: 2,
				gap,
			}}
		>
			<Typography sx={{ textTransform: "capitalize" }}>{label}</Typography>
			<Select
				multiple={multiple}
				value={value}
				onChange={handleChange}
				renderValue={renderValue}
				sx={{
					color: palette.white[900],
					width: "100%",
					background: palette.black[700],
					"&. MuiSelect-select": {
						padding: "12px 16px",
					},
					"&. MuiSvgIcon-root": {
						color: palette.white[900],
					},
					border: "none",
					...sx,
				}}
				{...props}
			>
				{options?.map((item) => (
					<MenuItem key={item._id} value={item} sx={{ color: "white" }}>
						{multiple && <Checkbox checked={value.indexOf(item) > -1} />}
						<ListItemText primary={item.name} />
					</MenuItem>
				))}
			</Select>
		</Box>
	);
};

export default MultiSelect;
