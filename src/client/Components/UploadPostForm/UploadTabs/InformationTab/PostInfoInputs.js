import React, { useEffect, useState } from "react";
import Box from "@mui/material/Box";
import TextField from "@mui/material/TextField";
import RichEditor from "@components/RichEditor";
import { useUploadFormContext } from "@components/UploadPostForm/UploadFormContext";
import { Palette } from "@common/shared/common/styles";
import checkUserTextInput from "@utils/checkUserTextInput";

const PostInfoInputs = ({ setFormValid }) =>
{
	const [inputErrors, setInputErrors] = useState({ title: "", astrobinLink: "" });
	const {
		description,
		setDescription,
		title,
		setTitle,
		equipmentProfile,
		astrobinLink,
		setAstrobinLink,
	} = useUploadFormContext();

	useEffect(() =>
	{
		setFormValid(!!(title && !!equipmentProfile));
	}, [title, equipmentProfile, setFormValid]);

	const handleChange = (e) =>
	{
		const { value, name } = e.target;

		if (name === "title")
		{
			setTitle(value);

			const validation = checkUserTextInput(value, 4, 25);
			setInputErrors((prevErrors) => ({
				...prevErrors,
				[name]: validation.message,
			}));
		}

		if (name === "astrobinLink")
		{
			setAstrobinLink(value);
			const urlPattern = /^(https?:\/\/)?(www\.)?astrobin\.com(\/.*)?$/i;
			const isValidUrl = value === "" || urlPattern.test(value);

			setInputErrors((prevErrors) => ({
				...prevErrors,
				astrobinLink: isValidUrl ? "" : "Incorect link format",
			}));
		}
	};

	return (
		<Box
			sx={{
				display: "grid",
				gridTemplateRows: "auto auto 1fr",
				gap: "1rem",
				marginTop: "1.25rem",
			}}
		>
			<TextField
				id="title"
				name="title"
				label="Title"
				type="search"
				required
				error={!!inputErrors.title}
				helperText={inputErrors.title}
				onChange={handleChange}
				value={title}
				InputProps={{ sx: { color: Palette.white } }}
				InputLabelProps={{ sx: { color: Palette.white70 } }}
			/>
			<TextField
				id="astrobinLink"
				name="astrobinLink"
				label="Astrobin Link (optional)"
				type="url"
				error={!!inputErrors.astrobinLink}
				helperText={inputErrors.astrobinLink}
				onChange={handleChange}
				value={astrobinLink}
				InputProps={{ sx: { color: Palette.white } }}
				InputLabelProps={{ sx: { color: Palette.white70 } }}
			/>
			<RichEditor value={description} onChange={(val) => setDescription(val)} />
		</Box>
	);
};

export default PostInfoInputs;
