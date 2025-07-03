import React, { useEffect } from "react";
import axios from "axios";
import Box from "@mui/material/Box";
import { captureException } from "@sentry/browser";
import { useNavigate } from "react-router-dom";
import useActiveUser from "@hooks/useActiveUser";
import WizardStepper from "./WizardStepper";
import PageContainer from "@components/global/PageContainer";
import SocialWizardContextProvider from "./SocialWizardTabs/SocialWizardContext";
import NotFoundPage from "../NotFoundPage";

const SocialWizard = () =>
{
	const user = useActiveUser();
	const navigate = useNavigate();

	useEffect(() =>
	{
		if (!user) return;

		(async () =>
		{
			try
			{
				const { data } = await axios.get("/api/survey", {
					params: { username: user.username, token: user.token },
				});
				if (!data) return;

				navigate("/community");
			}
			catch (error)
			{
				captureException(error);
			}
		})();
	}, [user]);

	return (
		<PageContainer>
			{!user && <NotFoundPage />}
			{user && (
				<Box
					sx={[
						{
							padding: "2rem 1.75rem",
						},
					]}
				>
					<SocialWizardContextProvider>
						<WizardStepper />
					</SocialWizardContextProvider>
				</Box>
			)}
		</PageContainer>
	);
};

export default SocialWizard;
