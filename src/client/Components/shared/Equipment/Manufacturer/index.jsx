import React, { useState, useEffect, memo, useCallback } from "react";
import axios from "axios";
import unionBy from "lodash/unionBy";
import { useLocation, useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { selectUser } from "@redux/selectors";
import { captureException } from "@sentry/browser";
import { ekosliveServer } from "@client/config";
import ModelModal from "./ModelModal";
import { useBreadcrumbContext } from "@components/providers/BreadcrumbProvider";
import View from "../View";
import { nameConvertorForURL } from "@client/utils/nameConvertorForURL";

const EQUIPMENT_PAGINATION_LIMIT = 30;

const addEquipment = async ({ model, profileId, observatoryId, user }) =>
{
	if (!user) return null;
	await axios.post(`/api/equipments/${observatoryId}/${profileId}`, model, {
		params: {
			username: user.username,
			token: user.token,
		},
	});
};

const Manufacturer = ({ equipmentTypeId, manufacturerId }) =>
{
	const location = useLocation();
	const user = useSelector(selectUser);
	const { setBreadcrumb } = useBreadcrumbContext();

	const [showModelModal, setShowModelModal] = useState(false);
	const [equipmentModels, setEquipmentModels] = useState([]);
	const [equipmentModel, setEquipmentModel] = useState(null);
	const [manufacturer, setManufacturer] = useState();
	const [equipmentType, setEquipmentType] = useState("");
	
	const [currentPage, setCurrentPage] = useState(0);
	const [itemsCount, setItemsCount] = useState(0);

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
			name: manufacturer?.name,
			link: `/community/equipment/${nameConvertorForURL(equipmentType?.name) + '-' + equipmentTypeId}/${nameConvertorForURL(manufacturer?.name) + '-' + manufacturerId}`,
		},
	];

	useEffect(() =>
	{
		setBreadcrumb(breadcrumbs);
	}, [
		setBreadcrumb,
		equipmentType,
		manufacturer,
		equipmentTypeId,
		manufacturerId,
		location,
	]);

	const navigate = useNavigate();

	/**
	 * Handles the click event to process and navigate based on the given equipment model name.
	 *
	 * @param {string} model - The name of the equipment model to process and navigate to.
	 * @returns {Promise<void>} A Promise that resolves when the navigation is complete.
	 * @async
	 */
	const handleClick = async (model) =>
	{
		if (location.state?.selecting)
		{
			return addEquipmentModel({
				model,
				profileId: location.state?.profileId,
				observatoryName: location.state?.observatoryName,
				observatoryId: location.state?.observatoryId,
				user,
			});
		}
		// Navigate to the new page
		navigate(
			`/community/equipment/${nameConvertorForURL(equipmentType?.name) + '-' + equipmentTypeId}/${nameConvertorForURL(manufacturer?.name) + '-' + manufacturerId}/${nameConvertorForURL(model?.label) + '-' + model?._id}`,
			{ state: location.state },
		);
	};

	const addEquipmentModel = async ({ model, profileId, observatoryName, observatoryId }) =>
	{
		try
		{
			await addEquipment({
				model,
				profileId,
				observatoryId,
				user,
			});
			navigate(`/community/profile/observatories/${nameConvertorForURL(observatoryName) + '-' + observatoryId}`, {
				success: true,
			});
		}
		catch (error)
		{
			captureException(error);
		}
	};

	const fetchEquipmentType = async () =>
	{
		try
		{
			const url = `/api/equipments/equipment-types/${equipmentTypeId}`;
			const response = await ekosliveServer.get(url);
			setEquipmentType(response?.data?.equipmentType);
		}
		catch (error)
		{
			captureException(error);
		}
	};

	/**
	 * Fetches manufacturer details from the server.
	 *
	 * @returns {Promise<void>} - A Promise that resolves when the manufacturer details are fetched and set in the state.
	 * @async
	 */
	const fetchManufacturer = async () =>
	{
		try
		{
			const url = `/api/equipments/manufacturer/${manufacturerId}`;
			const response = await ekosliveServer.get(url);
			setManufacturer(response?.data?.manufacturer);
		}
		catch (error)
		{
			captureException(error);
		}
	};

	const getFilteredModels = useCallback(
		async (filters) =>
		{
			try
			{
				const { data } = await ekosliveServer.get(
					`/api/equipments/filtered/equipmentmodel`,
					{
						params: {
							...filters,
							equipment_type: equipmentTypeId,
							manufacturer: manufacturerId,
							page: currentPage,
							limit: EQUIPMENT_PAGINATION_LIMIT,
							...(user ? { username: user.username, token: user.token } : {}),
						},
					},
				);

				setEquipmentModels((prevData) =>
					currentPage === 0 ? data.data : unionBy(prevData, data.data, "_id"),
				);
				setItemsCount(data?.count);
				return data;
			}
			catch (error)
			{
				captureException(error);
				return { data: [], count: 0 };
			}
		},
		[equipmentTypeId, manufacturerId, currentPage, user, location],
	);

	useEffect(() =>
	{
		if (equipmentTypeId && manufacturerId)
		{
			fetchManufacturer();
			fetchEquipmentType();
		}
	}, [equipmentTypeId, manufacturerId, location]);

	useEffect(() => {
		setCurrentPage(0)
	}, [location])

	return (
		<>
			<View
				type="model"
				setShowModal={setShowModelModal}
				datas={equipmentModels}
				handleClick={handleClick}
				equipmentType={equipmentType}
				fetchDatas={getFilteredModels}
				itemsRemaining={
					itemsCount - EQUIPMENT_PAGINATION_LIMIT * (currentPage + 1)
				}
				setPage={setCurrentPage}
				currentPage={currentPage}
				setEditData={setEquipmentModel}
				setData={setEquipmentModels}
			/>
			<ModelModal
				open={showModelModal}
				handleClose={() => setShowModelModal(false)}
				equipmentType={equipmentTypeId}
				manufacturer={manufacturerId}
				setEquipmentModels={setEquipmentModels}
				fields={equipmentType.fields}
				editData={equipmentModel ?? null}
			/>
		</>
	);
};

export default memo(Manufacturer);
