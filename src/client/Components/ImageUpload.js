import React, { useState, useRef, useEffect, useCallback } from "react";
import { captureException } from "@sentry/browser";
import Cropper from "react-cropper";
import Box from "@mui/material/Box";
import Modal from "@mui/material/Modal";
import Button from "@mui/material/Button";
import { useDropzone } from "react-dropzone";
import { styles } from "@client/shared/styles";
import { Palette } from "@common/shared/common/styles";
import "cropperjs/dist/cropper.css";
import CloseButton from "@components/CloseButton";
import {
	IMAGES_ASPECT_RATIO,
	IMAGES_MIN_SIZE,
	validateImage,
} from "@utils/validateImage";

const ImageUpload = ({
	isOpen,
	close,
	type = "model",
	setImage,
	setImageName,
	image,
	name,
	acceptedFiles = null,
	previewBoxProps,
	...filePickerProps
}) =>
{
	const [error, setError] = useState("");
	const [selectedFile, setSelectedFile] = useState(null); // Store the file
	const [tempImage, setTempImage] = useState(null); // Temp storage for image
	const cropperRef = useRef();
	const previewRef = useRef(null);
	const [isLoading, setIsLoading] = useState(false);

	const uploadImage = async () =>
	{
		if (typeof cropperRef.current?.cropper === "undefined") return;
		setIsLoading(true);
		try
		{
			if (cropperRef.current?.cropper)
			{
				const canvas = cropperRef.current.cropper.getCroppedCanvas();
				if (!canvas) {
					console.error("Failed to create canvas");
					return;
				}
				
				canvas.toBlob((blob) =>
				{
					if (!blob) {
						console.error("Failed to create blob");
						return;
					}
					setImage(blob);
					if (selectedFile)
					{
						setImageName(selectedFile.name);
					}
					close();
				});
			}
			else
			{
				console.error("Cropper is not initialized.");
			}
		}
		catch (error)
		{
			captureException(error, {
				addAttachment: { cropper: cropperRef.current },
			});
		}
		finally
		{
			setIsLoading(false);
		}
	};

	const onDrop = useCallback(
		(acceptedFiles) =>
		{
			setError("");
			if (acceptedFiles && acceptedFiles.length > 0)
			{
				const file = acceptedFiles[0];
				setSelectedFile(file); // Store the file

				const reader = new FileReader();

				reader.onload = () =>
				{
					const img = new Image();
					img.src = reader.result;

					img.onload = () =>
					{
						const validationError = validateImage(img.width, img.height, type);
						if (validationError)
						{
							setError(validationError);
						}
						else
						{
							setTempImage(reader.result); // Set the temp image
						}
					};
				};
				reader.readAsDataURL(file);
			}
		},
		[type],
	);

	const { getRootProps, getInputProps, isDragActive } = useDropzone({
		onDrop,
		accept: acceptedFiles ?? {
			"image/png": [".png"],
			"image/jpeg": [".jpg", ".jpeg"],
			"image/webp": [".webp"],
		},
		noClick: !!tempImage,
		...filePickerProps,
	});

	const setCropBoxDimensions = useCallback(() =>
	{
		if (!(tempImage && isOpen)) return;

		const cropper = cropperRef.current?.cropper;
		const dimensions = IMAGES_MIN_SIZE[type];
		const aspectRatio = IMAGES_ASPECT_RATIO[type];
		if (cropper && dimensions && aspectRatio)
		{
			const { width, height } = dimensions;
			cropper.setCropBoxData({ width, height });
			cropper.setAspectRatio(aspectRatio);
		}
	}, [type, cropperRef, tempImage]);

	useEffect(() =>
	{
		const cropper = cropperRef.current?.cropper;
		if (cropper)
		{
			setCropBoxDimensions();
		}
	}, [setCropBoxDimensions]);

	useEffect(() =>
	{
		if (isOpen)
		{
			setImage(null);
			setImageName(null);
			setTempImage(null);
			setSelectedFile(null);
		}
		else
		{
			setTempImage(null);
		}
	}, [isOpen]);

	return (
		<Modal open={isOpen} onClose={close}>
			<Box
				sx={[
					styles.centerAbsolute,
					{
						width: "800px",
						height: "600px",
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
					<input {...getInputProps({ name })} />
					{!isDragActive && !tempImage && (
						<span style={{ pointerEvents: "none", color: "#ccc" }}>
							Drag & Drop your image here or Click to select a file
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
					<Cropper
						ref={cropperRef}
						style={{ width: "100%", maxHeight: "400px" }}
						zoomTo={0.5}
						aspectRatio={IMAGES_ASPECT_RATIO[type]}
						preview={previewRef}
						src={tempImage}
						viewMode={1}
						minCropBoxHeight={10}
						minCropBoxWidth={10}
						background={false}
						responsive={true}
						autoCropArea={1}
						checkOrientation={false}
						guides={false}
						dragMode="move" // Allow only dragging
						highlight={false} // Prevent overlaid highlight of the cropping area
					/>
				</Box>

				<Box
					sx={{
						display: "flex",
						flexDirection: "row",
						alignItems: "center",
						justifyContent: "space-around",
					}}
				>
					<Button
						sx={{
							width: "175px",
							height: "52px",
							border: "1px solid #2d2d2d",
						}}
						disabled={isLoading}
						variant="contained"
						onClick={uploadImage}
					>
						Save
					</Button>
					<Box
						ref={previewRef}
						sx={{
							border: `3px solid ${Palette.white}`,
							width: "80px",
							height: "80px",
							display: "grid",
							placeItems: "center",
							overflow: "hidden",
							...previewBoxProps,
						}}
					/>
				</Box>
			</Box>
		</Modal>
	);
};

export default ImageUpload;
