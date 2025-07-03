const { inRange } = require("lodash");

const planType = {
	PRO_PLAN: "1",
	DEFAULT: "2",
	ULTIMATE: "3",
	PRO_MONTHLY: "4",
	ULTIMATE_MONTHLY: "5",
};
/**
 * @description Determines the number of prompts a user has remaining based on their plan and current prompt count.
 * This function checks the user's plan ID (`planId`) and the number of prompts remaining (`promptsLeft`).
 * It then applies limits based on the plan type:
 * - basic: Returns the remaining prompts if between 0 and 10, otherwise returns 10.
 * - pro: Returns the remaining prompts if between 0 and 100, otherwise returns 100.
 * - ultimate: Returns the remaining prompts if greater than 100, otherwise returns 99999.
 * @param {number} promptsLeft - The number of prompts the user has remaining.
 * @param {string} planId - The user's plan ID (e.g., 'DEFAULT', 'PRO_PLAN', 'ULTIMATE').
 * @returns {number} The number of prompts the user can use after applying plan limits.
 */
const checkUserPromptsLeft = (promptsLeft, planId) =>
{
	switch (planId)
	{
		case planType.DEFAULT:
			if (inRange(promptsLeft, 0, 10))
			{
				return promptsLeft;
			}
			else return 10;
		case planType.PRO_PLAN:
		case planType.PRO_MONTHLY:
			if (inRange(promptsLeft, 0, 100))
			{
				return promptsLeft;
			}
			else return 100;
		case planType.ULTIMATE:
		case planType.ULTIMATE_MONTHLY:
			if (promptsLeft > 100)
			{
				return promptsLeft;
			}
			else return 99999;
	}
};

module.exports = checkUserPromptsLeft;
