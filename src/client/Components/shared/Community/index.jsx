import React, {
	useState,
	useEffect,
	useCallback,
	useRef,
	forwardRef,
	useImperativeHandle,
} from "react";
import axios from "axios";
import { captureException } from "@sentry/browser";
import unionBy from "lodash/unionBy";
import Container from "@mui/material/Container";
import Grid from "@mui/material/Grid";
import CircularProgress from "@mui/material/CircularProgress";
import Box from "@mui/material/Box";
import Post from "./Post";
import Can from "@components/providers/AclProvider";
import usePostAPI from "@hooks/usePostAPI";
import { useSocialStreamContext } from "@client/Pages/Community/SocialStreamContext";
import useActiveUser from "@hooks/useActiveUser";

const SocialStream = forwardRef(({ breadcrumbs }, ref) =>
{
	const user = useActiveUser();
	const [loading, setLoading] = useState(false);
	const [initialLoad, setInitialLoad] = useState(true);
	const [nextPage, setNextPage] = useState(1);
	const [hasMore, setHasMore] = useState(true);
	const [socialProfile, setSocialProfile] = useState(null);
	const { getStreamPosts, getPostsByFollowing, getPostsByBooked } =
		usePostAPI();
	const { posts, setPosts, tabValue } = useSocialStreamContext();

	const observer = useRef();

	useEffect(() =>
	{
		if (!user) return;

		(async () =>
		{
			try
			{
				const { data } = await axios.get(
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

	const fetchPosts = useCallback(async (pageNumber) =>
	{		
		setLoading(true);
		try
		{
			let data = [];
			switch (tabValue)
			{
				case 0:
					if (pageNumber >= 1)
					{
						data = await getStreamPosts(pageNumber);
					}
					break;
				case 1:
					if (pageNumber === 1)
					{
						data = await getPostsByFollowing(pageNumber);
					}
					break;
				case 2:
					if (pageNumber === 1)
					{
						data = await getPostsByBooked(pageNumber);
					}
					break;
				default:
					break;
			}
			setPosts((prevPosts) => unionBy(prevPosts, data, "_id"));
			setHasMore(data.length > 0);
			if (data.length > 0)
			{
				setNextPage((prevPage) => prevPage + 1);
			}
		}
		catch (error)
		{
			captureException(error);
		}
		finally
		{
			setInitialLoad(false);
			setLoading(false);
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

	useEffect(() =>
	{
		setPosts([]);
		setNextPage(1);
		setHasMore(true);
		fetchPosts(1);
	}, [tabValue]);

	useEffect(() =>
	{
		if (initialLoad)
		{
			fetchPosts(1);
		}
	}, [initialLoad]);

	const resetPosts = useCallback(() =>
	{
		setInitialLoad(true);
	}, []);

	useImperativeHandle(ref, () => resetPosts, [resetPosts]);

	return (
		<Container>
			<Can action="read" subject="Post">
				<Grid container spacing={2}>
					{posts.map((post, index) =>
					{
						return (
							<Grid
								ref={
									index === posts.length - 1 && tabValue === 0
										? lastPostRef
										: null
								}
								item
								xs={12}
								key={post._id}
							>
								<Post
									post={post}
									socialProfile={socialProfile}
									breadcrumbs={breadcrumbs}
								/>
							</Grid>
						);
					})}
				</Grid>
			</Can>
			{(loading || initialLoad) && (
				<Box display="flex" justifyContent="center" alignItems="center" mt={2}>
					<CircularProgress sx={{ color: "primary.main" }} />
				</Box>
			)}
		</Container>
	);
});

export default SocialStream;
