import React from "react";
import Image from "mui-image";
import Link from "@mui/material/Link";
import Box from "@mui/material/Box";

const ObservatoryWindow = ({ observatory }) =>
{
	return (
		<Box
			sx={{
				display: "flex",
				flexDirection: "column",
				gap: "1rem",
				alignItems: "flex-start",
			}}
		>
			<Image
				src={
					observatory.photos?.[0] ?? "/public/observatory_img_placeholder.webp"
				}
				alt={observatory.title}
				width={100}
				height={100}
			/>
			<Link href={`/${observatory._id}`}>details</Link>
		</Box>
	);
};

export default ObservatoryWindow;
