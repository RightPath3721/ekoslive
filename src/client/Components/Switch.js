import * as React from "react";
import FormGroup from "@mui/material/FormGroup";
import FormControlLabel from "@mui/material/FormControlLabel";
import Switch from "@mui/material/Switch";

export default function SwitchToggle({ checked, onChange, title })
{
	return (
		<FormGroup>
			<FormControlLabel
				sx={{ color: "white" }}
				control={
					<Switch color="warning" checked={checked} onChange={onChange} />
				}
				label={title}
			/>
		</FormGroup>
	);
}
