import React, { useState } from "react";
import useModalState from "@hooks/useModalState";
import { useMediaQuery } from "react-responsive";
import ImageGallery from "react-image-gallery";
import "react-image-gallery/styles/css/image-gallery.css";
import { Box, IconButton } from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import { useTheme } from "@mui/material";

const ObservatoryPreviewImage = ({ observatory, onDeleteImage, canEdit }) =>
{
	const { palette } = useTheme();
	const isMediumScreen = useMediaQuery({ query: "(min-width: 768px)" });
	const [currentIndex, setCurrentIndex] = useState(0);
	
	const images = observatory?.photos?.length > 0 ? observatory?.photos?.map((item, index) => ({
		original: item,
		renderItem: (item) => (
			<div style={{ position: 'relative' }}>
				<img 
					src={item.original} 
					style={{ width: '100%', height: 'auto' }}
					alt={`Observatory ${index + 1}`}
				/>
				{canEdit && (
					<IconButton
						onClick={(e) => {
							e.stopPropagation();
							onDeleteImage(index, currentIndex);
						}}
						sx={{
							position: 'absolute',
							top: "1rem",
							right: "1rem",
							backgroundColor: 'rgba(0,0,0,0.5)',
							'&:hover': {
								backgroundColor: 'rgba(0,0,0,0.7)',
							}
						}}
					>
						<DeleteIcon sx={{ color: palette.white[900] }} />
					</IconButton>
				)}
			</div>
		)
	})) : [
		{
			original: "/public/observatory_img_placeholder.webp"
		}
	]

	return (
		<Box width={isMediumScreen ? 500 : "100%"}>
			{images.length > 0 &&
				<ImageGallery
					items={images}
					showBullets={images.length > 1}
					showPlayButton={images.length > 1}
					startIndex={currentIndex}
					onSlide={(index) => setCurrentIndex(index)}
				/>
			}
		</Box>
	);
};

export default ObservatoryPreviewImage;
