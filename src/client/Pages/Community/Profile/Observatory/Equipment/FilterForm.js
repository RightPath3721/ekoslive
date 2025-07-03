import React, { useReducer } from "react";
import axios from "axios";
import Button from "@mui/material/Button";
import Box from "@mui/material/Box";
import { captureException } from "@sentry/browser";
import FormLabelTextField from "@components/FormLabelTextField";
import FormLabelNumericInput from "@components/FormLabelNumericInput";
import FormLabelCheckbox from "@components/FormLabelCheckbox";
import FormLabelDropdown from "@components/FormLabelDropdown";
import { styles } from "@client/shared/styles";
import { Palette } from "@common/shared/common/styles";
import s from "@common/shared/i18n/i18n";
import { useEquipmentContext } from "./EquipmentContext";
import { useActiveObservatory } from "../ObservatoryContext";
import useActiveUser from "@hooks/useActiveUser";
import SearchableDropdownAction from "./SearchableDropdownAction";

const addFilterFormInputs = [
	{ name: "model", type: "search", key: "equipment_model" },
	{ name: "label", type: "search", key: "label" },
	{ name: "manufacturer", type: "actionDropdown", key: "manufacturer" },
	{ name: "link", type: "search", key: "link" },
	{ name: "type", type: "dropdown", key: "type" },
	{ name: "band", type: "dropdown", key: "band" },
];

const filterTypeOptions = [
	{ label: "Narrowband", value: "Narrowband" },
	{ label: "Broadband", value: "Broadband" },
	{ label: "Light Pollution", value: "Light Pollution" },
	{ label: "Clear", value: "Clear" },
];

const filterBandOptions = Array.from({ length: 7 }, (_, i) => ({
	label: `${i * 2 + 1}nm`,
	value: `${i * 2 + 1}nm`,
}));

const initValue = {
	manufacturer: "",
	equipment_model: "",
	label: "",
	link: "",
	type: "",
	band: "",
};

const getOptions = (key) =>
{
	switch (key)
	{
		case "type":
			return filterTypeOptions;

		case "band":
			return filterBandOptions;
		default:
			return [];
	}
};

const reducer = (state, action) =>
{
	if (action === "reset") return initValue;
	return { ...state, [action.name]: action.value };
};

const FilterForm = ({
	close,
	profileId,
	mode,
	equipmentTypeId,
	setManufacturerValue,
	manufacturers,
	manufacturerValue,
	observatoryDefaultValue,
	submit,
}) =>
{
	const user = useActiveUser();
	const [state, dispatch] = useReducer(reducer, initValue);
	const equipmentContext = useEquipmentContext();
	const { observatoryId } = useActiveObservatory();

	const handleSubmit = async (e) =>
	{
		e.preventDefault?.();

		if (!user) return;

		try
		{
			if (mode === "add")
			{
				const { data } = await axios.post(
					`/api/equipments/${observatoryDefaultValue ?? observatoryId}/${profileId}?username=${encodeURIComponent(user.username)}&token=${user.token}`,
					{
						...state,
						equipment_type: equipmentTypeId,
						manufacturer: manufacturerValue._id,
					},
				);
				if (submit)
				{
					submit?.(data);
				}
				else if (equipmentContext)
				{
					equipmentContext.setEquipmentList((prevList) => [
						...prevList,
						data.equipment,
					]);
				}
			}
			else
			{
				const { data } = await axios.patch(
					`/api/equipments/${observatoryId}/${equipment._id}?username=${encodeURIComponent(user.username)}&token=${user.token}`,
					state,
				);
				if (equipmentContext)
				{
					equipmentContext.setEquipmentList((prevList) =>
						prevList.map((equipment) =>
							equipment._id === data.equipment._id
								? { ...equipment, ...data.equipment }
								: equipment,
						),
					);
				}
			}
			dispatch({ action: "reset" });
			close();
		}
		catch (error)
		{
			captureException(error);
		}
	};

	return (
		<Box
			sx={[
				styles.centerAbsolute,
				styles.verticalScrollBar,
				{
					display: "grid",
					gridTemplateColumns: "repeat(2, 1fr)",
					gap: "1rem",
					maxHeight: "600px",
					overflowY: "scroll",
					padding: "24px 12px",
					backgroundColor: "#111111",
					width: "600px",
				},
			]}
			component="form"
			onSubmit={handleSubmit}
		>
			{addFilterFormInputs.map((input) =>
			{
				switch (input.type) {
					case "search":
						return (
							<FormLabelTextField
								key={input.key}
								type={input.type}
								id={input.name}
								label={input.name}
								name={input.name}
								onChange={(e) =>
									dispatch({ name: input.key, value: e.target.value })
								}
								value={state[input.key]}
							/>
						);
					case "number":
						return (
							<FormLabelNumericInput
								name={input.name}
								onChange={(value) => dispatch({ name: input.key, value })}
								value={state[input.key]}
								key={input.key}
							/>
						);

					case "checkbox":
						return (
							<FormLabelCheckbox
								name={input.name}
								onChange={(e) =>
									dispatch({ name: input.key, value: e.target.checked })
								}
								value={state[input.key]}
								key={input.key}
							/>
						);

					case "actionDropdown":
						return (
							<SearchableDropdownAction
								options={manufacturers}
								label={input.name}
								defaultValue=""
								width="100%"
								name={input.name}
								changeValue={setManufacturerValue}
								key={input.key}
							/>
						);

					case "dropdown":
						return (
							<FormLabelDropdown
								options={getOptions(input.key)}
								name={input.name}
								value={state[input.key]}
								onChange={(value) =>
									dispatch({ name: input.key, value: value.value })
								}
								key={input.key}
							/>
						);

					default:
						return null;
				}
			})}
			<Button
				type="submit"
				fullWidth
				variant="contained"
				sx={{ backgroundColor: Palette.orange }}
			>
				{s.general.add}
			</Button>
		</Box>
	);
};

export default FilterForm;
