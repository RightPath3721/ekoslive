import React, { Suspense, useEffect } from "react";
import axios from "axios";
import { captureException } from "@sentry/browser";
import Box from "@mui/material/Box";
import { Outlet, useNavigate } from "react-router-dom";
import SidePanel from "@components/global/SidePanel";
import ProfileContextProvider from "./Profile/ProfileContext";
import InitialTourGuide from "@components/global/InitialTourGuide/InitialTourGuide";
import useActiveUser from "@hooks/useActiveUser";

export const checkSurveyStatus = async (user) =>
{
	if (!user) return null;

	const { data } = await axios.get("/api/survey/check-status", {
		params: { username: user.username, token: user.token },
	});
	return data?.status;
};

const CommunityLayout = () =>
{
	const navigate = useNavigate();
	const user = useActiveUser();

	useEffect(() =>
	{
		if (!user) return;

		(async () =>
		{
			try
			{
				const status = await checkSurveyStatus(user);
				if (!status) navigate("/wizard");
			}
			catch (error)
			{
				captureException(error);
			}
		})();
	}, [user]);

	return (
		<Box
			sx={{
				display: "grid",
				gridTemplateColumns: { xxs: "1fr", lg: "auto 5fr" },
				backgroundColor: "rgb(23 23 23)",
			}}
		>
			<ProfileContextProvider>
				<SidePanel />
			</ProfileContextProvider>
			<Suspense>
				<Outlet />
			</Suspense>
			<InitialTourGuide />
		</Box>
	);
};

export default CommunityLayout;
