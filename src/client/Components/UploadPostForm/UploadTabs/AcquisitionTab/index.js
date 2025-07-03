import React from "react";
import AcquisionContextProvider from "./AcquisitionTabContext";
import AcquisionTabForm from "./AcquisionTabForm";

const AcquisitionTab = ({ setFormValid }) =>
{
	return (
		<AcquisionContextProvider>
			<AcquisionTabForm setFormValid={setFormValid} />
		</AcquisionContextProvider>
	);
};

export default AcquisitionTab;
