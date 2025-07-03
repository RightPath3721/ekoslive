import React from "react";
import SectionTitle from "../../shared/SectionTitle";
import PlatformsEllipse from "./PlatformsEllipse";

const PlatformSection = () =>
{
	return (
		<section className="flex flex-col sm:flex-row gap-12 sm:gap-0 pt-10 px-6 mb-14 sm:pt-16 sm:px-12 lg:px-24 lg:pt-36 xl:px-[9.375rem] xl:pt-44 justify-between items-center sm:mb-32">
			<PlatformsEllipse />
			<div className="w-full sm:w-auto">
				<SectionTitle title="Supported Platforms" />
				<p className="text-secondary max-w-auto flex flex-col mt-3 sm:max-w-[350px] lg:max-w-[450px] xl:max-w-auto">
					<span>
						Out of the box support for StellarMate, Linux, and MacOS using
						KStars.
					</span>
					<span>
						3rd party integrations planned for popular capture software.
					</span>
				</p>
				<button
					className="primary-btn mt-8 lg:mt-11 capitalize px-8"
					type="button"
				>
					learn more
				</button>
			</div>
		</section>
	);
};

export default PlatformSection;
