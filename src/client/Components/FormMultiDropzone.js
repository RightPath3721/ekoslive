import React, { useCallback, useState } from "react";
import { useTheme } from "@mui/material";
import Typography from "@mui/material/Typography";
import s from "@common/shared/i18n/i18n";
import FolderSearch from "@client/icons/FolderSearch";
import MutliImageUpload from "@components/MultiImageUpload";

const FormMultiDropzone = ({
	acceptedFiles,
	name,
	label,
	setFile,
	iconSize = 24,
	file,
	imagePickerType,
	previewBoxProps = {},
	rootStyleOverride = {},
	...imagePickerProps
}) =>
{
	const { palette } = useTheme();
	const [isPickerOpen, setIsPickerOpen] = useState(false);
	const [filename, setFilename] = useState();

	const toggleImagePicker = useCallback(
		() => setIsPickerOpen((p) => !p),
		[setIsPickerOpen],
	);

	return (
		<>
			<div
				style={{
					position: "relative",
					display: "grid",
					gridTemplateColumns: `1fr ${iconSize}px`,
					alignItems: "center",
					borderRadius: "4px",
					cursor: "pointer",
					padding: "16.5px 14px",
					boxSizing: "border-box",
					backgroundColor: palette.black[700],
					width: "100%",
					cursor: "pointer",
					...rootStyleOverride,
				}}
				className="text-white hover:text-primary-orange transition-colors"
				onClick={toggleImagePicker}
			>
				<Typography component="span" display="inline" sx={{ color: "inherit" }}>
					{filename && filename.length > 0
						? filename.join(", ")
						: label
							? label
							: s.general.select_file}
				</Typography>
				<FolderSearch width={iconSize} height={iconSize} color="inherit" />
			</div>
			<MutliImageUpload
				close={toggleImagePicker}
				image={file}
				isOpen={isPickerOpen}
				setImages={setFile}
				setImageNames={setFilename}
				acceptedFiles={acceptedFiles}
				type={imagePickerType}
				previewBoxProps={previewBoxProps}
				{...imagePickerProps}
			/>
		</>
	);
};

export default FormMultiDropzone;
