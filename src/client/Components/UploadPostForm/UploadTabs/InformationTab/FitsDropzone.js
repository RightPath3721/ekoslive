import React, { useCallback, useState } from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { useDropzone } from "react-dropzone";
import "cropperjs/dist/cropper.css";

const FitsDropzone = ({ onChange }) =>
{
	const [filename, setFilename] = useState("");

	const onDrop = useCallback(
		(acceptedFiles) =>
		{
			if (acceptedFiles && acceptedFiles.length > 0)
			{
				const file = acceptedFiles[0];

				setFilename(file.name);
				onChange(file);
			}
		},
		[onChange],
	);

	const { getRootProps, getInputProps, isDragActive } = useDropzone({
		onDrop,
		accept: {
			"application/octet-stream": [".fits", ".fit"],
		},
	});

	return (
		<Box
			{...getRootProps()}
			sx={{
				width: "100%",
				height: "100%",
				maxHeight: "150px",
				minHeight: "65px",
				border: `2px ${filename ? "solid" : "dashed"} #ccc`,
				borderRadius: "8px",
				display: "flex",
				alignItems: "center",
				justifyContent: "center",
				flexDirection: "column",
				cursor: isDragActive ? "copy" : "pointer",
			}}
		>
			<input {...getInputProps()} />
			{!filename ? (
				<Typography
					component="span"
					sx={{ pointerEvents: "none", color: "#ccc" }}
				>
					Drag & Drop your file here or Click to select a file
				</Typography>
			) : (
				<Typography component="span">{filename}</Typography>
			)}
		</Box>
	);
};

export default FitsDropzone;
