import * as React from "react";
import MuiCheckbox from "@mui/material/Checkbox";

/**
 * Description placeholder.
 * @param {{ onChange: Function; checked: boolean; }} props
 * @param {*} props.onChange
 * @param {*} props.checked
 * @returns {*}
 */
export default function Checkbox({ onChange, checked })
{
	return (
		<MuiCheckbox
			checked={checked}
			onChange={onChange}
			inputProps={{ "aria-label": "controlled" }}
		/>
	);
}
