import React, { useState } from "react";
import Box from "@mui/material/Box";
import Dropdown from "@components/Dropdown";
import FormLabelTextField from "@components/FormLabelTextField";
import FormLabelNumericInput from "@components/FormLabelNumericInput";
import s from "@common/shared/i18n/i18n";
import { useAcquisitionContext } from "./AcquisitionTabContext";
import FormLabelDropdown from "@components/FormLabelDropdown";
import FormLabelDatepicker from "@components/FormLabelDatePicker";

const inititalInputs = [
	{
		name: "frame",
		label: s.general.frame,
		type: "number",
		required: true,
		key: "frames",
	},
	{
		name: "duration",
		label: s.ekos.capture_file.duration,
		type: "number",
		required: true,
		key: "duration",
	},
	{
		name: "gain",
		label: s.general.gain,
		type: "number",
		required: false,
		key: "gain",
	},
	{
		name: "binning",
		label: s.general.binning,
		type: "dropdown",
		required: false,
		key: "binning",
		options: [
			{ label: "1x1", value: "1x1" },
			{ label: "2x2", value: "2x2" },
			{ label: "3x3", value: "3x3" },
		],
	},
	{
		name: "timestamp",
		label: s.general.date,
		type: "datepicker",
		required: false,
		key: "timestamp",
	},
];

const AcquisitionSessionInfo = () =>
{
	const { filter, dispatchFormState, formState } = useAcquisitionContext();
	const [fields, setFields] = useState(
		inititalInputs.filter((input) => input.required),
	);
	const [optionalFields, setOptionalFields] = useState(
		inititalInputs.filter((input) => !input.required),
	);

	return (
		<Box
			sx={{
				display: "grid",
				gridTemplateColumns: "repeat(3, 1fr)",
				gap: ".75rem",
			}}
		>
			{fields.map((input) =>
			{
				switch (input.type) {
					case "number":
						return (
							<FormLabelNumericInput
								value={formState[input.key] ?? 0}
								onChange={(value) =>
									dispatchFormState({ name: input.key, value })
								}
								key={input.key}
								name={input.name}
								width={100}
								disabled={!filter}
							/>
						);
					case "dropdown":
						return (
							<FormLabelDropdown
								id={input.key}
								name={input.name}
								onChange={(value) =>
									dispatchFormState({ name: input.name, value: value.value })
								}
								options={input.options}
								value={formState[input.key] ?? input.options?.[0]?.value}
								key={input.key}
							/>
						);
					case "datepicker":
						return (
							<FormLabelDatepicker
								id={input.key}
								name={input.name}
								value={formState[input.key] ?? new Date()}
								key={input.key}
								onChange={(value) =>
									dispatchFormState({ name: input.name, value })
								}
							/>
						);
					default:
						return (
							<FormLabelTextField
								value={formState[input.key] ?? ""}
								onChange={(value) =>
									dispatchFormState({ name: input.key, value })
								}
								key={input.key}
								name={input.name}
								width={100}
								disabled={!filter}
							/>
						);
				}
			})}
			{optionalFields.length > 0 ? (
				<Dropdown
					onChange={(e) =>
						{
						setFields((prev) => [
							...prev,
							...optionalFields.filter(
								(field) => !field.required && field.name === e.value,
							),
						]);
						setOptionalFields((prev) =>
							prev.filter((item) => item.label !== e.label),
						);
					}}
					options={optionalFields.map((field) => ({
						label: field.label,
						value: field.name,
					}))}
					containerStyles={{ gridColumn: "3", gridRow: "1" }}
				/>
			) : (
				<div style={{ gridColumn: "3", gridRow: "1" }} />
			)}
		</Box>
	);
};

export default AcquisitionSessionInfo;
