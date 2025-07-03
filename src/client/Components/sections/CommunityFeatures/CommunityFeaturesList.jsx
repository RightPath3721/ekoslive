import React from "react";
import { communityFeatures } from "../../../constants/communityFeatures";
import CommunityFeaturesListItem from "./CommunityFeaturesListItem";

const CommunityFeaturesList = () =>
{
	return (
		<ul className="flex flex-col gap-12 items-start justify-center mt-[3.5rem]">
			{communityFeatures.map((feature, idx) => (
				<CommunityFeaturesListItem
					feature={feature}
					index={idx}
					key={idx}
					className="grid-cols-[65px,1fr]"
				/>
			))}
		</ul>
	);
};

export default CommunityFeaturesList;
