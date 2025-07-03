import React, { useCallback, useEffect } from "react";
import { toast } from "react-toastify";
import Box from "@mui/material/Box";
import LinearProgress from "@mui/material/LinearProgress";
import { captureException } from "@sentry/browser";
import { useUploadFormContext } from "../UploadFormContext";
import Backdrop from "@components/Backdrop";
import useActiveUser from "@hooks/useActiveUser";
import useUploadProgress from "@hooks/useUploadProgress";
import s from "@common/shared/i18n/i18n";
import PostFilePicker from "./PostFilePicker";

const ImageUpload = ({ setFormValid }) =>
{
	const { image, setImage, setAdditionalMetadata } = useUploadFormContext();
	const user = useActiveUser();
	const { progress, uploadData, isPending } = useUploadProgress();

	const onChange = useCallback(
		(file) =>
		{
			const reader = new FileReader();
			reader.onload = async () =>
			{
				if (!reader.result.startsWith("data:application/octet-stream;"))
				{
					setImage(reader.result);
					return;
				}
				else
				{
					try
					{
						if (!user) return null;

						const formData = new FormData();
						const file = await (await fetch(reader.result)).blob();
						formData.append("file", file);
						const metadata = await uploadData(
							`/api/metadata?${encodeURIComponent(user.username)}&token=${user.token}`,
							formData,
						);
						setAdditionalMetadata(metadata);
						const imageData = await uploadData(
							`/api/metadata/preview?username=${encodeURIComponent(user.username)}&token=${user.token}`,
							formData,
							{ responseType: "blob" },
						);

						reader.readAsDataURL(imageData);
					}
					catch (error)
					{
						if (error?.response?.status == 500)
						{
							toast.error(s.stella.notifications.image.error);
							captureException(error);
						}
						else if (error?.response?.status == 413)
						{
							toast.error(s.general.file_too_large);
						}
						else
						{
							captureException(error);
						}
					}
				}
			};
			reader.readAsDataURL(file);
		},
		[setImage, user],
	);

	useEffect(() =>
	{
		setFormValid(image ? true : false);
	}, [image]);

	return (
		<Box
			sx={[
				{
					display: "flex",
					flexDirection: "column",
					gap: "20px",
					borderRadius: "16px",
					backgroundColor: "#151515",
					border: "1px solid #252525",
					padding: "16px",
					position: "relative",
				},
			]}
		>
			<Box sx={{ width: "100%", position: "relative", marginBottom: "1rem" }}>
				<PostFilePicker
					acceptedFiles={{
						"image/jpeg": [".jpg", ".jpeg"],
						"image/png": [".png"],
						"image/webp": [".webp"],
						"application/octet-stream": [".fits", ".fit"],
					}}
					setFile={onChange}
					previewVisible
					rootStyleOverride={
						image ? {} : { width: "100%", maxHeight: "50vh", minHeight: "30vh" }
					}
					previewBoxProps={{
						width: "auto",
						height: "auto",
						style: { objectFit: "contain", maxHeight: "40vh", maxWidth: "70%" },
					}}
				/>
				{isPending && (
					<LinearProgress
						value={progress}
						sx={{
							position: "absolute",
							inset: 0,
							opacity: 0.6,
							height: "100%",
						}}
						variant="determinate"
					/>
				)}
			</Box>

			{isPending && <Backdrop />}
		</Box>
	);
};

export default ImageUpload;
