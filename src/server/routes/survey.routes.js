const express = require("express");
const authMiddleware = require("../middlewares/auth");
const SurveyController = require("../controller/survey");
const logger = require("../logger");

const SurveyRoutes = express.Router();

SurveyRoutes.get("/", authMiddleware, async (req, res) =>
{
	const { username } = req.query;

	try
	{
		const survey = await SurveyController.getSurvey(username);
		res.json(survey);
	}
	catch (error)
	{
		logger.error("Error getting survey", error, {
			username,
			operation: "getSurvey"
		});
		res.status(400).send({ message: error.message });
	}
});

SurveyRoutes.post("/", authMiddleware, async (req, res) =>
{
	const { username } = req.query;

	try
	{
		const survey = await SurveyController.createSurvey(req.body, username);
		res.json(survey);
	}
	catch (error)
	{
		logger.error("Error creating survey", error, {
			username,
			operation: "createSurvey"
		});
		res.status(400).send({ message: error.message });
	}
});

SurveyRoutes.put("/", authMiddleware, async (req, res) =>
{
	const { username } = req.query;

	try
	{
		const survey = await SurveyController.updateSurvey(req.body, username);
		res.json(survey);
	}
	catch (error)
	{
		logger.error("Error updating survey", error, {
			username,
			operation: "updateSurvey"
		});
		res.status(400).send({ message: error.message });
	}
});

SurveyRoutes.get("/check-status", authMiddleware, async (req, res) =>
{
	try
	{
		const { username } = req.query;

		const surveyStatus = await SurveyController.checkSurveyResult(username);

		res.status(200).json({ status: surveyStatus });
	}
	catch (error)
	{
		logger.error("Error checking survey status", error, {
			username,
			operation: "checkSurveyResult"
		});
		res.status(500).json({ message: error.message });
	}
});

module.exports = SurveyRoutes;
