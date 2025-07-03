const { readFileSync, writeFileSync } = require("fs");
const { compareVersions } = require("compare-versions");
const PermissionModel = require("../models/permission");
const aclList = require("../acl/permission.json");
const { acl_version } = require("../config");
const logger = require("../logger");

/**
 * Updates permission object in a JSON file.
 * @param {object} updatedObject - The object with the updated data and `id` field.
 * @param {string} version - The version for updating list, default value is taken from json file .
 * @returns {Promise<boolean>} - A promise that resolves to `true` if the update was successful, `false` otherwise.
 * @throws {Error} - If an error occurs while reading or writing the JSON file.
 */
const updateACL = async (updatedObject, version = aclList.version) =>
{
	const data = readFileSync("../acl/permission.json", "utf-8");
	const jsonData = JSON.parse(data);
	jsonData.version = version;

	const index = jsonData.permissionList.findIndex(
		(obj) => obj.id === updatedObject.id,
	);

	if (index !== -1)
	{
		jsonData.permissionList[index] = updatedObject;

		// Write the updated data back to the file
		writeFileSync("../acl/permission.json", JSON.stringify(jsonData, null, 2));
		return true;
	}
	else
	{
		logger.error("Permission not found for update", new Error("Permission not found"), {
			operation: "updateACL",
			permissionId: updatedObject.id
		});
	}
};

/**
 * @description Initializes the ACL in the database.
 * This function checks the version of the provided ACL version from .env against the json version.
 * If the json list has a higher version, it updates the database by deleting existing permissions
 * and inserting the new ones from the provided list.
 * @async
 * @throws {Error}  - If an error occurs during permission deletion or insertion.
 */
const initACL = async () =>
{
	if (compareVersions(aclList.version, acl_version) > 0)
	{
		try
		{
			await PermissionModel.deleteMany({});
			await PermissionModel.insertMany(aclList.permissionList);
		}
		catch (error)
		{
			logger.error("Error updating permissions in database", error, {
				operation: "initACL",
				aclVersion: aclList.version,
				envVersion: acl_version
			});
		}
	}
};

module.exports = { updateACL, initACL };
