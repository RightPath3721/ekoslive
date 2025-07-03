import { useCallback } from "react";
import axios from "axios";
import dayjs from "dayjs";
import { captureException } from "@sentry/browser";
import useActiveUser from "@hooks/useActiveUser";

const useProfile = () =>
{
	const user = useActiveUser();

	const getProfileByNickname = useCallback(async (nickname) =>
	{
		const url = `/api/social/${encodeURIComponent(nickname)}`;
		try
		{
			const { data } = await axios.get(url);
			return data;
		}
		catch (error)
		{
			if (error.response?.status !== 404)
			{
				captureException(error);
			}
			return null;
		}
	}, []);

	const getCurrentUserProfile = useCallback(async () =>
	{
		if (!user) return null;

		const url = `/api/social?username=${encodeURIComponent(user.username)}&token=${user.token}`;

		try
		{
			const { data } = await axios.get(url);
			return data.socialProfile;
		}
		catch (error)
		{
			captureException(error);
			return null;
		}
	}, [user]);

	const getUserFollowers = useCallback(async (profileId, filters) =>
	{
		try
		{
			const {
				data: { data, count },
			} = await axios.get(`/api/social/followers/${profileId}`, {
				params: filters,
			});

			return { data, count };
		}
		catch (error)
		{
			captureException(error);
			return { data: [], count: 0 };
		}
	}, []);

	const getUserFollowing = useCallback(async (profileId, filters) =>
	{
		try
		{
			const {
				data: { count, data },
			} = await axios.get(`/api/social/following/${profileId}`, {
				params: filters,
			});

			return { data, count };
		}
		catch (error)
		{
			captureException(error);
			return { data: [], count: 0 };
		}
	}, []);

	const createUserProfile = useCallback(
		async (profileData) =>
		{
			if (!user) return;

			const defaultUserData = {
				status: true,
				posts_ids: [],
				subscriptions_ids: [],
				social_nickname: `${profileData.social_nickname.startsWith("@") ? profileData.social_nickname : `@${profileData.social_nickname}`}`,
				follower_ids: [],
				gallery_image_ids: [],
				liked_posts_ids: [],
				observatories: [],
				profile_description: `Capturing the cosmos since ${dayjs().year()}`,
				full_name: profileData.full_name,
			};
			try
			{
				const { data } = await axios.post(
					"/api/social",
					{ userData: defaultUserData },
					{ params: { username: user.username, token: user.token } },
				);
				return data.user;
			}
			catch (error)
			{
				captureException(error);
			}
		},
		[user],
	);

	const updateUserProfile = useCallback(
		async (profileData) =>
		{
			if (!user) return null;
			try
			{
				const nickname = profileData.get("social_nickname");
				const background = profileData.get("profile_background");
				const avatar = profileData.get("avatar");
				const updatedAccountInfo = {
					full_name: profileData.get("full_name"),
					profile_description: profileData.get("profile_description"),
					social_nickname: nickname.startsWith("@") ? nickname : `@${nickname}`,
				};

				const { data } = await axios.patch(
					`/api/social/?username=${encodeURIComponent(user.username)}&token=${user.token}`,
					updatedAccountInfo,
				);
				if (background)
				{
					const formData = new FormData();
					formData.append("background", background);
					const { data: updatedBackground } = await axios.patch(
						`/api/social/update-background?username=${encodeURIComponent(user.username)}&token=${user.token}`,
						formData,
					);
					data.profile_background = updatedBackground.newBackground;
				}
				if (avatar && typeof avatar !== "string")
				{
					const formData = new FormData();
					formData.append("avatar", avatar);
					const { data: updatedAvatar } = await axios.patch(
						`/api/social/update-avatar?username=${encodeURIComponent(user.username)}&token=${user.token}`,
						formData,
					);
					data.avatar = updatedAvatar.newAvatar;
				}
				return data.user;
			}
			catch (error)
			{
				captureException(error, { addAttachment: { profileData } });
			}
		},
		[user],
	);

	return {
		getProfileByNickname,
		getCurrentUserProfile,
		getUserFollowers,
		getUserFollowing,
		createUserProfile,
		updateUserProfile,
	};
};

export default useProfile;
