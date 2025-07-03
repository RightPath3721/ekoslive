const { get } = require("lodash");
const logger = require("../logger");
const SyncModel = require("../models/sync");
const UserModel = require("../models/user");

class SyncController
{
	async getSyncData(username)
	{
		const user = await this.#getUser(username);
		const data = await SyncModel.find({ owner: user._id });

		return data;
	}

	async #getUser(username)
	{
		const user = await UserModel.findOne({ username });
		if (!user) throw new Error("User not found");
		return user;
	}

	async createOrUpdateUserData(username, payload)
	{
		try
		{
			const user = await this.#getUser(username);

			const type = payload.type;
			const data = payload.data;
			const key = get(payload, "key", "");

			// Find and update, or create if doesn't exist
			const existingDocument = await SyncModel.findOneAndUpdate(
				{ owner: user._id },
				{
					$set: key
						? {
								[`payload.${type}.${key}`]: data,
							}
						: {
								[`payload.${type}`]: data,
							},
				},
				{
					upsert: true,
					new: true,
				},
			);
			return existingDocument;
		}
		catch (error)
		{
			logger.error("Error creating or updating user data for user", error, {
				username: username,
				payloadType: payload ? payload.type : "unknown"
			});
			throw error;
		}
	}
}

module.exports = new SyncController();
