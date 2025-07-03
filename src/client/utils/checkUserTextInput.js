import { CensorSensor } from "censor-sensor";

const censor = new CensorSensor();

/**
 * Checks the user's text input for profanity and validates its length.
 * @param {string} input - The user's text input.
 * @param {number} [minLength=3] - The minimum length of the input.
 * @param {number} [maxLength=20] - The maximum length of the input.
 * @returns {{isValid: boolean, message: string|undefined}} The result of the validation.
 */
const checkUserTextInput = (input, minLength = 3, maxLength = 20) =>
{
	input = input.trim();

	if (input.length < minLength)
	{
		return {
			isValid: false,
			message: `Input is too short. Minimum length is ${minLength}.`,
		};
	}
	if (input.length > maxLength)
	{
		return {
			isValid: false,
			message: `Input is too long. Maximum length is ${maxLength}.`,
		};
	}

	if (censor.isProfaneIsh(input))
	{
		return { isValid: false, message: "Input contains inappropriate content." };
	}

	return { isValid: true };
};

export default checkUserTextInput;
