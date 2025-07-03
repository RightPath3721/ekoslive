import React from "react";
import appstore from "../../assets/appstore.svg";
import googleplay from "../../assets/googleplay.png";

const DownloadButtons = () =>
{
	return (
		<p className="grid grid-cols-[repeat(2,auto)] items-center gap-[0.375rem] w-min">
			<a
				target="_blank"
				rel="noopener noreferrer"
				href="https://play.google.com/store/apps/details?id=com.ikarustech.stellarmate&pcampaignid=web_share&pcampaignid=pcampaignidMKT-Other-global-all-co-prtnr-py-PartBadge-Mar2515-1"
				className="w-fit h-fit"
			>
				<img
					src={googleplay}
					alt="Get stellarmate app on Google Play"
					width={144}
					height={70}
					className="get-app-button w-[100px] h-[45px] lg:w-[120px] lg:h-[54px] xl:w-[157px] xl:h-[70px]"
					loading="lazy"
				/>
			</a>
			<a
				href="#"
				target="_blank"
				rel="noopener noreferrer"
				className="w-fit h-fit"
			>
				<img
					src={appstore}
					alt="Get stellarmate app on App Store"
					width={140}
					height={47}
					className="get-app-button w-[96px] h-[32px] lg:w-[112px] lg:h-[38px] xl:w-[140px] xl:h-[47px]"
					loading="lazy"
				/>
			</a>
		</p>
	);
};

export default DownloadButtons;
