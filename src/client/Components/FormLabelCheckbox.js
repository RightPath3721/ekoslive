import React from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Checkbox from "@mui/material/Checkbox";

const FormLabelCheckbox = ({
	name,
	width = "120px",
	gap = ".25rem",
	value,
	onChange,
	...rest
}) =>
{
	return (
		<Box
			sx={{
				display: "grid",
				gridTemplateColumns: `${width} 1fr`,
				gap,
				alignItems: "center",
			}}
		>
			<Typography sx={{ textTransform: "capitalize", width: width }}>
				{name}
			</Typography>
			<Checkbox checked={value} onChange={onChange} inputProps={rest} />
		</Box>
	);
};

export default FormLabelCheckbox;
