import React, { useCallback, useEffect, useState } from "react";
import axios from "axios";
import isEmpty from "lodash/isEmpty";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemButton from "@mui/material/ListItemButton";
import { styles } from "@client/shared/styles";
import Icon from "@components/Icon";
import AddEquipmentProfileForm from "./AddEquipmentProfileForm";
import useActiveUser from "@hooks/useActiveUser";
import { useActiveObservatory } from "./ObservatoryContext";
import EquipmentProfileView from "./EquipmentProfileView";
import EquipmentProfileBox from "./EquipmentProfileBox";
import EmptyListTitle from "./EmptyListTitle";
import s from "@common/shared/i18n/i18n";

const ProfileList = () =>
{
	const [equipmentProfiles, setEquipmentProfiles] = useState([]);
	const [isAdding, setIsAdding] = useState(false);
	const user = useActiveUser();
	const { observatoryId } = useActiveObservatory();
	const [equipmentProfileViewId, setEquipmentProfileViewId] = useState(null);

	useEffect(() =>
	{
		(async () =>
		{
			try
			{
				if (!user) return;
				const { data } = await axios.get(
					`/api/equipments/${observatoryId}?username=${encodeURIComponent(user.username)}&token=${user.token}`,
				);
				setEquipmentProfiles(data.profiles);
			}
			catch (error)
			{
				console.error(error);
			}
		})();
	}, []);

	const addFormSubmit = useCallback(
		async (e) =>
		{
			e.preventDefault();

			if (!user) return;

			const formData = new FormData(e.currentTarget);
			try
			{
				const equipmentProfileData = {
					observatory_id: observatoryId,
					profile: { name: formData.get("name") },
				};
				const { data } = await axios.post(
					`/api/equipments?username=${encodeURIComponent(user.username)}&token=${user.token}`,
					equipmentProfileData,
				);
				setEquipmentProfiles((prevProfiles) => [
					...prevProfiles,
					data.equipmentProfile,
				]);
				setIsAdding(false);
			}
			catch (error)
			{
				console.error(error);
			}
		},
		[setIsAdding],
	);

	const toggleEquipmentProfileView = useCallback(
		(id) => {
			setEquipmentProfileViewId(id);
		},
		[setEquipmentProfileViewId],
	);

	if (equipmentProfileViewId)
		return (
			<EquipmentProfileView
				profileId={equipmentProfileViewId}
				back={toggleEquipmentProfileView}
			/>
		);

	return (
		<List
			dense={false}
			sx={[
				styles.verticalScrollBar,
				{
					maxHeight: "400px",
					overflowY: "scroll",
				},
			]}
		>
			{isEmpty(equipmentProfiles) && (
				<EmptyListTitle text={s.connect.observatory.empty_profiles_list} />
			)}
			{equipmentProfiles.map((profile, idx) => (
				<EquipmentProfileBox
					toggleView={toggleEquipmentProfileView}
					profile={profile}
					key={profile._id}
					idx={idx}
					setEquipmentProfiles={setEquipmentProfiles}
				/>
			))}
			<ListItem>
				{isAdding ? (
					<AddEquipmentProfileForm onSubmit={addFormSubmit} />
				) : (
					<ListItemButton
						onClick={() => setIsAdding(true)}
						sx={{ color: "white" }}
					>
						<Icon name="add" size="24" />
					</ListItemButton>
				)}
			</ListItem>
		</List>
	);
};

export default ProfileList;
