import * as React from "react";
import Box from "@mui/material/Box";
import Slider from "@mui/material/Slider";

export default function SliderComponent({
	width,
	onSlidingComplete,
	value,
	onChange,
	disabled = false,
	min,
	max,
	step,
	color = "",
})
{
	return (
		<Box width={width}>
			<Slider
				min={min}
				max={max}
				disabled={disabled}
				step={step}
				value={value}
				onChange={onChange}
				onChangeCommitted={() => onSlidingComplete?.()}
				defaultValue={value}
				aria-label="Default"
				valueLabelDisplay="auto"
				sx={{ color }}
			/>
		</Box>
	);
}
