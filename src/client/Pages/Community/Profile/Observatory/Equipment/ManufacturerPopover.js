import React, { useEffect, useState } from "react";
import axios from "axios";
import Image from "mui-image";
import Stack from "@mui/material/Stack";
import Popover from "@mui/material/Popover";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import useActiveUser from "@hooks/useActiveUser";
import { Palette } from "@common/shared/common/styles";
import s from "@common/shared/i18n/i18n";
import DetailedInfoViewModal from "./DetailedInfoViewModal";
import FullScreenImagePreview from "@components/FullScreenImagePreview";
import useModalState from "@hooks/useModalState";

const ManufacturerPopover = ({ manufacturer: initialData }) =>
{
	const [manufacturer, setManufacturer] = useState(null);
	const user = useActiveUser();
	const [showInfoModal, setShowInfoModal] = useState(false);
	const [showFullImage, toggleFullImage] = useModalState();

	useEffect(() =>
	{
		(async () =>
		{
			if (!user) return;
			
			try
			{
				const { data } = await axios.get(
					`/api/equipments/manufacturers/${initialData._id}?token=${user.token}&username=${encodeURIComponent(user.username)}`,
				);
				setManufacturer(data.manufacturer);
			}
			catch (error)
			{
				console.error(error);
			}
		})();
	}, []);

	const [anchorEl, setAnchorEl] = useState(null);

	const handlePopoverOpen = (event) =>
	{
		setAnchorEl(event.currentTarget);
	};

	const handlePopoverClose = () =>
	{
		setAnchorEl(null);
	};

	if (!manufacturer) return null;

	return (
		<>
			<Stack
				aria-owns={anchorEl ? "manufacturer-info-popover" : undefined}
				aria-haspopup="true"
				onMouseEnter={handlePopoverOpen}
			>
				<Image
					src={manufacturer.logo ?? "/public/manufacturer-logo.png"}
					width={30}
					height={30}
					duration={0.2}
					onClick={toggleFullImage}
					sx={{
						cursor: "pointer",
					}}
				/>
				<FullScreenImagePreview
					src={manufacturer.logo ?? "/public/manufacturer-logo.png"}
					close={toggleFullImage}
					open={showFullImage}
				/>
			</Stack>

			<Popover
				id="mouse-over-popover"
				sx={{
					".MuiPopover-paper": {
						display: "flex",
						flexDirection: "column",
						gap: "4px",
						padding: "6px",
						zIndex: 1000,
					},
				}}
				open={!!anchorEl}
				anchorEl={anchorEl}
				anchorOrigin={{
					vertical: "bottom",
					horizontal: "left",
				}}
				transformOrigin={{
					vertical: "top",
					horizontal: "left",
				}}
				onClose={handlePopoverClose}
				disableRestoreFocus
			>
				<Box
					onMouseLeave={handlePopoverClose}
					sx={[
						{
							display: "flex",
							flexDirection: "column",
							width: "160px",
							padding: "12px",
							gap: "12px",
							color: "white",
						},
					]}
				>
					<Typography sx={{ color: "white" }}>{manufacturer.name}</Typography>

					<Button
						onClick={() => setShowInfoModal(true)}
						type="button"
						variant="contained"
						sx={{
							backgroundColor: Palette.orange,
							color: "white",
							width: "130px",
						}}
					>
						{s.general.details}
					</Button>
				</Box>
			</Popover>
			<DetailedInfoViewModal
				manufacturer={manufacturer}
				close={() => setShowInfoModal(false)}
				isOpen={showInfoModal}
			/>
		</>
	);
};

export default ManufacturerPopover;
