import React from "react";
import SectionTitle from "../../shared/SectionTitle";
import CommunityFeaturesList from "./CommunityFeaturesList";
import BgEllipse from "../../shared/BgEllipse";
import satelliteBgImg from "../../../assets/satellite-bg.svg";
import earthBgImg from "../../../assets/earth-bg.png";

const CommunityFeaturesSection = () =>
{
	return (
		<section
			className="flex-center relative flex-col items-start px-[6.75rem] lg:px-[9.375rem] pb-28 lg:pb-40 pt-[4.5rem] bg-[length:160px_160px,contain] bg-[position:top_120px_right_70px,_right_0px_center] lg:bg-[position:top_120px_right_370px,_right_0px_center] bg-no-repeat"
			style={{
				backgroundImage: `url(${satelliteBgImg}), url(${earthBgImg})`,
			}}
		>
			<SectionTitle title="Community features" />
			<span className="text-[#FFFCFA]/70 text-xs mt-3">
				(Available Q4 2025)
			</span>
			<p className="text-secondary text-white-primary mt-5">
				Join thousands of amateur and expert astrophotographers worldwide.
			</p>
			<CommunityFeaturesList />

			<BgEllipse
				height={500}
				width={445}
				position={{ x: -170, y: "85%" }}
				className="[filter:blur(200px)]"
			/>
		</section>
	);
};

export default CommunityFeaturesSection;
