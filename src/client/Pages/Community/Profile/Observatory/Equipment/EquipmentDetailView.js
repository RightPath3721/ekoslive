import React, { useState } from "react";
import Modal from "@mui/material/Modal";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import IconButton from "@mui/material/IconButton";
import EditIcon from "@mui/icons-material/Edit";
import Button from "@mui/material/Button";
import CloseButton from "@components/CloseButton";
import { styles } from "@client/shared/styles";
import DetailedInfoViewModal from "./DetailedInfoViewModal";

const EquipmentDetailView = ({ equipment, open, close, setFormData }) =>
{
	const [showManufacturerView, setShowManufacturerView] = useState(false);

	return (
		<Modal open={open} onClose={close}>
			<Paper
				sx={[
					styles.centerAbsolute,
					{
						display: "grid",
						gridTemplateColumns: "1fr",
						gap: "12px",
						padding: "32px 24px",
						zIndex: 1000,
					},
				]}
			>
				{Object.entries(equipment).map(([key, value]) =>
				{
					if (key === "_id" || key === "__v") return null;

					if (typeof value === "string")
						return (
							<Typography key={key} sx={{ color: "white" }}>
								{key.includes("_") ? key.split("_").join(" ") : key}: {value}
							</Typography>
						);

					if (key === "equipment_type")
						return (
							<Typography
								key={key}
								sx={{ color: "white", textTransform: "capitalize" }}
							>
								{key.includes("_") ? key.split("_").join(" ") : key}:{" "}
								{value.name}
							</Typography>
						);

					if (typeof value === "object")
						return (
							<Typography key={key} sx={{ color: "white" }}>
								<Typography
									sx={{ textTransform: "capitalize" }}
									component="span"
								>
									{key.includes("_") ? key.split("_").join(" ") : key}
								</Typography>
								:
								<Button
									sx={{
										minWidth: "auto",
										color: "white",
										display: "inline",
										textDecoration: "underline",
									}}
									onClick={() => setShowManufacturerView(true)}
								>
									{value.name}
								</Button>
							</Typography>
						);

					return null;
				})}

				<IconButton
					onClick={() => setFormData({ equipment, mode: "edit" })}
					sx={[
						{
							backgroundColor: "#FFFCFA1A",
							borderRadius: "4px",
							width: "36px",
							height: "36px",
							minWidth: "auto",
							padding: 0,
							justifySelf: "flex-end",
						},
					]}
				>
					<EditIcon sx={{ color: "#CECECE", fontSize: 25 }} />
				</IconButton>
				<CloseButton top="10px" right="10px" onChange={close} />

				<DetailedInfoViewModal
					close={() => setShowManufacturerView(false)}
					isOpen={showManufacturerView}
					manufacturer={equipment.manufacturer}
				/>
			</Paper>
		</Modal>
	);
};

export default EquipmentDetailView;
