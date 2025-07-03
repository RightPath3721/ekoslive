import React, {
	useState,
	useEffect,
	useCallback,
	useRef,
	forwardRef,
	useImperativeHandle,
} from "react";
import unionBy from "lodash/unionBy";
import { useNavigate, Link } from "react-router-dom";
import Image from "mui-image";
import Box from "@mui/material/Box";
import ImageList from "@mui/material/ImageList";
import ImageListItem from "@mui/material/ImageListItem";
import CircularProgress from "@mui/material/CircularProgress";
import MuiLink from "@mui/material/Link";
import axios from "axios";
import { useSocialStreamContext } from "../SocialStreamContext";
import UploadForm from "@components/UploadPostForm";
import usePostAPI from "@hooks/usePostAPI";
import { Avatar, Typography } from "@mui/material";
import Moment from "react-moment";
import { nameConvertorForURL } from "@client/utils/nameConvertorForURL";

const GalleryView = forwardRef(({ breadcrumbs }, ref) =>
{
	const navigate = useNavigate();
	const [isFormOpen, setIsFormOpen] = useState(false);
	const { setPosts, posts, setEditId, editId, tabValue } =
		useSocialStreamContext();
	const [loading, setLoading] = useState(false);
	const [initialLoad, setInitialLoad] = useState(true);
	const [nextPage, setNextPage] = useState(1);
	const [hasMore, setHasMore] = useState(true);
	const { getStreamPosts, getPostsByFollowing, getPostsByBooked } =
		usePostAPI();
	const observer = useRef();

	const handleClick = (postID, postTitle) =>
	{
		// Navigate to the new page
		navigate(`/community/post/${nameConvertorForURL(postTitle) + '-' + postID}/`, { state: breadcrumbs(postTitle) });
	};

	const toggleFormState = useCallback(() =>
	{
		setIsFormOpen((p) => !p);
		setEditId(null);
	}, [setIsFormOpen, setEditId]);

	const onUploadSubmit = useCallback(
		(post) =>
		{
			setPosts((prev) =>
			{
				// Case 3: Remove the post when the status is "PENDING" and editId matches post._id
				if (post === "PENDING" && editId)
				{
					return prev.filter((p) => p._id !== editId);
				}

				if (post._id)
				{
					const postIndex = prev.findIndex((p) => p._id === post._id);

					// Case 2: Update the existing post with the same _id
					if (postIndex !== -1)
					{
						const updatedPosts = [...prev];
						updatedPosts[postIndex] = post;
						return updatedPosts;
					}

					// Case 1: Prepend the new post
					return [post, ...prev];
				}
			});
		},
		[setPosts, editId],
	);

	// Create a ref to store the current AbortController
	const currentAbortControllerRef = useRef();

	useEffect(() =>
	{
		setIsFormOpen(!!editId);
	}, [editId]);

	// Cleanup on component unmount
	useEffect(() => {
		return () => {
			if (currentAbortControllerRef.current) {
				currentAbortControllerRef.current.abort();
			}
		};
	}, []);
	
	// Reset state and abort previous requests when tab changes
	useEffect(() => {
		if (currentAbortControllerRef.current) {
			currentAbortControllerRef.current.abort();
		}
		setNextPage(1);
		setHasMore(true);
		setInitialLoad(true);
	}, [tabValue]);
	
	const fetchPosts = useCallback(async (pageNumber) =>
	{
		// Abort previous request if it exists
		if (currentAbortControllerRef.current) {
			currentAbortControllerRef.current.abort();
		}
		
		// Create a new AbortController for this request
		const controller = new AbortController();
		currentAbortControllerRef.current = controller;
		const signal = controller.signal;
		setLoading(true);
		let data = [];

		try {
			switch (tabValue)
			{
				case 0:
					if (pageNumber >= 1)
					{
						data = await getStreamPosts(pageNumber, undefined, signal);
					}
					break;
				case 1:
					if (pageNumber === 1)
					{
						data = await getPostsByFollowing(pageNumber, undefined, signal);
					}
					break;
				case 2:
					if (pageNumber === 1)
					{
						data = await getPostsByBooked(pageNumber, undefined, signal);
					}
					break;
				default:
					break;
			}
			
			// Check if the request was aborted before updating state
			if (signal.aborted) return;
			
			setPosts((prevPosts) => unionBy(prevPosts, data, "_id"));
			if (data.length === 0)
			{
				setHasMore(false);
			}
			else
			{
				setNextPage((prevPage) => prevPage + 1);
			}
		} catch (error) {
			// Skip state updates if request was aborted
			if (axios.isCancel(error) || signal.aborted) return;
			console.error("Error fetching posts:", error);
		} finally {
			if (!signal.aborted) {
				setInitialLoad(false);
				setLoading(false);
			}
		}
	}, [tabValue, getStreamPosts, getPostsByFollowing, getPostsByBooked]);


	const lastPostRef = useCallback(
		(node) =>
		{
			if (loading) return;
			if (observer.current) observer.current.disconnect();
			observer.current = new IntersectionObserver((entries) =>
			{
				if (entries[0].isIntersecting && hasMore)
				{
					fetchPosts(nextPage);
				}
			});
			if (node) observer.current.observe(node);
		},
		[loading, hasMore, nextPage, fetchPosts],
	);

	useImperativeHandle(ref, () =>
	{
		return () =>
		{
			fetchPosts(1);
		};
	}, [fetchPosts]);

	return (
		<ImageList
			sx={{
				width: "100%",
				transform: "translateZ(0)",
				gap: ".5rem",
				padding: "1rem",
			}}
			cols={4}
			gap={16}
		>
			{posts.map((post, index) =>
			{
				return (
					<ImageListItem
						key={post._id}
						cols={1}
						rows={1}
						sx={{
							position: "relative",
							overflow: "hidden",
							transition: "transform .2s ease-in-out, opacity .2s ease-in-out",
							cursor: "pointer",
							":hover": {
								transform: "scale(1.05)",
								"& .hover-overlay": {
									opacity: 1,
								},
							},
						}}
						ref={
							index === posts.length - 1 && tabValue === 0 ? lastPostRef : null
						}
						role="link"
					>
						<MuiLink
							to={`/community/${post.posted_by.social_nickname?.replace?.("@", "")}`}
							component={Link}
							sx={{
								position: "absolute",
								zIndex: 1,
								top: ".5rem",
								right: ".5rem",
								boxShadow: "0 4px 8px rgba(0, 0, 0, 0.2)",
								display: "inline-block",
								zIndex: 2,
								transition: "transform .2s ease, opacity .2s ease",
								cursor: "pointer",
								"& .hover-avatar-overlay": {
									opacity: 0,
								},
								":hover": {
									transform: "scale(1.1)",
									opacity: 0.9,
									"& .hover-avatar-overlay": {
										opacity: 1,
									},
								},
							}}
						>
							<Avatar
								alt={post.posted_by.full_name}
								src={post.posted_by.avatar}
								sx={{
									width: "40px",
									height: "40px",
								}}
								component="span"
							/>

							<Typography
								className="hover-avatar-overlay"
								sx={{
									position: "absolute",
									bottom: 0,
									right: 0,
									transform: "translateY(100%)",
									bgcolor: "rgba(0, 0, 0, 0.6)",
									transition: "opacity 0.3s ease",
									borderRadius: "10px",
									pointerEvents: "none",
									display: "inline-block",
									zIndex: 2,
								}}
								component="span"
								variant="body2"
							>
								{post.posted_by.full_name}
							</Typography>
						</MuiLink>
						<Image
							src={post.image.thumbnail}
							alt={post.title}
							loading="lazy"
							duration={0.2}
							onClick={() => handleClick(post._id, post.title)}
							showLoading={true}
							style={{
								width: "100%",
								aspectRatio: 1,
								transition: "transform 0.3s ease",
								borderRadius: "10px",
								background: "transparent",
							}}
						/>
						<Box
							className="hover-overlay"
							sx={{
								position: "absolute",
								inset: 0,
								display: "flex",
								flexDirection: "column",
								justifyContent: "center",
								alignItems: "center",
								color: "common.white",
								bgcolor: "rgba(0, 0, 0, 0.5)",
								opacity: 0,
								transition: "opacity 0.3s ease",
								borderRadius: "10px",
								pointerEvents: "none",
							}}
						>
							<Typography
								component="h4"
								variant="h1"
								sx={{
									whiteSpace: "normal",
									overflowWrap: "break-word",
									wordBreak: "break-all",
									maxWidth: "76%",
								}}
							>
								{post.title}
							</Typography>
							<Typography
								component="h4"
								variant="body2"
								sx={{
									position: "absolute",
									bottom: "5px",
									right: "10px"
								}}
							>
								<Moment fromNow ago>
									{post.createdAt}
								</Moment>{" "}
								ago
							</Typography>
						</Box>

					</ImageListItem>
				);
			})}

			{(loading || initialLoad) && (
				<Box display="flex" justifyContent="center" alignItems="center" mt={2}>
					<CircularProgress sx={{ color: "primary.main" }} />
				</Box>
			)}

			<UploadForm
				close={toggleFormState}
				open={isFormOpen}
				id={editId}
				submit={onUploadSubmit}
				mode={editId ? "edit" : "add"}
			/>
		</ImageList>
	);
});

export default GalleryView;
