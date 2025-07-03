import * as React from "react";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogContentText from "@mui/material/DialogContentText";
import DialogTitle from "@mui/material/DialogTitle";
import Box from "@mui/material/Box";
import useMediaQuery from "@mui/material/useMediaQuery";
import { useTheme } from "@mui/material/styles";
import s from "@common/shared/i18n/i18n";
import { Palette } from "@common/shared/common/styles";
import Warning from "@client/icons/Warning";

/**
 * Description placeholder.
 * @param {*} props - Component props.
 * @param {boolean} props.show - Indicates whether the dialog is open or not.
 * @param {Function} props.close - Function to close dialog.
 * @param {Function} props.handleDelete - Function to submit action.
 * @param {string} props.description - Description content for dialog.
 * @param {string} props.title - Dialog title.
 * @param {boolean} [props.yes=false] - Change text on confirm button, yes or delete.
 * @returns {React.JSX} - Кeturns modal alert for either submit or discard action.
 */
export default function AlertDialog({
	show,
	close,
	handleDelete,
	description,
	title,
	yes = false,
	icon,
	type = "warning"
})
{
	const theme = useTheme();
	const fullScreen = useMediaQuery(theme.breakpoints.down("md"));

	return (
		<Dialog fullScreen={fullScreen} open={show} onClose={close}>
			<Box sx={{ display: "flex", marginLeft: "10px", alignItems: "center" }}>
				{icon ? (
					icon
				) : (
					<Warning color={Palette.red} width="24px" height="24px" />
				)}
				<DialogTitle color={type === "warning" ? Palette.red : Palette.orange} fontWeight={600}>
					{title || ""}
				</DialogTitle>
			</Box>
			<DialogContent>
				<DialogContentText sx={{ color: "common.white" }}>
					{description || ""}
				</DialogContentText>
			</DialogContent>
			<DialogActions>
				<Button variant="outlined" autoFocus onClick={close}>
					{s.general.cancel}
				</Button>
				<Button
					variant="contained"
					color="error"
					onClick={handleDelete}
					autoFocus
				>
					{yes ? s.general.yes : s.general.delete}
				</Button>
			</DialogActions>
		</Dialog>
	);
}
