import React from "react";
import { useParams } from "react-router-dom";
import Model from "@components/shared/Equipment/Model";
import PageContainer from "@components/global/PageContainer";

const ModelPage = () =>
{
	const { equipmentTypeNameId, manufacturerNameId, modelNameId } = useParams();

	const equipmentTypeId = equipmentTypeNameId.split("-").pop();
	const manufacturerId = manufacturerNameId.split("-").pop();
	const modelId = modelNameId.split("-").pop();

	return (
		<PageContainer>
			<Model
				equipmentTypeId={equipmentTypeId}
				manufacturerId={manufacturerId}
				modelId={modelId}
			/>
		</PageContainer>
	);
};

export default ModelPage;
