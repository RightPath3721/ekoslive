import React from "react";
import SectionTitle from "../../shared/SectionTitle";
import PricingTable from "./PricingTable";
import pricingBgImg from "../../../assets/pricing-bg.webp";

const PricingSection = () =>
{
	return (
		<section
			id="pricing"
			className="flex-center flex-col items-end bg-cover bg-opacity-70 px-5 pb-6 md:px-[6.5rem] lg:px-[9.375rem] pt-[6.25rem] md:pb-14 relative"
			style={{
				backgroundImage: `url(${pricingBgImg})`,
			}}
		>
			<div className="flex items-start justify-center flex-col">
				<SectionTitle title="Pricing Plans" />
				<PricingTable />
			</div>
		</section>
	);
};

export default PricingSection;
