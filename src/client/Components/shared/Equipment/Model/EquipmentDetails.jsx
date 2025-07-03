import React from "react";
import Paper from "@mui/material/Paper";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Divider from "@mui/material/Divider";
import IconButton from "@mui/material/IconButton";
import { useTheme } from "@mui/material";
import useActiveUser from "@hooks/useActiveUser";
import EditPencilIcon from "@client/icons/EditPencilIcon";
import ReportIcon from "@client/icons/ReportIcon";

const EquipmentDetails = ({
	equipmentType,
	equipmentModel,
	toggleEditModal,
	setShowReportModal,
}) =>
{
	const user = useActiveUser();
	const { palette } = useTheme();

	const renderOptionalFields = (optionalFields) =>
	{
		return Object.entries(optionalFields).map(([key, value]) =>
		{
			if (key !== "tags")
			{
				const field = equipmentType?.fields?.find((item) => item.key === key);

				// Optional safety check
				const label = field ? field.label : key;
				const unit = field ? field.unit : "";

				// Format array values for display
				const displayValue = Array.isArray(value) 
					? value.join(", ") 
					: value;

				return (
					<Box
						key={key}
						display="flex"
						justifyContent="space-between"
						alignItems="center"
						mt={1}
					>
						<Typography>
							<strong>{unit ? `${label} (${unit})` : label}:</strong>
						</Typography>
						<Typography>{displayValue}</Typography>
					</Box>
				);
			}
		});
	};

	return (
		<Paper sx={{ width: "100%", p: 2, borderRadius: "10px", flexGrow: 1 }}>
			<Box
				sx={{
					display: "flex",
					justifyContent: "space-between",
					alignItems: "center",
				}}
			>
				<Typography variant="h5" sx={{ color: palette.primary.main }}>
					<a
						href={equipmentModel?.url}
						style={{ color: palette.primary.main }}
						target="_blank"
						rel="noopener noreferrer"
					>
						{equipmentModel?.label}
					</a>
				</Typography>
				{user && (
					<Box>
						<IconButton
							onClick={toggleEditModal}
							sx={{ color: palette.primary.main }}
						>
							<EditPencilIcon />
						</IconButton>
						<IconButton
							onClick={() => setShowReportModal(true)}
							sx={{ color: palette.primary.main }}
						>
							<ReportIcon width={24} height={24} />
						</IconButton>
					</Box>
				)}
			</Box>
			<Divider sx={{ my: 1, bgcolor: palette.primary.main }} />
			{equipmentModel?.optional_fields &&
				renderOptionalFields(equipmentModel.optional_fields)}
		</Paper>
	);
};

export default EquipmentDetails;
