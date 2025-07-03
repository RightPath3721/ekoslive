import React, { memo, useState } from "react";
import {
	Dialog,
	DialogTitle,
	DialogContent,
	DialogContentText,
	Box,
	IconButton,
} from "@mui/material";
import HelpOutlineIcon from "@mui/icons-material/HelpOutline";
import { Palette } from "@common/shared/common/styles";

const TooltipModal = ({ isOpen, onClose, title, content }) =>
{
	return (
		<Dialog open={isOpen} onClose={onClose}>
			<DialogTitle sx={{ fontWeight: "bold" }}>{title}</DialogTitle>
			<DialogContent>
				<DialogContentText sx={{ color: Palette.white70 }}>
					{content}
				</DialogContentText>
			</DialogContent>
		</Dialog>
	);
};

const Tooltip = ({ title, content }) =>
{
	const [showModal, setShowModal] = useState(false);

	return (
		<Box sx={{ p: 2 }}>
			<Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
				<IconButton
					size="small"
					color="primary"
					onClick={() => setShowModal(true)}
				>
					<HelpOutlineIcon fontSize="small" />
				</IconButton>
			</Box>

			<TooltipModal
				isOpen={showModal}
				onClose={() => setShowModal(false)}
				title={title}
				content={content}
			/>
		</Box>
	);
};

export default memo(Tooltip);
