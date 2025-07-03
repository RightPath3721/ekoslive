import React from "react";
import { featuresList } from "./tableData";
import FeatureCard from "./FeatureCard";

const PricingFeaturesList = () =>
{
	return (
		<ul className="w-full flex-center flex-col gap-4 md:gap-10 bg-cover bg-opacity-70">
			{featuresList.map((feature, i) => (
				<FeatureCard key={i} feature={feature} position={i + 1} />
			))}
		</ul>
	);
};

export default PricingFeaturesList;
