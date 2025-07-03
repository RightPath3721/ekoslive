import React from "react";
import { PricingTable as ReactPricingTable } from "react-pricing-table";
import useSubscriptionPlans from "@hooks/useSubscriptionPlans";
import { tableData } from "./tableData";
import PricingCard from "./PricingCard";

const PricingTable = ({ isYearView }) =>
{
	const subscriptionPlans = useSubscriptionPlans();

	return (
		<ReactPricingTable highlightColor="#FF6600">
			{tableData.map((plan, i) =>
			{
				let paypalData;
				if (plan.title === "Basic")
				{
					paypalData = subscriptionPlans.find((item) =>
						item.name.toLowerCase().includes(plan.title.toLowerCase()),
					);
				}
				else
				{
					paypalData = subscriptionPlans.find((item) =>
					{
						if (isYearView)
						{
							return (
								item.name.toLowerCase().includes(plan.title.toLowerCase()) &&
								item.description.toLowerCase().includes("annual")
							);
						}
						else if (!isYearView)
						{
							return (
								item.name.toLowerCase().includes(plan.title.toLowerCase()) &&
								!item.description.toLowerCase().includes("annual")
							);
						}
					});
				}
				if (!paypalData) return <React.Fragment key={i} />;

				return (
					<PricingCard
						key={paypalData.id}
						isYearView={isYearView}
						paypalData={paypalData}
						plan={plan}
					/>
				);
			})}
		</ReactPricingTable>
	);
};

export default PricingTable;
