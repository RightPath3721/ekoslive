import React from "react";
import WhatIsEkoslive from "./WhatIsEkoslive";
import About from "./About";

const AboutSection = () =>
{
	return (
		<section
			id="about"
			className="flex-center flex-col px-7 sm:px-16 xl:px-24 2xl:px-36 gap-[4.75rem]"
		>
			<WhatIsEkoslive />
			<About />
		</section>
	);
};

export default AboutSection;
