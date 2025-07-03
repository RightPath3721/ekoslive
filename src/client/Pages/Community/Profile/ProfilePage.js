import React, { useEffect } from "react";
import { useLocation } from "react-router-dom";
import PageContainer from "@components/global/PageContainer";
import ProfileContent from "./ProfileContent/ProfileContent";
import ProfileBanner from "./Banner/ProfileBanner";
import ProfileContextProvider from "./ProfileContext";
import { useBreadcrumbContext } from "@components/providers/BreadcrumbProvider";
import tourGuide from "@components/global/tourGuide";
import s from "@common/shared/i18n/i18n";

const initialBreadcrumbs = [
	{
		name: "Community",
		link: "/community",
	},
	{
		name: "Profile",
		link: "/community/profile",
	},
];

const tourGuideSteps = [
	{
		selector: "#profile_image",
		content: s.tourGuide.description_profile_image,
	},
	{
		selector: "#profile_achievements",
		content: s.tourGuide.description_profile_achievements,
	},
];

const ProfilePage = () =>
{
	const { setBreadcrumb } = useBreadcrumbContext();
	const location = useLocation();
	const breadcrumbs = location.state || initialBreadcrumbs;

	useEffect(() =>
	{
		setBreadcrumb(breadcrumbs);
	}, [setBreadcrumb, location]);

	return (
		<PageContainer id="profile-page" classOverrides="w-full">
			<ProfileContextProvider>
				<ProfileBanner />
				<ProfileContent />
			</ProfileContextProvider>
		</PageContainer>
	);
};

export default tourGuide(ProfilePage, {
	steps: tourGuideSteps,
	key: "profile_detailed",
	initialStepKey: "profile",
});
