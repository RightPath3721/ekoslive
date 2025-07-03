import React from "react";
import Box from "@mui/material/Box";
import Avatar from "@mui/material/Avatar";
import Typography from "@mui/material/Typography";
import { styles } from "@client/shared/styles";
import { useTheme } from "@mui/material";
import FollowersButtons from "./FollowersButtons";
import { useCurrentProfileContext } from "@client/Pages/Community/CurrentProfileContext";

const UserInfo = ({ profile }) =>
{
	const { palette } = useTheme();
	const { profile: userProfile } = useCurrentProfileContext();

	if (!profile && !userProfile) return null;

	profile = profile || userProfile;
	return (
		<Box>
			<Avatar
				alt={profile.username}
				src={profile.avatar || "/public/profile_default_image.webp"}
				sx={{ 
					width: 140, 
					height: 140, 
					margin: "0 auto",
					"@media (max-height: 800px)": {
						width: 100,
						height: 100
					}
				}}
			/>
			<Box
				sx={[
					styles.center,
					{ 
						gap: ".5rem", 
						flexDirection: "column", 
						marginTop: "20px",
						"@media (max-height: 800px)": {
							gap: ".3rem",
							marginTop: "10px",
						}
					},
				]}
			>
				<Typography
					sx={[
						styles.center,
						{
							flexDirection: "column",
							gap: ".25rem",
							"@media (max-height: 800px)": {
								gap: ".15rem",
							}
						},
					]}
				>
					<Typography 
						lineHeight={1.1} 
						variant="h2" 
						component="span"
						sx={{
							"@media (max-height: 800px)": {
								fontSize: "1.5rem",
							}
						}}
					>
						{profile.full_name}
					</Typography>
					<Typography 
						sx={{ 
							color: palette.grey.main,
							"@media (max-height: 800px)": {
								fontSize: "0.875rem",
							}
						}} 
						component="span"
					>
						{profile.social_nickname}
					</Typography>
				</Typography>

				<FollowersButtons profile={profile} />
			</Box>
		</Box>
	);
};

export default UserInfo;
