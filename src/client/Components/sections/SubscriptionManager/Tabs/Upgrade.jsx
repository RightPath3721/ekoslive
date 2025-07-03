import React from "react";
import { toast } from "react-toastify";
import paypalService from "@services/paypalService";
import { useSubscriptionManagerContext } from "@components/providers/SubscriptionManagerProvider";
import { planType } from "@indi/enums";
import useActiveUser from "@hooks/useActiveUser";

const Upgrade = () =>
{
	const user = useActiveUser();
	const { subscriptionPlans } = useSubscriptionManagerContext();

	const upgradeSubscription = async (planId) =>
	{
		try
		{
			const link = await paypalService.upgradeCurrentPlan(
				user,
				user.subscription_id,
				planId,
			);
			window.location.href = link;
		}
		catch (error)
		{
			console.error(error);
			toast.error(error.message);
		}
	};

	return (
		<div className="flex-center gap-2 mx-auto mt-5">
			{user.plan_id !== planType.ULTIMATE &&
				user.plan_id !== planType.PRO_PLAN && (
					<button
						aria-label="Upgrade subscription to pro"
						onClick={() =>
						{
							upgradeSubscription(
								subscriptionPlans.find((plan) =>
									plan.title.toLowerCase().includes("ekoslive pro"),
								).id,
							);
						}}
						className="primary-btn focus-button w-[100px] focus-within:text-white focus:text-white"
						type="button"
					>
						Pro
					</button>
				)}
			{user.plan_id !== planType.ULTIMATE && (
				<button
					aria-label="Upgrade subscription to ultimate"
					onClick={() =>
						upgradeSubscription(
							subscriptionPlans.find((plan) =>
								plan.title.toLowerCase().includes("ekoslive ultimate"),
							).id,
						)
					}
					className="primary-btn focus-button w-[100px] focus-within:text-white focus:text-white"
					type="button"
				>
					Ultimate
				</button>
			)}
		</div>
	);
};

export default Upgrade;
