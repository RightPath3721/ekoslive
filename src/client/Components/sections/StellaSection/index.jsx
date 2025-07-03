import React from "react";
import SectionTitle from "../../shared/SectionTitle";
import BgEllipse from "../../shared/BgEllipse";
import StellaFeaturesList from "./StellaFeaturesList";
import observatoryCometImg from "../../../assets/observatory-bg-comet.webp";
import observatoryBgImg from "../../../assets/observatory-bg.webp";

const StellaSection = () =>
{
	return (
		<section
			className="flex-center relative flex-col items-start px-5 xs:px-9 pb-7 sm:pb-28 sm:px-[6.75rem] lg:px-[9.375rem] lg:pb-40 pt-10 sm:pt-[4.5rem] bg-no-repeat bg-[position:top_219px_right_72px,_center] bg-[length:314px_340px,cover]"
			style={{
				backgroundImage: `url(${observatoryCometImg}), url(${observatoryBgImg})`,
			}}
		>
			<SectionTitle title="Stella Digital Smart Assistant" />
			<p className="text-secondary text-white-primary mt-5">
				Stella is a revolutionary new way to interact with StellarMate. It
				leverages text, voice, and images to help you accomplish in seconds what
				used to take much longer before. Let’s see how Stella can help you
				explore outer space.
			</p>
			<StellaFeaturesList />

			<BgEllipse
				height={500}
				width={445}
				position={{ x: -170, y: "85%" }}
				className="[filter:blur(200px)]"
			/>
		</section>
	);
};

export default StellaSection;
