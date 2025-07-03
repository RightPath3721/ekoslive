import React, {
	forwardRef,
	Suspense,
	useCallback,
	useEffect,
	useState,
} from "react";
import isEmpty from "lodash/isEmpty";
import Box from "@mui/material/Box";
import IconButton from "@mui/material/IconButton";
import AddIcon from "@mui/icons-material/Add";
import { useTheme } from "@mui/system";
import UploadForm from "@components/UploadPostForm";
import useActiveUser from "@hooks/useActiveUser";
import usePostAPI from "@hooks/usePostAPI";
import { useSocialStreamContext } from "../SocialStreamContext";
import ToggleViewButtons from "@components/ToggleViewButtons";
import TabsView from "@components/TabsView";
import { styles } from "@client/shared/styles";
import TabLoader from "@components/TabLoader";

const SocialStream = React.lazy(() => import("@components/shared/Community"));
const GalleryView = React.lazy(() => import("../GalleryView"));

export const Lists = {
	ALL: 0,
	FOLLOWING: 1,
	BOOKED: 2,
};

const PostsView = forwardRef(({}, ref) =>
{
	const { palette } = useTheme();
	const [view, setView] = useState("grid");
	const user = useActiveUser();
	const [isFormOpen, setIsFormOpen] = useState(false);
	const { getStreamPosts, getPostsByBooked, getPostsByFollowing } =
		usePostAPI();
	const { setPosts, setEditId, editId, tabValue, setTabValue } =
		useSocialStreamContext();

	const toggleView = useCallback(
		() => setView((p) => (p === "grid" ? "list" : "grid")),
		[setView],
	);

	const handleTabValueChange = (_, value) =>
	{
		if (value !== null)
		{
			setTabValue(value);
		}
	};

	const breadcrumbs = (postTitle) =>
	{
		return [
			{
				name: "Community",
				link: "/community",
			},
			{
				name: "Feed",
				link: "/community",
			},
			{
				name: postTitle,
				link: "/community",
			},
		];
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

				return prev;
			});
		},
		[setPosts, editId],
	);

	const getAllPosts = async (signal) =>
	{
		const data = await getStreamPosts(undefined, undefined, signal);
		if (!signal || !signal.aborted) {
			setPosts(data);
		}
	};
	const getFollowingPosts = async (signal) =>
	{
		const data = await getPostsByFollowing(undefined, undefined, signal);
		if (!signal || !signal.aborted) {
			setPosts(data);
		}
	};
	const getBookedPosts = async (signal) =>
	{
		const data = await getPostsByBooked(undefined, undefined, signal);
		if (!signal || !signal.aborted) {
			setPosts(data);
		}
	};

	useEffect(() =>
	{
		const controller = new AbortController();
		const signal = controller.signal;
		
		switch (tabValue)
		{
			case 0:
				getAllPosts(signal);
				break;
			case 1:
				getFollowingPosts(signal);
				break;
			case 2:
				getBookedPosts(signal);
				break;
			default:
				break;
		}

		// Abort any in-flight requests when tab changes or component unmounts
		return () => {
			controller.abort();
		};
	}, [tabValue]);

	useEffect(() =>
	{
		setIsFormOpen(!!editId);
	}, [editId]);

	useEffect(() =>
	{
		if (!user) setTabValue(Lists.ALL);
	}, [user]);

	return (
		<>
			<Box
				sx={[
					styles.center,
					{
						width: "100%",
						justifyContent: user ? "space-between" : "flex-end",
						paddingInline: ".75rem",
						paddingBlock: ".5rem",
					},
				]}
			>
				{user && (
					<TabsView
						tabValue={tabValue}
						handleChange={handleTabValueChange}
						tabs={[
							{ value: Lists.ALL, label: "All", id: "feed_all" },
							{
								value: Lists.FOLLOWING,
								label: "Following",
								id: "feed_following",
							},
							{
								value: Lists.BOOKED,
								label: "Saved Posts",
								id: "feed_saved",
							},
						]}
						isScrollable={false}
					/>
				)}
				<ToggleViewButtons toggleView={toggleView} view={view} />
			</Box>
			<Suspense fallback={<TabLoader />}>
				{view === "grid" ? (
					<GalleryView breadcrumbs={breadcrumbs} ref={ref} />
				) : (
					<SocialStream ref={ref} breadcrumbs={breadcrumbs} />
				)}
			</Suspense>
			{!isEmpty(user) && (
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
		</>
	);
});

export default PostsView;
