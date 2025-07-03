const express = require("express");
const _ = require("lodash");
const axios = require("axios");
const crypto = require("crypto");
const licenseRoutes = express.Router();
const clientController = require("../controller/client");
const registerController = require("../controller/register");
const logger = require("../logger");
const { server } = require("../config");

/**
 * License generation and registration routes.
 *
 * This module handles operations for two types of customers:
 *
 * 1. StellarMate OS Customers:
 *    - Purchase OS from stellarmate.com
 *    - Already have website account
 *    - License/serial generated via /generate endpoint after purchase
 *
 * 2. StellarMate Pro Controller Customers:
 *    - Buy physical controller with pre-assigned serial (QR code)
 *    - Register via mobile app's QR code scanner
 *    - Create account during registration
 *    - Use /register endpoint to activate their device
 */

// Auth error handling
let throwFailed = function (res, message)
{
	logger.warn(message);
	return res.json({ success: false, message: message });
};

/**
 * License Generation Endpoint
 *
 * Called by generate_licence.php after OS purchase on stellarmate.com.
 *
 * Flow:
 * 1. Receives admin credentials (api_user/api_pass from Joomla config)
 * 2. Validates admin access (single 'jasem' account in ClientModel)
 * 3. Updates customer info via jsm.php (user creation code is unnecessary since customer
 *    MUST already have an account from website registration)
 * 4. Generates and stores license in LicenseModel
 */
licenseRoutes.post("/generate", function (req, res)
{
	const username = req.body.username;
	const password = req.body.password;
	const email = req.body.email;
	const name = req.body.name;
	const serial = req.body.serial;

	if (server === "offline")
	{
		return throwFailed(res, "Authentication failed.");
	}

	if (_.isUndefined(username) || _.isUndefined(password))
	{
		return throwFailed(res, "Authentication failed. User not found.");
	}

	if (_.isUndefined(email) || _.isUndefined(name) || _.isUndefined(serial))
	{
		return throwFailed(
			res,
			"Missing info. Customer name, email, and serial number are required.",
		);
	}

	const clientInfo = { username, name, serial, password, email };
	clientController
		.generate(clientInfo)
		.then((result) =>
		{
			return res.json({
				success: true,
				email,
				username: result["username"],
				license: result["license"],
			});
		})
		.catch((err) =>
		{
			return throwFailed(res, "Generating license failed! " + err);
		});
});

/**
 * License Registration Endpoint
 *
 * Called by the mobile app when registering a Pro Controller.
 *
 * Flow:
 * 1. User scans controller's QR code (contains serial number)
 * 2. User creates account via mobile app
 * 3. App calls /register endpoint with:
 *    - User credentials (from registration)
 *    - Serial number (from QR code)
 *    - Device ID
 * 4. Validates credentials via jauth.php
 * 5. Verifies license signature
 * 6. Logs the device registration
 */
licenseRoutes.post("/register", function (req, res)
{
	const username = req.body.username;
	const password = req.body.password;
	const serial = req.body.serial;
	const license = req.body.license;
	const ip = req.body.email;
	const deviceid = req.body.deviceid;

	if (server === "offline")
	{
		return res.json({ result: false, message: "Registeration disabled." });
	}

	if (
		_.isUndefined(username) ||
		_.isUndefined(password) ||
		_.isUndefined(deviceid) ||
		username === "" ||
		password === ""
	)
	{
		return res.json({ result: false, message: "Missing information." });
	}

	axios
		.post("https://stellarmate.com/scripts/jauth.php", {
			username: username,
			password: password,
		})
		.then(function (response)
		{
			if (response.data.result === true)
			{
				// Make sure license is valid
				const encrypted = crypto
					.createHmac("sha256", response.data.token)
					.update(username)
					.update(serial)
					.digest("hex");

				let encrypted_license = encrypted
					.toUpperCase()
					.replace(/.{5}/g, "$&" + "-");
				if (encrypted_license !== license)
				{
					return res.json({
						result: false,
						message: "Invalid or expired license.",
					});
				}

				registerController.log({ username, serial, license, deviceid, ip });

				return res.json({
					result: true,
					username: username,
					email: response.data.email,
					from_date: response.data.from_date,
					to_date: response.data.to_date,
					plan_id: response.data.plan_id,
					type: 2,
				});
			}
			else
				return res.json({
					result: false,
					message: "Authentication failed! " + response.data.message,
				});
		})
		.catch(function (error)
		{
			return res.json({
				result: false,
				message: "Authentication failed! " + error,
			});
		});
});

module.exports = licenseRoutes;
