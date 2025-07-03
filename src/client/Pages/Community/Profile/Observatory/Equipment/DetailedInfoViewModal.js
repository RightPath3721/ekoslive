import React from "react";
import Image from "mui-image";
import Modal from "@mui/material/Modal";
import Paper from "@mui/material/Paper";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Link from "@mui/material/Link";
import { styles } from "@client/shared/styles";
import { Palette } from "@common/shared/common/styles";
import CloseButton from "@components/CloseButton";

const DetailedInfoViewModal = ({ isOpen, close, manufacturer }) =>
{
	return (
		<Modal open={isOpen} onClose={close}>
			<Paper
				sx={[
					styles.centerAbsolute,
					{
						display: "flex",
						flexDirection: "column",
						gap: "4px",
						padding: "6px",
						zIndex: 1000,
					},
				]}
			>
				<Box
					sx={[
						{
							display: "flex",
							flexDirection: "column",
							padding: "28px 20px",
							gap: "16px",
							color: "white",
						},
					]}
				>
					<Typography sx={{ color: "white", fontSize: "20px" }}>
						Name: {manufacturer.name}
					</Typography>
					{manufacturer.url && (
						<Link
							href={manufacturer.url}
							target="_blank"
							rel="noopener noreferrer"
							color="inherit"
						>
							Link: {manufacturer.url}
						</Link>
					)}
					<Box
						sx={{
							backgroundColor: manufacturer.approved
								? Palette.green
								: Palette.red,
							paddingBlock: "6px",
							borderRadius: "4px",
							width: "130px",
						}}
					>
						<Typography sx={{ color: "white", textAlign: "center" }}>
							{manufacturer.approved ? "Confirmed" : "Not confirmed"}
						</Typography>
					</Box>
					{manufacturer.logo && (
						<Box
							sx={{ display: "inline-flex", gap: "4px", alignItems: "center" }}
						>
							<Typography sx={{ color: "white" }}>Logo:&nbsp;</Typography>
							<Image
								src={manufacturer.logo}
								width={50}
								height={50}
								duration={0.1}
							/>
						</Box>
					)}
				</Box>

				<CloseButton onChange={close} right="10px" top="10px" />
			</Paper>
		</Modal>
	);
};

export default DetailedInfoViewModal;
