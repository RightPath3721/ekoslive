import React from "react";
import EquipmentDetail from "@components/shared/Equipment/EquipmentDetail";
import { useParams } from "react-router-dom";
import PageContainer from "@components/global/PageContainer";

const EquipmentDetailPage = () =>
{
	const { equipmentTypeNameId } = useParams();

	const equipmentTypeId = equipmentTypeNameId.split("-").pop();

	return (
		<PageContainer>
			<EquipmentDetail equipmentTypeId={equipmentTypeId} />
		</PageContainer>
	);
};

export default EquipmentDetailPage;
