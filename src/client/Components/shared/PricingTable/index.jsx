import React, { useState } from "react";
import PricingTable from "./PricingTable";
import TableSwitch from "./TableSwitch";
import PricingTableHeader from "./PricingTableHeader";

const index = () =>
{
	const [isYearView, setIsYearView] = useState(true);

	return (
		<section className="flex-center flex-col gap-5 py-10 px-4 md:px-6">
			<PricingTableHeader />
			<TableSwitch setValue={setIsYearView} value={isYearView} />
			<PricingTable isYearView={isYearView} />
		</section>
	);
};

export default index;
