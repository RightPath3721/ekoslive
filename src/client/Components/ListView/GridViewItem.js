import React, { forwardRef } from "react";
import WarningIcon from "@mui/icons-material/Warning";
import Image from "mui-image";
import Grid from "@mui/material/Grid";
import Button from "@mui/material/Button";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import IconButton from "@mui/material/IconButton";
import { useTheme } from "@mui/material";

const Ribbon = ({ children }) => (
	<div
		style={{
			position: 'absolute',
			top: 0,
			right: 0,
			backgroundColor: '#FF6600',
			color: 'white',
			padding: '5px 30px',
			fontSize: '0.75rem',
			transform: 'rotate(45deg) translate(22%, -45%)',
			transformOrigin: 'center',
			zIndex: 1,
			boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
		}}
	>
		{children}
	</div>
);

const GridViewItem = forwardRef(
	(
		{
			handleImageClick,
			item,
			icon,
			iconAction,
			iconCondition,
			imageSize = "100%",
			isRentable = false,
			...props
		},
		ref,
	) =>
	{
		const { palette } = useTheme();
		return (
			<Grid
				sx={{
					display: "flex",
					flexDirection: "column",
					gap: "1rem",
					width: "100%",
					borderRadius: "8px",
					overflow: "hidden",
					position: "relative",
				}}
				item
				{...props}
				ref={ref}
			>
				{item.rentable && <Ribbon>Book Me</Ribbon>}
				{!item.machine_id && (
					<Box sx={{
						position: 'absolute',
						top: 10,
						left: 10,
						backgroundColor: 'warning.main',
						width: '28px',
						height: '28px',
						display: 'flex',
						alignItems: 'center',
						justifyContent: 'center',
						borderRadius: '50%',
						zIndex: 10,
						boxShadow: '0 2px 4px rgba(0,0,0,0.3)'
					}}>
						<WarningIcon
							sx={{ 
								color: palette.white[900],
								fontSize: '20px'
							}}  
						/>
					</Box>
				)}
				{handleImageClick ? (
					<Button onClick={() => handleImageClick(item)} sx={{ padding: 0 }}>
						<Image
							wrapperStyle={{
								borderRadius: "15px",
								overflow: "hidden",
							}}
							src={
								(item.avatar || item.photos?.[0]) ??
								"/public/observatory_img_placeholder.webp"
							}
							sx={{
								aspectRatio: "1 / 1",
							}}
							fit={item.avatar || item.photos?.[0] ? "cover" : "fill"}
							width={imageSize}
							height={imageSize}
							duration={0.5}
						/>
					</Button>
				) : (
					<Image
						wrapperStyle={{
							height: "85%",
							borderRadius: "15px",
							overflow: "hidden",
						}}
						src={
							(item.avatar || item.photos?.[0]) ??
							"/public/observatory_img_placeholder.webp"
						}
						sx={{
							aspectRatio: "1 / 1",
						}}
						fit={item.avatar || item.photos?.[0] ? "cover" : "fill"}
						width={imageSize}
						height={imageSize}
						duration={0.5}
					/>
				)}

				<Box
					sx={{
						display: "flex",
						justifyContent: "space-between",
						alignItems: "center",
					}}
				>
					<Typography textAlign="left">
						{item.social_nickname || item.name}
					</Typography>
					{icon && iconAction && iconCondition?.(item) && (
						<IconButton
							sx={{ backgroundColor: "primary.main", padding: 0 }}
							onClick={() => iconAction(item)}
						>
							{icon}
						</IconButton>
					)}
				</Box>
			</Grid>
		);
	},
);

export default GridViewItem;
