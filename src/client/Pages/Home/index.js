import React, { Suspense } from "react";
import { Outlet } from "react-router-dom";
import AuthProvider from "@components/providers/AuthProvider";
import Notifier from "@components/shared/Notifier";

const HomePageLayout = () =>
{
	return (
		<>
			<AuthProvider>
				<Suspense>
					<Outlet />
				</Suspense>
			</AuthProvider>
			<Notifier />
		</>
	);
};

export default HomePageLayout;
