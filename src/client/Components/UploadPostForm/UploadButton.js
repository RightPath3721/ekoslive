import React, { useCallback, useState } from "react";
import IconButton from "@mui/material/IconButton";
import UploadIcon from "@mui/icons-material/Upload";
import UploadForm from "./";

const UploadButton = () =>
{
	const [isFormOpen, setIsFormOpen] = useState(false);

	const toggleFormState = useCallback(
		() => setIsFormOpen((p) => !p),
		[setIsFormOpen],
	);

	return (
		<>
			<IconButton onClick={toggleFormState}>
				<UploadIcon style={{ color: "#CECECE", fontSize: 30 }} />
			</IconButton>
			<UploadForm close={toggleFormState} open={isFormOpen} />
		</>
	);
};

export default UploadButton;
