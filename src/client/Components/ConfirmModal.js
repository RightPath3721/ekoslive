import React, { memo } from "react";
import {
	Box,
	Typography,
	Modal,
	Button,
} from "@mui/material";
import s from "@common/shared/i18n/i18n";

const ConfirmModal = ({openModal, handleCloseModal, handleYes, title, description}) =>
{
	return (
		<Modal
			open={openModal}
			onClose={handleCloseModal}
			aria-labelledby="approve-modal-title"
			aria-describedby="approve-modal-description"
		>
			<Box
				sx={{
					position: "absolute",
					top: "50%",
					left: "50%",
					transform: "translate(-50%, -50%)",
					background: "#111111",
					boxShadow: 24,
					p: 4,
				}}
			>
				<Typography
					sx={{ color: "#ff6600" }}
					id="approve-modal-title"
					variant="h6"
					component="h2"
				>
					{title}
				</Typography>
				<Typography
					sx={{ color: "white", mt: 2 }}
					id="approve-modal-description"
				>
					{description}
				</Typography>
				<Box sx={{ mt: 3, display: "flex", justifyContent: "space-between" }}>
					<Button onClick={handleCloseModal} variant="contained" color="error">
						{s.general.no}
					</Button>
					<Button onClick={handleYes} variant="contained" color="success">
						{s.general.yes}
					</Button>
				</Box>
			</Box>
		</Modal>
	);
};

export default memo(ConfirmModal);
