import React, { memo } from "react";

import TabView from "./TabView";
import Local from "./DirectoryBrowser/Local";
import { Modal } from "@mui/material";
import { Palette } from "@common/shared/common/styles";
import Upload from "./DirectoryBrowser/Upload";
import Cloud from "./DirectoryBrowser/Cloud";

const DirectoryBrowser = (props) =>
{
	const { toggle } = props;
	const headers = [
		{
			title: "Local",
			component: <Local {...props} />,
		},
		{
			title: "Cloud",
			component: <Cloud {...props} />,
		},
		{
			title: "Upload",
			component: <Upload {...props} />, // File Drag and Drop option
		},
	];

	return (
		<Modal
			open={true}
			style={{ justifyContent: "center", borderWidth: 2, borderColor: "white" }}
			onClose={toggle}
			aria-labelledby="modal-modal-title"
			aria-describedby="modal-modal-description"
		>
			<TabView sx={LOCAL_STYLES.modal} defaultValue={0} tabs={headers} />
		</Modal>
	);
};

export default memo(DirectoryBrowser);

const LOCAL_STYLES = {
	modal: {
		display: "flex",
		flexDirection: "column",
		justifyContent: "center",
		gap: "16px",
		backgroundColor: Palette.grey22,
		borderRadius: "5px",
		border: "2px solid #000",
		padding: "10px 40px",
		position: "absolute",
		top: "50%",
		left: "50%",
		transform: "translate(-50%, -50%)",
		width: "60%", // Adjust width as needed, for example
		height: "auto", // If you want dynamic height based on content
		textAlign: "center", // Useful for centering text inside the element
	},
};
