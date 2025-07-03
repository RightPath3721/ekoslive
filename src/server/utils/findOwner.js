const UserModel = require("../models/user");

/**
 * Finds a user by their username.
 * @param {string} username - The username of the user to find.
 * @returns {Promise<object>} A promise that resolves to the user document if found, or throws an error if the user is not found.
 * @throws {Error} If the user with the provided username is not found.
 */
const findOwner = async (username) =>
{
	const owner = await UserModel.findOne({ username });
	if (!owner) throw new Error("User not found");
	return owner;
};

module.exports = findOwner;
