import React, { useEffect, useState } from "react";
import { captureException } from "@sentry/browser";
import { toast } from "react-toastify";
import Box from "@mui/material/Box";
import Avatar from "@mui/material/Avatar";
import TabLoader from "@components/TabLoader";
import { styles } from "@client/shared/styles";
import FormLabelTextField from "@components/FormLabelTextField";
import useProfile from "@hooks/community/useProfile";
import useActiveUser from "@hooks/useActiveUser";
import { useSocialWizardContext } from "../SocialWizardContext";
import checkUserTextInput from "@utils/checkUserTextInput";
import { useCurrentProfileContext } from "@client/Pages/Community/CurrentProfileContext";

const SocialProfileTab = ({ next }) =>
{
	const user = useActiveUser();
	const { createUserProfile, getCurrentUserProfile, updateUserProfile } =
		useProfile();
	const { setProfile } = useSocialWizardContext();
	const { setProfile: setUserProfile } = useCurrentProfileContext();
	const [socialProfile, setSocialProfile] = useState({
		avatar: null,
		social_nickname: "",
		full_name: "",
	});
	const [inputErrors, setInputErrors] = useState({
		full_name: "",
		social_nickname: "",
	});
	const [isLoading, setIsLoading] = useState(true);
	const [isNewUser, setIsNewUser] = useState(true);

	useEffect(() =>
	{
		(async () =>
		{
			if (!user) return;
			
			try
			{
				const userProfile = await getCurrentUserProfile();
				if (userProfile)
				{
					setSocialProfile({
						avatar: userProfile.avatar,
						social_nickname: userProfile.social_nickname,
						full_name: userProfile.full_name ?? "",
					});
					setIsNewUser(false);
				}
				else if (user)
				{
					setSocialProfile({
						avatar: null,
						social_nickname: `@${user.username}`,
						full_name: user.username,
					});
				}
				else
				{
					throw new Error("User not found");
				}
			}
			catch (error)
			{
				captureException(error, { addAttachment: user });
			}
			finally
			{
				setIsLoading(false);
			}
		})();
	}, [user]);

	const onSubmit = async (e) =>
	{
		e.preventDefault();

		if (Object.values(inputErrors).filter((error) => error).length !== 0)
			return;

		try
		{
			const profileData = new FormData();
			Object.entries(socialProfile).map(([key, value]) =>
				profileData.append(key, value),
			);
			const res = isNewUser
				? await createUserProfile(socialProfile)
				: await updateUserProfile(profileData);
			if (res)
			{
				setIsNewUser(false);
			}
			setProfile(res);
			setUserProfile(res);
			next();
		}
		catch (error)
		{
			toast.error(error.message);
			captureException(error, { addAttachment: { socialProfile } });
		}
	};

	if (isLoading) return <TabLoader />;

	return (
		<Box
			component="form"
			style={{
				...styles.center,
				flexDirection: "column",
				gap: "1.25rem",
				width: "40%",
				height: "fit-content",
				padding: "1rem",
				margin: "1.5rem auto 0",
			}}
			onSubmit={onSubmit}
			id="social-profile-form"
		>
			<Avatar
				sx={{ width: 140, height: 140, borderRadius: "50%" }}
				src={socialProfile.avatar || "/public/profile_default_image.webp"}
				alt={socialProfile.social_nickname}
			/>
			<Box
				sx={{
					flexDirection: "column",
					gap: ".25rem",
					alignItems: "center",
					width: "100%",
				}}
				display="flex"
			>
				<FormLabelTextField
					label="Full Name"
					width="100%"
					defaultValue={socialProfile.full_name}
					name="full_name"
					error={inputErrors.full_name || undefined}
					onChange={(e) =>
					{
						{
							const validation = checkUserTextInput(e.target.value, 4, 25);

							setInputErrors((prevData) => ({
								...prevData,
								full_name: validation.message,
							}));
							setSocialProfile((prevData) => ({
								...prevData,
								[e.target.name]: e.target.value.trim(),
							}));
						}
					}}
					required
				/>
				<FormLabelTextField
					label="Social Nickname"
					width="100%"
					defaultValue={socialProfile.social_nickname}
					name="social_nickname"
					error={inputErrors.social_nickname || undefined}
					onChange={(e) =>
					{
						{
							const validation = checkUserTextInput(e.target.value, 4, 25);

							setInputErrors((prevData) => ({
								...prevData,
								social_nickname: validation.message,
							}));
							setSocialProfile((prevData) => ({
								...prevData,
								[e.target.name]: e.target.value.trim(),
							}));
						}
					}}
					required
				/>
			</Box>
		</Box>
	);
};

export default SocialProfileTab;
