const logger = require("../logger");
const ClientModel = require("../models/client");
const LicenseModel = require("../models/license");
const { token } = require("../config");
const crypto = require("crypto");
const axios = require("axios");

/**
 * Client controller for StellarMate admin authentication.
 *
 * IMPORTANT: This controller authenticates the admin account (username: 'jasem') that has
 * permission to generate licenses. The admin credentials are stored in Joomla's config
 * as api_user/api_pass and are used by generate_licence.php.
 *
 * IMPORTANT NOTE: The user creation code in jsm.php is unnecessary because:
 * 1. OS customers already have website accounts before purchase
 * 2. Pro Controller customers create accounts via register_user.php during mobile app registration
 * jsm.php should only update existing user records, not create new ones.
 *
 * There are two types of license generation flows:
 *
 * 1. StellarMate OS Customers:
 *    - Purchase OS from stellarmate.com
 *    - Already have an account on the website
 *    - License/serial generated after purchase
 *
 * 2. StellarMate Pro Controller Customers:
 *    - Purchase physical controller with pre-assigned serial number (in QR code)
 *    - Register through mobile app by scanning QR code
 *    - Create account during registration (username, password, email)
 *    - Account created via register_user.php
 */
class clientController
{
	/**
	 * Generates a license for a customer.
	 *
	 * Flow:
	 * 1. Authenticates the admin credentials (from Joomla config api_user/api_pass)
	 * 2. Sends customer info to jsm.php to update their account info (user creation code in jsm.php is unused)
	 * 3. Generates and stores the license
	 *
	 * Note: All customers MUST already have accounts either through:
	 * - Website registration (StellarMate OS customers)
	 * - Mobile app registration (Pro Controller customers)
	 *
	 * @param {Object} clientInfo Contains:
	 *   - username: Admin username from Joomla config (api_user)
	 *   - password: Admin password from Joomla config (api_pass)
	 *   - email: Customer's email (from existing account)
	 *   - name: Customer's name
	 *   - serial: Product serial number (generated for OS, pre-assigned for Controller)
	 */
	generate(clientInfo)
	{
		//const username = clientInfo.username.toLowerCase();
		const username = clientInfo.username;
		const password = clientInfo.password;
		const email = clientInfo.email;
		const serial = clientInfo.serial;
		const name = clientInfo.name;
		return new Promise(function (resolve, reject)
		{
			ClientModel.findOne({ username })
				.then((user) =>
				{
					if (user)
					{
						user
							.verifyPassword(password)
							.then((valid) =>
							{
								// const cipher = crypto.createCipher(config.cipher, config.token);
								// let encrypted = cipher.update(email, 'utf8', 'hex');
								// encrypted += cipher.final('hex');
								if (valid)
								{
									axios
										.post("https://stellarmate.com/scripts/jsm.php", {
											email,
											name,
											serial,
											client: username,
										})
										.then(function (response)
										{
											if (response.data.result === true)
											{
												let encrypted = crypto
													.createHmac("sha256", token)
													.update(response.data.username)
													.update(serial)
													.digest("hex");

												encrypted = encrypted
													.toUpperCase()
													.replace(/.{5}/g, "$&" + "-");

												LicenseModel.findOneAndUpdate(
													{ serial },
													{
														$set: {
															email,
															license: encrypted,
															client: username,
															serial,
															name,
															username: response.data.username,
															lastActivation: new Date(),
														},
														$inc: { activations: 1 },
													},
													{
														new: true,
														upsert: true,
													},
												)
													.then((license) =>
													{
														if (license)
															resolve({
																license: encrypted,
																username: response.data.username,
															});
													})
													.catch((err) =>
													{
														reject("Failed to generate license: " + err);
													});
											}
											else
												reject(
													"Registeration failed! " + response.data.message,
												);
										})
										.catch(function (error)
										{
											logger.error("Axios request to jsm.php failed during license generation", error, {
												username,
												email,
												serial
											});
											reject("Registeration failed! " + error);
										});
								}
								else reject("Invalid password");
							})
							.catch((err) =>
							{
								reject("Invalid password: " + err);
							});
					}
					else
						reject(
							"Failed to authenticate client. Wrong username or password.",
						);
				})
				.catch((err) =>
				{
					reject("Failed to authenticate client: " + err);
				});
		});
	}

	/**
	 * @deprecated This function is no longer used.
	 *
	 * Originally designed to add new reseller clients when the system supported multiple
	 * resellers generating licenses. Now the system only uses a single admin account,
	 * so this function is obsolete.
	 */
	add(clientInfo)
	{
		//const username = clientInfo.username.toLowerCase();
		const username = clientInfo.username;
		const password = clientInfo.password;
		const email = clientInfo.email;
		// auth by client token
		// if (config.client === undefined || clientInfo.client !== config.client)
		//     return Promise.reject();

		let newClient = new ClientModel({ username, password, email });
		return new Promise(function (resolve, reject)
		{
			newClient.save(function (err)
			{
				if (err) reject();

				resolve();
			});
		});
	}
}

module.exports = new clientController();
