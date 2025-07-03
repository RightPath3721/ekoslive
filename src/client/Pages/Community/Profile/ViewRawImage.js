import React, { useState } from "react";
import Box from "@mui/material/Box";
import CloseButton from "@components/CloseButton";
import Download from "@mui/icons-material/Download";
import { Palette } from "@common/shared/common/styles";
import { IconButton, Modal, Typography, useTheme } from "@mui/material";
import ShareIcon from "@mui/icons-material/Share";
import ShareDialog from "@client/views/ViewPage/ShareDialog";
import DeleteIcon from "@mui/icons-material/Delete";
import InfoViewer from "@client/views/ViewPage/InfoViewer";
import { styles } from "@client/shared/styles";
import InfoIcon from "@mui/icons-material/Info";
import { TransformComponent, TransformWrapper } from "react-zoom-pan-pinch";
import Image from "mui-image";
import AlertDialog from "@components/AlertDialog";

const ViewRawImage = ({ onClose, image, open }) =>
{
	const [isShareModalOpen, setIsShareModalOpen] = useState(false);
	const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
	const [showInfo, setShowInfo] = useState(false);
	const { palette } = useTheme();

	return (
		<Modal open={open} onClose={onClose}>
			<Box
				sx={[
					styles.centerAbsolute,
					styles.center,
					{
						width: "85%",
						position: "relative",
						backgroundColor: palette.black[700],
					},
				]}
			>
				<Box
					sx={{
						zIndex: 20,
						position: "absolute",
						display: "flex",
						flexDirection: "column",
						right: "32px",
						top: "20px",
						gap: "18px",
					}}
				>
					<Box
						sx={{
							cursor: "pointer",
							position: "relative",
							width: "38px",
							height: "38px",
							backgroundColor: Palette.orange,
							borderRadius: "4px",
						}}
					>
						<CloseButton
							right={0}
							top={0}
							onChange={() =>
							{
								onClose();
								setIsShareModalOpen(false);
							}}
							sx={{ width: "38px", height: "38px" }}
						/>
					</Box>
					<a
						href={image.raw}
						style={{
							cursor: "pointer",
							display: "grid",
							placeItems: "center",
							width: "38px",
							height: "38px",
							background: Palette.blue,
							borderRadius: "4px",
						}}
						target="_blank"
						rel="noreferrer noopener"
					>
						<Download sx={{ fill: Palette.white }} />
					</a>

					<Box sx={{ position: "relative" }}>
						<IconButton
							sx={{
								background: Palette.blue,
								borderRadius: "4px",
								color: Palette.white,
								width: "38px",
								height: "38px",
								":hover": { background: Palette.blue },
							}}
							onClick={() => setIsShareModalOpen((prevState) => !prevState)}
						>
							<ShareIcon />
						</IconButton>
						{isShareModalOpen && <ShareDialog shareURL={image.shortURL} />}
					</Box>

					<IconButton
						sx={{
							background: Palette.red,
							borderRadius: "4px",
							color: Palette.white,
							":hover": { background: Palette.red },
							width: "38px",
							height: "38px",
						}}
						onClick={() => setIsDeleteDialogOpen(true)}
					>
						<DeleteIcon />
					</IconButton>
				</Box>
				{showInfo && (
					<Box
						sx={{
							position: "absolute",
							top: "6%",
							left: "0",
							zIndex: 10,
							backgroundColor: "#000000aa",
						}}
					>
						<InfoViewer
							data={image}
							onTagAdd={() =>
							{}}
							onTagRemove={() =>
							{}}
							showTags={false}
						/>
					</Box>
				)}

				<Box sx={[styles.center, { justifyContent: "flex-start" }]}>
					<TransformWrapper
						initialPositionX={20}
						initialPositionY={0}
						minScale={0.5}
						maxScale={4}
					>
						<TransformComponent
							wrapperStyle={{ width: "100%", height: "700px" }}
							contentStyle={{ width: "100%" }}
						>
							<Image duration={0} src={image.src} />
						</TransformComponent>
					</TransformWrapper>
				</Box>

				{image["metadata"]?.filename && (
					<Box
						sx={[
							styles.center,
							{
								position: "absolute",
								bottom: "12px",
								left: "50%",
								transform: "translateX(-50%)",
							},
						]}
					>
						<Typography sx={styles.text}>
							{image["metadata"]?.filename}
						</Typography>
					</Box>
				)}

				<IconButton
					sx={{
						backgroundColor: showInfo ? Palette.orange : "",
						border: "1px solid grey",
						"&:hover": { backgroundColor: showInfo ? Palette.orange : "" },
						position: "absolute",
						top: "1%",
						left: "1%",
						borderRadius: "50%",
						padding: "4px",
						color: Palette.white,
					}}
					onClick={() => setShowInfo((p) => !p)}
				>
					<InfoIcon sx={{ fontSize: 20 }} />
				</IconButton>

				<AlertDialog
					handleDelete={() =>
					{}}
					show={isDeleteDialogOpen}
					close={() => setIsDeleteDialogOpen(false)}
					title="Confirmation"
					description="Are you sure you want to delete the displayed Image?"
				/>
			</Box>
		</Modal>
	);
};

export default ViewRawImage;
