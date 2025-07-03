import React, { useState, useEffect } from "react";
import Box from "@mui/material/Box";
import Slider from "@mui/material/Slider";
import Input from "@mui/material/Input";
import { useTheme } from "@mui/material/styles";

const MinimumDistanceSlider = ({
	value,
	setValue,
	step,
	width = "100%",
	minDistance,
	max = 100,
	min = 1,
	disabled = false,
}) =>
{
	const [firstValue, setFirstValue] = useState(min);
	const [secondValue, setSecondValue] = useState(max);
	const { palette } = useTheme();

	useEffect(() =>
	{
		setFirstValue(value?.[0] ?? min);
		setSecondValue(value?.[1] ?? max);
	}, [value, min, max]);

	const handleChange = (_, newValue, activeThumb) =>
	{
		if (!Array.isArray(newValue))
		{
			return;
		}

		if (newValue[1] - newValue[0] < minDistance)
		{
			if (activeThumb === 0)
			{
				const clamped = Math.min(newValue[0], max - minDistance);
				setValue([clamped, clamped + minDistance]);
			}
			else
			{
				const clamped = Math.max(newValue[1], min + minDistance);
				setValue([clamped - minDistance, clamped]);
			}
		}
		else
		{
			setValue(newValue);
		}
	};

	const handleFirstValueChange = (event) =>
	{
		const newValue = event.target.value === "" ? 0 : Number(event.target.value);
		if (minDistance)
		{
			if (newValue <= secondValue - minDistance)
			{
				setFirstValue(newValue);
				setValue([newValue, secondValue]);
			}
		}
		else
		{
			setFirstValue(newValue);
			setValue([newValue, secondValue]);
		}
	};

	const handleSecondValueChange = (event) =>
	{
		const newValue = event.target.value === "" ? 0 : Number(event.target.value);
		if (minDistance)
		{
			if (newValue >= firstValue + minDistance)
			{
				setSecondValue(newValue);
				setValue([firstValue, newValue]);
			}
		}
		else
		{
			setSecondValue(newValue);
			setValue([firstValue, newValue]);
		}
	};

	return (
		<Box sx={{ width }}>
			<Box sx={{ display: "flex", flexDirection: "row", gap: "20px" }}>
				<Input
					value={firstValue}
					size="small"
					onChange={handleFirstValueChange}
					inputProps={{
						type: "number",
					}}
					disabled={disabled}
					sx={{
						color: palette.common.white,
						borderBottom: `2px solid ${palette.common.white}`,
					}}
					error={value < min || value > secondValue}
				/>
				<Slider
					value={[firstValue, secondValue]}
					onChange={handleChange}
					disableSwap
					step={step}
					max={max}
					min={min}
					valueLabelDisplay="auto"
					disabled={disabled}
				/>
				<Input
					value={secondValue}
					size="small"
					onChange={handleSecondValueChange}
					inputProps={{
						type: "number",
					}}
					sx={{
						color: palette.common.white,
						borderBottom: `2px solid ${palette.common.white}`,
					}}
					disabled={disabled}
					error={value < firstValue || value > max}
				/>
			</Box>
		</Box>
	);
};

export default MinimumDistanceSlider;
