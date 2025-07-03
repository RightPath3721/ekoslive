import { useCallback } from "react";
import axios from "axios";
import { captureException } from "@sentry/browser";
import useActiveUser from "./useActiveUser";

const usePostAPI = () =>
{
	const user = useActiveUser();

	const getPosts = useCallback(
		async (page, limit) =>
		{
			if (!user) return [];
			const { data } = await axios.get("/api/posts", {
				params: { username: user.username, token: user.token, page, limit },
			});
			return data;
		},
		[user],
	);

	const getPostsByProfileId = useCallback(async (profileId, page, limit) =>
	{
		const { data } = await axios.get(`/api/posts/profile/${profileId}`, {
			params: { page, limit },
		});
		return data;
	}, []);

	const getPostsByFollowing = useCallback(
		async (page, limit, signal) =>
		{
			if (!user) return [];
			try {
				const { data } = await axios.get(`/api/posts/following`, {
					params: { username: user.username, token: user.token, page, limit },
					signal: signal,
				});
				return data;
			} catch (error) {
				// Don't report aborted requests to Sentry
				if (axios.isCancel(error)) {
					return [];
				}

				if (error.name === 'AbortError' || error.name === 'CanceledError') {
					return [];
				}

				captureException(error);
				return [];
			}
		},
		[user],
	);

	const getPostsByBooked = useCallback(
		async (page, limit, signal) =>
		{
			if (!user) return [];
			try {
				const { data } = await axios.get(`/api/posts/booked`, {
					params: { username: user.username, token: user.token, page, limit },
					signal: signal,
				});
				return data;
			} catch (error) {
				// Don't report aborted requests to Sentry
				if (axios.isCancel(error)) {
					return [];
				}

				if (error.name === 'AbortError' || error.name === 'CanceledError') {
					return [];
				}

				captureException(error);
				return [];
			}
		},
		[user],
	);

	const getPostById = useCallback(
		async (postId) =>
		{
			const url = `/api/posts/${postId}/?username=${encodeURIComponent(user.username)}&token=${user.token}`;
			const { data } = await axios.get(url);
			return data;
		},
		[user],
	);

	const getStreamPosts = useCallback(async (page, limit, signal) =>
	{
		const url = `/api/posts/stream`;
		try
		{
			const response = await axios.get(url, {
				params: { page, limit },
				signal: signal,
			});
			return response.data;
		}
		catch (error)
		{
			// Don't report aborted requests to Sentry
			if (axios.isCancel(error)) {
				return [];
			}

			if (error.name === 'AbortError' || error.name === 'CanceledError') {
				return [];
			}

			captureException(error);
			return [];
		}
	}, []);

	return {
		getPosts,
		getPostById,
		getStreamPosts,
		getPostsByProfileId,
		getPostsByFollowing,
		getPostsByBooked,
	};
};

export default usePostAPI;
