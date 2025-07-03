import React, { cloneElement, useEffect, useState, memo } from "react";
import axios from "axios";
import { useNavigate, useLocation } from "react-router-dom";
import { captureException } from "@sentry/browser";
import { useSelector } from "react-redux";
import { selectUser } from "@redux/selectors";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import { styles } from "@client/shared/styles";
import { typeIcons } from "@client/Pages/Community/Profile/Observatory/Equipment/EquipmentBox";
import { useBreadcrumbContext } from "@components/providers/BreadcrumbProvider";
import Search from "./Search";
import { nameConvertorForURL } from "@client/utils/nameConvertorForURL";

const Equipment = ({ mode = "normal", setEquipmentTypeId = null }) =>
{
	const breadcrumbs = [
		{
			name: "Community",
			link: "/community",
		},
		{
			name: "Equipment",
			link: "/community/equipment",
		},
	];
	const location = useLocation();

	const { setBreadcrumb } = useBreadcrumbContext();

	useEffect(() =>
	{
		setBreadcrumb(breadcrumbs);
	}, [setBreadcrumb, location]);

	const navigate = useNavigate();
	const user = useSelector(selectUser);
	const [equipmentTypes, setEquipmentTypes] = useState([]);

	useEffect(() =>
	{
		(async () =>
		{
			try
			{
				const { data } = await axios.get("/api/equipments/equipment-types");
				setEquipmentTypes(data.equipmentTypes);
			}
			catch (error)
			{
				captureException(error);
			}
		})();
	}, []);

	/**
	 * Handles the click event to navigate to a equipment's page.
	 *
	 * @param {string} equipmentType - The name of the equipment type to navigate to.
	 */
	const handleClick = (equipmentType) =>
	{
		if (mode === "normal")
		{
			// Navigate to the new page
			navigate(`/community/equipment/${nameConvertorForURL(equipmentType.name) + '-' + equipmentType._id}`, {
				state: location.state,
			});
		}
		else if (mode === "selectModel")
		{
			setEquipmentTypeId(equipmentType._id);
		}
	};

	const runExternalSearch = async (selectedObject) =>
	{
		if (location.state?.selecting)
		{
			return addEquipmentModel({
				model: selectedObject,
				profileId: location.state?.profileId,
				observatoryId: location.state?.observatoryId,
				user,
			});
		}
		
		navigate(`/community/equipment/${nameConvertorForURL(selectedObject.equipment_type.name) + '-' + selectedObject.equipment_type._id}/${nameConvertorForURL(selectedObject.manufacturer.name) + '-' + selectedObject.manufacturer._id}/${nameConvertorForURL(selectedObject.label) + '-' + selectedObject._id}`)
	};

	const addEquipmentModel = async ({ model, profileId, observatoryId }) =>
	{
		try
		{
			await addEquipment({
				model,
				profileId,
				observatoryId,
				user,
			});
			navigate(`/community/profile/observatories/${observatoryId}`, {
				success: true,
			});
		}
		catch (error)
		{
			captureException(error);
		}
	};

	const addEquipment = async ({ model, profileId, observatoryId, user }) =>
	{
		if (!user) return null;
		await axios.post(`/api/equipments/${observatoryId}/${profileId}`, model, {
			params: {
				username: user.username,
				token: user.token,
			},
		});
	};

	return (
		<Box>
			<Box sx={{marginLeft:"16px"}}>
				<Search runExternalSearch={runExternalSearch} />
			</Box>
			<Box
				sx={[
					{
						display: "grid",
						gridTemplateColumns: {
							xxs: "repeat(2, 1fr)",
							xs: "repeat(3, 1fr)",
							sm: "repeat(4, 1fr)",
						},
						columnGap: "1rem",
						rowGap: ".75rem",
						p: 2,
						marginTop: { xxs: ".75rem", sm: 0 },
					},
				]}
			>
				{equipmentTypes?.map((equipmentType) => (
					<Button
						key={equipmentType._id}
						onClick={() =>
						{
							handleClick(equipmentType);
						}}
						sx={[
							styles.center,
							{
								color: "white",
								flexDirection: "column",
								gap: "12px",
								backgroundColor: "#FFFCFA1A",
							},
						]}
					>
						{cloneElement(typeIcons[equipmentType.name], {
							width: 60,
							height: 60,
						})}
						<Typography sx={{ color: "white" }} component="span">
							{equipmentType.name}
						</Typography>
					</Button>
				))}
			</Box>
		</Box>
	);
};

export default memo(Equipment);
