import React from "react";
import { aboutFeatures } from "../../../constants/aboutFeatures";
import CheckBoxListItem from "../../shared/CheckBoxListItem";

const FeaturesList = () =>
{
	return (
		<ul className="flex flex-col items-start justify-center gap-2 lg:gap-4">
			{aboutFeatures.map((text, idx) => (
				<CheckBoxListItem key={idx} index={idx} text={text} />
			))}
		</ul>
	);
};

export default FeaturesList;
