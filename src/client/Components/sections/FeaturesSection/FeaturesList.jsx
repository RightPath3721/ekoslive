import React from "react";
import { featuresList } from "../../../constants/featuresList";
import FeaturesListItem from "./FeaturesListItem";

const FeaturesList = () =>
{
	return (
		<ul className="flex flex-row justify-center flex-wrap lg:flex-nowrap gap-4">
			{featuresList.map((feature, idx) => (
				<FeaturesListItem feature={feature} key={feature.title} index={idx} />
			))}
		</ul>
	);
};

export default FeaturesList;
