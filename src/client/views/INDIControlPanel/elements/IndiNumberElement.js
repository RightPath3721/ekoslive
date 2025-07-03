import React, { memo } from "react";
import { formatNumber } from "../utils";
import get from "lodash/get";
import Typography from "@mui/material/Typography";
import TextField from "@mui/material/TextField";
import { IPPerm } from "@indi/enums";
import { Palette } from "@common/shared/common/styles";

const IndiNumberElement = ({
	numberElement,
	property,
	setInputNumberValue,
	inputNumbers,
}) =>
{
	return (
		<>
			<Typography sx={[LOCAL_STYLES.element]}>{numberElement.label}</Typography>

			<Typography sx={[LOCAL_STYLES.element]}>
				{formatNumber(
					get(numberElement, "format", "%.f"),
					numberElement.value ?? 0,
				)}
			</Typography>

			{/* Show input field whenever it is not read only */}
			{property.perm !== IPPerm.IP_RO ? (
				<TextField
					value={
						inputNumbers[property.name] &&
						inputNumbers[property.name][numberElement.name] !== undefined
							? `${inputNumbers[property.name][numberElement.name]}`
							: `${formatNumber(get(numberElement, "format", "%.f"), numberElement.value ?? 0)}`
					}
					min={numberElement.min}
					max={numberElement.max}
					sx={[LOCAL_STYLES.inputField]}
					InputProps={{
						sx: {
							color: "white",
							padding: 0,
							".MuiInputBase-input": {
								padding: "4px 12px",
							},
						},
					}}
					onChange={(evt) =>
						{
						setInputNumberValue(property, numberElement, evt.target.value);
					}}
				/>
			) : null}
		</>
	);
};

const LOCAL_STYLES = {
	element: {
		padding: "5px",
		border: `1px solid ${Palette.grey44}`,
		backgroundColor: Palette.grey33,
		borderRadius: "2px",
		fontSize: "12px",
		color: "white",
	},
	inputField: {
		height: "30px",
		width: "120px",
		fontSize: "12px",
		color: "white",
	},
};

export default memo(IndiNumberElement);
