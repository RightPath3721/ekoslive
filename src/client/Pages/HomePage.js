import React from "react";
import HeroSection from "@components/sections/HeroSection";
import AboutSection from "@components/sections/AboutSection";
import FeaturesSection from "@components/sections/FeaturesSection";
import StellaSection from "@components/sections/StellaSection";
import PlatformSection from "@components/sections/PlatformsSection";
// import IntegrationsSection from "@components/sections/IntegrationsSection";
import AppDemo from "@components/sections/AppDemo";
import Footer from "@components/sections/Footer";

const Home = () =>
{
	return (
		<>
			<main className="text-white bg-black-primary overflow-hidden">
				<HeroSection />
				<AboutSection />
				<FeaturesSection />
				<StellaSection />
				<PlatformSection />
				{/* <IntegrationsSection /> */}
				<AppDemo />
			</main>
			<Footer />
		</>
	);
};

export default Home;
