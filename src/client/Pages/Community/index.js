import React, { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import { useActivate } from "react-activation";
import PostsView from "./Stream/PostsView";
import PageContainer from "@components/global/PageContainer";
import { useBreadcrumbContext } from "@components/providers/BreadcrumbProvider";
import tourGuide from "@components/global/tourGuide";
import s from "@common/shared/i18n/i18n";
import SocialStreamContextProvider from "./SocialStreamContext";

const tourGuideSteps = [
	{
		selector: "#feed_all",
		content: s.tourGuide.description_feed_all,
	},
	{
		selector: "#feed_following",
		content: s.tourGuide.description_feed_following,
	},
	{
		selector: "#feed_saved",
		content: s.tourGuide.description_feed_saved,
	},
	{
		selector: "#feed_add",
		content: s.tourGuide.description_feed_add,
	},
];

const Page = () =>
{
	const breadcrumbs = [
		{
			name: "Community",
			link: "/community",
		},
		{
			name: "Feed",
			link: "/community",
		},
	];

	const { setBreadcrumb } = useBreadcrumbContext();
	const location = useLocation();
	const ref = useRef();

	useEffect(() =>
	{
		setBreadcrumb(breadcrumbs);
	}, [setBreadcrumb, location]);

	useActivate(() =>
	{
		ref.current?.();
	});

	useEffect(() =>
		{
			ref.current?.();
		});

	return (
		<PageContainer id="feed-page">
			<SocialStreamContextProvider>
				<PostsView ref={ref} />
			</SocialStreamContextProvider>
		</PageContainer>
	);
};

export default tourGuide(Page, {
	steps: tourGuideSteps,
	key: "detailed_feed",
	initialStepKey: "feed",
});
