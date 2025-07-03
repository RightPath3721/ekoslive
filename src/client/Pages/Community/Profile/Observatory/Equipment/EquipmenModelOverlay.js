import React, { useEffect, memo } from "react";
import axios from "axios";
import Modal from "@mui/material/Modal";
import Box from "@mui/material/Box";
import useActiveUser from "@hooks/useActiveUser";
import View from "@components/shared/Equipment/View";
import { styles } from "@client/shared/styles";
import { ekosliveServer } from "@client/config";
import { captureException } from "@sentry/browser";

const EquipmentModelOverlay = ({
	close,
	profileId,
	equipmentTypeId,
	manufacturerId,
	setEquipmentList,
	setShowModal,
	observatoryId,
	equipmentModels,
	setEquipmentModels,
}) =>
{
	const user = useActiveUser();

	/**
	 * Fetches equipment models from the server based on equipment type and manufacturer.
	 *
	 * @returns {Promise<void>} - A Promise that resolves when the equipment models are fetched and set in the state.
	 * @async
	 */
	const fetchEquipmentModels = async () =>
	{
		try
		{
			if (!user) return;

			const url = `/api/equipments/equipment-models/${equipmentTypeId}/${manufacturerId}?username=${encodeURIComponent(user.username)}&token=${user.token}`;
			const response = await ekosliveServer.get(url);
			setEquipmentModels(response.data.equipmentModels);
		}
		catch (error)
		{
			captureException(error);
		}
	};

	const handleClick = async (data) =>
	{
		if (!user) return;
		
		const url = `/api/equipments/equipment-profile/${profileId}/${data._id}?username=${encodeURIComponent(user.username)}&token=${user.token}`;
		await ekosliveServer.get(url);

		const { data: equipmnets } = await axios.get(
			`/api/equipments?username=${encodeURIComponent(user.username)}&token=${user.token}&observatoryId=${observatoryId}&profileId=${profileId}`,
			{ observatoryId, profileId },
		);
		const {
			data: { equipmentTypes },
		} = await axios.get(
			`/api/equipments/equipment-types?username=${encodeURIComponent(user.username)}&token=${user.token}`,
		);
		setEquipmentList(
			equipmnets.equipmentList.map((equipment) => ({
				...equipment,
				equipment_type: equipmentTypes.find(
					(type) => type._id === equipment.equipment_type,
				),
			})),
		);
		close();
	};

	useEffect(() =>
	{
		fetchEquipmentModels();
	}, [equipmentTypeId, manufacturerId]);

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
						height: "600px",
						overflow: "auto",
					},
				]}
			>
				<View
					type={"model"}
					setShowModal={setShowModal}
					datas={equipmentModels}
					handleClick={handleClick}
				/>
			</Box>
		</Modal>
	);
};

export default memo(EquipmentModelOverlay);
