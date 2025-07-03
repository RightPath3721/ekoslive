import React from "react";
import SectionTitle from "../../shared/SectionTitle";
import FeaturesList from "./FeaturesList";
import featuresBgImg from "../../../assets/features-bg.webp";

const FeaturesSection = () =>
{
	return (
		<section
			id="features"
			className="pt-16 px-7 pb-16 sm:pb-24 md:pt-24 md:px-24 xl:px-36 xl:pb-32 flex-center flex-col gap-14 bg-no-repeat bg-center bg-cover"
			style={{
				backgroundImage: `linear-gradient(180deg, rgba(0, 0, 0, 0) 54.86%, #000000 100%), linear-gradient(180deg, #000000 0%, rgba(0, 0, 0, 0) 74.51%), url(${featuresBgImg})`,
			}}
		>
			<SectionTitle title="Our Features" />
			<FeaturesList />
		</section>
	);
};

export default FeaturesSection;
