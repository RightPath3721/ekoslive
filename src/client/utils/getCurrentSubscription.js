import { planType } from "@indi/enums";

/**
 * Gets the label for the Subscription based on the plan ID.
 * @param {string} plan_id - The ID of the subscription plan.
 * @returns {("Basic" | "Pro" | "Ultimate")} - The label corresponding to the subscription plan.
 */
export const getCurrentSubscription = (plan_id) =>
{
	switch (plan_id)
	{
		case planType.DEFAULT:
			return "Basic";
		case planType.PRO_PLAN:
		case planType.PRO_MONTHLY:
			return "Pro";
		case planType.ULTIMATE:
		case planType.ULTIMATE_MONTHLY:
			return "Ultimate";
		default:
			return "Basic";
	}
};
