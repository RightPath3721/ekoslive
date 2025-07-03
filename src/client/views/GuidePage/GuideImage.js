import React, { useEffect, useState } from "react";
import ImagePreviewBox from "../EkosPage/ImagePreviewBox";
import s from "@common/shared/i18n/i18n";
import defaultImg from "@images/background.webp";
import { useSelector } from "react-redux";
import { isEmpty } from "lodash";
import { Box } from "@mui/material";

const GuideImage = () =>
{
	const metadata = useSelector((state) => state.wsMedia.guideMetadata);

	const [imagesData, setImagesData] = useState(defaultImg);
	const [hasMounted, setHasMounted] = useState(false);

	useEffect(() =>
	{
		if (!hasMounted)
		{
			setHasMounted(true);
			return;
		}

		if (!isEmpty(metadata))
		{
			setImagesData(metadata.preview + "?ts=" + new Date());
		}
	}, [metadata]);

	return (
		<Box sx={{ height: "216px", width: "300px" }}>
			<ImagePreviewBox src={imagesData} title={s.tourGuide.title_guide} />;
		</Box>
	);
};

export default GuideImage;
