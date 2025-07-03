import React, { useEffect, useState, memo, useRef, useCallback } from "react";
import { useSelector } from "react-redux";
import { isEmpty } from "lodash";
import { useNavigate, useLocation } from "react-router-dom";
import { captureException } from "@sentry/browser";
import Avatar from "@mui/material/Avatar";
import { Link } from "react-router-dom";
import Paper from "@mui/material/Paper";
import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Typography from "@mui/material/Typography";
import Grid from "@mui/material/Grid";
import Dialog from "@mui/material/Dialog";
import DialogContent from "@mui/material/DialogContent";
import IconButton from "@mui/material/IconButton";
import { selectUser } from "@redux/selectors";
import { ekosliveServer } from "@client/config";
import Comment from "../Community/Comment";
import InfoIcon from "@mui/icons-material/Info";
import EditIcon from "@mui/icons-material/Edit";
import s from "@common/shared/i18n/i18n";
import MetadataTable from "@components/MetadataTable";
import { Palette } from "@common/shared/common/styles";
import ChatIcon from "@client/icons/ChatIcon";
import LikeFillIcon from "@client/icons/LikeFillIcon";
import LikeIcon from "@client/icons/LikeIcon";
import BookmarkFillIcon from "@client/icons/BookmarkFillIcon";
import BookmarkIcon from "@client/icons/BookmarkIcon";
import EquipmentIcon from "@client/icons/EquipmentIcon";
import AcquisitionInfoIcon from "@client/icons/AcquisitionInfoIcon";
import ReportIcon from "@client/icons/ReportIcon";
import { useTheme } from "@mui/system";
import { useActivate } from "react-activation";
import { useBreadcrumbContext } from "@components/providers/BreadcrumbProvider";
import { Tooltip } from "@mui/material";
import ReportAbuseModal from "../Community/ReportAbuseModal";
import { useSocialStreamContext } from "@client/Pages/Community/SocialStreamContext";
import { Can } from "@components/providers/AclProvider";
import UploadForm from "@components/UploadPostForm";
import Moment from "react-moment";
import Image from "mui-image";
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import NavigateBeforeIcon from '@mui/icons-material/NavigateBefore';
import { nameConvertorForURL } from "@client/utils/nameConvertorForURL";
import DeleteOutlineOutlinedIcon from "@mui/icons-material/DeleteOutlineOutlined";
import AlertDialog from "@components/AlertDialog";
import AuthButtons from "@components/global/Header/AuthButtons";

const DetailView = ({ postID }) =>
{
	const { palette } = useTheme();
	const navigate = useNavigate();
	const [open, setOpen] = useState(false);
	const [activeModal, setActiveModal] = useState("");
	const user = useSelector(selectUser);
	const [post, setPost] = useState(null);
	const [socialProfile, setSocialProfile] = useState(null);
	const [comments, setComments] = useState([]);
	const [isAcquisitionViewOpen, setIsAcquisitionViewOpen] = useState(false);
	const [likes, setLikes] = useState(post?.liked_by.length);
	const [like, setLike] = useState(post?.liked_by.includes(socialProfile?._id));
	const [favorites, setFavorites] = useState(post?.bookmarks.length);
	const [favorite, setFavorite] = useState(
		post?.bookmarks.includes(socialProfile?._id),
	);
	const location = useLocation();
	const { setBreadcrumb } = useBreadcrumbContext();
	const [showReportModal, setShowReportModal] = useState(false);

	const breadcrumbs = location.state || {};
	const { setEditId, editId, setPosts } = useSocialStreamContext();
	const [isFormOpen, setIsFormOpen] = useState(false);
	const [openDeleteModal, setOpenDeleteModal] = useState(false);
	// const [currentIndex, setCurrentIndex] = useState(-1);

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

	useEffect(() =>
	{
		setBreadcrumb(breadcrumbs);
	}, [setBreadcrumb, location]);

	const commentsRef = useRef(null);

	const handleFavorite = async () =>
	{
		if (isEmpty(user))
		{
			setActiveModal("LOGIN");
		}
		else
		{
			const url = `/api/posts/favorite/${post._id}?username=${encodeURIComponent(user.username)}&token=${user.token}`;
			const response = await ekosliveServer.post(url, {
				bookedBy: socialProfile._id,
			});
			if (response.data == "booked")
			{
				setFavorites(favorites + 1);
				setFavorite(true);
			}
			else if (response.data == "unbooked")
			{
				setFavorites(favorites - 1);
				setFavorite(false);
			}
		}
	};

	const handleLike = async () =>
	{
		if (isEmpty(user))
		{
			setActiveModal("LOGIN");
		}
		else
		{
			const url = `/api/posts/like/${post._id}?username=${encodeURIComponent(user.username)}&token=${user.token}`;
			const response = await ekosliveServer.post(url, {
				likedBy: socialProfile._id,
			});
			if (typeof response.data === "boolean")
			{
				setLikes((prev) => (response.data ? prev + 1 : prev - 1));
				setLike(response.data);
			}
		}
	};

	const handleEdit = () =>
	{
		setEditId(post._id);
		setIsFormOpen(true);
	};

	const handleOpenDeleteModal = () =>
	{
		setOpenDeleteModal(true);
	};

	const handleDelete = async () =>
	{
		if (!user) return null;
		try
		{
			const url = `/api/posts/${post._id}?username=${encodeURIComponent(user.username)}&token=${user.token}`;
			const response = await ekosliveServer.delete(url);

			if (response.status === 200) {
				setPosts((prev) => prev.filter((p) => p._id !== post._id));
			}
			
			handleCloseDeleteModal();
		}
		catch (error)
		{
			captureException(error);
			handleCloseDeleteModal();
		}
	};

	const handleCloseDeleteModal = () =>
	{
		setOpenDeleteModal(false);
	};

	useEffect(() =>
	{
		// Function to check the URL hash
		const checkHash = () =>
		{
			if (window.location.hash === "#comments" && commentsRef.current)
			{
				commentsRef.current.scrollIntoView({ behavior: "smooth" });
			}
		};
		checkHash();

		window.addEventListener("hashchange", checkHash);
		return () =>
		{
			window.removeEventListener("hashchange", checkHash);
		};
	}, []);

	const handleClickOpen = () =>
	{
		setOpen(true);
	};

	const handleClose = () =>
	{
		setOpen(false);
	};

	const calIntegrationTime = (frame, duration) =>
	{
		const num = (val) => Number(val);
		const result = (num(frame) * num(duration)) / 3600;
		return result.toFixed(2);
	};

	const totalSum = (post?.image.metadata.filters || []).reduce((acc, item) =>
	{
		const itemIntegrationTime = calIntegrationTime(item.frames, item.duration);
		return acc + parseFloat(itemIntegrationTime);
	}, 0);

	useEffect(() =>
	{
		if (post && socialProfile)
		{
			setLikes(post.liked_by.length);
			setLike(post.liked_by.includes(socialProfile._id));
			setFavorites(post.bookmarks.length);
			setFavorite(post.bookmarks.includes(socialProfile._id));
		}
	}, [post, socialProfile]);

	/**
	 * Navigates to the model view page based on equipment type, manufacturer, and model.
	 *
	 * @param {string} equipmentType - The type of equipment.
	 * @param {string} manufacturer - The name of the manufacturer.
	 * @param {string} model - The name of the model.
	 */
	const goModelView = (equipmentType, manufacturer, model) =>
	{
		navigate(
			`/community/equipment/${nameConvertorForURL(equipmentType?.name) + '-' + equipmentType?._id}/${nameConvertorForURL(manufacturer?.name) + '-' + manufacturer?._id}/${nameConvertorForURL(model?.label) + '-' + model?._id}`,
		);
	};

	/**
	 * Fetches post data from the server based on the post ID.
	 *
	 * @returns {Promise<void>} - A Promise that resolves when the post data is fetched and set in the state.
	 * @async
	 */
	const fetchPost = async () =>
	{
		try
		{
			const url = `/api/posts/${postID}`;
			const response = await ekosliveServer.get(url);
			setPost(response.data);
			setComments(response.data.comments);
		}
		catch (error)
		{
			captureException(error);
		}
	};

	useEffect(() =>
	{
		fetchPost();
	}, []);

	useActivate(() => fetchPost());

	useEffect(() =>
	{
		if (!user) return;
		(async () =>
		{
			try
			{
				const { data } = await ekosliveServer.get(
					`/api/social?username=${encodeURIComponent(user.username)}&token=${user.token}`,
				);
				setSocialProfile(data.socialProfile);
			}
			catch (error)
			{
				captureException(error);
			}
		})();
	}, [user]);

	const navigateToAstrobin = () =>
	{
		window.open(post?.astrobinLink, "_blank", "noopener,noreferrer");
	};

	const handleNavigate = async (direction) => {
		try {
			const response = await ekosliveServer.get(`/api/posts/${direction}/${postID}`);
			if (response.data) {
				navigate(`/community/post/${nameConvertorForURL(response.data.title) + '-' + response.data._id}/`, {
					state: breadcrumbs,
					replace: true // This will replace the current history entry
				});
				setPost(response.data);
				setComments(response.data.comments);
			}
		} catch (error) {
			// Handle error - maybe show a toast notification
			console.error(`Error navigating to ${direction} post:`, error);
		}
	};

	return (
		<Box sx={{ minHeight: "100vh", p: 2 }}>
			<Grid container spacing={2}>
				{/* Main image section */}
				<Grid item xs={12} md={6}>
					<Paper elevation={3} sx={{ position: 'relative' }}>
						<Box sx={{ position: 'absolute', top: '50%', left: 0, right: 0, display: 'flex', justifyContent: 'space-between', px: 2, transform: 'translateY(-50%)', zIndex: 1 }}>
							<IconButton
								onClick={() => handleNavigate('next')}
								size="large"
								sx={{
									backgroundColor: 'rgba(0, 0, 0, 0.5)',
									'&:hover': { backgroundColor: 'rgba(0, 0, 0, 0.7)' }
								}}
							>
								<NavigateBeforeIcon fontSize="large" sx={{ color: palette.white[900] }} />
							</IconButton>
							<IconButton
								onClick={() => handleNavigate('previous')}
								size="large"
								sx={{
									backgroundColor: 'rgba(0, 0, 0, 0.5)',
									'&:hover': { backgroundColor: 'rgba(0, 0, 0, 0.7)' }
								}}
							>
								<NavigateNextIcon fontSize="large" sx={{ color: palette.white[900] }} />
							</IconButton>
						</Box>
						{post?.image?.preview && (
							<Image
								src={post.image.preview}
								alt={post?.title || ''}
								sx={{ width: "100%", height: "auto", borderRadius: "10px" }}
								onClick={handleClickOpen}
								showLoading={true}
							/>
						)}
					</Paper>
					<Box
						display="flex"
						alignItems="center"
						justifyContent="space-between"
						sx={{ marginTop: 2 }}
					>
						<Box display="flex" alignItems="center">
							<IconButton onClick={handleLike} sx={{ color: "#ff6600" }}>
								{like ? (
									<LikeFillIcon
										width={24}
										height={24}
										color={palette.primary.main}
									/>
								) : (
									<LikeIcon
										width={24}
										height={24}
										color={palette.primary.main}
									/>
								)}
							</IconButton>
							<Typography
								variant="body2"
								sx={{ color: "white", marginRight: 2 }}
							>
								{likes}
							</Typography>

							<IconButton sx={{ color: "#ff6600" }}>
								<ChatIcon width={24} height={24} color={palette.primary.main} />
							</IconButton>
							<Typography
								variant="body2"
								sx={{ color: "white", marginRight: 2 }}
							>
								{post?.comments.length || 0}
							</Typography>

							<IconButton onClick={handleFavorite} sx={{ color: "#ff6600" }}>
								{favorite ? (
									<BookmarkFillIcon
										width={24}
										height={24}
										color={palette.primary.main}
									/>
								) : (
									<BookmarkIcon
										width={24}
										height={24}
										color={palette.primary.main}
									/>
								)}
							</IconButton>
							<Typography
								variant="body2"
								sx={{ color: "white", marginRight: 2 }}
							>
								{favorites}
							</Typography>
						</Box>

						<Box display="flex" alignItems="center">
							<Can
								action="update"
								subject="Post"
								object={{ ...post, posted_by: post?.posted_by._id }}
							>
								<IconButton
									onClick={handleEdit}
									sx={{ color: palette.primary.main }}
								>
									<EditIcon />
								</IconButton>
								<IconButton
									onClick={handleOpenDeleteModal}
									sx={{ color: palette.error.main }}
								>
									<DeleteOutlineOutlinedIcon />
								</IconButton>
							</Can>
							<IconButton
								onClick={() => {
									if (!user) {
										setActiveModal("LOGIN");
									} else {
										setShowReportModal(true)
									}
								}}
								sx={{ color: palette.primary.main }}
							>
								<ReportIcon width={24} height={24} />
							</IconButton>
						</Box>
					</Box>

					<Typography variant="h6" gutterBottom>
						{post?.title}
					</Typography>
					<div
						style={{ color: Palette.white }}
						dangerouslySetInnerHTML={{ __html: post?.description }}
					/>
				</Grid>

				<Grid item xs={12} md={6}>
					<Card
						sx={{
							mb: 2,
							background: palette.black[700],
							border: `1px solid ${palette.grey[300]}`,
							borderRadius: "20px",
						}}
					>
						<CardContent
							sx={{
								position: "relative",
								display: "flex",
								flexDirection: "row",
								justifyContent: "space-between",
							}}
						>
							<Box sx={{ display: "flex" }}>
								<Avatar
									alt={post?.posted_by.full_name}
									src={post?.posted_by.avatar}
									sx={{ marginRight: 2, width: "50px", height: "50px" }}
								/>
								<Box sx={{ flexDirection: "column" }}>
									<Typography variant="h6" component="div">
										{post?.posted_by.full_name}
									</Typography>
									<Link
										to={`/community/${post?.posted_by.social_nickname.slice(1)}`}
										variant="body2"
										style={{
											color: palette.primary.main,
											cursor: "pointer",
											textDecoration: "none",
										}}
										onMouseEnter={(e) =>
											(e.currentTarget.style.textDecoration = "underline")
										}
										onMouseLeave={(e) =>
											(e.currentTarget.style.textDecoration = "none")
										}
									>
										{post?.posted_by.social_nickname}
									</Link>
								</Box>
							</Box>
							<Typography
								component="h4"
								variant="body2"
								sx={{
									position: "absolute",
									bottom: "5px",
									right: "10px",
								}}
							>
								<Moment format="YYYY.MM.DD HH:mm">{post?.createdAt}</Moment>
							</Typography>
							{post?.astrobinLink && (
								<Box
									sx={{
										width: 40,
										height: 40,
										backgroundColor: `${palette.white[900]}33`,
										borderRadius: "50%",
										display: "inline-grid",
										placeItems: "center",
										color: "inherit",
										mr: 2,
										cursor: "pointer",
									}}
									onClick={() => navigateToAstrobin()}
								>
									<img src="/public/icons/astrobin.webp" alt="astrobin" />
								</Box>
							)}
						</CardContent>
					</Card>
					<Card
						sx={{
							mb: 2,
							background: palette.black[700],
							border: `1px solid ${palette.grey[300]}`,
							borderRadius: "20px",
						}}
					>
						<CardContent>
							<Box sx={{ display: "flex" }}>
								<Box
									sx={{
										width: 32,
										height: 32,
										backgroundColor: `${palette.white[900]}33`,
										borderRadius: "50%",
										display: "inline-grid",
										placeItems: "center",
										color: "inherit",
										mr: 2,
									}}
								>
									<EquipmentIcon width={19} height={19} />
								</Box>
								<Typography variant="h6" gutterBottom>
									{s.connect.equipment}
								</Typography>
							</Box>
							{post?.image?.metadata?.equipment_profile?.equipments?.map(
								(item, index) =>
								{
									return (
										<Typography key={index} variant="body2">
											{item.equipment_type.name}:{" "}
											<span
												style={{
													color: palette.primary.main,
													cursor: "pointer",
													textDecoration: "none",
												}}
												onMouseEnter={(e) =>
													(e.currentTarget.style.textDecoration = "underline")
												}
												onMouseLeave={(e) =>
													(e.currentTarget.style.textDecoration = "none")
												}
												onClick={() =>
												{
													goModelView(
														item.equipment_type,
														item.manufacturer,
														item,
													);
												}}
											>
												{item.label}
											</span>
										</Typography>
									);
								},
							)}
						</CardContent>
					</Card>
					<Card
						sx={{
							mb: 2,
							background: palette.black[700],
							border: `1px solid ${palette.grey[300]}`,
							borderRadius: "20px",
						}}
					>
						<CardContent>
							<Box
								sx={{
									display: "flex",
									justifyContent: "space-between",
									alignItems: "center",
								}}
							>
								<Box sx={{ display: "flex" }}>
									<Box
										sx={{
											width: 32,
											height: 32,
											backgroundColor: `${palette.white[900]}33`,
											borderRadius: "50%",
											display: "inline-grid",
											placeItems: "center",
											color: "inherit",
											mr: 2,
										}}
									>
										<AcquisitionInfoIcon width={19} height={19} />
									</Box>
									<Typography variant="h6" gutterBottom>
										{s.general.acquisition_details}
									</Typography>
								</Box>

								<Box
									sx={{ display: "flex", flexDirection: "row", gap: "10px" }}
								>
									{post?.image?.metadata?.additional_metadata && (
										<IconButton
											sx={{ padding: 0 }}
											onClick={() =>
												setIsAcquisitionViewOpen((prevValue) => !prevValue)
											}
										>
											<InfoIcon
												sx={[
													{
														color: isAcquisitionViewOpen
															? palette.primary.main
															: palette.white[900],
														fontSize: 18,
													},
												]}
											/>
										</IconButton>
									)}
									{totalSum > 0 && (
										<Tooltip title={`${totalSum.toFixed(2)} hours`}>
											<Typography
												variant="body2"
												sx={{
													padding: "0px 5px",
													background: palette.primary.main,
													borderRadius: "5px",
												}}
											>
												{totalSum.toFixed(2)}
											</Typography>
										</Tooltip>
									)}
								</Box>
							</Box>
							{post?.image.metadata.filters?.map((item, index) =>
							{
								return (
									<Box
										sx={{
											display: "flex",
											flexDirection: "row",
											justifyContent: "space-between",
										}}
										key={index}
									>
										<Typography variant="body2">
											<span
												style={{
													color: palette.primary.main,
													cursor: "pointer",
													textDecoration: "none",
												}}
												onMouseEnter={(e) =>
													(e.currentTarget.style.textDecoration = "underline")
												}
												onMouseLeave={(e) =>
													(e.currentTarget.style.textDecoration = "none")
												}
												onClick={() =>
												{
													const equipment =
														post.image.metadata.equipment_profile.equipments.find(
															(equipment) => equipment.label === item.label,
														);
													if (equipment)
													{
														goModelView(
															equipment.equipment_type,
															equipment.manufacturer,
															equipment,
														);
													}
												}}
											>
												{item.label ? `${item.label} : ` : ""}
											</span>
											{item.frames &&
												item.duration &&
												`${item.frames}X${item.duration}'`}{" "}
											{item.binning &&
												`${s.general.binning}-
											${item.binning}`}{" "}
											{item.gain && `${s.general.gain}-${item.gain}`}
										</Typography>
										<Tooltip
											title={`${calIntegrationTime(item.frames, item.duration)} hours`}
										>
											<Typography
												key={index}
												variant="body2"
												sx={{
													padding: "0px 5px",
													background: `${palette.white[900]}33`,
													borderRadius: "5px",
												}}
											>
												{item.frames &&
													item.duration &&
													calIntegrationTime(item.frames, item.duration)}
											</Typography>
										</Tooltip>
									</Box>
								);
							})}

							<MetadataTable
								metadata={post?.image?.metadata?.additional_metadata ?? {}}
								onClose={() => setIsAcquisitionViewOpen(false)}
								open={isAcquisitionViewOpen}
							/>
						</CardContent>
					</Card>

					<Card
						sx={{
							mb: 2,
							background: palette.black[700],
							border: `1px solid ${palette.grey[300]}`,
							borderRadius: "20px",
						}}
						ref={commentsRef}
					>
						<CardContent>
							<Box sx={{ display: "flex" }}>
								<Box
									sx={{
										width: 32,
										height: 32,
										backgroundColor: `${palette.white[900]}33`,
										borderRadius: "50%",
										display: "inline-grid",
										placeItems: "center",
										color: "inherit",
										mr: 2,
									}}
								>
									<ChatIcon width={19} height={19} />
								</Box>
								<Typography variant="h6" gutterBottom>
									{s.social.comment.comments}
								</Typography>
							</Box>
							{isEmpty(comments) && (
								<Typography variant="body2" gutterBottom>
									{s.social.comment.no_comment}
								</Typography>
							)}
							<Comment
								precomments={comments}
								socialProfile={socialProfile}
								post={post}
							/>
						</CardContent>
					</Card>
				</Grid>
			</Grid>

			<Dialog open={open} onClose={handleClose} maxWidth="lg" fullWidth={true}>
				<DialogContent sx={{ p: 0, m: 0 }}>
					<img
						src={post?.image.preview}
						alt={post?.title}
						style={{ width: "100%", height: "auto" }}
						onClick={handleClose}
					/>
				</DialogContent>
			</Dialog>

			<ReportAbuseModal
				type="POST"
				resourceId={post?._id}
				open={showReportModal}
				handleClose={() => setShowReportModal(false)}
			/>

			<AuthButtons mode={activeModal} setMode={setActiveModal}/>

			<UploadForm
				close={toggleFormState}
				open={isFormOpen}
				id={editId}
				submit={onUploadSubmit}
				mode={editId ? "edit" : "add"}
			/>

			<AlertDialog
				show={openDeleteModal}
				close={handleCloseDeleteModal}
				handleDelete={handleDelete}
				title={s.general.confirm_delete}
				description={s.general.delete_post_description}
			/>
		</Box>
	);
};

export default memo(DetailView);
