import React, { useEffect } from "react";
import UserInfo from "./UserInfo";
import SidebarNavigation from "./SidebarNavigation";
import { useProfileContext } from "@client/Pages/Community/Profile/ProfileContext";
import FollowButton from "./FollowButton";
import SidePanelContainer from "./SidePanelContainer";
import useActiveUser from "@hooks/useActiveUser";
import axios from "axios";
import Updates from "@components/Updates";
import { captureException } from "@sentry/browser";
import Box from "@mui/material/Box";

const SidePanel = () =>
{
	const { profile, setProfile } = useProfileContext();
	const user = useActiveUser();

	useEffect(() => {
		const abortController = new AbortController();
		const signal = abortController.signal;
		const getCurrentUserProfile = async () => {
			if (!user) return null;
			const url = `/api/social?username=${encodeURIComponent(user.username)}&token=${user.token}`;
			try {
				const { data } = await axios.get(url, { signal });
				if (!signal.aborted) {
					setProfile(data.socialProfile);
				}
			} catch (error) {
				if (error.name === 'CanceledError' || error.name === 'AbortError') 
					// Don't report cancellation errors to Sentry
					return;
				// Only capture non-cancellation errors
				captureException(error);
			}
		};

		getCurrentUserProfile();

		return () => abortController.abort();
	}, [user]);
	

	return (
		<SidePanelContainer>
			<Box sx={{
				display: "flex",
				flexDirection: "column",
				flex: 1,
				"@media (max-height: 800px)": {
					overflow: "hidden",
					display: "flex",
					flexDirection: "column"
				}
			}}>
				<UserInfo profile={profile} />
				<FollowButton profile={profile} setProfile={setProfile} />
				<SidebarNavigation userProfile={profile} />
			</Box>

			<Box sx={{ 
				marginTop: "auto",
				"@media (max-height: 800px)": {
					marginTop: "auto"
				}
			}}>
				<Updates />
			</Box>
		</SidePanelContainer>
	);
};

export default SidePanel;
