import React from "react";
import HeroTitle from "./HeroTitle";
import bgImage from "../../../assets/hero-bg.webp";

const HeroSection = () =>
{
	return (
		<section
			className="w-full bg-no-repeat pt-40 px-8 pb-12 sm:pt-72 sm:px-16 sm:pb-24 lg:pt-96 lg:px-24 xl:px-36 lg:pb-32 xl:pt-[32rem] bg-center bg-cover flex flex-col sm:flex-row gap-2 sm:gap-0 justify-between items-start sm:items-end"
			style={{
				backgroundImage: `linear-gradient(180deg, rgba(0, 0, 0, 0) 8.17%, rgba(0, 0, 0, 0.9375) 100%), url(${bgImage})`,
			}}
		>
			<HeroTitle />
			<a href="#about" className="primary-btn px-5 lg:px-8" type="button">
				Discover
			</a>
		</section>
	);
};

export default HeroSection;
