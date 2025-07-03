import React from "react";
import Grid from "@mui/material/Grid";
import Typography from "@mui/material/Typography";
import Paper from "@mui/material/Paper";
import Box from "@mui/material/Box";
import Image from "mui-image";
import { Palette } from "@common/shared/common/styles";
import { styles } from "@client/shared/styles";
import LikesCounter from "@components/LikesCounter";
import CommentsCounter from "@components/CommentsCounter";
import BookmarksCounter from "@components/BookmarksCounter";

const PostPreview = ({ post }) =>
{
	return (
		<Grid item alignItems="flex-start">
			<Paper
				sx={{
					display: "flex",
					flexDirection: "column",
					alignItems: "flex-start",
					gap: "0.75rem",
					padding: "0.5rem",
					border: `1px solid ${Palette.grey44}`,
					borderRadius: "6px",
				}}
			>
				<Typography component="p" textAlign="center" variant="caption">
					{post.title}
				</Typography>
				<Image
					src={post.image.thumbnail}
					alt={`thumbnail for ${post.title}`}
					width={200}
					height={200}
					duration={0.3}
				/>
				<div dangerouslySetInnerHTML={{ __html: post.description }} />
				<Box sx={[styles.center, { gap: ".5rem" }]}>
					<LikesCounter
						count={post.liked_by.length}
						liked={post.liked_by.includes(post._id)}
						toggleLike={() =>
						{}}
					/>
					<CommentsCounter
						count={post.comments.length}
						toggleCommentPopup={() =>
						{}}
					/>
					<BookmarksCounter
						count={post.bookmarks.length}
						isSaved={post.bookmarks.includes(post._id)}
						togglePostInBookmarks={() =>
						{}}
					/>
				</Box>
			</Paper>
		</Grid>
	);
};

export default PostPreview;
