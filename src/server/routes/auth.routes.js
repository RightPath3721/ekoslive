const express = require("express");
const jwt = require("jsonwebtoken");
const _ = require("lodash");
const axios = require("axios");
const {
	secret,
	server,
	stellarmateWebsiteUrl,
	ekoslive_non,
	recaptcha_secret_key,
	cleantalk_api_key,
	smtp_host,
	smtp_port,
	smtp_user,
	smtp_pass,
	smtp_from_name,
	smtp_from_email,
	app_url,
	joomlaApiKey,
	ekoslive_key
} = require("../config");
const logger = require("../logger");
const authRoutes = express.Router();
const nodemailer = require("nodemailer");
const tokenVerifier = require("../auth/token-verifier");
const UserController = require("../controller/user");
const { generateEmailTemplate } = require('../utils/emailTemplates');

/**
 * Convenient function to return error to sender in case of request failure.
 * @param {*} res - Response object to be used to send the response.
 * @param {string} message - Error message.
 * @param {number} code - HTTP error code. Defaults to 400 for bad return.
 * @returns {void} Response object after setting the code and error response.
 */
let throwFailed = function (res, message, code = 400)
{
	return res.status(code).json({ success: false, message: message });
};

/**
 * Generate JWT token for 3 days that a user can use to login to ekoslive and connect to websocket server.
 * @param {string} username - Username.
 * @returns {string} - Signed JWT token valid for 3 days.
 */
let generateToken = function (username)
{
	return jwt.sign({ name: username }, secret, { expiresIn: "3d" });
};

/**
 * Primary route to authenticate a user to ekoslive.com
 * username and password are mandotary, while machine_id is optional and is submitted by Ekos clients
 * connecting to the server. An Ekos client represents an observatory that is uniquely defined by a machine ID.
 */
authRoutes.post("/authenticate", function (req, res)
{
	const username = req.body.username;
	const password = _.get(req.body, "password", "");
	const token = _.get(req.body, "token", "");
	const source = _.get(req.body, "source", "");
	const machine_id = _.get(req.body, "machine_id", "");
	const ip = req.header("x-forwarder-for");

	if (_.isUndefined(username) || _.isUndefined(password))
	{
		return throwFailed(res, "Authentication failed. User not found.", 401);
	}

	axios
		.post(`${stellarmateWebsiteUrl}jauth.php`, {
			username: username,
			password: password,
			token: token,
			source: source,
		})
		.then(async function (response)
		{
			if (response.data.result === true)
			{
				await UserController.loginUser(response.data.username, {
					ip,
					username: response.data.username,
					email: response.data.email,
					plan_id: response.data.plan_id,
				});
				return res.json({
					success: true,
					token: generateToken(username),
					username: response.data.username,
					email: response.data.email,
					from_date: response.data.from_date,
					to_date: response.data.to_date,
					plan_id: response.data.plan_id,
					user_id: response.data.user_id,
					type: server,
					subscription_id: response.data.subscription_id,
					machine_id,
				});
			}
			else
				return throwFailed(
					res,
					"Authentication failed! " + response.data.message,
					401,
				);
		})
		.catch(function (error)
		{
			logger.error("Authentication failed", error, {
				username,
				operation: "authenticate",
				source,
				hasMachineId: !!machine_id
			});
			return throwFailed(res, "Authentication failed! " + error, 401);
		});
});

/**
 *
 */
authRoutes.post("/register", async (req, res) =>
{
	const { email, password, name } = req.body;

	if (!name || !email || !password)
	{
		return throwFailed(res, "Missing required fields");
	}

	try
	{
		const cleanTalkResponse = await axios.post(
			"https://moderate.cleantalk.org/api2.0",
			{
				method_name: "check_message",
				auth_key: cleantalk_api_key,
				message: password,
				sender_email: email,
				sender_nickname: name,
				js_on: 1, // assuming JavaScript is enabled in the browser
				submit_time: 3, // time the form was filled in seconds
			},
		);

		if (cleanTalkResponse.data.allow == 0)
		{
			return throwFailed(res, "CleanTalk detected spam.");
		}

		const { data } = await axios.post(
			`${stellarmateWebsiteUrl}scripts/ekoslive_register.php`,
			{
				action: "check",
				email,
				ekoslive_non,
			},
		);

		if (!data.result)
		{
			return throwFailed(res, "Email already exists.");
		}

		const tokenPayload = { name, email, password };
		const emailToken = jwt.sign(tokenPayload, secret, { expiresIn: "1h" });
		const confirmationUrl = `${app_url}api/confirm_email?token=${emailToken}`;

		const transporter = nodemailer.createTransport({
			host: smtp_host,
			port: smtp_port,
			secure: false,
			auth: {
				user: smtp_user,
				pass: smtp_pass,
			},
		});

		await transporter.sendMail({
			from: {
				name: smtp_from_name,
				address: smtp_from_email,
			},
			to: email,
			subject: "Welcome to EkosLive! Please Confirm Your Email",
			text: `Hello ${name},

Thank you for registering your account at EkosLive. Please confirm your email address to activate your account by clicking the link below:
${confirmationUrl}

If you did not initiate this registration, please disregard this email.

Thank you!

Best Regards,
The EkosLive Team`,
			html: generateEmailTemplate(
				'Email Confirmation',
				name,
				'Thank you for registering your account at <b>EkosLive</b>. Please confirm your email address to activate your account by clicking the button below. This will help us ensure you have a seamless experience.',
				'Confirm Email Address',
				confirmationUrl,
				{
					footerText: 'If you did not initiate this registration, please disregard this email.',
					closingText: 'Thank you for joining EkosLive!'
				}
			)
		});

		res.status(201).json({
			success: true,
			message: "Please check your email to confirm your registration.",
		});
	}
	catch (error)
	{
		logger.error("Registration failed", error, {
			email,
			name,
			operation: "register",
			hasCleanTalkResponse: !!cleanTalkResponse
		});
		res.status(400).json({ error });
	}
});

/**
 * Confirm email.
 */
authRoutes.get("/confirm_email", async (req, res) =>
{
	const token = req.query.token;

	if (!token)
	{
		return throwFailed(res, "Missing token");
	}

	try
	{
		const decoded = jwt.verify(token, secret);
		const { name, email, password } = decoded;

		const { data } = await axios.post(
			`${stellarmateWebsiteUrl}scripts/ekoslive_register.php`,
			{
				action: "register",
				name,
				email,
				password,
				ekoslive_non,
			},
		);

		if (data.result)
		{
			try
			{
				// Add subscription using the correct URL format and parameters
				const subscriptionUrl = `${stellarmateWebsiteUrl}index.php?option=com_osmembership&task=api.add&api_key=${joomlaApiKey}&plan_id=1`;
				const subscriptionData = {
					email: email,
					source: "EkosLive"
				};

				await axios.post(subscriptionUrl, subscriptionData);

				// Perform authentication
				const authResponse = await axios.post(`${stellarmateWebsiteUrl}jauth.php`, {
					username: email,
					password: password
				});

				if (authResponse.data.result === true)
				{
					await UserController.loginUser(email, {
						ip: req.ip,
						username: email,
						email: email,
						plan_id: "1"
					});

					const token = generateToken(email);

					// Include user data in the URL as encoded parameters
					const userData = encodeURIComponent(JSON.stringify({
						username: email,
						password: password,
					}));

					// Set cookie and redirect with user data
					res.cookie('auth_token', token, {
						httpOnly: true,
						secure: true,
						sameSite: 'strict'
					});

					return res.redirect(`${app_url}?login=success&userData=${userData}`);
				}
			} catch (error)
			{
				logger.error("Subscription/auth error", error, {
					email,
					operation: "confirmEmail",
					step: "subscriptionOrAuth"
				});
			}
		}

		return res.redirect(`${app_url}?login=failed`);
	} catch (error)
	{
		return throwFailed(res, "Invalid or expired token: " + error.message);
	}
});

/**
 * @description Return user StellarMate registration information.
 * Including plan id, plan start and end date.
 * Licence and serial key
 * FIXME: Need to return an array since a user can have multiple StellarMate.
 */
authRoutes.post("/register_info", function (req, res)
{
	const username = req.body.username;
	const password = _.get(req.body, "password", "");
	const token = _.get(req.body, "token", "");
	const source = _.get(req.body, "source", "");

	if (_.isUndefined(username) || _.isUndefined(password))
	{
		return throwFailed(res, "Authentication failed. User not found.");
	}

	axios
		.post(`${stellarmateWebsiteUrl}jauth_reginfo.php`, {
			username: username,
			password: password,
			token: token,
			source: source,
		})
		.then(function (response)
		{
			if (response.data.result === true)
			{
				return res.json({
					success: true,
					username: response.data.username,
					serial: response.data.serial,
					license: response.data.license,
				});
			}
			else return throwFailed(res, response.data.message);
		})
		.catch(function (error)
		{
			logger.error("Registration info failed", error, {
				username,
				operation: "registerInfo",
				hasToken: !!token,
				source
			});
			return throwFailed(res, "Authentication failed! " + error, 401);
		});
});

authRoutes.get("/check-token", tokenVerifier, async (_, res) =>
{
	res.json({ success: true });
});

authRoutes.post("/change-password", async (req, res) =>
{
	const { email, currentPassword, newPassword } = req.body;

	try
	{
		const { data } = await axios.post(
			`${stellarmateWebsiteUrl}scripts/reset_password.php`,
			{
				key: ekoslive_key,
				email: email,
				current_password: currentPassword,
				new_password: newPassword,
			},
		);

		if (data.result)
		{
			res.json({ success: true, message: "Password updated successfully" });
		} else
		{
			return res.status(404).json({ success: false, message: "Password change failed: " + data.message });
		}
	} catch (error)
	{
		logger.error("Password change error", error, {
			email,
			operation: "changePassword"
		});
		return throwFailed(res, "Password change failed: " + error.message);
	}
});

module.exports = authRoutes;
