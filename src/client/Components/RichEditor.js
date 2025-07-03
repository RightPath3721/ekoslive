import React from "react";
import JoditEditor from "jodit-react";

const RichEditor = ({ value, onChange, ...rest }) =>
{
	return (
		<JoditEditor
			value={value}
			config={{ theme: "dark", ...rest }}
			onBlur={onChange}
		/>
	);
};

export default RichEditor;
