import React from "react";
import { motion } from "framer-motion";
import { useMediaQuery } from "react-responsive";
import { pricingTableData } from "@constants/pricingTableData";
import TableCheckMark from "@client/icons/TableCheckmark";
import TableX from "@client/icons/TableX";
import TableButton from "@components/sections/PricingSection/TableButton";
import { pricingTableAnimationConfig } from "@constants/animation";
import { useSubscriptionManagerContext } from "@components/providers/SubscriptionManagerProvider";
import { SUBSCRIPTION_MANAGER_TABS } from "@constants/subscriptionManager";
import useActiveUser from "@hooks/useActiveUser";
import shouldDisplaySubscribeButton from "@utils/shouldDisplaySubscribeButton";

const SeePlans = () =>
{
	const user = useActiveUser();
	const { setCurrentConfirmPlan, changeTab, subscriptionPlans } =
		useSubscriptionManagerContext();
	const isLargeScreen = useMediaQuery({ query: "(min-width: 1024px)" });

	return (
		<motion.table {...pricingTableAnimationConfig}>
			<thead>
				<tr className="bg-white-10">
					{pricingTableData.headers.map((header) => (
						<th
							className="py-3 w-[170px] font-raleway text-base align-middle leading-6 text-center font-semibold"
							key={header}
						>
							{header}
						</th>
					))}
				</tr>
			</thead>
			<tbody>
				{Object.entries(pricingTableData.body).map(([key, values], idx) => (
					<tr className="[&>td]:py-3" key={idx}>
						<td className="bg-white-10 pl-3 pr-4 font-raleway text-sm leading-[1.125rem] align-middle font-normal text-left">
							{key}
						</td>
						{values.map((value, idx) => (
							<td
								className="font-manrope text-xs text-center font-medium align-middle"
								key={idx}
							>
								{typeof value === "string" ? (
									String(value)
								) : value ? (
									<TableCheckMark
										height={isLargeScreen ? 24 : 20}
										width={isLargeScreen ? 24 : 20}
										color="#FF6600"
										className="mx-auto"
									/>
								) : (
									<TableX
										height={isLargeScreen ? 24 : 20}
										width={isLargeScreen ? 24 : 20}
										color="#FFFFFFB3"
										className="mx-auto"
									/>
								)}
							</td>
						))}
					</tr>
				))}
			</tbody>
			<tfoot>
				<tr>
					{pricingTableData.headers.map((header, idx) =>
					{
						const shouldDisplayButton = shouldDisplaySubscribeButton(
							user.plan_id,
							false,
							header.replace("EkosLive ", ""),
						);
						if (!shouldDisplayButton) return <td key={idx}></td>;

						return (
							<td className="pt-3" key={idx}>
								{header ? (
									<TableButton
										onClick={() =>
											{
											setCurrentConfirmPlan(
												subscriptionPlans.find((plan) =>
													plan.title
														.toLowerCase()
														.includes(header.toLowerCase()),
												),
											);
											changeTab(SUBSCRIPTION_MANAGER_TABS.confirmSubscription);
										}}
										className="px-3 mx-auto block"
									/>
								) : (
									header
								)}
							</td>
						);
					})}
				</tr>
			</tfoot>
		</motion.table>
	);
};

export default SeePlans;
