const express = require("express");
const axios = require("axios");
const authMiddleware = require("../middlewares/auth");
const logger = require("../logger/subscriptionLogger");
const generatePaypalBasicAuthString = require("../utils/generatePaypalBasicString");
const paypalRoutes = express.Router();
const { paypalBaseURL, paypalRedirectURL } = require("../config");

paypalRoutes.post("/create-subscription", authMiddleware, async (req, res) =>
{
	const { planId, user } = req.body;

	try
	{
		const subscriptionData = {
			plan_id: planId,
			subscriber: {
				email_address: user.email,
				name: {
					given_name: user.firstName,
					surname: user.lastName,
				},
			},
			application_context: {
				brand_name: "Ikarus Technologies Inc",
				locale: "en-US",
				user_action: "SUBSCRIBE_NOW",
				payment_method: {
					payer_selected: "PAYPAL",
					payee_preferred: "IMMEDIATE_PAYMENT_REQUIRED",
				},
				return_url: paypalRedirectURL,
				cancel_url: paypalRedirectURL,
			},
		};
		logger.info(
			`Trying to create a paypal record for user ${user.email} with plan id ${planId}`,
		);
		const { data } = await axios.post(
			`${paypalBaseURL}/v1/billing/subscriptions`,
			subscriptionData,
			{
				headers: {
					Authorization: `Basic ${generatePaypalBasicAuthString()}`,
					"Content-Type": "application/json",
				},
			},
		);
		res.json({ link: data.links[0].href });
	}
	catch (error)
	{
		res.status(400).json({ error: error.message });
	}
});

paypalRoutes.get(
	"/check-subscription/:subscriptionId",
	authMiddleware,
	async (req, res) =>
	{
		const { subscriptionId } = req.params;

		try
		{
			logger.info(`Check subscription status for id ${subscriptionId}`);
			const { data } = await axios.get(
				`${paypalBaseURL}/v1/billing/subscriptions/${subscriptionId}`,
				{
					headers: {
						Authorization: `Basic ${generatePaypalBasicAuthString()}`,
					},
				},
			);
			if (data.status !== "ACTIVE")
			{
				throw new Error(`Inactive subscription ${subscriptionId}`);
			}
			const { data: planInfo } = await axios.get(
				`${paypalBaseURL}/v1/billing/plans/${data.plan_id}`,
				{
					headers: {
						Authorization: `Basic ${generatePaypalBasicAuthString()}`,
					},
				},
			);
			res.status(200).json({ data: { ...data, plan_name: planInfo.name } });
		}
		catch (error)
		{
			logger.error("Error checking subscription", error, {
				operation: "checkSubscription",
				subscriptionId
			});
			res.status(400).json(error.message);
		}
	},
);

paypalRoutes.get(
	"/active-subscription/:subscriptionId",
	authMiddleware,
	async (req, res) =>
	{
		try
		{
			const { data } = await axios.get(
				`${paypalBaseURL}/v1/billing/subscriptions/${req.params.subscriptionId}`,
				{
					headers: {
						Authorization: `Basic ${generatePaypalBasicAuthString()}`,
					},
				},
			);
			res.status(200).json({ data });
		}
		catch (error)
		{
			res.status(400).json(error.message);
		}
	},
);

paypalRoutes.post(
	"/cancel/:subscriptionId",
	authMiddleware,
	async (req, res) =>
	{
		try
		{
			const { data } = await axios.post(
				`${paypalBaseURL}/v1/billing/subscriptions/${req.params.subscriptionId}/cancel`,
				{ reason: "User canceled subscription" },
				{
					headers: {
						Authorization: `Basic ${generatePaypalBasicAuthString()}`,
					},
				},
			);
			res.status(200).json(data);
		}
		catch (error)
		{
			res.status(400).json({ error: error.message });
		}
	},
);

paypalRoutes.post("/upgrade-subscription", authMiddleware, async (req, res) =>
{
	const { planId, user } = req.body;

	try
	{
		const subscriptionData = {
			plan_id: planId,
			subscriber: {
				email_address: user.email,
			},
			application_context: {
				brand_name: "Ikarus Technologies Inc",
				locale: "en-US",
				user_action: "SUBSCRIBE_NOW",
				payment_method: {
					payer_selected: "PAYPAL",
					payee_preferred: "IMMEDIATE_PAYMENT_REQUIRED",
				},
				return_url: paypalRedirectURL,
				cancel_url: paypalRedirectURL,
			},
		};

		const { data } = await axios.post(
			`${paypalBaseURL}/v1/billing/subscriptions`,
			subscriptionData,
			{
				headers: {
					Authorization: `Basic ${generatePaypalBasicAuthString()}`,
					"Content-Type": "application/json",
				},
			},
		);

		res.json({ link: data.links[0].href });
	}
	catch (error)
	{
		res.status(400).json({ error: error.message });
	}
});

module.exports = paypalRoutes;
