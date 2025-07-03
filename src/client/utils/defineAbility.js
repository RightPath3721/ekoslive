import { AbilityBuilder, PureAbility } from "@casl/ability";

const conditionsMatcher = (conditions) =>
{
	return (object) =>
	{
		return Object.entries(conditions).every(
			([key, value]) => object[key] === value,
		);
	};
};

const defineAbilityForClient = (user = null, permissions = []) =>
{
	const { build, can, cannot } = new AbilityBuilder(PureAbility);

	if (!permissions || !Array.isArray(permissions)) return build({
		conditionsMatcher,
	});

	permissions.forEach((permission) =>
	{
		if (user?.role === "SUPER_ADMIN") return can("manage", "all");
		if (permission.userActions)
		{
			if (!user) return;

			if (!permission.userActions || !Array.isArray(permission.userActions)) return;

			permission.userActions?.forEach((userAction) =>
			{
				if (userAction.allow)
				{
					if (!userAction.actions || !Array.isArray(userAction.actions)) return;
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
								parseDynamicConditions(user, userAction.conditions),
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
							parseDynamicConditions(user, userAction.conditions),
						);
					});
				}
			});
		}

		if (!permission.actions || !Array.isArray(permission.actions)) return;
		permission.actions.forEach((action) =>
		{
			if (
				permission.allow &&
				(permission.role.includes(user?.role) || permission.role.includes("*"))
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

	return build({
		conditionsMatcher,
	});
};

/**
 * @description Parses dynamic query conditions for ACL by replacing placeholders with user data.
 * This function iterates over the provided conditions object and replaces any keys
 * starting with '$' with the corresponding value from the user object.
 * @param {object} user - The user object containing the values to replace placeholders.
 * @param {object} conditions - The MongoDB query conditions object.
 * @returns {object} The updated conditions object with placeholders replaced.
 */
const parseDynamicConditions = (user, conditions = {}) =>
{
	const fields = Object.entries(conditions);

	const updatedConditions = fields.reduce((acc, [field, key]) =>
	{
		if (!key.includes("$")) return { ...acc, [field]: key };
		return { ...acc, [field]: user[key.replace("$", "")] };
	}, {});

	return updatedConditions;
};

export default defineAbilityForClient;
