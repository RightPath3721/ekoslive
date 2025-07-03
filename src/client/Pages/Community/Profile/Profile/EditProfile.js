import React, { useState } from "react";
import axios from "axios";
import { captureException } from "@sentry/browser";
import { Typography, useTheme } from "@mui/material";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Modal from "@mui/material/Modal";
import { styles } from "@client/shared/styles";
import { Palette } from "@common/shared/common/styles";
import useActiveUser from "@hooks/useActiveUser";
import FormTextField from "@components/FormTextField";
import s from "@common/shared/i18n/i18n";
import CloseModalButton from "@components/shared/CloseModalButton";
import FormDropzone from "@components/FormDropzone";

const EditProfile = ({ open, close, userProfile, setUserProfile }) =>
{
	const user = useActiveUser();
	const { palette } = useTheme();
	const [background, setBackground] = useState(null);
	const [avatar, setAvatar] = useState(null);

	const handleSubmit = async (event) =>
	{
		event.preventDefault();

		if (!user) return;

		const formData = new FormData(event.currentTarget);
		try
		{
			const nickname = formData.get("social_nickname");
			const updatedAccountInfo = {
				full_name: formData.get("full_name"),
				profile_description: formData.get("profile_description"),
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
			if (avatar)
			{
				const formData = new FormData();
				formData.append("avatar", avatar);
				const { data: updatedAvatar } = await axios.patch(
					`/api/social/update-avatar?username=${encodeURIComponent(user.username)}&token=${user.token}`,
					formData,
				);
				data.avatar = updatedAvatar.newAvatar;
			}
			setUserProfile((prevData) => ({
				...prevData,
				full_name: data.user.full_name,
				profile_description: data.user.profile_description,
				social_nickname: data.user.social_nickname,
				...(data.avatar?.includes?.("https") ? { avatar: data.avatar } : {}),
				...(data.profile_background?.includes?.("https")
					? { profile_background: data.profile_background }
					: {}),
			}));
			close();
		}
		catch (error)
		{
			captureException(error);
		}
	};

	return (
		<Modal open={open} onClose={close}>
			<Box
				component="form"
				onSubmit={handleSubmit}
				noValidate
				sx={[
					styles.centerAbsolute,
					{
						display: "flex",
						flexDirection: "column",
						gap: "12px",
						padding: "2.5rem 2.25rem 2rem",
						borderRadius: "12px",
						backgroundColor: palette.common.black,
						minWidth: "416px",
					},
				]}
			>
				<CloseModalButton
					close={close}
					name="Close edit profiel dialog"
					label="Close edit profile"
				/>
				<FormTextField
					id="full_name"
					label="Full Name"
					name="full_name"
					defaultValue={userProfile?.full_name}
				/>
				<FormTextField
					id="social_nickname"
					label="Nickname"
					name="social_nickname"
					type="text"
					defaultValue={userProfile?.social_nickname}
				/>
				<FormTextField
					id="profile_description"
					label="Profile Description"
					name="profile_description"
					type="text"
					defaultValue={userProfile?.profile_description}
				/>
				<Box
					sx={{
						display: "flex",
						flexDirection: "column",
						gap: ".25rem",
						alignItems: "flex-start",
						justifyContent: "center",
					}}
				>
					<Typography>Background</Typography>
					<FormDropzone
						acceptedFiles={{
							"image/jpeg": [".jpg", ".jpeg"],
							"image/png": [".png"],
							"image/webp": [".webp"],
						}}
						setFile={setBackground}
						name="profile_background"
						file={background}
						imagePickerType="profile_background"
					/>
				</Box>
				<Box
					sx={{
						display: "flex",
						flexDirection: "column",
						gap: ".25rem",
						alignItems: "flex-start",
						justifyContent: "center",
					}}
				>
					<Typography>Avatar</Typography>
					<FormDropzone
						acceptedFiles={{
							"image/jpeg": [".jpg", ".jpeg"],
							"image/png": [".png"],
							"image/webp": [".webp"],
						}}
						name="avatar"
						setFile={setAvatar}
						file={avatar}
						imagePickerType="avatar"
						previewBoxProps={{ borderRadius: "50%" }}
					/>
				</Box>
				<Button
					type="submit"
					fullWidth
					variant="contained"
					sx={{ mt: 3, mb: 2, backgroundColor: Palette.orange }}
				>
					{s.general.submit}
				</Button>
			</Box>
		</Modal>
	);
};

export default EditProfile;
