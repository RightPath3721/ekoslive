import React, { useState, useRef, useCallback, useLayoutEffect } from "react";
import Cropper from "react-cropper";
import Box from "@mui/material/Box";
import Modal from "@mui/material/Modal";
import Button from "@mui/material/Button";
import { useDropzone } from "react-dropzone";
import "cropperjs/dist/cropper.css";
import {
	IMAGES_ASPECT_RATIO
} from "@utils/validateImage";
import CloseButton from "@components/CloseButton";
import { styles } from "@client/shared/styles";
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';

const MultiImageUpload = ({
	isOpen,
	close,
	type = "model",
	setImages,
	setImageNames,
	acceptedFiles = null,
	previewBoxProps,
	...filePickerProps
}) => {
	const [error, setError] = useState("");
	const [selectedFiles, setSelectedFiles] = useState([]);
	const [tempImages, setTempImages] = useState([]);
	const [currentIndex, setCurrentIndex] = useState(0);
	const [croppedImages, setCroppedImages] = useState([]);
	const [isOverflowing, setIsOverflowing] = useState(false);
	const cropperRef = useRef();
	const [isLoading, setIsLoading] = useState(false);
	const thumbnailContainerRef = useRef();
	const isAllCropped = croppedImages.every(Boolean);

	// Determine if the thumbnail container is overflowing
	useLayoutEffect(() => {
		const container = thumbnailContainerRef.current;
		if (container) {
			setIsOverflowing(container.scrollWidth > container.clientWidth);
		}
	}, [tempImages]);

	const uploadCurrentCroppedImage = () => {
		return new Promise((resolve, reject) => {
			if (typeof cropperRef.current?.cropper === "undefined") {
				return reject("Cropper is undefined");
			}
			setIsLoading(true);
	
			const cropper = cropperRef.current?.cropper;
			if (!cropper) return reject("Cropper is undefined");
			cropper.getCroppedCanvas()?.toBlob((blob) => {
				if (blob) {
					const updatedCroppedImages = [...croppedImages];
					updatedCroppedImages[currentIndex] = blob;
					setCroppedImages(updatedCroppedImages);
					setImages(updatedCroppedImages);
					setIsLoading(false);
					resolve(updatedCroppedImages);
				} else {
					setIsLoading(false);
					reject("Failed to get the blob from canvas");
				}
			});
		});
	};

	const saveAllImages = async () => {
		try {
			await uploadCurrentCroppedImage(); // Make sure the current image is properly cropped and updated
			const updatedNames = selectedFiles.map((file) => file.name);
			setImageNames(updatedNames);
			close();
		} catch (error) {
			console.error("There was an issue saving images", error);
		}
	};

	const onDrop = useCallback((acceptedFiles) => {
		setError("");
		if (acceptedFiles && acceptedFiles.length > 0) {
		  setSelectedFiles(acceptedFiles);
	  
		  const newTempImages = acceptedFiles.map((file) => {
			const reader = new FileReader();
			return new Promise((resolve) => {
			  reader.onload = () => resolve(reader.result);
			  reader.readAsDataURL(file);
			});
		  });
	  
		  Promise.all(newTempImages).then((images) => {
			setTempImages(images);
			setCurrentIndex(0);
	  
			// Automatically crop all images with a dynamic aspect ratio
			const cropAndSetImages = images.map((src) =>
			  new Promise((resolve) => {
				const image = new Image();
				image.src = src;
				image.onload = () => {
				  const aspectRatio = IMAGES_ASPECT_RATIO[type]; // Get the dynamic aspect ratio
	  
				  // Calculate the crop dimensions based on the aspect ratio
				  let cropWidth, cropHeight;
				  if (image.width / image.height > aspectRatio) {
					// Wider than needed
					cropHeight = image.height;
					cropWidth = cropHeight * aspectRatio;
				  } else {
					// Taller than needed
					cropWidth = image.width;
					cropHeight = cropWidth / aspectRatio;
				  }
				  
				  const x = (image.width - cropWidth) / 2;
				  const y = (image.height - cropHeight) / 2;
	  
				  const canvas = document.createElement("canvas");
				  const ctx = canvas.getContext("2d");
				  canvas.width = cropWidth;
				  canvas.height = cropHeight;
	  
				  // Draw the image cropped to the calculated aspect ratio
				  ctx.drawImage(image, x, y, cropWidth, cropHeight, 0, 0, cropWidth, cropHeight);
				  canvas?.toBlob((blob) => {
					resolve(blob);
				  });
				};
			  })
			);
	  
			Promise.all(cropAndSetImages).then((croppedBlobs) => {
			  setCroppedImages(croppedBlobs);
			});
		  });
		}
	  }, []);

	const handleImageSelect = async (index) => {
		await uploadCurrentCroppedImage();
		setCurrentIndex(index);
	};

	const scrollThumbnails = (direction) => {
		const scrollAmount = 200;  
		if (thumbnailContainerRef.current) {
			thumbnailContainerRef.current.scrollBy({
				left: direction === "left" ? -scrollAmount : scrollAmount,
				behavior: "smooth",
			});
		}
	};

	const { getRootProps, getInputProps, isDragActive } = useDropzone({
		onDrop,
		accept: acceptedFiles ?? {
			"image/png": [".png"],
			"image/jpeg": [".jpg", ".jpeg"],
			"image/webp": [".webp"],
		},
		noClick: tempImages.length > 0 ? true : false,
		multiple: true,
		...filePickerProps,
	});

	return (
		<Modal open={isOpen} onClose={close}>
			<Box
				sx={[
					styles.centerAbsolute,
					{
						width: "800px",
						height: "700px",
						display: "flex",
						flexDirection: "column",
						gap: "20px",
						borderRadius: "16px",
						backgroundColor: "#151515",
						border: "1px solid #252525",
						padding: "2rem 1.75rem",
						position: "relative",
					},
				]}
			>
				<CloseButton right="10px" top="10px" onChange={close} />

				<Box
					{...getRootProps()}
					sx={{
						width: "100%",
						height: "100%",
						position: "relative",
						border: "2px dashed #ccc",
						borderRadius: "8px",
						display: "flex",
						alignItems: "center",
						justifyContent: "center",
						flexDirection: "column",
						cursor: isDragActive ? "copy" : "default",
					}}
				>
					<input {...getInputProps()} />
					{!isDragActive && !tempImages[currentIndex] && (
						<span style={{ pointerEvents: "none", color: "#ccc" }}>
							Drag & Drop your images here or Click to select files
						</span>
					)}
					{error && (
						<Box
							sx={{
								color: "red",
								marginBottom: "10px",
								position: "absolute",
								top: 0,
							}}
						>
							{error}
						</Box>
					)}
					{tempImages[currentIndex] && (
						<Cropper
							ref={cropperRef}
							style={{ width: "100%", maxHeight: "400px" }}
							zoomTo={0.5}
							aspectRatio={IMAGES_ASPECT_RATIO[type]}
							src={tempImages[currentIndex]}
							viewMode={1}
							minCropBoxHeight={10}
							minCropBoxWidth={10}
							background={false}
							responsive={true}
							autoCropArea={1}
							checkOrientation={false}
							guides={false}
							dragMode="move"
							highlight={false}
						/>
					)}
				</Box>

				<Box
					sx={{
						display: "flex",
						flexDirection: "row",
						alignItems: "center",
						justifyContent: "center",
						marginTop: "20px",
					}}
				>
					{isOverflowing && (
						<Button variant="outlined" sx={{maxWidth: "20px"}} onClick={() => scrollThumbnails("left")}>
							<ChevronLeftIcon/>
						</Button>
					)}
					<Box
						ref={thumbnailContainerRef}
						sx={{
							display: "flex",
							overflowX: "hidden", // Hide scrollbar
							maxWidth: "600px",
							scrollBehavior: "smooth",
							margin: "0 10px",
							position: "relative",
						}}
					>
						{tempImages.map((img, index) => (
							<img
								key={index}
								src={img}
								alt={`Thumbnail ${index}`}
								style={{
									width: "60px",
									height: "60px",
									margin: "5px",
									border: croppedImages[index]
										? "2px solid green"
										: currentIndex === index
										? "2px solid blue"
										: "1px solid #ddd",
									cursor: "pointer",
								}}
								onClick={() => handleImageSelect(index)}
							/>
						))}
					</Box>
					{isOverflowing && (
						<Button variant="outlined" sx={{maxWidth: "20px"}} onClick={() => scrollThumbnails("right")}>
							<ChevronRightIcon/>
						</Button>
					)}
				</Box>

				<Box
					sx={{
						display: "flex",
						flexDirection: "row",
						alignItems: "center",
						justifyContent: "space-around",
						marginTop: "20px",
					}}
				>
					<Button
						sx={{
							width: "175px",
							height: "52px",
							border: "1px solid #2d2d2d",
						}}
						variant="contained"
						onClick={saveAllImages}
					>
						Save
					</Button>
				</Box>
			</Box>
		</Modal>
	);
};

export default MultiImageUpload;
