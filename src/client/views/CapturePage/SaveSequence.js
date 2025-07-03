import React from "react";
import { Box, IconButton, Modal } from "@mui/material";
import SaveIcon from "@mui/icons-material/Save";
import InputField from "../../Components/InputField";
import s from "@common/shared/i18n/i18n";
import { Palette } from "@common/shared/common/styles";

const SaveSequence = ({
	selectFileName,
	setSelectFileName,
	setFilename,
	filename,
	saveSequence,
}) =>
{
	return (
		<Modal
			open={selectFileName}
			style={{ justifyContent: "center", borderWidth: 2, borderColor: "white" }}
			onClose={() => setSelectFileName(false)}
			aria-labelledby="modal-modal-title"
			aria-describedby="modal-modal-description"
		>
			<Box sx={LOCAL_STYLES.modal}>
				<Box
					sx={{
						display: "flex",
						flexDirection: "column",
						gap: "10px",
						justifyContent: "center",
						alignItems: "center",
					}}
				>
					<Box sx={{ display: "flex", gap: "10px" }}>
						<InputField
							onChange={(e) => setFilename(e)}
							value={filename || ""}
							placeholder={s.ekos.capture_file.filename}
						/>
						<IconButton
							onClick={async () =>
							{
								saveSequence(filename);
								setSelectFileName(false);
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
