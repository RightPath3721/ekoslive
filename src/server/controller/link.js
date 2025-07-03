const logger = require("../logger");
const LinkSchema = require("../models/link");
const { server } = require("../config");
const alphabets = "23456789bcdfghjkmnpqrstvwxyzBCDFGHJKLMNPQRSTVWXYZ-_",
	base = alphabets.length;

/**
 * Saves the link to the database and returns a shortened one.
 * @param {string} url - Url to save in mongoDB.
 * @returns {Promise<string | void>} Promise with url of saved link or void in case of error.
 */
const saveUrl = (url) =>
{
	const link = new LinkSchema({ url });
	return link
		.save()
		.then((doc) =>
		{
			if (server === "local")
				return "http://localhost:5000/i/" + encode(doc._id);
			else return "https://" + server + ".stellarmate.com/i/" + encode(doc._id);
		})
		.catch((err) =>
		{
			logger.error("Failed to save URL", err, { url });
		});
};

/**
 * @description Taken from https://github.com/delight-im/ShortURL/blob/master/JavaScript/ShortURL.js.
 * @param {number} num - Number to encode.
 * @returns {string} Returns shortened code that maps to the database.
 */
const encode = (num) =>
{
	let code = "";
	while (num > 0)
	{
		code = alphabets.charAt(num % base) + code;
		num = Math.floor(num / base);
	}
	return code;
};

module.exports = {
	saveUrl,
};
