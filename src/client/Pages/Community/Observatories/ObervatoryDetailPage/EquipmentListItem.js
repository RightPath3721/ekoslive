import React, { cloneElement } from "react";
import { IconButton, useTheme, Box } from "@mui/material";
import { useNavigate } from "react-router-dom";
import MuiLink from "@mui/material/Link";
import Typography from "@mui/material/Typography";
import { styles } from "@client/shared/styles";
import { typeIcons } from "../../Profile/Observatory/Equipment/EquipmentBox";
import DeleteOutlineOutlinedIcon from "@mui/icons-material/DeleteOutlineOutlined";
import { Palette } from "@common/shared/common/styles";
import { nameConvertorForURL } from "@utils/nameConvertorForURL";

const EquipmentListItem = ({
	equipment,
	handleDeleteObservatoryProfileEquipment,
	isOwner
}) =>
{
	const navigate = useNavigate();
	const getEquipmentUrl = (equipment) =>
	{
		navigate(`/community/equipment/${nameConvertorForURL(equipment?.equipment_type?.name) + '-' + equipment?.equipment_type?._id}/${nameConvertorForURL(equipment?.manufacturer?.name) + '-' + equipment?.manufacturer?._id}/${nameConvertorForURL(equipment?.label) + '-' + equipment?._id}`);
	};

	const { palette } = useTheme();

	return (
		<Box sx={{ display: "flex", alignItems: "center", gap: "6px" }}>
			<MuiLink
				sx={[
					styles.center,
					{
						gap: ".75rem",
						justifyContent: "flex-start",
						textDecoration: "none",
						":hover": {
							textDecoration: "underline",
						},
						cursor: "pointer",
					},
				]}
				onClick={() => getEquipmentUrl(equipment)}
			>
				<Typography
					sx={{
						width: 24,
						height: 24,
						borderRadius: "4px",
						display: "grid",
						placeItems: "center",
						backgroundColor: palette.black[600],
					}}
					display="inline-block"
					component="span"
				>
					{cloneElement(typeIcons[equipment.equipment_type.name], {
						width: 16,
						height: 16,
					})}
				</Typography>
				<Typography component="span">{equipment.label}</Typography>
			</MuiLink>
			{
				isOwner &&
				<IconButton
					onClick={() => handleDeleteObservatoryProfileEquipment(equipment._id)}
					sx={{
						width: "24px",
						height: "24px",
						marginLeft: "4px",
						borderRadius: "4px",
						padding: "10px",
					}}
				>
					<DeleteOutlineOutlinedIcon
						sx={{
							color: Palette.red,
						}}
						width="12px"
						height="12px"
					/>
				</IconButton>
			}
		</Box>
	);
};

export default EquipmentListItem;
