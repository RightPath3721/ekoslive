import React from "react";
import TextField from "@mui/material/TextField";
import TagsView from "@components/TagsView";
import SliderInput from "@components/SliderInput";
import DropSearchableDown from "@components/DropSearchableDown";

const DynamicForm = ({ fields, dynamicFormValues, setDynamicFormValues }) =>
{
	const handleTagChange = (key, newValue) =>
	{
		if (newValue.length <= 5)
		{
			handleChange(key, newValue);
		}
	};

	const handleChange = (key, value) =>
	{
		setDynamicFormValues((prevValues) => ({
			...prevValues,
			[key]: value,
		}));
	};

	const renderField = (field) =>
	{
		switch (field.type) {
			case "Tags":
				return (
					<TagsView
						label={field.label}
						value={dynamicFormValues?.tags || []}
						options={[]}
						onChange={(e, newValue) => handleTagChange(field.key, newValue)}
						key={field.key}
					/>
				);

			case "Number":
				if (field.range)
				{
					return (
						<SliderInput
							label={`${field.label}${field.unit ? ` (${field.unit})` : ""}`}
							value={dynamicFormValues?.[field.key] || field.range.min}
							range={field.range}
							handleSliderChange={(e, newValue) =>
								handleChange(field.key, newValue)
							}
							handleInputChange={(e) => handleChange(field.key, e.target.value)}
							key={field.key}
						/>
					);
				}
				else
				{
					return (
						<TextField
							variant="standard"
							key={field.key}
							label={`${field.label}${field.unit ? ` (${field.unit})` : ""}`}
							type="number"
							required={field.required}
							fullWidth
							margin="normal"
							value={dynamicFormValues?.[field.key]}
							onChange={(e) => handleChange(field.key, e.target.value)}
						/>
					);
				}

			case "Dropdown":
				return (
					<DropSearchableDown
						label={field.label}
						options={field.options}
						value={dynamicFormValues?.[field.key] || (field.multiple ? [] : null)}
						handleChange={(e, newValue) => handleChange(field.key, newValue)}
						key={field.key}
						multiple={field.multiple}
					/>
				);
			default:
				return null;
		}
	};

	return fields?.map((field) => renderField(field));
};

export default DynamicForm;
