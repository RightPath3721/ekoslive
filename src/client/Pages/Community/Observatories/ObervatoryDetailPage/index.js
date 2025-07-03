import React, { useEffect, useState } from "react";
import PageContainer from "@components/global/PageContainer";
import ObservatoryPageContextProvider from "./ObservatoryPageContext";
import { useLocation } from "react-router-dom";
import { useBreadcrumbContext } from "@components/providers/BreadcrumbProvider";
import ObservatoryDetail from "./ObservatoryDetailPage";


const ObservatoryDetailPage = () =>
{
	const location = useLocation();
	const breadcrumbs = location.state;
	const { setBreadcrumb } = useBreadcrumbContext();

	useEffect(() =>
	{
		setBreadcrumb(breadcrumbs);
	}, [setBreadcrumb, location]);

	return (
		<PageContainer>
			<ObservatoryPageContextProvider>
				<ObservatoryDetail />
			</ObservatoryPageContextProvider>
		</PageContainer>
	);
};

export default ObservatoryDetailPage;
