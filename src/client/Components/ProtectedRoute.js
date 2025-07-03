import React from "react";
import NotFoundPage from "@client/Pages/NotFoundPage";
import { Can } from "@components/providers/AclProvider";

const ProtectedRoute = ({ children }) =>
{
	return (
		<Can action="update" subject="ModeratingStatus" passThrough>
			{(allowed) => (allowed ? children : <NotFoundPage />)}
		</Can>
	);
};

export default ProtectedRoute;
