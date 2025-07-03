import React, { useEffect, useState, memo, useCallback } from "react";
import Box from "@mui/material/Box";
import { captureException } from "@sentry/browser";
import { useLocation } from "react-router-dom";
import { ekosliveServer } from "@client/config";
import { useBreadcrumbContext } from "@components/providers/BreadcrumbProvider";
import ImageUploadComponent from "@components/ImageUpload";
import ModelModal from "../Manufacturer/ModelModal";
import EquipmentModelImage from "./EquipmentModelImage";
import EquipmentDetails from "./EquipmentDetails";
import ReportAbuseModal from "@components/shared/Community/ReportAbuseModal";
import { nameConvertorForURL } from "@client/utils/nameConvertorForURL";

const EquipmentModel = ({ equipmentTypeId, manufacturerId, modelId }) =>
{
	const { setBreadcrumb } = useBreadcrumbContext();

	const [equipmentModel, setEquipmentModel] = useState({});
	const [equipmentType, setEquipmentType] = useState("");

	const [showImageModal, setShowImageModal] = useState(false);
	const [image, setImage] = useState();
	const [imageName, setImageName] = useState();
	const [showModelModal, setShowModelModal] = useState(false);
	const [showReportModal, setShowReportModal] = useState(false);
	const location = useLocation();

	const breadcrumbs = [
		{
			name: "Community",
			link: "/community",
		},
		{
			name: "Equipment",
			link: "/community/equipment",
		},
		{
			name: equipmentType?.name,
			link: `/community/equipment/${nameConvertorForURL(equipmentType?.name) + '-' + equipmentTypeId}`,
		},
		{
			name: equipmentModel?.manufacturer?.name,
			link: `/community/equipment/${nameConvertorForURL(equipmentType?.name) + '-' + equipmentTypeId}/${nameConvertorForURL(equipmentModel?.manufacturer?.name) + '-' + manufacturerId}`,
		},
		{
			name: equipmentModel?.label,
			link: `/community/equipment/${nameConvertorForURL(equipmentType?.name) + '-' + equipmentTypeId}/${nameConvertorForURL(equipmentModel?.manufacturer?.name) + '-' + manufacturerId}/${nameConvertorForURL(equipmentModel?.label) + '-' + modelId}`,
		},
	];

	const fetchEquipmentType = async () =>
	{
		try
		{
			const url = `/api/equipments/equipment-types/${equipmentTypeId}`;
			const response = await ekosliveServer.get(url);
			setEquipmentType(response.data.equipmentType);
		}
		catch (error)
		{
			captureException(error);
		}
	};

	useEffect(() =>
	{
		setBreadcrumb(breadcrumbs);
	}, [
		setBreadcrumb,
		equipmentType,
		equipmentModel,
		equipmentTypeId,
		manufacturerId,
		modelId,
		location,
	]);

	/**
	 * Fetches equipment model details from the server.
	 *
	 * @returns {Promise<void>} A Promise that resolves when the equipment model details are fetched and set in the state.
	 * @async
	 */
	const fetchEquipmentModel = async () =>
	{
		try
		{
			const url = `/api/equipments/equipment-model/${modelId}`;
			const response = await ekosliveServer.get(url);
			setEquipmentModel(response.data.equipmentModel);
		}
		catch (error)
		{
			captureException(error);
		}
	};

	useEffect(() =>
	{
		if (modelId && equipmentTypeId)
		{
			fetchEquipmentModel();
			fetchEquipmentType();
		}
	}, [modelId, equipmentTypeId, location]);

	const toggleEditModal = useCallback(
		() => setShowModelModal((p) => !p),
		[setShowModelModal],
	);

	return (
		<Box
			sx={{
				display: "flex",
				color: "white",
				paddingInline: {
					xxs: ".75rem",
					xs: "1rem",
					md: "1.25rem",
					lg: "1.125rem 1.5rem",
				},
				gap: "1.5rem",
				flexDirection: { xxs: "column", sm: "row" },
				alignItems: "flex-start",
				mt: { xxs: "2rem" },
			}}
		>
			<EquipmentModelImage
				equipmentModel={equipmentModel}
				equipmentType={equipmentType}
			/>

			<EquipmentDetails
				equipmentModel={equipmentModel}
				equipmentType={equipmentType}
				toggleEditModal={toggleEditModal}
				setShowReportModal={setShowReportModal}
			/>

			<ImageUploadComponent
				isOpen={showImageModal}
				close={() => setShowImageModal(false)}
				type="model"
				setImage={setImage}
				image={image}
				setImageName={setImageName}
			/>

			<ModelModal
				open={showModelModal}
				handleClose={toggleEditModal}
				fields={equipmentType?.fields}
				setShowImageModal={setShowImageModal}
				setEquipmentModel={setEquipmentModel}
				image={image}
				editData={equipmentModel}
				imageName={imageName}
			/>

			<ReportAbuseModal
				type="EQUIPMENTMODEL"
				resourceId={equipmentModel._id}
				open={showReportModal}
				handleClose={() => setShowReportModal(false)}
			/>
		</Box>
	);
};

export default memo(EquipmentModel);
