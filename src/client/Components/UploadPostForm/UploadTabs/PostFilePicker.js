import React, { useCallback, useState } from "react";
import Image from "mui-image";
import { useTheme } from "@mui/material";
import Typography from "@mui/material/Typography";
import { useDropzone } from "react-dropzone";
import s from "@common/shared/i18n/i18n";
import FolderSearch from "@client/icons/FolderSearch";

const PostFilePicker = ({
	acceptedFiles,
	name,
	setFile,
	multiple = false,
	autoFocus = false,
	previewVisible = true,
	previewBoxProps = {},
	iconSize = 24,
	rootStyleOverride = {},
}) =>
{
	const { palette } = useTheme();
	const [previewFile, setPreviewFile] = useState();
	const onDrop = useCallback((acceptedFiles) =>
	{
		setFile?.(acceptedFiles[0]);
		if (previewVisible) setPreviewFile(URL.createObjectURL(acceptedFiles[0]));
	}, []);
	const { getRootProps, getInputProps } = useDropzone({
		onDrop,
		multiple,
		autoFocus,
		accept: acceptedFiles,
	});

	return (
		<div
			{...getRootProps({
				style: {
					position: "relative",
					display: "grid",
					gridTemplateColumns: `1fr ${iconSize}px`,
					alignItems: "center",
					borderRadius: "4px",
					cursor: "pointer",
					padding: "9px 16px",
					boxSizing: "border-box",
					backgroundColor: palette.black[700],
					width: "100%",
					...rootStyleOverride,
				},
			})}
			className="text-white hover:text-primary-orange"
		>
			<input {...getInputProps({ name })} />
			<Typography component="span" display="inline" sx={{ color: "inherit" }}>
				{s.general.select_file}
			</Typography>
			<FolderSearch width={iconSize} height={iconSize} color="inherit" />
			{previewVisible && previewFile && (
				<Image
					src={previewFile}
					alt="observatory preview"
					duration={0.3}
					width={140}
					height={140}
					style={{ objectFit: "cover" }}
					{...previewBoxProps}
				/>
			)}
		</div>
	);
};

export default PostFilePicker;
