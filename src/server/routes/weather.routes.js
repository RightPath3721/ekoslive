const express = require("express");
const authMiddleware = require("../middlewares/auth");
const { default: axios } = require("axios");
const logger = require("../logger");

const weatherRoutes = express.Router();

weatherRoutes.get("/bortle-sky", authMiddleware, async (req, res) =>
{
	const { latitude, longitude } = req.query;
	if (!latitude || !longitude)
	{
		return res.status(400).json({ message: "Missing required fields" });
	}

	const url = `https://clearoutside.com/forecast/${latitude}/${longitude}`;
	try
	{
		const { data } = await axios.get(url, { responseEncoding: "utf-8" });
		const regex = /<strong>Class (\d+)<\/strong> Bortle/g;
		const match = data.match(regex);

		if (!match?.[0])
		{
			return res.status(500).json({ error: "Can not get bortle sky" });
		}

		const bortleValueRegex = /Class (\d+)/;
		const bortleScalueValue = match[0].match(bortleValueRegex)?.[1];

		res.json(bortleScalueValue ?? null);
	}
	catch (error)
	{
		logger.error("Error fetching Bortle sky data", error, {
			operation: "getBortleSky",
			latitude,
			longitude
		});
		res.status(500).json({ message: error.message });
	}
});

module.exports = weatherRoutes;
