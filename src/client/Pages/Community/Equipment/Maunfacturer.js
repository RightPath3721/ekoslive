import React from "react";
import { useParams } from "react-router-dom";
import Manufacturer from "@components/shared/Equipment/Manufacturer";
import PageContainer from "@components/global/PageContainer";

const ManufacturerPage = () =>
{
	const { equipmentTypeNameId, manufacturerNameId } = useParams();

	const equipmentTypeId = equipmentTypeNameId.split("-").pop();
	const manufacturerId = manufacturerNameId.split("-").pop();
	
	return (
		<PageContainer>
			<Manufacturer
				equipmentTypeId={equipmentTypeId}
				manufacturerId={manufacturerId}
			/>
		</PageContainer>
	);
};

export default ManufacturerPage;
