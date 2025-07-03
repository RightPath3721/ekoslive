import React, { useState, useEffect, memo, Suspense } from "react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import isEmpty from "lodash/isEmpty";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";
import IconButton from "@mui/material/IconButton";
import Avatar from "@mui/material/Avatar";
import EditIcon from "@mui/icons-material/Edit";
import Image from "mui-image";
import { useTheme } from "@mui/system";
import AddIcon from "@mui/icons-material/Add";
import RemoveIcon from "@mui/icons-material/Remove";
import { Palette } from "@common/shared/common/styles";
import { ekosliveServer } from "@client/config";
import { selectUser } from "@redux/selectors";
import { useSocialStreamContext } from "@client/Pages/Community/SocialStreamContext";
import ReportAbuseModal from "./ReportAbuseModal";
import { Can } from "@components/providers/AclProvider";
import ChatIcon from "@client/icons/ChatIcon";
import LikeIcon from "@client/icons/LikeIcon";
import LikeFillIcon from "@client/icons/LikeFillIcon";
import BookmarkIcon from "@client/icons/BookmarkIcon";
import BookmarkFillIcon from "@client/icons/BookmarkFillIcon";
import ReportIcon from "@client/icons/ReportIcon";
import s from "@common/shared/i18n/i18n";
import AuthButtons from "@components/global/Header/AuthButtons";
import TabLoader from "@components/TabLoader";
import { nameConvertorForURL } from "@client/utils/nameConvertorForURL";
import { captureException } from "@sentry/browser";
import DeleteOutlineOutlinedIcon from "@mui/icons-material/DeleteOutlineOutlined";
import AlertDialog from "@components/AlertDialog";

const Comment = React.lazy(() => import("./Comment"));

const Post = ({ post, socialProfile, breadcrumbs }) =>
{
	const { palette } = useTheme();
	const [activeModal, setActiveModal] = useState("");
	const user = useSelector(selectUser);
	const [likes, setLikes] = useState(post.liked_by?.length);
	const [like, setLike] = useState(post.liked_by?.includes(socialProfile?._id));
	const [favorites, setFavorites] = useState(post.bookmarks?.length);
	const [favorite, setFavorite] = useState(
		post.bookmarks?.includes(socialProfile?._id),
	);
	const [isFollowing, setIsFollowing] = useState(
		socialProfile?.following.includes(post.posted_by?._id),
	);
	const [toggleComment, setToggleComment] = useState(false);
	const { setEditId, setPosts } = useSocialStreamContext();
	const [showReportModal, setShowReportModal] = useState(false);
	const [owner, setOwner] = useState(false);
	const [openDeleteModal, setOpenDeleteModal] = useState(false);

	const navigate = useNavigate();

	const handleToggleComments = () => {
		setToggleComment(prevState => !Boolean(prevState));
	};

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

	const handleClick = () =>
	{
		// Navigate to the new page
		navigate(`/community/post/${nameConvertorForURL(post.title) + '-' + post._id}/`, {
			state: breadcrumbs(post.title),
		});
	};

	const gotoUser = (username) =>
	{
		event.preventDefault();
		// Navigate to the new page
		navigate(`/community/${username}/`);
	};

	const handleEdit = () =>
	{
		setEditId(post._id);
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

	const handleFollowClick = async (followingProfileId, isFollower) =>
	{
		if (!followingProfileId || !user) return;

		try
		{
			await ekosliveServer.post(
				`/api/social/follow/${followingProfileId}?username=${encodeURIComponent(user.username)}&token=${user.token}&value=${!isFollower ? "0" : "1"}`,
			);
			setIsFollowing(isFollower);
		}
		catch (error)
		{
			captureException(error);
		}
	};

	useEffect(() =>
	{
		if (post && socialProfile?._id)
		{
			setLikes(post.liked_by?.length);
			setLike(post.liked_by?.includes(socialProfile?._id));
			setFavorites(post.bookmarks?.length);
			setFavorite(post.bookmarks?.includes(socialProfile?._id));
			setIsFollowing(socialProfile?.following.includes(post.posted_by?._id));
			if (post.posted_by?._id == socialProfile._id)
			{
				setOwner(true);
			}
		}
	}, [post, socialProfile]);

	return (
		<Card sx={{ backgroundColor: "#151515" }}>
			<CardContent>
				<Box
					sx={{
						display: "flex",
						flexDirection: "row",
						justifyContent: "space-between",
					}}
				>
					<Box sx={{ display: "flex", flexDirection: "row", mb: 2 }}>
						<Avatar
							alt={post.posted_by?.full_name}
							src={post.posted_by?.avatar}
							sx={{
								marginRight: 2,
								width: "50px",
								height: "50px",
								cursor: "pointer",
							}}
							onClick={() => gotoUser(post.posted_by?.social_nickname)}
						/>
						<Box sx={{ flexDirection: "column" }}>
							<Typography
								variant="h6"
								component="div"
								sx={{ color: palette.primary.main }}
							>
								{post.posted_by?.full_name}
							</Typography>
							<Typography variant="body2" sx={{ color: "white" }}>
								{post.posted_by?.social_nickname}
							</Typography>
						</Box>
					</Box>
					{socialProfile && !owner && (
						<IconButton
							sx={{ color: palette.primary.main }}
							onClick={() => handleFollowClick(post.posted_by?._id, isFollowing)}
						>
							{isFollowing ? (
								<RemoveIcon width="16px" height="16px" mr={1} />
							) : (
								<AddIcon width="16px" height="16px" mr={1} />
							)}
							<Typography
								variant="body2"
								sx={{
									color: isFollowing ? palette.grey[300] : palette.primary.main,
								}}
							>
								{isFollowing ? s.social.unfollow : s.social.follow}
							</Typography>
						</IconButton>
					)}
				</Box>

				<Box
					display="flex"
					justifyContent="center"
					alignItems="center"
					onClick={handleClick}
				>
					<Image
						src={post.image?.preview}
						alt="social_stream"
						duration={0.3}
						width="100%"
						key={post.image?._id}
						sx={{ borderRadius: "10px" }}
						showLoading={true}
					/>
				</Box>

				<Box
					display="flex"
					alignItems="center"
					justifyContent="space-between"
					sx={{ marginTop: 2 }}
				>
					<Box display="flex" alignItems="center">
						<IconButton
							onClick={handleLike}
							sx={{ color: palette.primary.main }}
						>
							{like ? (
								<LikeFillIcon
									width={24}
									height={24}
									color={palette.primary.main}
								/>
							) : (
								<LikeIcon width={24} height={24} color={palette.primary.main} />
							)}
						</IconButton>
						<Typography variant="body2" sx={{ color: "white", marginRight: 2 }}>
							{likes}
						</Typography>
						<IconButton
							onClick={handleToggleComments}
							sx={{ color: palette.primary.main }}
						>
							<ChatIcon width={24} height={24} color={palette.primary.main} />
						</IconButton>
						<Typography variant="body2" sx={{ color: "white", marginRight: 2 }}>
							{post.comments?.length || 0}
						</Typography>
						<IconButton
							onClick={handleFavorite}
							sx={{ color: palette.primary.main }}
						>
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
						<Typography variant="body2" sx={{ color: "white", marginRight: 2 }}>
							{favorites}
						</Typography>
					</Box>
					<Box display="flex" alignItems="center">
						<Can
							action="update"
							subject="Post"
							object={{ ...post, posted_by: post.posted_by?._id }}
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
								if (isEmpty(user))
								{
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

				<Box sx={{ flexDirection: "column", mt: 2 }}>
					<Typography
						variant="h5"
						component="div"
						sx={{ color: palette.white[900], mb: 2 }}
					>
						{post.title}
					</Typography>
					<div
						style={{ color: Palette.white }}
						dangerouslySetInnerHTML={{ __html: post.description }}
					/>
				</Box>

				{toggleComment && (
					<Suspense fallback={<TabLoader />}>
						<Comment
							precomments={post.comments}
							socialProfile={socialProfile}
							post={post}
						/>
					</Suspense>
				)}
			</CardContent>

			<AuthButtons mode={activeModal} setMode={setActiveModal}/>

			<ReportAbuseModal
				type="POST"
				resourceId={post._id}
				open={showReportModal}
				handleClose={() => setShowReportModal(false)}
			/>

			<AlertDialog
				show={openDeleteModal}
				close={handleCloseDeleteModal}
				handleDelete={handleDelete}
				title={s.general.confirm_delete}
				description={s.general.delete_post_description}
			/>
		</Card>
	);
};

export default memo(Post);
