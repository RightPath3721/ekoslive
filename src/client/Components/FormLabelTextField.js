import React from "react";
import TextField from "@mui/material/TextField";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { useTheme } from "@mui/system";

const FormLabelTextField = ({
	width = 120,
	gap = ".5rem",
	label = "",
	rows = 1,
	error = null,
	defaultValue = "",
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
				width: width,
			}}
		>
			<Typography sx={{ textTransform: "capitalize" }}>{label}</Typography>
			<TextField
				multiline
				rows={rows}
				defaultValue={defaultValue}
				sx={{
					width: "100%",
					"& .MuiInputLabel-root": {
						color: error ? palette.error.main : palette.common.white,
					},
					"& .MuiInputBase-root": {
						color: error ? palette.error.main : palette.common.white,
						caretColor: palette.primary.main,
					},
				}}
				InputProps={{
					sx: {
						height: "100%",
					},
				}}
				error={!!error}
				{...props}
			/>
			<Typography
				sx={{ minHeight: "1.125rem" }}
				variant="h4"
				component="span"
				color="error"
			>
				{error?.message || error || ""}
			</Typography>
		</Box>
	);
};

export default FormLabelTextField;
