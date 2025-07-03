import { Box } from "@mui/material";
import { get, isEmpty } from "lodash";
import React, { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { TransformComponent, TransformWrapper } from "react-zoom-pan-pinch";
import { FiCrosshair } from "react-icons/fi";
import { styles } from "../../shared/styles";
import { Palette } from "@common/shared/common/styles";
import { captureActions } from "@redux/actions";
import { keyframes } from "@mui/system";
import { selectTrainDevice } from "@redux/selectors";
import { DEVICE_TYPE, trainModules } from "@indi/enums";
import defaultImg from "@images/background.webp";
import useLongPress from "@hooks/useLongPress";

const LOCAL_STYLES = {
	container: { backgroundColor: "#0f0e0e" },
	image: {
		objectFit: "contain",
		width: "100%",
		height: "100%",
		maxHeight: "calc(100vh - 280px)",
	},
	polarImage: {
		objectFit: "contain",
		cursor: "pointer",
	},
	defaultImage: {
		maxWidth: "100%",
	},
	imageBox: {
		width: "100%",
		display: "flex",
		justifyContent: "center",
		alignItems: "center",
	},
};

// Define a keyframe animation for rotation
const rotate = keyframes`
  from {
    transform: translate(-50%, -50%) rotate(0deg);
  }
  to {
    transform: translate(-50%, -50%) rotate(360deg);
  }
`;

const MainImage = ({ showOverlay, showTargetGOTO }) =>
{
	const dispatch = useDispatch();
	// const metadata = useSelector(selectMetadata);
	const metadata = useSelector((state) => state.wsMedia.metadata);

	const imageRef = useRef(null);
	const [imageData, setImageData] = useState(defaultImg);
	const [imageWidth, setImageWidth] = useState("1000px");
	const [imageHeight, setImageHeight] = useState("750px");
	const [targetPosition, setTargetPosition] = useState({ x: 0, y: 0 });
	const [inProgress, setInProgress] = useState(false);

	const updateDimensions = (e) =>
	{
		const { target } = e;
		setImageWidth(target.width);
		setImageHeight(target.height);
	};

	const camera = useSelector((state) =>
		selectTrainDevice(state, {
			trainType: trainModules.CaptureOpticalTrain,
			deviceType: DEVICE_TYPE.CAMERA,
		}),
	);
	const mountStatus = useSelector((state) => state.status.mount.status);
	const cameraStatus = useSelector((state) => state.status.capture.status);

	const imageSize = useRef({ width: -1, height: -1 });
	const displaySize = useRef({ width: -1, height: -1 });
	const TargetLockDebug = useRef({
		x: -1,
		y: -1,
		imageX: -1,
		imageY: -1,
	});
	// after holding on the object for more than 3seconds, this function is called.
	// It is used to determine the position on the image according to our gesture hold
	const mountGoto = (event) =>
	{
		setInProgress(true);
		// Get image and container dimensions
		const rect = imageRef.current?.getBoundingClientRect();
		const locationX = event.clientX - rect.left;
		const locationY = event.clientY - rect.top;

		const imageWidth = imageSize?.width || rect.width;
		const imageHeight = imageSize?.height || rect.height;

		const actualWidth = displaySize?.width || rect.width;
		const actualHeight = displaySize?.height || rect.height;

		// Initialize normalized x and y
		let x = locationX / imageWidth;
		let y = locationY / imageHeight;

		const containerRatio = imageWidth / imageHeight;
		const imageRatio = actualWidth / actualHeight;

		// Adjust x for horizontal offset
		if (containerRatio > imageRatio)
		{
			const scaledWidth = (imageHeight / actualHeight) * actualWidth; // Width based on image scale
			const offset = (imageWidth - scaledWidth) / 2; // Offset due to centering
			const xScaledStart = offset / imageWidth;
			const xScaledEnd = 1 - xScaledStart;
			x = (x - xScaledStart) / (xScaledEnd - xScaledStart);
		}

		// Adjust y for vertical offset
		if (containerRatio < imageRatio)
		{
			const scaledHeight = (imageWidth / actualWidth) * actualHeight; // Height based on image scale
			const offset = (imageHeight - scaledHeight) / 2; // Offset due to centering
			const yScaledStart = offset / imageHeight;
			const yScaledEnd = 1 - yScaledStart;
			y = (y - yScaledStart) / (yScaledEnd - yScaledStart);
		}

		// Clamp values to the range [0, 1]
		x = Math.max(0, Math.min(1, x));
		y = Math.max(0, Math.min(1, y));

		// Ensure values are within bounds and dispatch action
		if (x >= 0 && x <= 1 && y >= 0 && y <= 1)
		{
			dispatch(
				captureActions.mountGotoPixel({
					camera: get(camera, "name", ""), // Replace with actual camera name
					x,
					y,
				}),
			);
		}
		setTimeout(() => setInProgress(false), 5000);
	};

	/**
	 *
	 * @param event
	 */

	const longGestureBegin = (event) =>
	{
		if (
			get(metadata, "hasWCS", false) &&
			mountStatus !== "Parked" &&
			cameraStatus !== "Capturing"
		)
		{
			const rect = imageRef.current?.getBoundingClientRect();
			const x = ((event.clientX - rect.left) / rect.width) * 100;
			const y = ((event.clientY - rect.top) / rect.height) * 100;
			setTargetPosition({ x, y });
			TargetLockDebug.current = {
				...TargetLockDebug.current,
				x: x,
				y: y,
			};
		}
	};

	const longGestureEnd = (event) =>
	{
		// console.log("end", event);
		if (true)
		{
			mountGoto(event);
		}
		if (get(metadata, "hasWCS", false) && cameraStatus !== "Capturing")
		{
			mountGoto(event);
		}
	};

	const handleStart = (event) =>
	{
		const rect = imageRef.current?.getBoundingClientRect();
		const x = ((event.clientX - rect.left) / rect.width) * 100;
		const y = ((event.clientY - rect.top) / rect.height) * 100;
		setTargetPosition({ x, y });
		longGestureBegin(event);
	};

	const handleLongPress = (event) =>
	{
		longGestureEnd(event);
	};

	const handleCancel = () =>
	{};

	const longPressHandlers = useLongPress(handleLongPress, {
		threshold: 500,
		onStart: handleStart,
		onFinish: handleMouseLeave,
		onCancel: handleCancel,
	});

	const handleMouseLeave = () =>
	{
		setShowTarget(false);
	};

	/**
	 * Lines around the Crosshair.
	 * @param {*} param0 - Position of the lines.
	 * @returns {JSX.Element} - Line element.
	 */
	const Lines = ({ position }) => (
		<Box
			sx={[position, { backgroundColor: Palette.red, border: "1px solid red" }]}
		/>
	);

	const TargetMarker = ({ x, y }) => (
		<Box
			sx={{
				position: "absolute",
				top: `${y}%`,
				left: `${x}%`,
				transformOrigin: "center", // Ensure rotation happens around the center
				transform: "translate(-50%, -50%)",
				zIndex: 15,
				animation: inProgress
					? `${rotate} 1s linear infinite` // Rotate if inProgress is true
					: "none",
			}}
		>
			<FiCrosshair size={30} color={inProgress ? "orange" : "red"} />
		</Box>
	);

	const Overlay = ({ leftX, rightX, topY, bottomY }) => (
		<Box
			sx={{
				position: "absolute",
				top: 0,
				left: 0,
				width: "100%",
				height: "100%",
				zIndex: 10,
			}}
		>
			<Box
				sx={[
					styles.center,
					{
						position: "absolute",
						top: 0,
						left: 0,
						right: 0,
						bottom: 0,
						display: "flex",
					},
				]}
			>
				<FiCrosshair size={40} color={Palette.red} />
			</Box>
			<Box
				sx={[
					styles.row,
					{ top: imageHeight / 2 - 1, flex: 1, position: "absolute" },
				]}
			>
				<Lines position={leftX} />
				<Lines position={rightX} />
			</Box>

			<Box
				sx={{
					display: "flex",
					flexDirection: "column",
					left: imageWidth / 2 - 1,
					flex: 1,
					position: "absolute",
				}}
			>
				<Lines position={topY} />
				<Lines position={bottomY} />
			</Box>
		</Box>
	);

	useEffect(() =>
	{
		if (!isEmpty(metadata))
		{
			setImageData(metadata.preview + "?ts=" + new Date());
		}
	}, [metadata]);

	return (
		<Box sx={[styles.center]}>
			<TransformWrapper minScale={0.1} initialScale={1} centerOnInit={true}>
				<TransformComponent
					wrapperStyle={{
						width: "100%",
						height: "calc(100vh - 280px)",
					}}
				>
					{showOverlay && (
						<Overlay
							leftX={{
								width: imageWidth / 2 - 10,
							}}
							rightX={{
								width: imageWidth / 2,
								marginLeft: "20px",
							}}
							topY={{
								height: imageHeight / 2 - 10,
							}}
							bottomY={{
								height: imageHeight / 2,
								marginTop: "20px",
							}}
						/>
					)}
					<Box
						sx={[
							imageData === defaultImg
								? LOCAL_STYLES.defaultImage
								: LOCAL_STYLES.imageBox,
							{
								position: "relative",
								height: "100%",
								width: "100%",
								display: "flex",
								justifyContent: "center",
								alignItems: "center",
							},
						]}
						{...(get(metadata, "hasWCS", false) && showTargetGOTO
							? longPressHandlers
							: {})}
					>
						<img
							onLoad={updateDimensions}
							style={LOCAL_STYLES.image}
							ref={imageRef}
							src={imageData}
						/>
						{get(metadata, "hasWCS", false) && showTargetGOTO && (
							<TargetMarker x={targetPosition.x} y={targetPosition.y} />
						)}
					</Box>
				</TransformComponent>
			</TransformWrapper>
		</Box>
	);
};

export default MainImage;
