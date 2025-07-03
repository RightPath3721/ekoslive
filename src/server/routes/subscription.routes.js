const express = require("express");
const axios = require("axios");
const {
	joomlaApiKey,
	paypalBaseURL,
	stellarmateWebsiteUrl,
} = require("../config");
const authMiddleware = require("../middlewares/auth");
const subscriptionRoutes = express.Router();
const generatePaypalBasicAuthString = require("../utils/generatePaypalBasicString");
const logger = require("../logger/subscriptionLogger");
const UserController = require("../controller/user");

const createParamsFromData = (data) =>
{
	return Object.entries(data).reduce(
		(acc, item) =>
			item[1] || item[1] === 0 ? acc + `&${item[0]}=${item[1]}` : acc,
		"",
	);
};

subscriptionRoutes.post("/register", async (req, res) =>
{
	const { username, email, password } = req.body;
	if (!username || !email || !password)
		res.status(400).json({ message: "Missing required fields" });
	try
	{
		const url = `${stellarmateWebsiteUrl}index.php/?api_key=${joomlaApiKey}&option=com_osmembership&task=api.add&username=${encodeURIComponent(username)}&email=${email}&password=${password}&plan_id=1`;
		logger.info(
			`Create free plan for registered user ${username} with email: ${email}`,
		);
		const { data } = await axios.post(url);
		res.json({ data });
	}
	catch (error)
	{
		logger.error("Error registering user", error, {
			operation: "registerUser",
			username,
			email
		});
		res.status(500).json({ error });
	}
});

subscriptionRoutes.post("/renew", authMiddleware, async (req, res) =>
{
	const {
		user: { user_id, plan_id, email: defaultEmail },
		data,
	} = req.body;

	const values = { user_id, plan_id, email: defaultEmail, ...data };
	try
	{
		const params = createParamsFromData(values);
		const url = `${stellarmateWebsiteUrl}index.php?option=com_osmembership&task=api.update&api_key=${joomlaApiKey}${params}&id=11975`;
		const result = await axios.post(url);
		res.json({ data: result.data });
	}
	catch (error)
	{
		res.json({ error });
	}
});

subscriptionRoutes.post("/add", authMiddleware, async (req, res) =>
{
	const { data, plan_id, user } = req.body;

	try
	{
		const url = `${stellarmateWebsiteUrl}index.php?option=com_osmembership&task=api.add&api_key=${joomlaApiKey}&plan_id=${plan_id}&user_id=${user.user_id}`;
		const params = createParamsFromData({ ...data, source: "EkosLive" });
		const subscriptionData = {
			...data,
			email: user.email,
			user_id: user.user_id,
			source: "EkosLive",
		};
		logger.debug(
			`Trying to add a subscription with plan id ${plan_id} for ${user.email} with user id ${user.user_id}`,
		);
		const { data: response } = await axios.post(
			`${url}${params}`,
			subscriptionData,
		);
		logger.debug(
			`Successfully added subscription with plan id ${plan_id} for ${user.email}`,
		);
		await UserController.updateUserProperty(user.username, { plan_id });
		res.json({ data: response });
	}
	catch (error)
	{
		logger.error("Error adding subscription", error, {
			operation: "addSubscription",
			plan_id,
			username: user.username,
			user_id: user.user_id
		});
		res.json({ message: error });
	}
});

subscriptionRoutes.get(
	"/get-active-subscription",
	authMiddleware,
	async (req, res) =>
	{
		const { user_id } = req.query;

		try
		{
			const url = `${stellarmateWebsiteUrl}index.php?option=com_osmembership&task=api.get_user_active_subscriptions&api_key=${joomlaApiKey}&user_id=${user_id}`;
			const { data } = await axios.get(url);
			res.json({ data: data.data[0] });
		}
		catch (error)
		{
			logger.error("Error getting active subscription", error, {
				operation: "getActiveSubscription",
				user_id
			});
			res.status(400).json({ error });
		}
	},
);

subscriptionRoutes.get("/get-active-plans", async (_, res) =>
{
	try
	{
		const { data } = await axios.get(
			`${paypalBaseURL}/v1/billing/plans?page_size=10&page=1`,
			{
				headers: {
					Authorization: `Basic ${generatePaypalBasicAuthString()}`,
				},
			},
		);
		res
			.status(200)
			.json({ plans: data.plans.filter((plan) => plan.status === "ACTIVE") });
	}
	catch (error)
	{
		logger.error("Error getting active plans", error, {
			operation: "getActivePlans"
		});
		res.status(400).json({ error: error.message });
	}
});

subscriptionRoutes.post(
	"/update-subscription/:subscriptionId",
	authMiddleware,
	async (req, res) =>
	{
		const { subscriptionId } = req.params;
		const { data } = req.body;

		try
		{
			const params = createParamsFromData(data);
			const url = `${stellarmateWebsiteUrl}index.php?option=com_osmembership&task=api.update&api_key=${joomlaApiKey}&id=${subscriptionId}&plan_id=${data.plan_id}${params}`;
			const { data: result } = await axios.post(url, data);
			res.status(200).json(result);
		}
		catch (error)
		{
			res.status(400).json({ error: error.message });
		}
	},
);

module.exports = subscriptionRoutes;
