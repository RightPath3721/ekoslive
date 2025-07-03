import React, { useCallback, useReducer, useState } from "react";
import Modal from "@mui/material/Modal";
import Paper from "@mui/material/Paper";
import Button from "@mui/material/Button";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Checkbox from "@mui/material/Checkbox";
import CloseButton from "@components/CloseButton";
import { styles } from "../../../../../shared/styles";
import AddFilterInputBox from "./AddFilterInputBox";
import NumericInput from "@components/NumericControl";
import { useUploadFormContext } from "../../UploadFormContext";
import s from "@common/shared/i18n/i18n";
import { Palette } from "@common/shared/common/styles";

const addFilterFormInputs = [
	{ name: "manufacturer", type: "search", key: "manufacturer" },
	{ name: "model", type: "search", key: "model" },
	{ name: "type", type: "search", key: "type" },
	{ name: "color", type: "search", key: "color" },
	{ name: "exposure", type: "number", key: "exposure" },
	{ name: "offset", type: "number", key: "offset" },
	{ name: "abs.position", type: "number", key: "abs" },
	{ name: "focus temp", type: "number", key: "temp" },
	{ name: "focus alt", type: "number", key: "alt" },
	{ name: "ticks per C", type: "number", key: "ticksPerC" },
	{ name: "ticks per Alt", type: "number", key: "ticksPerAlt" },
	{ name: "wavelength", type: "number", key: "wavelength" },
	{ name: "autofocus", type: "checkbox", key: "autoFocus" },
];

const initValue = {
	manufacturer: "",
	model: "",
	type: "",
	color: "",
	exposure: 1,
	offset: 0,
	abs: 0,
	temp: 0,
	alt: 0,
	ticksPerC: 0,
	ticksPerAlt: 0,
	wavelength: 500,
	autoFocus: false,
};

const reducer = (state, action) =>
{
	if (action === "reset") return initValue;
	return { ...state, [action.name]: action.value };
};

const AddFilterForm = () =>
{
	const { setFilters } = useUploadFormContext();
	const [isOpen, setIsOpen] = useState(false);
	const [state, dispatch] = useReducer(reducer, initValue);

	const toggleModdalForm = useCallback(() => setIsOpen((p) => !p), [setIsOpen]);

	const handleSubmit = (e) =>
	{
		e?.preventDefault?.();

		setFilters((prev) => [...prev, state]);
		dispatch("reset");
		toggleModdalForm();
	};

	return (
		<>
			<Modal open={isOpen} onClose={toggleModdalForm}>
				<Paper
					sx={[
						styles.centerAbsolute,
						styles.verticalScrollBar,
						{
							padding: "2rem 1.5rem",
							display: "grid",
							gridTemplateColumns: "repeat(2, 1fr)",
							gap: "1rem",
							maxHeight: "600px",
							overflowY: "scroll",
						},
					]}
					component="form"
					onSubmit={handleSubmit}
				>
					<CloseButton onChange={toggleModdalForm} right="4px" top="4px" />

					{addFilterFormInputs.map((input) =>
					{
						switch (input.type) {
							case "search":
								return (
									<AddFilterInputBox
										id={input.name}
										label={input.name}
										name={input.name}
										onChange={(e) =>
										{
											dispatch({ name: input.key, value: e.target.value });
										}}
										value={state[input.key]}
										type={input.type}
										key={input.key}
									/>
								);
							case "number":
								return (
									<Box
										sx={{
											display: "grid",
											gridTemplateColumns: "120px 1fr",
											gap: ".25rem",
											alignItems: "center",
										}}
										key={input.key}
									>
										<Typography sx={{ textTransform: "capitalize" }}>
											{input.name}
										</Typography>
										<NumericInput
											onChange={(value) =>
											{
												dispatch({ name: input.key, value });
											}}
											initialValue={state[input.key]}
										/>
									</Box>
								);

							case "checkbox":
								return (
									<Box
										sx={{
											display: "grid",
											gridTemplateColumns: "120px 1fr",
											gap: ".25rem",
											alignItems: "center",
										}}
										key={input.key}
									>
										<Typography sx={{ textTransform: "capitalize" }}>
											{input.name}
										</Typography>
										<Checkbox
											checked={state[input.key]}
											onChange={(e) =>
												dispatch({ name: input.key, value: e.target.checked })
											}
										/>
									</Box>
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
						onClick={handleSubmit}
					>
						{s.general.add}
					</Button>
				</Paper>
			</Modal>

			<Button
				onClick={toggleModdalForm}
				sx={{ backgroundColor: Palette.orange, height: "min-content" }}
			>
				{s.cloud.filters_drawer.btn_add_filter}
			</Button>
		</>
	);
};

export default AddFilterForm;
