import React from "react";
import SectionTitle from "../../shared/SectionTitle";
import IntegrationList from "./IntegrationList";

const IntegrationsSection = () =>
{
	return (
		<section className="flex-center flex-col pb-10 gap-9 sm:gap-[4.5rem]">
			<SectionTitle title="Integrations" />
			<IntegrationList />
		</section>
	);
};

export default IntegrationsSection;
