import React from "react";
import dayjs from "dayjs";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import DatePicker from "./DateDialog";

const FormLabelDatepicker = ({
	name,
	onChange,
	width = 120,
	gap = ".25rem",
	value,
	format = "YYYY-MM-DDTHH:mm:ss.SSSZZ",
	...rest
}) =>
{
	return (
		<Box
			sx={{
				display: "grid",
				gridTemplateColumns: `${width}px 1fr`,
				gap,
				alignItems: "center",
			}}
		>
			<Typography sx={{ textTransform: "capitalize" }}>{name}</Typography>
			<DatePicker
				handleChange={(value) => onChange(dayjs(value).format(format))}
				value={value}
				mode="datetime"
				containerStyles={{ width: parseInt(width) * 1.3, ...rest }}
			/>
		</Box>
	);
};

export default FormLabelDatepicker;
