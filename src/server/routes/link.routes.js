const express = require("express");

const LinkSchema = require("../models/link");

const alphabets = "23456789bcdfghjkmnpqrstvwxyzBCDFGHJKLMNPQRSTVWXYZ-_",
	base = alphabets.length;

const linkRoutes = express.Router();

/**
 * Takes the code, decodes it, and searches
 * the database for the record to redirect user.
 * @param req - Link code as request parameter.
 * @param res - URL.
 */
linkRoutes.get("/:code", function (req, res)
{
	if (req.params.code)
	{
		const id = decode(req.params.code);

		// todo extend with query params to include other metadata
		const projection = { _id: false, url: true }; // only return URL in payload

		LinkSchema.findById(id, projection)
			.then((link) =>
			{
				if (link === null)
					return res.status(404).json({ message: "Resource Not Found" });

				//res.status(200).json(link);
				res.redirect(link.url);
			})
			.catch((err) =>
			{
				return res
					.status(500)
					.json({ message: "Internal Server Error", error: err });
			});
	}
});

/**
 * Taken from
 * https://github.com/delight-im/ShortURL/blob/master/JavaScript/ShortURL.js.
 * @param {string} code - Takes a short string and turns it into an ID.
 * @returns {string} ID in database.
 */
const decode = (code) =>
{
	let num = 0;
	for (let i = 0; i < code.length; i++)
	{
		num = num * base + alphabets.indexOf(code.charAt(i));
	}
	return num;
};

module.exports = linkRoutes;
