import React, { memo } from "react";
import { useSelector } from "react-redux";
import {
	Modal,
	Box,
	Typography,
	TextField,
	Button,
	MenuItem,
} from "@mui/material";
import { textFieldStyles } from "@client/shared/styles";
import s from "@common/shared/i18n/i18n";
import { selectUser } from "@redux/selectors";
import { ekosliveServer } from "@client/config";

const style = {
	position: "absolute",
	top: "50%",
	left: "50%",
	transform: "translate(-50%, -50%)",
	width: 400,
	boxShadow: 24,
	backgroundColor: "#151515",
	p: 4,
};

const ReportAbuseModal = ({ resourceId, open, handleClose, type = "POST" }) =>
{
	const user = useSelector(selectUser);
	const [reason, setReason] = React.useState("");
	const [additionalInfo, setAdditionalInfo] = React.useState("");

	const resetStatesAndClose = () =>
	{
		setReason("");
		setAdditionalInfo("");
		handleClose();
	};

	const handleSubmit = async () =>
	{
		if (!user) return null;
		
		const url = `/api/posts/abuse-report?username=${encodeURIComponent(user.username)}&token=${user.token}`;
		const body = {
			reason,
			comment: additionalInfo,
			resource_id: resourceId,
			type,
		};
		await ekosliveServer.post(url, body);
		resetStatesAndClose();
	};

	return (
		<Modal
			open={open}
			onClose={resetStatesAndClose}
			aria-labelledby="report-abuse-modal-title"
			aria-describedby="report-abuse-modal-description"
		>
			<Box sx={style}>
				<Typography id="report-abuse-modal-title" variant="h6" component="h2">
					{s.social.report_abuse.title}
				</Typography>
				<Typography id="report-abuse-modal-description" sx={{ mt: 2 }}>
					{s.social.report_abuse.description}
				</Typography>
        {type !== "EQUIPMENTMODEL" ? (
          <TextField
            sx={{ ...textFieldStyles }}
            select
            label="Reason"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            fullWidth
            margin="normal"
          >
            <MenuItem sx={{ color: "white" }} value="SPAM">
              {s.social.report_abuse.reason.spam}
            </MenuItem>
            <MenuItem sx={{ color: "white" }} value="HATE SPEECH">
              {s.social.report_abuse.reason.hate_speech}
            </MenuItem>
            <MenuItem sx={{ color: "white" }} value="INAPPROPRIATE CONTENT">
              {s.social.report_abuse.reason.inappropriate_content}
            </MenuItem>
            <MenuItem sx={{ color: "white" }} value="IMPERSONATION">
              {s.social.report_abuse.reason.impersonation}
            </MenuItem>
            <MenuItem sx={{ color: "white" }} value="VIOLATION OF TERMS">
              {s.social.report_abuse.reason.violation_of_terms}
            </MenuItem>
            <MenuItem sx={{ color: "white" }} value="PRIVACY VIOLATION">
              {s.social.report_abuse.reason.privacy_violation}
            </MenuItem>
            <MenuItem sx={{ color: "white" }} value="OTHER">
              Other
            </MenuItem>
          </TextField>
        ) : (
          <TextField
            sx={{ ...textFieldStyles }}
            select
            label="Reason"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            fullWidth
            margin="normal"
          >
            <MenuItem sx={{ color: "white" }} value="WRONG IMAGE">
              {s.social.report_abuse.reason.wrong_image}
            </MenuItem>
            <MenuItem sx={{ color: "white" }} value="WRONG METADATA">
              {s.social.report_abuse.reason.wrong_metadata}
            </MenuItem>
            <MenuItem sx={{ color: "white" }} value="OTHER">
              Other
            </MenuItem>
          </TextField>
        )}
				<TextField
					sx={{ ...textFieldStyles }}
					label="Additional information (optional)"
					multiline
					rows={4}
					value={additionalInfo}
					onChange={(e) => setAdditionalInfo(e.target.value)}
					fullWidth
					margin="normal"
				/>
				<Box
					sx={{ mt: 2, display: "flex", justifyContent: "flex-end", gap: 1 }}
				>
					<Button
						variant="contained"
						sx={{ background: "#ff6600" }}
						onClick={handleSubmit}
					>
						{s.social.report_abuse.title}
					</Button>
					<Button
						variant="contained"
						sx={{ background: "#ff6600" }}
						onClick={handleClose}
					>
						{s.general.cancel}
					</Button>
				</Box>
			</Box>
		</Modal>
	);
};

export default memo(ReportAbuseModal);
