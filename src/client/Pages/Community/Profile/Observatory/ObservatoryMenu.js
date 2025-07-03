import React from "react";
import Modal from "@mui/material/Modal";
import Paper from "@mui/material/Paper";
import TabView from "@components/TabView";
import CloseButton from "@components/CloseButton";
import { styles } from "@client/shared/styles";
import ObservatoryForm from "./ObservatoryForm";
import EquipmentTab from "./EquipmentTab";
import { useActiveObservatory } from "./ObservatoryContext";
import s from "@common/shared/i18n/i18n";

const ObservatoryMenu = ({ open, close, setObservatories }) =>
{
	const { observatoryId } = useActiveObservatory();

	const tabs = [
		{
			title: s.ekos.collapse_observatory.heading,
			component: (
				<ObservatoryForm setObservatories={setObservatories} close={close} />
			),
			containerStyle: {},
		},
		...(observatoryId
			? [
					{
						title: s.connect.equipment,
						component: <EquipmentTab />,
						containerStyle: {},
					},
				]
			: []),
	];

	return (
		<Modal open={open} onClose={close}>
			<Paper
				sx={[
					styles.centerAbsolute,
					{
						backgroundColor: "#111111",
						padding: "12px",
						minWidth: "60vw",
						minHeight: "500px",
					},
				]}
			>
				<CloseButton right="10px" top="10px" onChange={close} />
				<TabView tabs={tabs} />
			</Paper>
		</Modal>
	);
};

export default ObservatoryMenu;
