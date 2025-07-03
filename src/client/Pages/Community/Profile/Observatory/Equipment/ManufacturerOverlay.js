import React, { useEffect, memo } from "react";
import Modal from "@mui/material/Modal";
import Box from "@mui/material/Box";
import useActiveUser from "@hooks/useActiveUser";
import View from "@components/shared/Equipment/View";
import { styles } from "@client/shared/styles";
import { ekosliveServer } from "@client/config";
import { captureException } from "@sentry/browser";

const ManufacturerOverlay = ({
	close,
	setManufacturerId,
	equipmentTypeId,
	setShowModal,
	manufacturers,
	setManufacturers,
}) =>
{
	const user = useActiveUser();
	const fetchManufacturers = async () =>
	{
		if (!user) return;
		
		try
		{
			if (equipmentTypeId)
			{
				const url = `/api/equipments/manufacturers/${equipmentTypeId}?username=${encodeURIComponent(user.username)}&token=${user.token}`;
				const response = await ekosliveServer.get(url);
				setManufacturers(response.data.manufacturers);
			}
		}
		catch (error)
		{
			captureException(error);
		}
	};

	useEffect(() =>
	{
		fetchManufacturers();
	}, [equipmentTypeId]);

	const handleClick = (data) =>
	{
		setManufacturerId(data._id);
	};

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
					type={"manufacturer"}
					setShowModal={setShowModal}
					datas={manufacturers}
					handleClick={handleClick}
				/>
			</Box>
		</Modal>
	);
};

export default memo(ManufacturerOverlay);
