import React, { useEffect, useState } from "react";
import axios from "axios";
import { captureException } from "@sentry/browser";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import { useCurrentProfileContext } from "@client/Pages/Community/CurrentProfileContext";
import { useTheme } from "@mui/material";
import s from "@common/shared/i18n/i18n";
import useActiveUser from "@hooks/useActiveUser";
import PlusIcon from "@client/icons/PlusIcon";
import MinusIcon from "@client/icons/MinusIcon";

const FollowButton = ({ profile, setProfile }) =>
{
	const { palette } = useTheme();
	const user = useActiveUser();
	const { profile: userProfile, setProfile: setUserProfile } =
		useCurrentProfileContext();
	const [isFollower, setIsFollower] = useState(
		profile?.followers?.includes(userProfile?._id),
	);

	const handleFollowClick = async () =>
	{
		if (!profile) return;

		try
		{
			if (!user || !userProfile) return;
			await axios.post(
				`/api/social/follow/${profile?._id}?username=${encodeURIComponent(user.username)}&token=${user.token}&value=${isFollower ? "0" : "1"}`,
			);
			setIsFollower((p) => !p);
			setProfile((prevData) => ({
				...prevData,
				followers: isFollower
					? prevData.followers.filter((id) => userProfile._id !== id)
					: [...prevData.followers, userProfile._id],
			}));
			setUserProfile((prevData) => ({
				...prevData,
				following: isFollower
					? prevData.following.filter((id) => userProfile._id !== id)
					: [...prevData.following, userProfile._id],
			}));
		}
		catch (error)
		{
			captureException(error);
		}
	};

	useEffect(() =>
	{
		if (!profile) return;

		setIsFollower(profile?.followers?.includes?.(userProfile?._id));
	}, [profile, userProfile, setIsFollower]);

	if (!user || !profile || profile?._id === userProfile?._id) return null;

	return (
		<Button
			sx={{
				display: "grid",
				gridTemplateColumns: "26px 1fr",
				alignItems: "center",
				justifyContent: "flex-start",
				gap: ".625rem",
				padding: ".625rem .75rem",
				"@media (max-height: 800px)": {
					padding: ".4rem .5rem",
					gap: ".4rem",
				}
			}}
			onClick={handleFollowClick}
			variant={isFollower ? "outlined" : "contained"}
		>
			<Typography
				sx={{
					display: "grid",
					placeItems: "center",
					backgroundColor: `${palette.white[900]}0F`,
					width: 26,
					height: 26,
					borderRadius: "50%",
					"@media (max-height: 800px)": {
						width: 22,
						height: 22,
					}
				}}
				component="span"
			>
				{isFollower ? (
					<MinusIcon width={16} height={16} color={palette.grey.main} />
				) : (
					<PlusIcon width={16} height={16} color={palette.grey.main} />
				)}
			</Typography>
			<Typography 
				component="span"
				sx={{
					"@media (max-height: 800px)": {
						fontSize: "0.875rem"
					}
				}}
			>
				{isFollower ? s.social.unfollow : s.social.follow}
			</Typography>
		</Button>
	);
};

export default FollowButton;
