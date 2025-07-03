import React from "react";
import { useMediaQuery } from "react-responsive";
import Ellipse from "@client/icons/Ellipse";
import Linux from "@client/icons/Linux";
import MacOS from "@client/icons/MacOS";
import StellarMateOS from "@client/icons/StellarMateOS";
import BgEllipse from "../../shared/BgEllipse";
import PlatformIcon from "./PlatformIcon";

const PlatformsEllipse = () =>
{
	const isLargeScreen = useMediaQuery({ query: "(min-width: 1024px)" });

	return (
		<div className="w-[300px] h-[142.5px] lg:w-[400px] lg:h-[190px] relative">
			<Ellipse
				className="center-absolute"
				color="#FF6600"
				width={isLargeScreen ? 400 : 300}
				height={isLargeScreen ? 180 : 135}
			/>
			<PlatformIcon
				icon={<StellarMateOS width={56} height={56} />}
				position={{ x: 30, y: -5 }}
				className="-top-5 left-[1.875rem]"
			/>
			<PlatformIcon
				icon={<MacOS height={56} width={50} />}
				position={{ x: 5, y: 4 }}
				className="-top-2 right-3 lg:right-4 lg:top-[5px]"
			/>
			<PlatformIcon
				icon={<Linux width={56} height={56} color="#000000" />}
				position={{ y: "50%", x: "-50%" }}
				className="bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2"
			/>
			<BgEllipse width={244} height={244} position={{ x: -63, y: 42 }} />
		</div>
	);
};

export default PlatformsEllipse;
