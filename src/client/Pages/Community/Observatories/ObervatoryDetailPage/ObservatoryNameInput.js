import React from "react";
import FormLabelTextField from "@components/FormLabelTextField";
import s from "@common/shared/i18n/i18n";

const ObservatoryNameInput = ({ defaultValue = "" }) =>
{
	return (
		<FormLabelTextField
			defaultValue={defaultValue}
			id="name"
			name="name"
			width="100%"
			label={s.general.name}
			required
		/>
	);
};

export default ObservatoryNameInput;
