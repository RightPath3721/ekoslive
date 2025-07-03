import React, { useCallback } from "react";
import { toast } from "react-toastify";
import { captureException } from "@sentry/browser";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import LinearProgress from "@mui/material/LinearProgress";
import Backdrop from "@components/Backdrop";
import s from "@common/shared/i18n/i18n";
import useActiveUser from "@hooks/useActiveUser";
import useUploadProgress from "@hooks/useUploadProgress";
import FitsDropzone from "./InformationTab/FitsDropzone";

const FitsSelector = ({ setMetadata }) =>
{
	const user = useActiveUser();
	const { progress, uploadData, isPending } = useUploadProgress();

	const onChange = useCallback(
		(file) =>
		{
			const reader = new FileReader();
			reader.onload = async () =>
			{
				if (!user) return null;

				try
				{
					const formData = new FormData();
					const file = await (await fetch(reader.result)).blob();
					formData.append("file", file);
					const metadata = await uploadData(
						`/api/metadata?${encodeURIComponent(user.username)}&token=${user.token}`,
						formData,
					);
					setMetadata(metadata);
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
			};
			reader.readAsDataURL(file);
		},
		[user],
	);

	return (
		<Box
			sx={[
				{
					display: "flex",
					flexDirection: "column",
					gap: ".75rem",
					justifyContent: "center",
					alignItems: "center",
					padding: ".5rem",
				},
			]}
		>
			<Typography>FITS file(optional)</Typography>

			<Box sx={{ position: "relative", width: "100%" }}>
				<FitsDropzone onChange={onChange} />
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

export default FitsSelector;
