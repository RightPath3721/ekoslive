import React from "react";
import { useTheme } from "@mui/material";
import Typography from "@mui/material/Typography";
import s from "@common/shared/i18n/i18n";
import FolderSearch from "@client/icons/FolderSearch";

const FormSelectFile = ({ handleClick, selectedFile, iconSize = 24 }) =>
{
	const { palette } = useTheme();

	return (
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
			}}
			className="text-white hover:text-primary-orange"
			onClick={handleClick}
		>
			<Typography component="span" display="inline" sx={{ color: "inherit" }}>
				{selectedFile ? selectedFile : s.general.select_file}
			</Typography>
			<FolderSearch width={iconSize} height={iconSize} color="inherit" />
		</div>
	);
};

export default FormSelectFile;
