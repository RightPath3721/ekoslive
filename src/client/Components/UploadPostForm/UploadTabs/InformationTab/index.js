import React from "react";
import Box from "@mui/material/Box";
import ObservatorySelector from "./ObservatorySelector";
import EquipmentProfileSelector from "./EquipmentProfileSelector";
import PostInfoInputs from "./PostInfoInputs";
import Fits from "./Fits";
import { styles } from "@client/shared/styles";
import { useUploadFormContext } from "@components/UploadPostForm/UploadFormContext";

const InformationTab = ({ setFormValid }) =>
{
	const { isOwner, mode } = useUploadFormContext();

	return (
		<Box
			component="form"
			sx={[
				styles.verticalScrollBar,
				{ maxHeight: "500px", overflowY: "scroll" },
			]}
		>
			{(isOwner || mode !== "edit") && (
				<>
					<ObservatorySelector />
					<EquipmentProfileSelector setFormValid={setFormValid} />
				</>
			)}
			<PostInfoInputs setFormValid={setFormValid} />
			{mode !== "edit" && <Fits />}
		</Box>
	);
};

export default InformationTab;
