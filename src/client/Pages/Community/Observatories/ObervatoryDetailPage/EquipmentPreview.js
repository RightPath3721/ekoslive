import axios from "axios";
import React, { useState, useEffect } from "react";
import { captureException } from "@sentry/browser";
import Box from "@mui/material/Box";
import EquipmentProfileSelector from "./EquipmentProfileSelector";
import EquipmentList from "./EquipmentList";
import { useObservatoryPageContext } from "./ObservatoryPageContext";

const EquipmentPreview = () =>
{
	const [selectedProfile, setSelectedProfile] = useState("");
	const { observatory, observatoryPermissions } = useObservatoryPageContext();
	const [equipmentProfiles, setEquipmentProfiles] = useState([]);

	useEffect(() =>
	{
		if (!observatory) return;

		(async () =>
		{
			try
			{
				const { data } = await axios.get(`/api/equipments/${observatory._id}`);
				setEquipmentProfiles(data.profiles);
				if (data.profiles?.length > 0)
				{
					setSelectedProfile(data.profiles[0]?._id);
				}
			}
			catch (error)
			{
				captureException(error);
			}
		})();
	}, [observatory]);

	return (
		<Box>
			<EquipmentProfileSelector
				equipmentProfiles={equipmentProfiles}
				selectedProfile={selectedProfile}
				setSelectedProfile={setSelectedProfile}
				setEquipmentProfiles={setEquipmentProfiles}
				observatoryId={observatory?._id}
				isOwner={observatoryPermissions?.isOwner}
			/>
			{selectedProfile && (
				<EquipmentList
					profileId={selectedProfile}
					isOwner={observatoryPermissions?.isOwner}
				/>
			)}
		</Box>
	);
};

export default EquipmentPreview;
