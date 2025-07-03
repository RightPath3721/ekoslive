import React, { createRef, useEffect, useRef, useState } from "react";
import defaultImg from "@images/background.webp";
import { useDispatch, useSelector } from "react-redux";
import { selectPolarStage } from "@redux/selectors";
import { isEmpty } from "lodash";
import { Box, Grid } from "@mui/material";
import PolarCoordinates from "./PolarCoordinates";
import FullScreenImagePreview from "@components/FullScreenImagePreview";
import { polarActions } from "@redux/actions";
import useModalState from "@hooks/useModalState";
import PolarControls from "./PolarControls";
import { styles } from "@client/shared/styles";

const AlignImage = ({ sx = { height: "250px", width: "300px" } }) =>
{
	const dispatch = useDispatch();
	const metadata = useSelector((state) => state.wsMedia.alignMetadata);
	const stage = useSelector(selectPolarStage);

	const imageRef = useRef(null);
	const boxRef = createRef();

	const [imagesData, setImagesData] = useState(defaultImg);
	const [hasMounted, setHasMounted] = useState(false);
	const [showFullImage, toggleFullImage] = useModalState();

	const handleClick = (event) =>
	{
		if (stage === "Select Star")
		{
			const rect = imageRef.current?.getBoundingClientRect();
			const x = event.clientX - rect.left;
			const y = event.clientY - rect.top;
			const width = rect.right - rect.left;
			const height = rect.bottom - rect.top;
			const posX = x / width;
			const posY = y / height;

			if (posX >= 0 && posX <= 1 && posY >= 0 && posY <= 1)
				dispatch(polarActions.setCrosshair(posX, posY));
		}
	};

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
		<Box sx={{ width: "100%" }}>
			<Grid container>
				<Grid item xs={2}>
					<PolarCoordinates />
				</Grid>
				<Grid item xs={8}>
					<Box ref={boxRef} sx={styles.center}>
						<img
							ref={imageRef}
							duration={0}
							onMouseDown={(e) => handleClick(e)}
							style={{ ...LOCAL_STYLES.polarImage, ...sx }}
							src={imagesData}
						/>
						<FullScreenImagePreview
							src={imagesData}
							close={toggleFullImage}
							open={showFullImage}
						/>
					</Box>
				</Grid>
				<PolarControls />
			</Grid>
		</Box>
	);
};

export default AlignImage;

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
