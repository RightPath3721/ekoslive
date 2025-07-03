import React, { useEffect, useState } from "react";
import { captureException } from "@sentry/browser";
import usePostAPI from "@hooks/usePostAPI";
import TabLoader from "@components/TabLoader";
import PostsList from "./PostsList";

const Posts = () =>
{
	const [posts, setPosts] = useState([]);
	const [loading, setLoading] = useState(true);
	const { getPosts } = usePostAPI();

	useEffect(() =>
	{
		(async () =>
		{
			try
			{
				const data = await getPosts();
				setPosts(data);
			}
			catch (error)
			{
				captureException(error);
			}
			finally
			{
				setLoading(false);
			}
		})();
	}, []);

	if (loading) return <TabLoader />;

	return <PostsList posts={posts} />;
};

export default Posts;
