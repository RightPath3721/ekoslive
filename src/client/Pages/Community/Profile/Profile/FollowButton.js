import React, { useEffect, useState } from "react";
import Button from "@mui/material/Button";
import axios from "axios";
import { captureException } from "@sentry/browser";
import s from "@common/shared/i18n/i18n";
import useActiveUser from "@hooks/useActiveUser";
import useProfile from "@hooks/community/useProfile";
import { Palette } from "@common/shared/common/styles";

const FollowButton = ({ followingProfileId, profile, updateProfile }) =>
{
	const user = useActiveUser();
	const [isFollower, setIsFollower] = useState(false);
	const { getCurrentUserProfile } = useProfile();

	const handleFollowClick = async () =>
	{
		if (!followingProfileId) return;

		try
		{
			const profile = await getCurrentUserProfile();
			if (!profile || !user) return;
			await axios.post(
				`/api/social/follow/${followingProfileId}?username=${encodeURIComponent(user.username)}&token=${user.token}&value=${isFollower ? "0" : "1"}`,
			);
			setIsFollower((p) => !p);
			updateProfile((prevData) => ({
				...prevData,
				followers: isFollower
					? prevData.followers.filter((id) => profile._id !== id)
					: [...prevData.followers, profile._id],
			}));
		}
		catch (error)
		{
			captureException(error);
		}
	};

	useEffect(() =>
	{
		(async () =>
		{
			try
			{
				const userProfile = await getCurrentUserProfile();
				if (!userProfile) return;
				setIsFollower(profile?.followers?.includes(userProfile._id));
			}
			catch (error)
			{
				captureException(error);
			}
		})();
	}, []);

	return (
		<Button
			sx={{
				width: "fit-content",
				backgroundColor: isFollower ? Palette.red : Palette.orange,
			}}
			variant="contained"
			onClick={handleFollowClick}
		>
			{isFollower ? s.social.unfollow : s.social.follow}
		</Button>
	);
};

export default FollowButton;
