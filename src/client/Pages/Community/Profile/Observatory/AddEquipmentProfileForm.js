import React from "react";
import Box from "@mui/material/Box";
import FormTextField from "@components/FormTextField";
import { Palette } from "@common/shared/common/styles";
import s from "@common/shared/i18n/i18n";
import Button from "@mui/material/Button";

const AddEquipmentProfileForm = ({ onSubmit, onCancel }) =>
{
	return (
		<Box
			sx={[
				{
					width: "100%",
					display: "flex",
					flexDirection: "row",
					gap: "16px",
				},
			]}
			onSubmit={onSubmit}
			component="form"
		>
			<FormTextField
				defaultValue=""
				id="name"
				label={s.connect.observatory.profile_name}
				name="name"
				required
			/>

			<Box sx={{ display: "flex", gap: "8px", justifyContent: "flex-end" }}>
				<Button
					variant="outlined"
					onClick={onCancel}
					color="inherit"
				>
					{s.general.cancel}
				</Button>
				<Button
					type="submit"
					variant="contained"
					sx={{
						backgroundColor: Palette.orange,
						minWidth: "auto",
						textTransform: "capitalize",
					}}
				>
					{s.general.save}
				</Button>
			</Box>
		</Box>
	);
};

export default AddEquipmentProfileForm;
