import React from "react";
import { useUploadFormContext } from "./UploadFormContext";
import Moderation from "../Moderation";

const UploadFormModeration = ({reportData, handleOpenDeleteModal, handleOpenBanModal, setOwner}) =>
{
	const {
		submissionStatus,
		setSubmissionStatus,
		tags,
		setTags,
		note,
		setNote,
        owner
	} = useUploadFormContext();

    if(setOwner){
        setOwner(owner);
    };

	return (
        <Moderation 
            submissionStatus={submissionStatus}
            setSubmissionStatus={setSubmissionStatus}
            tags={tags}
            setTags={setTags}
            note={note}
            setNote={setNote}
            reportData={reportData}
            handleOpenDeleteModal={handleOpenDeleteModal}
            handleOpenBanModal={handleOpenBanModal}
        />
	);
};

export default UploadFormModeration;
