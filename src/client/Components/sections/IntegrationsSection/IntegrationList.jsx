import React from "react";
import { integrationsList } from "../../../constants/integrationsList";
import IntegrationListItem from "./IntegrationListItem";

const IntegrationList = () =>
{
	return (
		<ul className="grid grid-cols-[minmax(0,190px)] lg:grid-cols-[minmax(0,228px)] gap-6">
			{integrationsList.map((integration, idx) => (
				<IntegrationListItem integration={integration} index={idx} key={idx} />
			))}
		</ul>
	);
};

export default IntegrationList;
