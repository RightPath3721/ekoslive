const {
	AbilityBuilder,
	createMongoAbility,
	defineAbility,
} = require("@casl/ability");
const logger = require("../logger");
const PermissionModel = require("../models/permission");
const UserModel = require("../models/user");
const parseMongoQueryConditions = require("../utils/parseMongoQueryConditions");

/**
 * Creates a CASL ability for a given username.
 * This function builds an ability object using CASL,
 * and defines permissions based on the retrieved permissions and the provided username (if any).
 * It considers user-specific permissions and conditions when defining the ability.
 * @param {string} username - The username to build the ability for (optional).
 * @returns {Promise<Ability>} - A promise that resolves to the created CASL ability object.
 * @throws {Error} - If an error occurs while fetching permissions or building the ability.
 */
const createAbility = async (username) =>
{
	try
	{
		const permissions = await PermissionModel.find({});
		const { build, can, cannot } = new AbilityBuilder(createMongoAbility);

		const user = await UserModel.findOne({ username });

		permissions.forEach((permission) =>
		{
			if (permission.userActions)
			{
				if (!user) return;

				permission.userActions?.forEach((userAction) =>
				{
					if (userAction.allow)
					{
						userAction.actions.forEach((action) =>
						{
							if (
								permission.role.includes("*") ||
								permission.role.includes(user.role)
							)
							{
								can(
									action,
									permission.subject,
									parseMongoQueryConditions(user, userAction.conditions),
								);
							}
						});
					}
					else
					{
						permission.actions.forEach((action) =>
						{
							cannot(
								action,
								permission.subject,
								parseMongoQueryConditions(user, userAction.conditions),
							);
						});
					}
				});
			}
			permission.actions.forEach((action) =>
			{
				if (
					permission.allow &&
					(permission.role.includes(user?.role) ||
						permission.role.includes("*"))
				)
				{
					can(action, permission.subject, permission.conditions ?? {});
				}
				else
				{
					cannot(action, permission.subject, permission.conditions);
				}
			});
		});

		const ability = build();
		return ability;
	}
	catch (error)
	{
		logger.error("Error creating ability", error, { username });
		throw error;
	}
};

const createReactAbility = async (username) =>
{
	try
	{
		const permissions = await PermissionModel.find({});
		const user = await UserModel.findOne({ username });
		return { permissions, user };
	}
	catch (error)
	{
		logger.error("Error getting permissions", error, { username });
		throw error;
	}
};

module.exports = {
	abilityMiddleware: async (req, _, next) =>
	{
		req.ability = await createAbility(req.query.username);
		next();
	},
	createReactAbility,
};
