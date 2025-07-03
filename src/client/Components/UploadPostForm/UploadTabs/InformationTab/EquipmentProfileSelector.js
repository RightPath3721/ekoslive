import React, { useEffect, useState } from "react";
import axios from "axios";
import { captureException } from "@sentry/browser";
import ToggleButton from "@mui/material/ToggleButton";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import ToggleButtonGroup from "@mui/material/ToggleButtonGroup";
import { useUploadFormContext } from "../../UploadFormContext";
import { Palette } from "@common/shared/common/styles";
import s from "@common/shared/i18n/i18n";
import useActiveUser from "@hooks/useActiveUser";
import NoEquipmentProfilesMessage from "./NoEquipmentProfilesMessage";

const EquipmentProfileSelector = ({ setFormValid }) =>
{
	const user = useActiveUser();
	const { observatory, equipmentProfile, setEquipmentProfile } =
		useUploadFormContext();
	const [equipmentProfiles, setEquipmentProfiles] = useState([]);

	const handleChange = (_, newProfile) =>
	{
		setEquipmentProfile(newProfile);
	};

	useEffect(() =>
	{
		if (!user || !observatory) return;

		(async () =>
		{
			try
			{
				const { data } = await axios.get(
					`/api/equipments/${observatory}?username=${encodeURIComponent(user.username)}&token=${user.token}`,
				);
				setEquipmentProfiles(data.profiles);
			}
			catch (error)
			{
				captureException(error);
				setEquipmentProfiles([]);
			}
		})();
	}, [observatory, user]);

	useEffect(() =>
	{
		setFormValid(equipmentProfile ? true : false);
	}, [equipmentProfile]);

	return (
		<Box
			sx={{
				display: "flex",
				flexDirection: "column",
				gap: ".5rem",
				alignItems: "flex-start",
				marginTop: "1.25rem",
			}}
		>
			<Typography>
				{s.connect.profile_manager.heading}
				<Typography fontSize="1.5rem" component="span" color="error">
					&#42;
				</Typography>
			</Typography>
			<ToggleButtonGroup
				color="primary"
				value={equipmentProfile ?? ""}
				exclusive
				onChange={handleChange}
				aria-label="Equipment Profile"
				sx={{ gap: ".5rem" }}
			>
				{equipmentProfiles?.length > 0 ? (
					equipmentProfiles?.map((equipment_profile) => (
						<ToggleButton
							sx={{
								color: Palette.white,
								backgroundColor: "#1D1D1D",
								border: "2px solid #CECECE",
								"&.Mui-selected": {
									backgroundColor: Palette.orange,
									color: Palette.white,
								},
							}}
							key={equipment_profile._id}
							value={equipment_profile._id}
						>
							{equipment_profile.name}
						</ToggleButton>
					))
				) : (
					<NoEquipmentProfilesMessage observatory={observatory} />
				)}
			</ToggleButtonGroup>
		</Box>
	);
};

export default EquipmentProfileSelector;
