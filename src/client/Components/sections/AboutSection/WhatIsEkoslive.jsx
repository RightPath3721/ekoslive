import React from "react";
import EkosLiveLogo from "@client/icons/EkosLiveLogo";
import BgEllipse from "@components/shared/BgEllipse";
import SectionTitle from "@components/shared/SectionTitle";
import { useMediaQuery } from "react-responsive";

const WhatIsEkoslive = () =>
{
	const isLargeScreen = useMediaQuery({ query: "(min-width: 1024px)" });
	const isMediumScreen = useMediaQuery({ query: "(min-width: 640px)" });

	return (
		<article className="flex-center gap-4 xs:gap-16 lg:gap-24 relative">
			<EkosLiveLogo
				width={isLargeScreen ? 359 : isMediumScreen ? 250 : 175}
				height={isLargeScreen ? 247 : isMediumScreen ? 170 : 120}
			/>
			<div className="flex flex-col justify-center items-start gap-3">
				<SectionTitle title="What is EkosLive?" />
				<p className="max-w-[320px] sm:max-w-[400px] lg:max-w-[540px] text-secondary">
					EkosLive is an online cloud-based App to remotely control your
					observatory from anywhere and at any time. Store, search, share, and
					tag your images. Get notifications about the imaging progress,
					live-stack deep sky targets, and invite others to join your session.
					Engage with the astrophotography community and discover new targets
					and equipment. Use it on your phone, tablet, or computer.
				</p>
			</div>

			<BgEllipse width={194} height={194} position={{ y: 40, x: 0 }} />
		</article>
	);
};

export default WhatIsEkoslive;
