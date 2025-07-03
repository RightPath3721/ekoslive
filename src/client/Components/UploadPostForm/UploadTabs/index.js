import ImageUpload from "./ImageUpload";
import InformationTab from "./InformationTab";
import AcquisitionTab from "./AcquisitionTab";
import { useUploadFormContext } from "../UploadFormContext";

const UploadTabs = ({ back, next, active, setFormValid }) =>
{
	const { mode } = useUploadFormContext();

	const tabs =
		mode === "edit"
			? [InformationTab, AcquisitionTab]
			: [ImageUpload, InformationTab, AcquisitionTab];

	return tabs[active]?.({ next, back, setFormValid });
};

export default UploadTabs;
