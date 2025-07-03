import React, { useState, useEffect, memo, useCallback } from "react";
import unionBy from "lodash/unionBy";
import { useLocation, useNavigate } from "react-router-dom";
import { captureException } from "@sentry/browser";
import View from "./View";
import { ekosliveServer } from "@client/config";
import ManufacturerModal from "./ManufacturerModal";
import { useBreadcrumbContext } from "@components/providers/BreadcrumbProvider";
import tourGuide from "@components/global/tourGuide";
import s from "@common/shared/i18n/i18n";
import useActiveUser from "@hooks/useActiveUser";
import { nameConvertorForURL } from "@client/utils/nameConvertorForURL";

const steps = [
	{
		selector: "#search_filter",
		content: s.tourGuide.description_search_filter,
	},
	{
		selector: "#search_live",
		content: s.tourGuide.description_search_live,
	},
];

const PAGINATION_LIMIT = 30;

const EquipmentDetails = ({ equipmentTypeId }) =>
{
	const user = useActiveUser();
	const location = useLocation();
	const { setBreadcrumb } = useBreadcrumbContext();
	const [equipmentTypeName, setEquipmentTypeName] = useState("");
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
			name: equipmentTypeName,
			link: `/community/equipment/${nameConvertorForURL(equipmentTypeName) + '-' + equipmentTypeId}`,
		},
	];

	useEffect(() =>
	{
		setBreadcrumb(breadcrumbs);
	}, [setBreadcrumb, equipmentTypeName, location]);

	const navigate = useNavigate();

	const getFilteredManufacturers = useCallback(
		async (filters) =>
		{
			try
			{
				const { data } = await ekosliveServer.get(
					`/api/equipments/filtered/manufacturer`,
					{
						params: {
							...filters,
							page: currentPage,
							equipment_types: equipmentTypeId,
							limit: PAGINATION_LIMIT,
							...(user ? { username: user.username, token: user.token } : {}),
						},
					},
				);

				setManufacturers((prevData) =>
				{
					return currentPage === 0
						? data.data
						: unionBy(prevData, data.data, "_id");
				});
				setItemsCount(data.count);
				return data;
			}
			catch (error)
			{
				captureException(error, { addAttachment: { filters } });
				return { data: [], count: 0 };
			}
		},
		[user, equipmentTypeId, currentPage, location],
	);

	/**
	 * Handles the click event to navigate to a manufacturer's page.
	 *
	 * @param {string} manufacturer - The name of the manufacturer to navigate to.
	 */
	const handleClick = (manufacturer) =>
	{
		// Navigate to the new page
		navigate(`/community/equipment/${nameConvertorForURL(equipmentTypeName) + '-' + equipmentTypeId}/${nameConvertorForURL(manufacturer.name) + '-' + manufacturer._id}`, {
			state: location.state,
		});
	};
	const [manufacturers, setManufacturers] = useState([]);
	const [manufacturer, setManufacturer] = useState(null);
	const [showModal, setShowModal] = useState(false);

	useEffect(() => {
		setCurrentPage(0)
	}, [location]);

	const fetchEquipmentType = async () => {
		try {
			const { data } = await ekosliveServer.get(
				`/api/equipments/equipment-types/${equipmentTypeId}`
			);
			setEquipmentTypeName(data?.equipmentType?.name);
		} catch (error) {
			captureException(error);
		}
	};

	useEffect(() => {

		if (equipmentTypeId) {
			fetchEquipmentType();
		}
	}, [equipmentTypeId]);

	return (
		<>
			<View
				type="manufacturer"
				setShowModal={setShowModal}
				datas={manufacturers}
				handleClick={handleClick}
				fetchDatas={getFilteredManufacturers}
				itemsRemaining={itemsCount - PAGINATION_LIMIT * (currentPage + 1)}
				setPage={setCurrentPage}
				currentPage={currentPage}
				breadcrumbs={breadcrumbs}
				setEditData={setManufacturer}
				setData={setManufacturers}
			/>
			<ManufacturerModal
				open={showModal}
				handleClose={() => setShowModal(false)}
				equipmentType={equipmentTypeId}
				setManufacturers={setManufacturers}
				editData={manufacturer}
			/>
		</>
	);
};

export default memo(
	tourGuide(EquipmentDetails, {
		steps,
		key: "equipment_detailed",
		initialStepKey: "equipment",
	}),
);
