import React, { useState, useEffect, memo } from "react";
import { useSelector } from "react-redux";
import Typography from "@mui/material/Typography";
import TextField from "@mui/material/TextField";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import Box from "@mui/material/Box";
import IconButton from "@mui/material/IconButton";
import Avatar from "@mui/material/Avatar";
import Send from "@mui/icons-material/Send";
import DeleteOutlineOutlinedIcon from "@mui/icons-material/DeleteOutlineOutlined";
import { Palette } from "@common/shared/common/styles";
import { ekosliveServer } from "@client/config";
import { selectUser } from "@redux/selectors";
import { isEmpty } from "lodash";
import AuthButtons from "@components/global/Header/AuthButtons";
import { Can } from "@components/providers/AclProvider";
import ReportAbuseModal from "./ReportAbuseModal";
import { textFieldStyles } from "@client/shared/styles";
import ReportIcon from "@client/icons/ReportIcon";
import LikeIcon from "@client/icons/LikeIcon";
import LikeFillIcon from "@client/icons/LikeFillIcon";
import EditIcon from "@mui/icons-material/Edit";
import { useTheme } from "@mui/system";
import CommentEditModal from "../Moderation/CommentEditModal";

const convertNewlinesToBreaks = (text) =>
{
	return text.split("\n").map((part, index) => (
		<React.Fragment key={index}>
			{part}
			<br />
		</React.Fragment>
	));
};

const Comment = ({ precomments, socialProfile, post }) =>
{
	const { palette } = useTheme();
	const [activeModal, setActiveModal] = useState("");
	const user = useSelector(selectUser);
	const [comments, setComments] = useState(precomments);
	const [editComment, setEditComment] = useState();
	const [commentText, setCommentText] = useState("");
	const [selectedCommentId, setSelectedCommentId] = useState(null);
	const [showReportModal, setShowReportModal] = useState(false);
	const [showEditModal, setShowEditModal] = useState(false);

	useEffect(() =>
	{
		setComments(precomments);
	}, [precomments]);

	const handleCommentLike = async (commentId) =>
	{
		if (isEmpty(user))
		{
			setActiveModal("LOGIN");
		}
		else
		{
			const url = `/api/comments/like/${commentId}?username=${encodeURIComponent(user.username)}&token=${user.token}`;
			const response = await ekosliveServer.post(url, {
				likedBy: socialProfile._id,
			});
			if (typeof response.data === "boolean")
			{
				setComments((prevComments) =>
					prevComments.map((comment) =>
						comment._id === commentId
							? {
									...comment,
									liked_by: response.data
										? [...(comment.liked_by || []), socialProfile._id]
										: (comment.liked_by || []).filter(
												(id) => id !== socialProfile._id,
											),
								}
							: comment,
					),
				);
			}
		}
	};

	const handleCommentEdit = async (commentId) =>
	{
		setShowEditModal(true);
		const commentToEdit = comments.find((comment) => comment._id === commentId);
		setEditComment(commentToEdit);
		if (commentToEdit)
		{
			setCommentText(commentToEdit.content);
			setSelectedCommentId(commentId);
		}

	};

	const handleCommentChange = (e) =>
	{
		setCommentText(e.target.value);
	};

	const handleCommentDelete = async (commentId) =>
	{
		if (!user) return null;

		const updatedComments = comments.filter(
			(comment) => comment._id !== commentId,
		);
		setComments(updatedComments);

		const url = `/api/comments/${commentId}?username=${encodeURIComponent(user.username)}&token=${user.token}`;
		await ekosliveServer.delete(url);
	};

	const handleCommentSubmit = async (e) =>
	{
		e.preventDefault();
		if (!commentText.trim() || !user) return;
		
		if (selectedCommentId !== null)
		{
			setComments((prevComments) =>
				prevComments.map((comment) =>
					comment._id === selectedCommentId
						? { ...comment, content: commentText }
						: comment,
				),
			);
			const url = `/api/comments/${selectedCommentId}?username=${encodeURIComponent(user.username)}&token=${user.token}`;
			await ekosliveServer.patch(url, { content: commentText });
			setSelectedCommentId(null);
		}
		else
		{
			const url = `/api/comments?username=${encodeURIComponent(user.username)}&token=${user.token}`;
			const newComment = {
				postId: post._id,
				posted_by: socialProfile._id,
				content: commentText,
			};
			const response = await ekosliveServer.post(url, newComment);

			setComments([...comments, response.data]);
		}
		setCommentText("");
	};

	return (
		<>
			<List>
				{comments?.map((comment) =>
				{
					return (
						<ListItem
							key={comment._id}
							sx={{
								flexDirection: "column",
								alignItems: "flex-start",
								color: "white",
							}}
						>
							<Box
								sx={{
									display: "flex",
									justifyContent: "space-between",
									width: "100%",
									alignContent: "center",
								}}
							>
								<Box sx={{ display: "flex", flexDirection: "row" }}>
									<Avatar
										alt={comment.posted_by.social_nickname}
										src={comment.posted_by.avatar}
										sx={{ marginRight: 2, width: "24px", height: "24px" }}
									/>
									<Typography variant="body2" sx={{ color: "#ff6600" }}>
										{comment.posted_by.social_nickname}
									</Typography>
								</Box>
								<Box sx={{ display: "flex", alignItems: "center" }}>
									<IconButton onClick={() => handleCommentLike(comment._id)}>
										{Array.isArray(comment?.liked_by) &&
										comment.liked_by.includes(socialProfile?._id) ? (
											<LikeFillIcon width={16} height={16} />
										) : (
											<LikeIcon width={16} height={16} />
										)}
									</IconButton>
									<Typography
										variant="body2"
										sx={{ color: "white", marginRight: 2 }}
									>
										{comment.liked_by?.length || 0}
									</Typography>

									<IconButton
										onClick={() =>
										{
											if (isEmpty(user))
											{
												setActiveModal("LOGIN");
											} else {
												setShowReportModal(true);
												setSelectedCommentId(comment._id);
											}
										}}
										sx={{ color: "#ff6600", fontSize: "12px" }}
									>
										<ReportIcon width={16} height={16} />
									</IconButton>

									<Can
										action="update"
										subject="Comment"
										object={{ ...comment, posted_by: comment.posted_by._id }}
									>
										<IconButton
											onClick={() => handleCommentEdit(comment._id)}
											sx={{
												color: palette.primary.main
											}}
										>
											<EditIcon width={16} height={16}/>
										</IconButton>
									</Can>

									<Can
										action="delete"
										subject="Comment"
										object={{ ...comment, posted_by: comment.posted_by._id }}
									>
										<IconButton
											onClick={() => handleCommentDelete(comment._id)}
											sx={{
												color: palette.error.main
											}}
										>
											<DeleteOutlineOutlinedIcon width={16} height={16}/>
										</IconButton>
									</Can>
								</Box>
							</Box>
							<Typography sx={{ marginBottom: 1 }}>
								{convertNewlinesToBreaks(comment.content)}
							</Typography>
							<Box sx={{ flexDirection: "column", flexGrow: 1 }}>
								<Typography variant="body2" sx={{ color: "#ff6600" }}>
									{comment.posted_by.social_nickname}
								</Typography>
							</Box>
						</ListItem>
					);
				})}
			</List>
			{!isEmpty(user) && (
				<form onSubmit={handleCommentSubmit} style={{ position: "relative" }}>
					<TextField
						sx={{ ...textFieldStyles }}
						label="Write a comment"
						value={commentText}
						onChange={handleCommentChange}
						fullWidth
						multiline
					/>
					<IconButton
						type="submit"
						variant="contained"
						sx={{
							position: "absolute",
							right: "10px",
							top: "7px",
							color: Palette.orange,
						}}
					>
						<Send />
					</IconButton>
				</form>
			)}

			<AuthButtons mode={activeModal} setMode={setActiveModal}/>

			<ReportAbuseModal
				type="COMMENT"
				resourceId={selectedCommentId}
				open={showReportModal}
				handleClose={() => setShowReportModal(false)}
			/>

			<CommentEditModal 
				open={showEditModal}
				handleClose={() => setShowEditModal(false)}
				editData={editComment}
				setComments={setComments}
			/>
		</>
	);
};

export default memo(Comment);
