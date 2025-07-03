import { planType } from "@common/shared/indi/enums";

/**
 * @param {string} userPlan - User plan id.
 * @param {boolean} isAnnual - Indicates is plan annual or monthly.
 * @param {string} planTitle - Title of the plan which needs to be checked.
 * @returns {boolean} - Returns boolean value which indicate to show button or not.
 */
export default function shouldDisplaySubscribeButton(
	userPlan,
	isAnnual,
	planTitle,
)
{
	if (planTitle === "Basic") return false;

	switch (userPlan)
	{
		case planType.PRO_MONTHLY:
			return planTitle === "Ultimate" || (planTitle === "Pro" && isAnnual);

		case planType.PRO_PLAN:
			return planTitle === "Ultimate" && isAnnual;

		case planType.ULTIMATE_MONTHLY:
			return planTitle === "Ultimate" && isAnnual;

		case planType.ULTIMATE:
			return false;

		case planType.DEFAULT:
		default:
			return true;
	}
}
