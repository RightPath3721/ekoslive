import React, { Suspense, useCallback, useEffect, useState } from "react";
import axios from "axios";
import unionBy from "lodash/unionBy";
import { captureException } from "@sentry/browser";
import Grid from "@mui/material/Grid";
import usePostAPI from "@hooks/usePostAPI";
import { useProfileContext } from "./ProfileContext";
import useScrollPagination from "@hooks/useScrollPagination";
import AddPostGridItem from "./AddPostGridItem";
import { Lists } from "./ListSwitch";
import useActiveUser from "@hooks/useActiveUser";
import { ekosliveServer } from "@client/config";
import TabLoader from "@components/TabLoader";
import View from "@client/views/ViewPage/View";
import UploadForm from "@components/UploadPostForm";
import { Box, IconButton } from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import { useTheme } from "@mui/system";
import { useSocialStreamContext } from "../SocialStreamContext";
import { useSelector } from "react-redux";
import { Sync } from "@indi/enums";

const ListItem = React.lazy(() => import("./ListItem"));
// const GridRawImage = React.lazy(() => import("./GridRawImage"));
const GridItem = React.lazy(() => import("./GridItem"));
const AchievementsGridView = React.lazy(
	() => import("./Achievements/AchievementsGridView"),
);
const AchievementsListView = React.lazy(
	() => import("./Achievements/AchievementsListView"),
);

const ContentList = ({ list, listView }) =>
{
	const user = useActiveUser();
	const achievementsData = useSelector((state) => state.achievements);

	const { profile, currentUserProfile } = useProfileContext();
	const { getPostsByProfileId } = usePostAPI();
	const [page, setPage] = useState(0);
	const [itemsRemaining, setItemsRemaining] = useState(0);
	const { observeRef } = useScrollPagination({ setPage, itemsRemaining });
	const { palette } = useTheme();

	const [achievements, setAchievements] = useState([]);
	const [isFormOpen, setIsFormOpen] = useState(false);
	const { setEditId, editId, setPosts, posts } = useSocialStreamContext();

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

				return prev;
			});
		},
		[setPosts, editId],
	);

	const toggleFormState = useCallback(() =>
	{
		setIsFormOpen((p) => !p);
		setEditId(null);
	}, [setIsFormOpen, setEditId]);

	useEffect(() =>
	{
		setIsFormOpen(!!editId);
	}, [editId]);

	useEffect(() =>
	{
		if (!user) return;

		(async () =>
		{
			const url = `/api/sync?username=${encodeURIComponent(user.username)}&token=${user.token}`;
			try
			{
				const response = await ekosliveServer.post(url, {
					type: Sync.ACHIEVEMENT,
					data: Object.values(achievementsData).filter(
						(item) => item.status === true,
					),
				});
				setAchievements(response.data.payload);
			}
			catch (error)
			{
				captureException(error);
				setAchievements([]);
			}
		})();
	}, [user]);

	useEffect(() =>
	{
		(async () =>
		{
			try
			{
				if (list === Lists.POSTS)
				{
					if (!profile) return;
					const data = await getPostsByProfileId(profile._id, page, 15);
					setPosts((prevData) =>
						unionBy(prevData, data, "_id").filter((item) => !!item._id),
					);
					setItemsRemaining(data.length ?? 0);
				}
				else if (list === Lists.IMAGES)
				{
					if (!user) return;

					const { data } = await axios.get("/api/cloud/images", {
						params: { username: user.username, token: user.token },
					});
					if (!data.result)
					{
						setItemsRemaining(0);
						return;
					}
					setPosts(data.payload);
				}
			}
			catch (error)
			{
				setItemsRemaining(0);
				captureException(error);
			}
		})();
	}, [page, list, profile]);

	useEffect(() =>
	{
		if (profile?._id !== currentUserProfile?._id)
		{
			resetPosts();
		}
	}, [profile, currentUserProfile]);

	useEffect(() =>
	{
		setPage(0);
	}, [list]);

	const resetPosts = async () =>
	{
		if (list !== Lists.POSTS)
		{
			setPosts([]);
			setItemsRemaining(0);
			setPage(0);
			return;
		}

		try
		{
			const data = await getPostsByProfileId(profile._id, 0, 15);
			setPosts(data);
			setItemsRemaining(data.length ?? 0);
		}
		catch (error)
		{
			setItemsRemaining(0);
			captureException(error);
		}
	};

	if (list === Lists.ACHIEVEMENTS)
	{
		return (
			<Suspense fallback={<TabLoader />}>
				{listView === "grid" ? (
					<AchievementsGridView achievements={achievements} />
				) : (
					<AchievementsListView achievements={achievements} />
				)}
			</Suspense>
		);
	}
	else if (list === Lists.IMAGES)
	{
		return (
			<Suspense fallback={<TabLoader />}>
				<View active={true} />
			</Suspense>
		);
	}
	else
	{
		return (
			<Grid
				container
				sx={{
					display: "grid",
					gridTemplateColumns: `repeat(${listView === "grid" ? 4 : 1}, 1fr)`,
					gap: "1.5rem",
					marginTop: "1.5rem",
				}}
			>
				{listView === "grid" &&
					list === Lists.POSTS &&
					profile &&
					profile._id === currentUserProfile?._id && (
						<AddPostGridItem onUploadSubmit={onUploadSubmit} />
					)}
				{posts.map((item, idx) =>
				{
					return (
						<Suspense fallback={<TabLoader />} key={item._id ?? idx}>
							{listView === "grid" ? (
								<GridItem
									ref={
										list === Lists.POSTS && idx === posts.length - 1
											? observeRef
											: null
									}
									item={item}
								/>
							) : list === Lists.POSTS ? (
								<ListItem
									ref={idx === posts.length - 1 ? observeRef : null}
									post={item}
								/>
							) : null}
						</Suspense>
					);
				})}
				{listView === "list" &&
					list === Lists.POSTS &&
					profile &&
					profile._id === currentUserProfile?._id && (
						<Box
							sx={{
								position: "fixed",
								bottom: { xxs: "65px", sm: "24px" },
								right: { xxs: "16px", sm: "24px" },
								zIndex: 1000,
								width: { xxs: "40px", sm: "70px" },
								height: { xxs: "40px", sm: "70px" },
								borderRadius: "50%",
								backgroundColor: palette.primary.main,
								display: "flex",
								alignItems: "center",
								justifyContent: "center",
							}}
						>
							<IconButton
								id="feed_add"
								onClick={toggleFormState}
								sx={{ color: palette.white[900] }}
							>
								<AddIcon
									sx={{
										width: { xxs: "24px", sm: "40px" },
										height: { xxs: "24px", sm: "40px" },
									}}
								/>
							</IconButton>

							<UploadForm
								close={toggleFormState}
								open={isFormOpen}
								id={editId}
								submit={onUploadSubmit}
								mode={editId ? "edit" : "add"}
							/>
						</Box>
					)}
			</Grid>
		);
	}
};

export default ContentList;
