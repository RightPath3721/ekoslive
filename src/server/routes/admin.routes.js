const express = require("express");
const authMiddleware = require("../middlewares/auth");
const logger = require("../logger");
const UserController = require("../controller/user");
const EkosController = require("../controller/ekos");
const { wssMessageManager } = require("../websocket");
const commands = require("../../../StellarMateShared/shared/commands");

const AdminRoutes = express.Router();

const adminRoutesMiddleware = (action, subject) => async (req, res, next) =>
{
	if (!req.ability.can(action, subject))
	{
		return res.json({ result: false, error: "Forbidden" });
	}
	else
	{
		next();
	}
};

AdminRoutes.get(
	"/users",
	authMiddleware,
	adminRoutesMiddleware("read", "User"),
	async (req, res) =>
	{
		const {
			orderBy = "lastLogged",
			page = 0,
			search,
			sortDirection = "desc",
			limit = 10,
			connected,
		} = req.query;

		try
		{
			const users = await UserController.getUsersInfo({
				orderBy,
				page: +page,
				search,
				sortDirection,
				limit: +limit,
				connected,
			});
			res.json(users);
		}
		catch (error)
		{
			logger.error("Error reading users", error, {
				orderBy,
				page: +page,
				search,
				sortDirection,
				limit: +limit,
				connected
			});
			res.json({ result: false, error: error.message });
		}
	},
);

AdminRoutes.get(
	"/ekos",
	authMiddleware,
	adminRoutesMiddleware("read", "Ekos"),
	async (req, res) =>
	{
		const {
			orderBy = "lastLogged",
			page = 0,
			search,
			sortDirection = "desc",
			limit = 10,
			connected,
		} = req.query;

		try
		{
			const ekos = await EkosController.getEkosInfo({
				orderBy,
				page: +page,
				search,
				sortDirection,
				limit: +limit,
				connected,
			});
			res.json(ekos);
		}
		catch (error)
		{
			logger.error("Error reading ekos", error, {
				orderBy,
				page: +page,
				search,
				sortDirection,
				limit: +limit,
				connected
			});
			res.json({ result: false, error: error.message });
		}
	},
);

AdminRoutes.get(
	"/users/count",
	authMiddleware,
	adminRoutesMiddleware("read", "User"),
	async (req, res) =>
	{
		try
		{
			const usersCount = await UserController.getConnectedUsersCount();
			res.json(usersCount);
		}
		catch (error)
		{
			logger.error("Error getting users count", error, {
				operation: "getConnectedUsersCount"
			});
			res.status(400).json({ message: error.message });
		}
	},
);

AdminRoutes.get(
	"/ekos/count",
	authMiddleware,
	adminRoutesMiddleware("read", "Ekos"),
	async (req, res) =>
	{
		try
		{
			const ekosCount = await EkosController.getConnectedEkosCount();
			res.json(ekosCount);
		}
		catch (error)
		{
			logger.error("Error getting ekos count", error, {
				operation: "getConnectedEkosCount"
			});
			res.status(400).json({ message: error.message });
		}
	},
);

AdminRoutes.post(
	"/users/logout",
	authMiddleware,
	adminRoutesMiddleware("update", "User"),
	async (req, res) =>
	{
		const { username } = req.body;

		try
		{
			wssMessageManager.sendMessageByUsername(username, {
				type: commands.LOGOUT,
			});
			UserController.saveProperty(username, { connected: false });
			res.status(204).json();
		}
		catch (error)
		{
			logger.error("Error logging out user", error, {
				username,
				operation: "logout"
			});
			res.json({ result: false, error: error.message });
		}
	},
);

AdminRoutes.get(
	"/users/subscribers-count",
	authMiddleware,
	adminRoutesMiddleware("read", "User"),
	async (req, res) =>
	{
		try
		{
			const subscribersData = await UserController.getSubscribersCount();
			res.json(subscribersData);
		}
		catch (error)
		{
			logger.error("Error getting subscribers count", error, {
				operation: "getSubscribersCount"
			});
			res.status(400).json({ message: error.message });
		}
	},
);

module.exports = AdminRoutes;
