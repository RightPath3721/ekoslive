import React, { memo, useEffect, useState } from "react";
import { get, isEmpty } from "lodash";
import { numericControls } from "@indi/enums";
import NumericInput from "./NumericInput/NumericInput";

// exposure drop-down values are filtered according the min and max exposure limits of the camera
const Exposures = [
	0.001, 0.01, 0.02, 0.05, 0.1, 0.2, 0.25, 0.5, 1, 1.5, 2, 2.5, 3, 5, 6, 7, 8,
	9, 10, 20, 30, 40, 50, 60, 120, 180, 300, 600, 900, 1200, 1800,
];

// temperature drop-down values are filtered according the min and max temperature limits of the camera
const Temperatures = [
	-50, -45, -40, -35, -30, -25, -20, -15, -10, -5, 0, 5, 10, 15, 20,
];

const NumericControl = ({
	device,
	initialValue,
	steps = [],
	editable = true,
	customLimit = [],
	type,
	onChange,
	width = 153,
	numberType = "integer",
}) =>
{
	const [initValue, setInitValue] = useState(initialValue ?? "--");
	const [incrementValue, setIncrementValue] = useState(1);
	const [decrementValue, setDecrementValue] = useState(1);
	const [limit, setLimit] = useState([0, 100, 1]);

	useEffect(() =>
	{
		setInitValue(initialValue);
	}, [initialValue]);

	useEffect(() =>
	{
		if (isEmpty(device)) return;
		else
		{
			let limit = [],
				element;

			switch (type)
			{
				// #1 Exposure
				case numericControls.EXPOSURE:
					limit = get(
						device,
						"getMinMaxStep('CCD_EXPOSURE', 'CCD_EXPOSURE_VALUE')",
						false,
					);
					if (initialValue === undefined && limit)
						setInitValue(device.getExposure());
					break;

				// #2 Temperature Limits
				case numericControls.TEMPERATURE:
					limit = device.getMinMaxStep(
						"CCD_TEMPERATURE",
						"CCD_TEMPERATURE_VALUE",
					);
					if (initialValue === undefined && device.hasTemperature())
						setInitValue(device.getTemperature());
					break;

				// #3 Gain
				// Get primary CCD_GAIN
				case numericControls.GAIN:
					{
						let gainList = device.getRangeList("CCD_GAIN", "GAIN");
						// If that fails, search for CCD_CONTROLS value
						if (isEmpty(gainList))
						{
							gainList = device.getRangeList("CCD_CONTROLS", "Gain");
							limit = device.getMinMaxStep("CCD_CONTROLS", "Gain");
							element = device.getElement("CCD_CONTROLS", "Gain");
						}
						else
						{
							limit = device.getMinMaxStep("CCD_GAIN", "GAIN");
							element = device.getElement("CCD_GAIN", "GAIN");
						}

						if (initialValue === undefined) setInitValue(element.value);
					}
					break;

				// #4 Offset
				// Get primary CCD_OFFSET
				case numericControls.OFFSET:
					{
						let offsetList = device.getRangeList("CCD_OFFSET", "OFFSET");
						// If that fails, search for CCD_CONTROLS value
						if (isEmpty(offsetList))
						{
							offsetList = device.getRangeList("CCD_CONTROLS", "Offset");
							limit = device.getMinMaxStep("CCD_CONTROLS", "Offset");
							element = device.getElement("CCD_CONTROLS", "Offset");
							//range = offsetList;
						}
						else
						{
							limit = device.getMinMaxStep("CCD_OFFSET", "OFFSET");
							element = device.getElement("CCD_OFFSET", "OFFSET");
							//range = offsetList;
						}

						if (initValue === undefined) setInitValue(element.value);
					}
					break;
			}

			setLimit(limit);
			updateLimits(initValue);
		}
	}, []);

	const updateLimits = (value) =>
	{
		if (value === undefined) return;

		// Need to adjust increment/decrement per type
		switch (type)
		{
			case numericControls.EXPOSURE:
				{
					const index = Exposures.indexOf(value);
					if (index >= 0)
					{
						setIncrementValue(Exposures[index + 1] - Exposures[index]);
						if (index > 0)
							setDecrementValue(Exposures[index] - Exposures[index - 1]);
					}
				}
				break;

			case numericControls.TEMPERATURE:
				{
					const index = Temperatures.indexOf(value);
					if (index >= 0)
					{
						setIncrementValue(Temperatures[index + 1] - Temperatures[index]);
						if (index > 0)
							setDecrementValue(Temperatures[index] - Temperatures[index - 1]);
					}
				}
				break;

			default:
				break;
		}
	};

	const handleChange = (newValue) =>
	{
		setInitValue(newValue);
		updateLimits(newValue);
		onChange(newValue);
	};

	return (
		<NumericInput
			totalWidth={width}
			initValue={initValue}
			value={initialValue}
			maxValue={customLimit ? customLimit[1] : limit[1]}
			minValue={customLimit ? customLimit[0] : limit[0]}
			incrementStep={steps ? steps[1] : incrementValue}
			decrementStep={steps ? steps[0] : decrementValue}
			editable={editable}
			onChange={handleChange}
			textColor="#CECECE"
			valueType={numberType}
		/>
	);
};

export default memo(NumericControl);
