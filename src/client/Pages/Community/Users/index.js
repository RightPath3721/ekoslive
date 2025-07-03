import React, { useCallback, useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import PageContainer from "@components/global/PageContainer";
import UsersContextProvider from "./UsersContext";
import TopBar from "./TopBar";
import UsersList from "./UsersList";
import { useBreadcrumbContext } from "@components/providers/BreadcrumbProvider";
import tourGuide from "@components/global/tourGuide";
import s from "@common/shared/i18n/i18n";

const breadcrumbs = [
	{
		name: "Community",
		link: "/community",
	},
	{
		name: "Users",
		link: "/community/users",
	},
];

const tourGuideSteps = [
	{
		selector: "#search_filter",
		content: s.tourGuide.description_search_filter,
	},
	{
		selector: "#search_live",
		content: s.tourGuide.description_search_live,
	},
];

const UsersPage = () =>
{
	const { setBreadcrumb } = useBreadcrumbContext();
	const location = useLocation();

	useEffect(() =>
	{
		setBreadcrumb(breadcrumbs);
	}, [setBreadcrumb, location]);

	const [view, setView] = useState("grid");

	const toggleView = useCallback(
		() => setView((p) => (p === "grid" ? "list" : "grid")),
		[setView],
	);

	return (
		<PageContainer id="users-page">
			<UsersContextProvider>
				<TopBar toggleView={toggleView} view={view} />
				<UsersList view={view} />
			</UsersContextProvider>
		</PageContainer>
	);
};

export default tourGuide(UsersPage, {
	steps: tourGuideSteps,
	key: "users_detailed",
	initialStepKey: "users",
});
