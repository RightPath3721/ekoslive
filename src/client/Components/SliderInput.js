import React from "react";
import { Box, Typography, Grid, Slider, Input } from "@mui/material";
import { useTheme } from "@mui/material/styles";

const SliderInput = ({
	label,
	value,
	range,
	handleSliderChange,
	handleInputChange,
	sx = {},
	...props
}) =>
{
	const { palette } = useTheme();

	const numericValue = isNaN(value) ? range.min : Number(value);

	return (
		<Box
			sx={{
				display: "flex",
				alignItems: "flex-start",
				justifyContent: "center",
				flexDirection: "column",
				gap: ".5rem",
				my: 2,
				...sx, // Allow overriding styles
			}}
		>
			<Typography>{label}</Typography>
			<Grid container spacing={2} sx={{ alignItems: "center" }}>
				<Grid item xs={10}>
					<Slider
						sx={{ color: palette.primary.main }}
						value={numericValue}
						aria-labelledby="input-slider"
						min={range.min}
						max={range.max}
						step={range.step}
						onChange={handleSliderChange}
						valueLabelDisplay="auto"
						{...props}
					/>
				</Grid>
				<Grid item xs={2}>
					<Input
						size="small"
						value={numericValue}
						onChange={handleInputChange}
						inputProps={{
							type: "number",
							"aria-labelledby": "input-slider",
						}}
						sx={{
							color: palette.white[900],
							borderBottom: `2px solid ${palette.white[900]}`,
						}}
						error={numericValue < range.min || numericValue > range.max}
					/>
				</Grid>
			</Grid>
		</Box>
	);
};

export default SliderInput;
