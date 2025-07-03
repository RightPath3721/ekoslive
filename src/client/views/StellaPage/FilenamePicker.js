import React, { useState } from "react";
import Modal from "@mui/material/Modal";
import IconButton from "@mui/material/IconButton";
import Box from "@mui/material/Box";
import DownloadIcon from "@mui/icons-material/Download";
import InputField from "../../Components/InputField";
import s from "@common/shared/i18n/i18n";
import { styles } from "../../shared/styles";
import { Palette } from "@common/shared/common/styles";

const FilenamePicker = ({ onClose, download }) =>
{
	const [filename, setFilename] = useState("");

	return (
		<Modal open={true} onClose={onClose} sx={{ zIndex: 2000 }}>
			<Box
				sx={[
					styles.centerAbsolute,
					{
						backgroundColor: "rgb(16, 16, 16)",
						border: "1px solid #FFFCFA24",
						padding: "18px",
						borderRadius: "4px",
						margin: 0,
						boxSizing: "border-box",
						display: "flex",
						gap: "10px",
					},
				]}
			>
				<InputField
					clear={() => setFilename("")}
					onChange={(e) => setFilename(e)}
					value={filename || ""}
					placeholder={s.ekos.capture_file.filename}
				/>
				<IconButton
					onClick={() => download(filename)}
					sx={{ borderRadius: "4px", backgroundColor: "#2a2a2a" }}
				>
					<DownloadIcon sx={{ color: Palette.white, fontSize: 30 }} />
				</IconButton>
			</Box>
		</Modal>
	);
};

export default FilenamePicker;
