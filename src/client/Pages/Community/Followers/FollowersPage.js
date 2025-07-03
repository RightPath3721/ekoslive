import React, { useCallback, useState, useEffect } from "react";
import PageContainer from "@components/global/PageContainer";
import TopBar from "./TopBar";
import FollowersList from "./FollowersList";
import FollowersProvider from "./FollowersContext";
import { useBreadcrumbContext } from "@components/providers/BreadcrumbProvider";
import ProfileContextProvider from "../Profile/ProfileContext";
import { useLocation } from "react-router-dom";

const breadcrumbs = [
	{
		name: "Community",
		link: "/community/",
	},
	{
		name: "Profile",
		link: "/community/profile/",
	},
	{
		name: "Followers",
		link: "/community/followers/",
	},
];

const FollowersPage = () =>
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
				<FollowersProvider>
					<TopBar view={view} toggleView={handleViewChange} />
					<FollowersList view={view} />
				</FollowersProvider>
			</ProfileContextProvider>
		</PageContainer>
	);
};

export default FollowersPage;
