import React from "react";
import EkosLiveLogo from "@client/icons/EkosLiveLogo";

const getStyles = (variant) =>
{
	let className = "inline-flex items-baseline text-grey-primary font-snasm font-normal";
	switch (variant)
	{
		case "secondary":
			className += " text-[2rem] leading-10";
			break;
		case "primary":
			className += " text-[1.25rem] md:text-[1.5rem] lg:text-[1.75rem] leading-8";
			break;
		default:
			break;
	}
	return className;
};

const Logo = ({ width, height, variant }) =>
{
	return (
		<p className={getStyles(variant)}>
			Ek
			<span>
				<EkosLiveLogo height={height} width={width} />
			</span>
			sLive
		</p>
	);
};

export default Logo;
