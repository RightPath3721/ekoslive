import React, { useCallback, useState } from "react";
import Button from "@mui/material/Button";
import s from "@common/shared/i18n/i18n";
import EditProfile from "../Profile/EditProfile";
import { useProfileContext } from "../ProfileContext";
import { useAliveController } from "react-activation";

const EditProfileButton = () =>
{
	const { refresh } = useAliveController();
	const [isEdit, setIsEdit] = useState(false);
	const { profile, setProfile } = useProfileContext();

	const toggleEditModal = useCallback(() => setIsEdit((p) => !p), [setIsEdit]);

	const closeEditModal = useCallback(() =>
	{
		toggleEditModal();
		refresh("community_layout");
	}, [toggleEditModal, refresh]);

	return (
		<>
			<Button
				sx={{
					padding: { xxs: ".5rem 1rem", sm: "1rem 3.5rem" },
					lineHeight: 1.1,
					fontWeight: 500,
				}}
				variant="contained"
				onClick={toggleEditModal}
			>
				{s.general.edit}
			</Button>
			<EditProfile
				close={closeEditModal}
				userProfile={profile}
				setUserProfile={setProfile}
				open={isEdit}
			/>
		</>
	);
};

export default EditProfileButton;
