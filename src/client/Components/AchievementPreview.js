import React, { useEffect, useState } from "react";
import { captureException } from "@sentry/browser";
import { get } from "lodash";
import { useMediaQuery } from "react-responsive";
import Image from "mui-image";
import Box from "@mui/material/Box";
import Tooltip from "@mui/material/Tooltip";
import TabLoader from "./TabLoader";
import badges from "@common/shared/common/badges";

const AchievementPreview = ({ achievement, width = 44, height = 44 }) =>
{
	const isMediumScreen = useMediaQuery({ query: "(min-width: 640px)" });
	const [image, setImage] = useState(null);

	useEffect(() =>
	{
		(async () =>
		{
			try
			{
				const badgePath = get(badges, achievement.key, "badges/first_light");
				const imageSrc = await import(`@images/${badgePath}.webp`);
				setImage(imageSrc.default);
			}
			catch (error)
			{
				setImage("/public/profile_default_image.webp");
				captureException(error, { addAttachment: { achievement } });
			}
		})();

		return () =>
		{
			setImage(null);
		};
	}, []);

	return (
		<Tooltip title={achievement.title} placement="bottom">
			<Box>
				{image ? (
					<Image
						src={image}
						alt={achievement.title}
						width={isMediumScreen ? width : width / 1.7}
						height={isMediumScreen ? height : height / 1.7}
					/>
				) : (
					<TabLoader />
				)}
			</Box>
		</Tooltip>
	);
};

export default AchievementPreview;
