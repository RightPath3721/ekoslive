import React, { forwardRef } from "react";
import Image from "mui-image";
import Grid from "@mui/material/Grid";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import IconButton from "@mui/material/IconButton";

const ListViewItem = forwardRef(
	({ handleImageClick, item, icon, iconAction, iconCondition, ...props }, ref) =>
	{
		return (
			<Grid
				sx={{
					display: "flex",
					flexDirection: "row",
					gap: ".5rem",
					alignItems: "center",
				}}
				item
				{...props}
				ref={ref}
			>
				{handleImageClick ? (
					<Button onClick={() => handleImageClick(item)}>
						<Image
							wrapperStyle={{ height: 50, width: 50 }}
							src={
								(item.avatar || item.photos?.[0]) ??
								"/public/observatory_img_placeholder.webp"
							}
						/>
					</Button>
				) : (
					<Image
						wrapperStyle={{ height: 50, width: 50 }}
						src={
							(item.avatar || item.photos?.[0]) ??
							"/public/observatory_img_placeholder.webp"
						}
					/>
				)}

				<Typography textAlign="left">
					{item.social_nickname || item.name}
				</Typography>
				{icon && iconAction && iconCondition?.(item) && (
					<IconButton
						sx={{
							backgroundColor: "#ff6600",
							width: 24,
							height: 24,
							padding: "1rem",
						}}
						onClick={() => iconAction(item)}
					>
						{icon}
					</IconButton>
				)}
			</Grid>
		);
	},
);

export default ListViewItem;
