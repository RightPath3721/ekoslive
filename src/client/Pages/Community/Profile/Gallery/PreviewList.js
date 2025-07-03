import React, { useEffect, useState } from "react";
import { captureException } from "@sentry/browser";
import Box from "@mui/material/Box";
import Image from "mui-image";
import useGalleryApi from "@hooks/useGalleryApi";
import { styles } from "@client/shared/styles";
import UploadButton from "@components/UploadPostForm/UploadButton";

const PreviewList = () =>
{
	const [images, setImages] = useState([]);
	const { getImages } = useGalleryApi();

	useEffect(() =>
	{
		(async () =>
		{
			try
			{
				const galleryImages = await getImages();
				setImages(galleryImages);
			}
			catch (error)
			{
				captureException(error);
			}
		})();
	}, []);

	return (
		<Box
			sx={[
				styles.horizontalScrollBar,
				{
					display: "flex",
					flexDirection: "row",
					gap: "4px",
					flexWrap: "nowrap",
					overflowX: "scroll",
					maxWidth: "340px",
				},
			]}
		>
			{images.map((image) => (
				<Image
					src={image.thumbnail}
					alt=""
					duration={0.3}
					width={120}
					height={120}
					key={image._id}
				/>
			))}

			<UploadButton />
		</Box>
	);
};

export default PreviewList;
