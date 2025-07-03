const CloudModel = require("../models/cloud");
const logger = require("../logger");

class cloudController
{
	register(ekosInfo)
	{
		CloudModel.findOneAndUpdate(
			{ username: ekosInfo.username },
			{ ...ekosInfo, connected: true },
			{ new: true, upsert: true },
		).then((ekos) =>
		{
			if (ekos === null)
			{
				logger.error("CloudModel username not found", new Error("User not found"), {
					username: ekosInfo.username
				});
			}
			else
			{
				logger.log(
					"debug",
					ekos.username + ": Successfully registered Ekos Cloud connection.",
				);
			}
		});
	}

	/**
	 * Saves a property for a given user in mongoDB.
	 * @param {string} username - The username of the user.
	 * @param {{key: value}} property - The property to be saved. The exact structure of the property object depends on the specific use case.
	 * @throws {Error} If there's an error saving the property, especially if the Ekos profile doesn't exist.
	 */
	saveProperty(username, property)
	{
		CloudModel.findOneAndUpdate({ username }, property).then((ekos) =>
		{
			if (ekos === null)
			{
				logger.error("Failed to save property: no Ekos profile exists", new Error("Profile not found"), {
					username,
					property: JSON.stringify(property)
				});
			}
		});
	}

	/**
	 * Saves a property for a given user in mongoDB.
	 * @param {string} username - The username of the user.
	 * @param {string} property - The name of the array where property will be saved.
	 * @param {{key: value}} payload - The property to be saved. The exact structure of the property object depends on the specific use case.
	 * @throws {Error} If there's an error saving the property, especially if the Ekos profile doesn't exist.
	 */
	savePropertyInArray(username, property, payload)
	{
		CloudModel.findOneAndUpdate(
			{ username },
			{ $push: { [property]: payload } },
		).then((ekos) =>
		{
			if (ekos === null)
			{
				logger.error("Failed to save property in array: no Ekos profile exists", new Error("Profile not found"), {
					username,
					property: JSON.stringify(property)
				});
			}
		});
	}

	/**
	 * Increments a property value for a given user.
	 *
	 * @param {string} username - The username of the user.
	 * @param {string} property - The name of the property to increment.
	 * @param {number} value - The value to increment the property by.
	 * @throws {Error} If there's an error incrementing the property, especially if the Ekos profile doesn't exist.
	 */
	increaseProperty(username, property, value)
	{
		const query = { [property]: value };
		CloudModel.findOneAndUpdate(
			{ username },
			{ $inc: query },
			{ upsert: true },
		).then((ekos) =>
		{
			if (ekos === null)
			{
				logger.error("Failed to increase property: no Ekos profile exists", new Error("Profile not found"), {
					username,
					property,
					value
				});
			}
		});
	}

	/**
	 * Clears a property from a user's Ekos profile.
	 * @description
	 * Clears a property from a user's Ekos profile by updating the corresponding document in the database.
	 * If the user does not have an Ekos profile, an error is logged.
	 * @param {string} username - The username of the user whose property is to be cleared.
	 * @param {string} property - The name of the property to be cleared.
	 * @throws {Error} If an error occurs while clearing the property.
	 * @example
	 * clearProperty('johnDoe', 'favoriteColor');
	 */
	clearProperty(username, property)
	{
		CloudModel.findOneAndUpdate({ username }, { $unset: property })
			.then((ekos) =>
			{
				if (ekos === null)
				{
					logger.error(
						"Failed to clear property: " +
							property +
							" as no Ekos profile exists for username: " +
							username,
					);
				}
				else
				{
					logger.debug(username + ": Clear property " + property);
				}
			})
			.catch((err) =>
			{
				logger.error("Failed to clear property", err, {
					username,
					property
				});
			});
	}
}

module.exports = new cloudController();
