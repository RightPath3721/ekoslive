import React, { Suspense, useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { useTourGuideContext } from "@components/providers/TourGuideProvider";
import TabLoader from "@components/TabLoader";
import { checkSurveyStatus } from "@client/Pages/Community/CommunityLayout";
import useActiveUser from "@hooks/useActiveUser";
import { captureException } from "@sentry/browser";

const Guide = React.lazy(() => import("./Guide"));

const InitialTourGuide = () =>
{
	const location = useLocation();

	const [isLoading, setIsLoading] = useState(true);
	const [isOpen, setIsOpen] = useState(true);
	const { tourGuideState, updateTourGuideState } = useTourGuideContext();
	const [stepsKey, setStepsKey] = useState(null);
	const user = useActiveUser();
	const [wizardStatus, setWizardStatus] = useState(false);

	useEffect(() => {
		if (!user || typeof checkSurveyStatus !== "function") return;

		(async () => {
			try {
				const status = await checkSurveyStatus(user);
				setWizardStatus(status);
				updateTourGuideState(status);
			} catch (error) {
				captureException(error);
			}
		})();
	}, [user]);

	useEffect(() => {
		if (!wizardStatus || !tourGuideState) return;

		let currentStepKey = null;
		let shouldOpen = false;

		switch (location.pathname) {
			case "/community/profile":
			case "/community/profile/":
				currentStepKey = "profile";
				shouldOpen = !tourGuideState?.tour_guide?.profile;
				break;
			case "/community/":
			case "/community":
				currentStepKey = "feed";
				shouldOpen = !tourGuideState?.tour_guide?.feed;
				break;
			case "/community/users":
			case "/community/users/":
				currentStepKey = "users";
				shouldOpen = !tourGuideState?.tour_guide?.users;
				break;
			case "/community/equipment":
			case "/community/equipment/":
				currentStepKey = "equipment";
				shouldOpen = !tourGuideState?.tour_guide?.equipment;
				break;
			case "/community/profile/observatories":
			case "/community/profile/observatories/":
				currentStepKey = "observatories";
				shouldOpen = !tourGuideState?.tour_guide?.observatories;
				break;
		}

		if (currentStepKey && shouldOpen)
		{
			setStepsKey(currentStepKey);
			setIsOpen(true);
		}
		else
		{
			setStepsKey(null);
			setIsOpen(false);
		}

		setIsLoading(false);
	}, [location.pathname, tourGuideState, wizardStatus]);

	if (isLoading) return null;

	return (
		<Suspense fallback={<TabLoader />}>
			{isOpen && stepsKey && (
				<Guide stepKey={stepsKey} isOpen={isOpen} setIsOpen={setIsOpen} />
			)}
		</Suspense>
	);
};

export default InitialTourGuide;
