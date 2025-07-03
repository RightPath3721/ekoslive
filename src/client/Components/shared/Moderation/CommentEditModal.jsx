import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { captureException } from "@sentry/browser";
import { Modal, Box, Typography, TextField, Button } from "@mui/material";
import { textFieldStyles } from "@client/shared/styles";
import s from "@common/shared/i18n/i18n";
import { selectUser } from "@redux/selectors";
import { ekosliveServer } from "@client/config";
import SaveIcon from "@mui/icons-material/Save";
import Moderation from "@components/Moderation";
import { SubmissionStatus } from "@utils/status";
import { useTheme } from "@mui/material/styles";
import { Can } from "@components/providers/AclProvider";

const style = {
	position: "absolute",
	top: "50%",
	left: "50%",
	transform: "translate(-50%, -50%)",
	width: 600,
	boxShadow: 24,
	backgroundColor: "#151515",
	p: 4,
};

const CommentEditModal = ({
	open,
	handleClose,
	editData,
	setComments,
	reportData,
	handleOpenDeleteModal,
	handleOpenBanModal,
}) =>
{
	const { palette } = useTheme();
	const user = useSelector(selectUser);
	const [content, setContent] = useState("");
	const [submissionStatus, setSubmissionStatus] = useState(SubmissionStatus[1]);
	const [tags, setTags] = useState([]);
	const [note, setNote] = useState("");

	const handleSubmit = async () =>
	{
		if (!user) return null;

		try
		{
			const url = `/api/comments/${editData._id}?username=${encodeURIComponent(user.username)}&token=${user.token}`;
			const response = await ekosliveServer.patch(url, { content, submissionStatus, tags, note });
			if (setComments)
			{
				setComments((prevComments) =>
					prevComments.map((item) =>
						item._id === response.data._id ? {
							...item,
							content: response.data.content
						} : item,
					),
				);
			}
			handleClose();
		}
		catch (error)
		{
			captureException(error, {
				addAttachment: { commentId: editData._id, content },
			});
		}
	};

	useEffect(() =>
	{
		if (editData && editData.moderation_report)
		{
			setContent(editData.content);
			setSubmissionStatus(editData.moderation_report.submissionStatus);
			setTags(editData.moderation_report.tags);
			setNote(editData.moderation_report.note);
		}
	}, [editData]);

	return (
		<Modal
			open={open}
			onClose={handleClose}
			aria-labelledby="report-abuse-modal-title"
			aria-describedby="report-abuse-modal-description"
		>
			<Box sx={style}>
				<Typography id="report-abuse-modal-title" variant="h6" component="h2">
					{s.social.comment.comments}
				</Typography>

				<TextField
					sx={{ ...textFieldStyles }}
					label={s.social.comment.comments}
					multiline
					rows={4}
					value={content}
					onChange={(e) => setContent(e.target.value)}
					fullWidth
					margin="normal"
				/>

				<Box
					sx={{
						mt: 2,
						display: "flex",
						flexDirection: "column",
						width: "100%",
						gap: "10px",
					}}
				>
					<Box
						sx={{
							display: "flex",
							flexDirection: "row",
							width: "100%",
							gap: "10px",
						}}
					>
						<Button
							variant="contained"
							startIcon={<SaveIcon />}
							sx={{ backgroundColor: palette.primary.main, width: "50%" }}
							onClick={handleSubmit}
						>
							{s.general.save}
						</Button>
						<Button
							variant="outlined"
							sx={{ width: "50%" }}
							onClick={handleClose}
						>
							{s.general.cancel}
						</Button>
					</Box>
					<Can action="update" subject="ModeratingStatus">
						<Moderation
							submissionStatus={submissionStatus}
							setSubmissionStatus={setSubmissionStatus}
							tags={tags}
							setTags={setTags}
							note={note}
							setNote={setNote}
							reportData={reportData}
							handleOpenDeleteModal={handleOpenDeleteModal}
							handleOpenBanModal={handleOpenBanModal}
						/>
					</Can>
				</Box>
			</Box>
		</Modal>
	);
};

export default CommentEditModal;
