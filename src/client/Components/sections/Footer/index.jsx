import React from "react";
import FooterLinkList from "./FooterLinkList";
import Logo from "@components/shared/Logo";
// import DownloadButtons from "./DownloadButtons";
import SocialList from "./SocialList";

const Footer = () =>
{
	return (
		<footer className="bg-black-secondary text-white">
			<div className="flex flex-col sm:flex-row justify-between items-start gap-8 md:gap-12 lg:gap-28 xl:gap-[9.375rem] px-9 lg:px-28 xl:px-[9.375rem] pt-16 pb-11">
				<div>
					<Logo height={34} width={46} variant="secondary" />
					<p className="text-secondary mt-2 max-w-[320px]">
						EkosLive is an online astrophotography platform that connects you
						with the rest of the community
					</p>
					{/* <DownloadButtons /> */}
				</div>
				<FooterLinkList />
				<SocialList />
			</div>

			<p className="py-4 border-t border-white-30 text-center text-white-80 font-manrope text-sm font-normal">
				Copyright&#64;{new Date().getFullYear()} &#124; All Rights Reserved
			</p>
		</footer>
	);
};

export default Footer;
