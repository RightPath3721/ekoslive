const express = require("express");

const ACLRoutes = express.Router();
const { createReactAbility } = require("../acl/createAbility");
const logger = require("../logger");

ACLRoutes.get("/", async (req, res) =>
{
	try
	{
		const ability = await createReactAbility(req.query.username);
		res.json(ability);
	}
	catch (error)
	{
		logger.error("Error generating ACL", error, {
			username: req.query.username,
			operation: "createReactAbility"
		});
		res.status(400).json({ message: error.message });
	}
});

module.exports = ACLRoutes;
