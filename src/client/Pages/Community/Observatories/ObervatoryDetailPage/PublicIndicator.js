import React from "react";
import Typography from "@mui/material/Typography";
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";
import VisibilityIcon from "@mui/icons-material/Visibility";
import { useTheme } from "@mui/material";
import s from "@common/shared/i18n/i18n";

const PublicIndicator = ({ isPublic }) =>
{
	const { palette } = useTheme();

	return (
		<Typography display="flex" alignItems="center" gap=".75rem">
			{isPublic ? (
				<VisibilityIcon style={{ color: palette.primary.main }} />
			) : (
				<VisibilityOffIcon style={{ color: palette.error.main }} />
			)}
			{isPublic ? s.social.public_directory : s.general.private}
		</Typography>
	);
};

export default PublicIndicator;
