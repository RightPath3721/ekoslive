import React, { useCallback, useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import PageContainer from "@components/global/PageContainer";
import ObservatoriesContextProvider from "./ObservatoriesContext";
import ObservatoriesList from "./ObservatoriesList";
import { useBreadcrumbContext } from "@components/providers/BreadcrumbProvider";
import s from "@common/shared/i18n/i18n";
import tourGuide from "@components/global/tourGuide";

const breadcrumbs = [
	{
		name: "Community",
		link: "/community",
	},
	{
		name: "Observatories",
		link: "/community/observatories",
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
	{
		selector: "#observatory_map",
		content: s.tourGuide.description_observatory_map,
	},
];

const ObservatoriesPage = () =>
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
		<PageContainer id="observatory-page">
			<ObservatoriesContextProvider>
				<ObservatoriesList view={view} toggleView={toggleView} />
			</ObservatoriesContextProvider>
		</PageContainer>
	);
};

export default tourGuide(ObservatoriesPage, {
	steps: tourGuideSteps,
	key: "observatories_detail",
	initialStepKey: "observatories",
});
