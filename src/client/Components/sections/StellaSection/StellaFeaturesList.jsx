import React from "react";
import { stellaFeatures } from "../../../constants/stellaFeatures";
import CommunityFeaturesListItem from "../CommunityFeatures/CommunityFeaturesListItem";

const StellaFeaturesList = () =>
{
	return (
		<ul className="flex flex-col gap-12 items-start justify-center mt-8 sm:mt-[3.5rem]">
			{stellaFeatures.map((feature, idx) => (
				<CommunityFeaturesListItem
					feature={feature}
					index={idx}
					key={idx}
					className="grid-cols-[30px,1fr]"
				/>
			))}
		</ul>
	);
};

export default StellaFeaturesList;
