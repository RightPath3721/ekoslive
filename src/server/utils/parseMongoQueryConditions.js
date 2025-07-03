/**
 * @description Parses MongoDB query conditions for ACL by replacing placeholders with user data.
 * This function iterates over the provided conditions object and replaces any keys
 * starting with '$' with the corresponding value from the user object.
 * @param {object} user - The user object containing the values to replace placeholders.
 * @param {object} conditions - The MongoDB query conditions object.
 * @returns {object} The updated conditions object with placeholders replaced.
 */
const parseMongoQueryConditions = (user, conditions = {}) =>
{
	const fields = Object.entries(conditions);

	const updatedConditions = fields.reduce((acc, [field, key]) =>
	{
		if (!key.includes("$")) return { ...acc, [field]: key };
		return { ...acc, [field]: user[key.replace("$", "")] };
	}, {});

	return updatedConditions;
};

module.exports = parseMongoQueryConditions;
