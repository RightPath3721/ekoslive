const UserModel = require("../models/user");
const PromptModel = require("../models/prompt");
const logger = require("../logger");
const checkUserPromptsLeft = require("../utils/checkUserPromptsLeft");

// This is called by the client web API to register a new user connection.
class userController
{
	// Mark user as connected.
	// For online user, we can add them to the database if they're not already there.
	// For offline user, they MUST exist (be registered before hand) before they can set as connected.
	setConnected(userInfo)
	{
		// We only ADD new users when using online server
		// for offline server, the user must _already_ exist
		return new Promise(function (resolve, reject)
		{
			UserModel.findOneAndUpdate(
				{
					$or: [{ username: userInfo.username }, { email: userInfo.username }],
				},
				{ ...userInfo, connected: true },
				{
					new: true,
				},
			)
				.then((ekos) =>
				{
					if (ekos === null)
					{
						logger.error("User not found during connection", new Error("User not found"), {
							username: userInfo.username
						});
						reject(userInfo.username + ": user not found!");
					}
					else
					{
						logger.info(userInfo.username + ": Connected Successfully.");
						resolve("Connected successfully.");
					}
				})
				.catch((err) =>
				{
					logger.error("Error during user connection", err, {
						username: userInfo.username
					});
					reject(err);
				});
		});
	}

	add(userInfo)
	{
		let newUser = new UserModel({
			username: userInfo.username,
			password: userInfo.password,
			connected: false,
			role: "REGISTERED",
		});
		// We only ADD new users when using online server
		// for offline server, the user must _already_ exist
		return new Promise((resolve, reject) =>
		{
			newUser
				.save()
				.then((user) => resolve(user))
				.catch((err) => reject(err));
		});
	}

	verify(username, password)
	{
		return new Promise(function (resolve, reject)
		{
			UserModel.findOne({ $or: [{ username }, { email: username }] }).then(
				(user) =>
				{
					if (user === null)
					{
						logger.error("User does not exist during verification", new Error("User does not exist"), {
							username
						});
						reject(username + ": User does not exist!");
					}
					else
					{
						user
							.verifyPassword(password)
							.then((valid) =>
							{
								if (valid)
								{
									logger.info(username + " Authentication successful");
									resolve(user.serial);
								}
								else
								{
									logger.warn(username + ": Authentication failed!");
									reject(username + ": Authentication failed!");
								}
							})
							.catch((err) =>
							{
								logger.error("Error during password verification", err, {
									username
								});
								reject(err);
							});
					}
				},
			);
		});
	}

	/**
	 * @param {string} username - Username.
	 * @param {{key: value}} property - Property to save.
	 */
	saveProperty(username, property)
	{
		UserModel.findOneAndUpdate(
			{ $or: [{ username }, { email: username }] },
			property,
		).then((user) =>
		{
			if (user === null)
			{
				logger.error("Failed to save property - user not found", new Error("User not found"), {
					username,
					property: JSON.stringify(property)
				});
			}
		});
	}

	clearAll()
	{
		UserModel.deleteMany({}, function (err)
		{
			if (err)
			{
				logger.warn("Failed to remove all user records. " + err);
			}
			else logger.log("debug", "All user records are cleared.");
		});
	}

	savePropertyInArray(username, arrayName, arrayKey, property, payload)
	{
		const query = { username, [arrayName + ".name"]: arrayKey };
		const update = { [arrayName + ".0." + property]: payload };
		UserModel.findOneAndUpdate(query, update).then((ekos) =>
		{
			if (ekos === null)
			{
				logger.error("Failed to save property in array - user not found", new Error("User not found"), {
					username,
					arrayName,
					arrayKey,
					property
				});
			}
		});
	}

	clearProperty(token, property)
	{
		UserModel.findOneAndUpdate({ token }, { $unset: property })
			.then((ekos) =>
			{
				if (ekos === null)
				{
					logger.error("Failed to clear property - user not found", new Error("User not found"), {
						token,
						property
					});
				}
				else
				{
					logger.log("debug", token + ": Clear property " + property);
				}
			})
			.catch((err) =>
			{
				logger.error("Failed to clear property", err, {
					token,
					property
				});
			});
	}

	async updateUserPromptsQuantity(username, { promptsQuantity, step, planId })
	{
		try
		{
			const user = await UserModel.findOne({ username });
			if (
				isNaN(user.promptsLeft) ||
				compareDates(new Date(user.promptsUpdateTS), new Date())
			)
			{
				const updatedUser = await UserModel.findByIdAndUpdate(
					user._id,
					{ promptsLeft: promptsQuantity, promptsUpdateTS: new Date() },
					{ new: true },
				);
				return updatedUser.promptsLeft;
			}
			else if (!isNaN(step - 0))
			{
				const updatedUser = await UserModel.findByIdAndUpdate(
					user._id,
					{ promptsLeft: user.promptsLeft + step },
					{ new: true },
				);
				return updatedUser.promptsLeft;
			}
			else if (planId)
			{
				const updatedPrompts = checkUserPromptsLeft(user.promptsLeft, planId);
				await UserModel.findByIdAndUpdate(user._id, {
					promptsLeft: updatedPrompts,
				});
				return updatedPrompts;
			}
		}
		catch (error)
		{
			logger.error("Error updating prompts for user", error, {
				username,
				promptsQuantity,
				step,
				planId
			});
			throw new Error("Error updating prompts");
		}
	}

	async checkPrompts(username)
	{
		const user = await UserModel.findOne({ username });
		if (user.promptsLeft < 1)
			throw new Error(
				"You are consumed all available prompts, please upgrade your plan",
			);
	}

	async getUsersInfo({
		orderBy,
		sortDirection,
		page,
		limit,
		search,
		connected,
	})
	{
		const aggregatePipeline = [
			{ $sort: { [orderBy]: sortDirection === "desc" ? -1 : 1 } },
			{ $skip: +page * limit },
			{ $limit: limit },
			{
				$lookup: {
					from: 'prompts',
					localField: 'username',
					foreignField: 'username',
					as: 'userPrompts'
				}
			},
			{
				$addFields: {
					promptCount: { $size: "$userPrompts" },
					executedPromptCount: {
						$size: {
							$filter: {
								input: "$userPrompts",
								as: "prompt",
								cond: { $eq: ["$$prompt.executed", true] }
							}
						}
					}
				}
			}
		];
		const countPipeline = [];

		if (search)
		{
			const regex = new RegExp(search, "i");
			const matchStage = {
				$match: {
					$or: [{ username: regex }, { email: regex }, { machine_id: regex }],
				},
			};
			aggregatePipeline.unshift(matchStage);
			countPipeline.unshift(matchStage);
		}
		try
		{
			const parsedFilter = JSON.parse(connected);
			const filterByConnectedStage = { $match: { connected: parsedFilter } };
			aggregatePipeline.unshift(filterByConnectedStage);
			countPipeline.unshift(filterByConnectedStage);
		}
		catch
		{ }

		const users = await UserModel.aggregate([
			{
				$facet: {
					filtered_data: aggregatePipeline,
					total_count: [...countPipeline, { $count: "totalCount" }],
				}
			}
		]);

		return {
			users: users[0].filtered_data,
			count: users[0].total_count[0]?.totalCount,
			result: true,
		};
	}

	async getConnectedUsersCount()
	{
		const count = await UserModel.aggregate([
			{
				$match: { connected: true },
			},
			{
				$count: "connectedUsersCount",
			},
		]);
		return count[0].connectedUsersCount;
	}

	async updateUserProperty(username, property)
	{
		const user = await UserModel.findOneAndUpdate(
			{ $or: [{ username }, { email: username }] },
			property,
			{
				new: true,
			},
		);
		if (!user) throw new Error("User not found");
		// if (!user?.role)
		// {
		// 	await this.updateUserProperty(username, {
		// 		role: user.plan_id !== "2" ? "SUBSCRIBER" : "REGISTERED",
		// 	});
		// }
		return user;
	}

	async getSubscribersCount()
	{
		const pipeline = [
			{
				$facet: {
					pro_annual: [
						{ $match: { plan_id: "1" } },
						{ $count: "pro_annual_count" },
					],
					pro_montly: [
						{ $match: { plan_id: "4" } },
						{ $count: "pro_monthly_count" },
					],
					ultimate_annual: [
						{ $match: { plan_id: "3" } },
						{ $count: "ultimate_annual_count" },
					],
					ultimate_monthly: [
						{ $match: { plan_id: "3" } },
						{ $count: "ultimate_monthly_count" },
					],
				},
			},
		];

		const result = await UserModel.aggregate(pipeline);
		return result[0];
	}

	async loginUser(username, data)
	{
		const user = await UserModel.findOneAndUpdate(
			{ $or: [{ username }, { email: username }] },
			data,
			{
				new: true,
				upsert: true,
			},
		);
		if (!user) throw new Error("User not found");
		// if (!user?.role)
		// {
		// 	await this.updateUserProperty(username, {
		// 		role: user.plan_id !== "2" ? "SUBSCRIBER" : "REGISTERED",
		// 	});
		// }
		return user;
	}

	async getUser(username)
	{
		// Find user by username or email (assuming username can be an email for login purposes)
		const user = await UserModel.findOne({ $or: [{ username: username }, { email: username }] });
		// We don't throw an error here if not found, the route handler will do that.
		return user;
	}
}

/**
 * @param {Date} date1 - First date to compare.
 * @param {Date} date2 - Second date to compare.
 * @returns {boolean} Returns true if one month passed since date1 to date2.
 */
function compareDates(date1, date2)
{
	return date1.getMonth() - date2.getMonth() > 0;
}

module.exports = new userController();
