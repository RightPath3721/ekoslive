import { Palette } from "@common/shared/common/styles";
import s from "@common/shared/i18n/i18n";
import { Box, Typography } from "@mui/material";
import { captureActions, schedulerActions } from "@redux/actions";
import React, { useState } from "react";
import { useDropzone } from "react-dropzone";
import { useDispatch } from "react-redux";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";

const Upload = (props) =>
{
	const dispatch = useDispatch();

	const { fileExtension, toggle } = props;

	const [isUploaded, setIsUploaded] = useState(false);
	const isScheduler = fileExtension === "esl";
	// Handle dropped files
	const onDrop = (acceptedFiles) =>
	{
		// You can process the file here, e.g., read the content
		const file = acceptedFiles[0];

		const reader = new FileReader();

		reader.onload = () =>
		{
			saveJob(reader.result);
		};

		reader.onerror = () =>
		{
			console.error("Error reading file", reader.error);
		};

		reader.readAsText(file); // Use `readAsArrayBuffer` for binary content
	};

	// Set up the dropzone options
	const { getRootProps, getInputProps } = useDropzone({
		onDrop, // The function to call when files are dropped
		accept: isScheduler ? ".esl" : ".esq", // Restrict file types to `.esq` (you can add other types if needed)
	});

	const saveJob = async (fileContent) =>
	{
		if (fileExtension === "esl")
			dispatch(schedulerActions.loadFile("", fileContent));
		else dispatch(captureActions.loadSequenceFile("", fileContent));

		setIsUploaded(true);
		toggle();
	};

	return (
		<Box>
			<Box {...getRootProps()} style={styles.dropzone}>
				<input {...getInputProps()} />
				{!isUploaded ? (
					<Typography>{s.ekoslive.info.drag}</Typography>
				) : (
					<Box>
						<Typography>{s.ekoslive.info.selected}</Typography>
						<CheckCircleOutlineIcon
							sx={{ color: Palette.green, fontSize: "25px" }}
							size="25px"
						/>
					</Box>
				)}
			</Box>
		</Box>
	);
};

const styles = {
	dropzone: {
		border: "2px dashed #cccccc",
		padding: "20px",
		textAlign: "center",
		cursor: "pointer",
		width: "300px",
		margin: "auto",
		borderRadius: "5px",
	},
};

export default Upload;
