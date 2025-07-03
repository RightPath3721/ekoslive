import React, { memo } from "react";
import Modal from "@mui/material/Modal";
import Box from "@mui/material/Box";
import Equipment from "@components/shared/Equipment"
import { styles } from "@client/shared/styles";

const EquipmentTypeOverlay = ({ close, setEquipmentTypeId }) =>
{
	return (
		<Modal open onClose={close}>
			<Box
				sx={[
					styles.centerAbsolute,
					{
						display: "flex",
						flexDirection: "column",
						borderRadius: "16px",
						backgroundColor: "#151515",
						border: "1px solid #252525",
						padding: "16px",
						position: "relative",
						width: "800px",
						overflow: "auto"
					},
				]}
			>
				<Equipment mode="selectModel" setEquipmentTypeId={setEquipmentTypeId}/>
			</Box>
		</Modal>
	);
};

export default memo(EquipmentTypeOverlay);
