import React from "react";
import isEmpty from "lodash/isEmpty";
import FitsSelector from "../FitsSelector";
import { useUploadFormContext } from "../../UploadFormContext";

const Fits = () =>
{
	const { additionalMetadata, setAdditionalMetadata } = useUploadFormContext();

	if (!isEmpty(additionalMetadata)) return null;

	return <FitsSelector setMetadata={setAdditionalMetadata} />;
};

export default Fits;
