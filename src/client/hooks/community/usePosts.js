import { useCallback, useEffect, useState } from "react";
import axios from "axios";
import { captureException } from "@sentry/browser";

const usePosts = () =>
{
	const [posts, setPosts] = useState([]);

	const getPosts = useCallback(async (page = 1) =>
	{
		try
		{
			const url = `/api/posts/stream`;
			const response = await axios.get(url, {
				params: { page, limit: 10 },
			});
			setPosts((prevPosts) => [...prevPosts, ...response.data]);
		}
		catch (error)
		{
			captureException(error);
		}
	}, []);

	const onUploadSubmit = useCallback(
		(post) =>
		{
			if(post._id) {
				setPosts((prev) => [post, ...prev]);
			}
		},
		[setPosts],
	);

	useEffect(() =>
	{
		(async () =>
		{
			await getPosts();
		})();
	}, []);

	return { posts, setPosts, getPosts, onUploadSubmit };
};

export default usePosts;
