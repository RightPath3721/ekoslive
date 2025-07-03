import React, { forwardRef } from "react";
import { useNavigate } from "react-router-dom";
import Grid from "@mui/material/Grid";
import Box from "@mui/material/Box";
import Image from "mui-image";

const GridItem = forwardRef(({ item }, ref) =>
{
	const breadcrumbs = (postTitle) =>
	{
		return [
			{
				name: "Community",
				link: "/community",
			},
			{
				name: "Profile",
				link: "/community/profile",
			},
			{
				name: postTitle,
				link: "/community",
			},
		];
	};
	const navigate = useNavigate();
	const handleClick = (postId, postTitle) =>
	{
		// Navigate to the new page
		navigate(`/community/post/${postId}/`, { state: breadcrumbs(postTitle) });
	};
	return (
		<Grid
			ref={ref}
			item
			sx={{
				width: "100%",
				aspectRatio: 1,
				borderRadius: "8px",
				overflow: "hidden",
			}}
		>
			<Box
				onClick={() => handleClick(item?._id, item?.title)}
				sx={{
					padding: 0,
					width: "100%",
					height: "100%",
					cursor: "pointer",
					transition: "transform .2s ease-in-out, opacity .2s ease-in-out",
					":hover": {
						transform: "scale(1.05)",
						opacity: ".4",
					},
				}}
				role="link"
			>
				<Image
					src={item?.image?.thumbnail || item?.thumbnail}
					width="100%"
					height="100%"
					duration={0.5}
					showLoading={true}
				/>
			</Box>
		</Grid>
	);
});

export default GridItem;
