import React, { useCallback } from "react";
import Box from "@mui/material/Box";
import { useProfileContext } from "../ProfileContext";
import MottoComponent from "../Profile/MottoComponent";
import EditProfileButton from "./EditProfileButton";
import AchievementsPreview from "../Achievements/AchievementsPreview";
import { Can } from "@components/providers/AclProvider";

const ProfileBanner = () =>
{
	const { profile, setProfile } = useProfileContext();

	const handleUpdateMotto = useCallback(
		(value) =>
			setProfile((prevData) => ({ ...prevData, profile_description: value })),
		[setProfile],
	);

	return ( profile && 
		<Box
			sx={{
				backgroundImage: profile?.profile_background
					? `linear-gradient(180deg, rgba(17,17,17,0) 0%, rgba(17,17,17,1) 90%), url(${profile.profile_background})`
					: "linear-gradient(180deg, rgba(17,17,17,0) 0%, rgba(17,17,17,1) 57%)",
				backgroundSize: "cover",
				backgroundPosition: "center",
				backgroundRepeat: "no-repeat",
				padding: "1.75rem .75rem 1.5rem",
				display: "flex",
				alignItems: "flex-end",
				justifyContent: "flex-end",
				width: "100%",
				gap: "13.375rem",
				position: "relative",
				minHeight: "170px",
			}}
		>
			<MottoComponent
				userProfile={profile}
				updateMotto={handleUpdateMotto}
			/>
			<Box
				sx={{
					display: "flex",
					flexDirection: "column",
					justifyContent: "space-between",
					alignItems: "center",
					gap: "2.875rem",
				}}
			>
				<Can action="update" subject="Social" object={profile}>
					<EditProfileButton />
				</Can>
				<AchievementsPreview />
			</Box>
		</Box>
	);
};

export default ProfileBanner;
