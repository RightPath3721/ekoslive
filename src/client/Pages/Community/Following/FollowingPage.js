import React, { useCallback, useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import PageContainer from "@components/global/PageContainer";
import TopBar from "./TopBar";
import FollowingList from "./FollowingList";
import FollowingProvider from "./FollowingContext";
import { useBreadcrumbContext } from "@components/providers/BreadcrumbProvider";
import ProfileContextProvider from "../Profile/ProfileContext";
import s from "@common/shared/i18n/i18n";

const breadcrumbs = [
	{
		name: s.social.community,
		link: "/community"
	},
	{
		name: s.general.profile,
		link: "/community/profile",
	},
	{
		name: s.social.following,
		link: "/community/following",
	},
];

const FollowingPage = () =>
{
	const { setBreadcrumb } = useBreadcrumbContext();
	const location = useLocation();
	useEffect(() =>
	{
		setBreadcrumb(breadcrumbs);
	}, [setBreadcrumb, location]);

	const [view, setView] = useState("grid");

	const handleViewChange = useCallback(
		() => setView((view) => (view === "grid" ? "list" : "grid")),
		[setView],
	);

	return (
		<PageContainer>
			<ProfileContextProvider>
				<FollowingProvider>
					<TopBar view={view} toggleView={handleViewChange} />
					<FollowingList view={view} />
				</FollowingProvider>
			</ProfileContextProvider>
		</PageContainer>
	);
};

export default FollowingPage;
