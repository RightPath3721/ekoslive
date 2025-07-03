/**
 * Generates a random password.
 * @returns {string} A randomly generated password.
 */
export default function generatePassword()
{
	const chars =
		"0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
	const string_length = 16;
	let randomstring = "";
	for (let i = 0; i < string_length; i++)
	{
		const rnum = Math.floor(Math.random() * chars.length);
		randomstring += chars.substring(rnum, rnum + 1);
	}
	return randomstring;
}
