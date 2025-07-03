import React from "react";
import SectionTitle from "../../shared/SectionTitle";
import aboutImg from "../../../assets/about-us.webp";
import FeaturesList from "./FeaturesList";

const About = () =>
{
	return (
		<div className="flex-between flex-col xs:flex-row gap-5 sm:gap-8 lg:gap-16">
			<div className="flex flex-col gap-3 items-flex-start justify-center">
				<SectionTitle title="About EkosLive" />
				<FeaturesList />
			</div>
			<img
				src={aboutImg}
				alt="observatory"
				className="w-[220px] h-[186px] sm:w-[320px] sm:h-[270px] lg:w-[500px] lg:h-[405px] xl:w-[690px] xl:h-[560px]"
				width={690}
				height={560}
				loading="lazy"
			/>
		</div>
	);
};

export default About;
