import React from "react";
import FullscreenExitIcon from "@mui/icons-material/FullscreenExit";
import Modal from "@mui/material/Modal";
import Box from "@mui/material/Box";
import InfoIcon from "@mui/icons-material/Info";
import { TransformComponent, TransformWrapper } from "react-zoom-pan-pinch";
import { styles } from "../shared/styles";
import { Palette } from "@common/shared/common/styles";
import useModalState from "@hooks/useModalState";
import MetadataTable from "./MetadataTable";
import Fade from "@mui/material/Fade";
import Backdrop from "@mui/material/Backdrop";

const FullScreenImagePreview = ({ open, src, close, metadata }) =>
{
	const [showFileInfo, toggleFileInfo] = useModalState();

	return (
		<Modal
			open={open}
			onClose={close}
			closeAfterTransition
			slots={{ backdrop: Backdrop }}
			slotProps={{
				backdrop: {
					timeout: 500,
				},
			}}
		>
			<Fade in={open} timeout={{ enter: 1000, exit: 1000 }}>
				<Box
					sx={[
						styles.centerAbsolute,
						{ width: "fit-content", height: "fit-content", outline: "none" },
					]}
				>
					<TransformWrapper minScale={0.2}>
						<TransformComponent>
							<Box sx={[LOCAL_STYLES.fullImageBox]}>
								<img style={LOCAL_STYLES.image} src={src} />
							</Box>
						</TransformComponent>
					</TransformWrapper>

					<Box
						sx={[
							styles.center,
							{
								position: "absolute",
								right: "10px",
								top: "10px",
								flexDirection: "column",
								gap: "4px",
							},
						]}
					>
						<FullscreenExitIcon
							onClick={close}
							sx={[LOCAL_STYLES.iconBtn, { color: Palette.white }]}
						/>
						{metadata && (
							<InfoIcon
								onClick={toggleFileInfo}
								sx={[
									LOCAL_STYLES.iconBtn,
									{
										color: showFileInfo ? Palette.orange : Palette.white,
										fontSize: 18,
									},
								]}
							/>
						)}
					</Box>

					<MetadataTable
						metadata={metadata ?? {}}
						onClose={toggleFileInfo}
						open={showFileInfo}
					/>
				</Box>
			</Fade>
		</Modal>
	);
};

const LOCAL_STYLES = {
	image: {
		width: "100%",
		maxHeight: "100%",
		maxWidth: "100%",
		overflow: "hidden",
		objectFit: "contain",
	},
	fullImageBox: {
		width: "75vw",
		height: "75vh",
	},
	iconBtn: {
		cursor: "pointer",
		fontSize: 20,
	},
};

export default FullScreenImagePreview;
