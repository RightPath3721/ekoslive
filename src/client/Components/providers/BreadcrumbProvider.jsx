import React, { createContext, useContext, useState } from "react";

const BreadcrumbContext = createContext({
	breadcrumb: null,
	setBreadcrumb: () =>
	{},
});

export const useBreadcrumbContext = () => useContext(BreadcrumbContext);

const BreadcrumbProvider = ({ children }) =>
{
	const [breadcrumb, setBreadcrumb] = useState(null);

	return (
		<BreadcrumbContext.Provider value={{ breadcrumb, setBreadcrumb }}>
			{children}
		</BreadcrumbContext.Provider>
	);
};

export default BreadcrumbProvider;
