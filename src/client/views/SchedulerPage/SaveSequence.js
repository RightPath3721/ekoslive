import React, { useEffect, useState } from "react";
import { Box, IconButton, Modal } from "@mui/material";
import SaveIcon from "@mui/icons-material/Save";
import { useDispatch, useSelector } from "react-redux";
import { ekosliveServer } from "../../config";
import s from "@common/shared/i18n/i18n";
import { selectUser } from "@redux/selectors";
import InputField from "../../Components/InputField";
import { ekosActions } from "@redux/actions";
import { MetaType, planType } from "@indi/enums";
import { toast } from "react-toastify";
import { isEmpty, isEqual } from "lodash";
import { Palette } from "@common/shared/common/styles";

const SaveSequence = ({ close, saveJob, filename, setFilename }) =>
{
	return (
		<Modal
			open
			style={{ justifyContent: "center", borderWidth: 2, borderColor: "white" }}
			onClose={close}
			aria-labelledby="modal-modal-title"
			aria-describedby="modal-modal-description"
		>
			<Box sx={LOCAL_STYLES.modal}>
				<Box
					sx={{
						display: "flex",
						flexDirection: "row",
						gap: "10px",
						justifyContent: "center",
						alignItems: "center",
					}}
				>
					<InputField
						onChange={(e) => setFilename(e)}
						value={filename}
						placeholder={s.ekos.capture_file.filename}
					/>
					<Box sx={{ display: "flex", gap: "10px" }}>
						<IconButton
							disabled={isEmpty(filename)}
							onClick={async () =>
							{
								await saveJob(filename);
							}}
							sx={{ borderRadius: "4px", backgroundColor: "#2a2a2a" }}
						>
							<SaveIcon sx={{ color: Palette.white, fontSize: 30 }} />
						</IconButton>
					</Box>
				</Box>
			</Box>
		</Modal>
	);
};

const LOCAL_STYLES = {
	modal: {
		position: "absolute",
		top: "50%",
		left: "50%",
		transform: "translate(-50%, -50%)",
		backgroundColor: "#0f0e0e",
		border: "2px solid #000",
		boxShadow: 24,
		p: 4,
		display: "flex",
		flexDirection: "row",
		gap: "60px",
		justifyContent: "center",
		alignItems: "center",
	},
};

export default SaveSequence;
