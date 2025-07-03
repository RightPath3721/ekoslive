import React from "react";
import isEmpty from "lodash/isEmpty";
import Modal from "@mui/material/Modal";
import Paper from "@mui/material/Paper";
import { styles } from "@client/shared/styles";
import UploadFormContextProvider from "./UploadFormContext";
import FormStepper from "./FormStepper";
import UploadFormModeration from "./UploadFormModeration";
import { Can } from "@components/providers/AclProvider";

const UploadForm = ({ open, close, mode = "add", id, submit, reportData, handleOpenDeleteModal, handleOpenBanModal, setOwner }) =>
{
	mode = !isEmpty(id) ? "edit" : "add";
	return (
		<Modal open={open} onClose={close}>
			<Paper
				sx={[
					styles.centerAbsolute,
					{
						padding: "1.75rem 1.25rem",
						minHeight: "60vh",
						minWidth: "60vw",
						display: "flex",
						flexDirection: "column",
						gap: "10px",
					},
				]}
			>
				<UploadFormContextProvider mode={mode} id={id} submit={submit}>
					<FormStepper close={close} />
					<Can action="update" subject="ModeratingStatus">
						<UploadFormModeration 
							reportData={reportData}
							handleOpenDeleteModal={handleOpenDeleteModal}
							handleOpenBanModal={handleOpenBanModal}
							setOwner={setOwner}
						/>
					</Can>
				</UploadFormContextProvider>
			</Paper>
		</Modal>
	);
};

export default UploadForm;
