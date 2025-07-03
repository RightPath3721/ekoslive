import { planType } from "@indi/enums";

/**
 * Return plan_id based on subsscription name.
 * @param {object} plan - The subscription plan object.
 * @returns {string} - The ID of the subscription plan.
 */
export const getPlanId = (plan) =>
{
	const lowerDescription = plan.description.toLowerCase();
	if (lowerDescription.includes("ultimate"))
	{
		return lowerDescription.includes("annual")
			? planType.ULTIMATE
			: planType.ULTIMATE_MONTHLY;
	}
	else if (lowerDescription.includes("pro"))
	{
		return lowerDescription.includes("annual")
			? planType.PRO_PLAN
			: planType.PRO_MONTHLY;
	}
	else return planType.DEFAULT;
};
