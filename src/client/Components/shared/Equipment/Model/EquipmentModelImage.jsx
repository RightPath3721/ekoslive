import React, { cloneElement } from "react";
import Box from "@mui/material/Box";
import { useTheme } from "@mui/material";
import { typeIcons } from "@client/Pages/Community/Profile/Observatory/Equipment/EquipmentBox";
import FullScreenImagePreview from "@components/FullScreenImagePreview";
import useModalState from "@hooks/useModalState";
import DoNotDisturbOnIcon from '@mui/icons-material/DoNotDisturbOn';
import Tooltip from '@mui/material/Tooltip';

const EquipmentModelImage = ({ equipmentModel, equipmentType }) =>
{
	const { palette } = useTheme();
	const [showFullImage, toggleFullImage] = useModalState();

	return (
		<Box sx={{ width: "100%" }}>
			<Box
				sx={{
					width: "100%",
					aspectRatio: 1.6,
					display: "flex",
					alignItems: "center",
					justifyContent: "center",
					backgroundColor: palette.black[400],
					borderRadius: "10px",
					overflow: "hidden",
				}}
			>
				{equipmentModel?.logo ? (
					<>
						<img
							src={equipmentModel?.logo}
							style={{ borderRadius: "10px", width: "100%", cursor:"pointer" }}
							alt="model"
							onClick={toggleFullImage}
						/>
						<FullScreenImagePreview
							src={equipmentModel?.logo}
							close={toggleFullImage}
							open={showFullImage}
						/>
					</>
				) : (
					cloneElement(typeIcons[equipmentType?.name || "Mount"], {
						height: 140,
						width: 80,
					})
				)}
			</Box>
			
			<Box
				sx={{
					display: 'flex',
					gap: 1,
					mt: 1,
					justifyContent: 'flex-start',
					alignItems: 'center',
				}}
			>
				{equipmentModel.discontinued && (
					<Tooltip title="Discontinued Product" arrow>
						<DoNotDisturbOnIcon 
							sx={{ 
								color: 'error.main',
								cursor: 'help'
							}} 
						/>
					</Tooltip>
				)}
				
			</Box>
		</Box>
	);
};

export default EquipmentModelImage;
