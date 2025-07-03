const express = require("express");
const logger = require("../logger");
const PromptExampleModel = require("../models/promptExample");
const PromptModel = require("../models/prompt");
const stellaController = require("../controller/stella");
const UserController = require("../controller/user");
const authMiddleware = require("../middlewares/auth");
const multer = require("multer");
const path = require("path");
const statusTransformer = require("../utils/statusTransformer");
const { Readable } = require("stream");
const { toFile } = require("openai");
const { openAIModel } = require("../config");

const storage = multer.memoryStorage();

const upload = multer({ storage: storage });

/**
 * Prompt examples that can be used to initialize a new MonogoDB instance
 * In case the database does not have any new.
 */
const prompt_examples = [
	{
		prompt:
			"Take 15 x 30 seconds exposures and refocus if the temperature exceeds 2 degrees",
	},
	{
		prompt:
			"Capture a flat frame with ADU 24000 then create dark flats for it.",
	},
	{
		prompt: "Take a 30-second 2x2 exposure for Altair using XISF format",
	},
	{
		prompt:
			"Capture 15 LRGB images each one is 60 seconds long. Make sure dithering is done every 2 frames. The cooler should be -20C.",
	},
	{
		prompt: "Create a 100 LRGB sequences each 10 seconds long",
	},
	{
		prompt: "Capture 20 calibration frames",
	},
	{
		prompt:
			"Take 50 1x1 Hydrogen Alpha images each 300 seconds long. Then 20 2x2 SII and 2x2 OIII frames each 180 seconds long. Dither every 5 frames.",
	},
	{
		prompt:
			"Capture 5 frames each 30 seconds long using LRGB filters, followed by dark frames of the same duration",
	},
	{
		prompt: "Capture 5 RB frames, followed by flats and dark flats",
	},
	{
		prompt:
			"Capture 5 frames each 30 seconds long using RGB filters, followed by dark frames of the same duration",
	},
	{
		prompt: "Capture 3 H-Alpha frames each 10 seconds",
	},
	{
		prompt:
			"Capture 20 frames and add a delay of 2 seconds before exposing the next frame",
	},
	{
		prompt:
			"Capture 100 60 seconds light frames. Adjust the focus of the camera after meridan flip",
	},
	{
		prompt: "Capture Carina Nebula during twilight and start asap",
	},
	{
		prompt:
			"Capture Bode's Galaxy when it is 40 degrees above horizon. Don't capture if weather is alert status",
	},
	{
		prompt:
			"Capture Southern Pinwheel Galaxy when it is 40 degrees above horizon",
	},
	{
		prompt: "Schedule Andromeda Galaxy using Track, Align, and Guide Steps",
	},
	{
		prompt: "Every day at 4:00 AM, park my telescope",
	},
	{
		prompt: "Abort my mount",
	},
	{
		prompt: "Unpark my mount",
	},
	{
		prompt: "Delete all scheduler jobs",
	},
	{
		prompt: "Start scheduler job",
	},
	{
		prompt: "Go and solve Andromeda Galaxy",
	},
	{
		prompt: "Capture a preview",
	},
	{
		prompt: "Go to Mars",
	},
	{
		prompt: "Start profile",
	},
	{
		prompt: "Stop profile",
	},
	{
		prompt: "Park dome",
	},
	{
		prompt: "Unpark dome",
	},
	{
		prompt: "Park dust cap",
	},
	{
		prompt: "Unpark my dust cap",
	},
	{
		prompt: "Is my mount parked?",
	},
	{
		prompt: "When is the mount going to flip?",
	},
	{
		prompt: "What is the total error in last plate solve?",
	},
];

const stellaRoutes = express.Router();

/**
 * Gets parameters of function_name and function_args.
 * These parameters will be used to search targets and filter views.
 */
stellaRoutes.post("/aiFilter", authMiddleware, async (req, res) =>
{
	const prompt = req.body.value;
	const response = await stellaController.functionRun(prompt);
	res.json(response);
});

/**
 * Ekos live can receive user prompts asking questions about astrophotography.
 * The questions are categorized into the following:
 * - General Request: General astronomy-related questions.
 * - Ekos Actions: Actions to be executed when ekos is online (e.g. Go to Mars)
 * - Ekos Requests: Requests to capture or schedule targets.
 */
stellaRoutes.post("/submit", authMiddleware, async (req, res) =>
{
	const { username } = req.query;
	const { prompt, promptId, source, status } = req.body;
	let response;

	try
	{
		const type = await stellaController.classifyUserPrompt(
			prompt,
			openAIModel,
			username,
		);

		if (type === "general")
		{
			const transformedStatus = statusTransformer(status);
			response = await stellaController.getGeneral(prompt, transformedStatus);
		}
		else
		{
			response = await stellaController.getConfirm(
				prompt,
				openAIModel,
				username,
			);
			await UserController.updateUserPromptsQuantity(username, { step: -1 });
		}

		// Check if this an action or a regular prompt response
		const isAction = [
			"parkToggle",
			"autoPark",
			"gotoAndSolve",
			"scheduler",
			"capture",
			"profileToggle",
		].includes(response.function_name);
		const tempResponse = isAction ? "Processing ..." : response;

		// Check if the action requires Ekos Profile to be running
		const ekosRunning = [
			"parkToggle",
			"autoPark",
			"gotoAndSolve",
			"capture",
		].includes(response.function_name);

		let savedPrompt;

		if (promptId) {
			savedPrompt = await PromptModel.findByIdAndUpdate(promptId, {
				response: tempResponse,
				prompt,
				ekosRunning,
				type,
				summary: tempResponse,
				source: source,
				executed: false,
			}, {new: true}); 
		}
		else {
			savedPrompt = await PromptModel.create({
				username,
				response: tempResponse,
				prompt,
				ekosRunning,
				type,
				summary: tempResponse,
				source: source,
				executed: false,
			});
		}

		if (!savedPrompt) {
			throw new Error('Failed to save prompt');
		}

		res.json({ success: true, response, prompt: savedPrompt });
	}
	catch (error)
	{
		logger.warn(error);
		res.json({ success: false, error });
	}
});

stellaRoutes.post("/test-request-prompt", async (req, res) =>
{
	const { prompt } = req.body;
	const filterList = [
		"Red",
		"Green",
		"Blue",
		"H_Alpha",
		"SII",
		"OIII",
		"LPR",
		"Luminance",
	];
	const captureSettings = {
		guideDeviation: 2,
	};
	try
	{
		const json_data = await stellaController.getKey(
			prompt,
			filterList,
			openAIModel,
			captureSettings,
		);

		res.json({ success: true, response: JSON.stringify(json_data) });
	}
	catch (error)
	{
		logger.warn(error);
		res.json({ success: false, error });
	}
});

//Supported file extensions

const SUPPORTED_EXTENSIONS = [
	".mp3",
	".mp4",
	".mpeg",
	".mpga",
	".m4a",
	".wav",
	".webm",
];

/**
 * Middleware to validate the file extension of an uploaded audio file.
 * @param {object} req - The Express request object.
 * @param {object} res - The Express response object.
 * @param {Function} next - The next middleware function in the stack.
 * @returns {void}
 */
const validateFileExtension = (req, res, next) =>
{
	const audioFile = req.file;
	if (!audioFile)
	{
		return res.status(400).json({ error: "No audio file uploaded" });
	}

	const extension = path.extname(audioFile.originalname).toLowerCase();
	if (!SUPPORTED_EXTENSIONS.includes(extension))
	{
		return res.status(400).json({
			error: `Unsupported file type: ${extension}. Supported types are: ${SUPPORTED_EXTENSIONS.join(", ")}`,
		});
	}

	next();
};

/**
 * Transcribes audio from an input file to text using the OpenAI speech-to-text model.
 */
stellaRoutes.post(
	"/speech_to_text",
	authMiddleware,
	upload.single("audio"),
	validateFileExtension,
	async (req, res) =>
	{
		const { buffer, originalname } = req.file;
		try
		{
			const convertedFile = await toFile(Readable.from(buffer), originalname);
			const response = await stellaController.speechToText(convertedFile);
			res.send(response);
		}
		catch (error)
		{
			res.status(500).send(error);
		}
	},
);

/**
 * Converts the given text to speech using the OpenAI text-to-speech model and returns the audio as a buffer.
 * @deprecated Use /text_to_speech/stream for better performance with streaming response
 */
stellaRoutes.get("/text_to_speech", authMiddleware, async (req, res) =>
{
	const { text } = req.query;
	try
	{
		const buffer = await stellaController.textToSpeech(text);
		res.type("mp3");
		res.send(buffer);
	}
	catch (error)
	{
		res.status(500).send(error);
	}
});

/**
 * Streams text-to-speech audio using the OpenAI text-to-speech model.
 * This endpoint provides better performance by streaming the audio directly to the client.
 * Accepts text in request body for handling longer texts.
 */
stellaRoutes.get(
	"/text_to_speech/stream",
	authMiddleware,
	async (req, res) =>
	{
		const { text } = req.query;
		if (!text)
		{
			return res
				.status(400)
				.json({ error: "Text is required in query parameters" });
		}
		try
		{
			const response = await stellaController.textToSpeechStream(text);
			res.setHeader("Content-Type", "audio/mpeg");
			if (response.body)
			{
				response.body.pipe(res);
			}
			else
			{
				// If response.body is not available, try using response directly
				response.pipe(res);
			}
		}
		catch (error)
		{
			console.error("Text-to-speech error:", error);
			res.status(500).json({
				error: "Text-to-speech failed",
				details: error.message,
			});
		}
	},
);

/**
 * Gets XML for sequence and scheduler.
 */
stellaRoutes.post("/get_xml", authMiddleware, async (req, res) =>
{
	const {
		value: prompt,
		id: promptId,
		sequence: captureSettings,
		scheduler: schedulerSettings,
		filter: filterList,
	} = req.body;
	const { username } = req.query;

	try
	{
		const json_data = await stellaController.getKey(
			prompt,
			filterList,
			openAIModel,
			captureSettings,
		);
		const sequence = stellaController.makeSequence(json_data, captureSettings);
		const scheduler = await stellaController.makeScheduler(
			json_data,
			schedulerSettings,
		);

		const ekosRunning = sequence && !scheduler;

		const updatedPrompt = await PromptModel.findByIdAndUpdate(
			promptId,
			{ sequence, scheduler, ekosRunning },
			{ new: true, fields: { _v: 0, username: 0, createdAt: 0, updatedAt: 0 } },
		);

		res.json({ success: true, prompt: updatedPrompt });
	}
	catch (error)
	{
		logger.warn(error);
		await UserController.updateUserPromptsQuantity(username, { step: 1 });
		res.json({ success: false, error: error.message });
	}
});

/**
 * Saves the result of the ekos actions.
 */
stellaRoutes.post("/save_result", authMiddleware, async (req, res) =>
{
	const response = req.body.value;
	const promptId = req.body.id;
	const username = req.query.username;

	try
	{
		let updatedPrompt;

		if (promptId)
		{
			// Update existing prompt
			updatedPrompt = await PromptModel.findByIdAndUpdate(
				promptId,
				{ response },
				{
					new: true,
					fields: { __v: 0, username: 0, createdAt: 0, updatedAt: 0 },
				},
			);
		}
		else
		{
			// Create new prompt
			const newPrompt = new PromptModel({ response });
			updatedPrompt = await newPrompt.save();
		}

		res.json({ success: true, prompt: updatedPrompt });
	}
	catch (error)
	{
		logger.warn(error);
		// Update the quantity of remaining prompts if an error occurs during xml generation
		await UserController.updateUserPromptsQuantity(username, { step: 1 });
		res.json({ success: false, error });
	}
});

/**
 * Posts feedback for each prompt and answer.
 */
stellaRoutes.post("/feedback", authMiddleware, async (req, res) =>
{
	const promptId = req.body.id;
	const feedback = req.body.feedback;

	try
	{
		const updatedPrompt = await PromptModel.findByIdAndUpdate(
			promptId,
			{ feedback: feedback },
			{ new: true, fields: { _v: 0, username: 0, updatedAt: 0 } },
		);

		res.json({ success: true, prompt: updatedPrompt });
	}
	catch (error)
	{
		res.json({ success: false, error });
	}
});

stellaRoutes.get("/executed/:id", authMiddleware, async (req, res) =>
{
	const id = req.params.id;
	try
	{
		const prompt = await PromptModel.findByIdAndUpdate(id, { executed: true });

		if (!prompt)
		{
			return res
				.status(404)
				.json({ success: false, message: "Prompt not found" });
		}

		res.json({ success: true, prompt });
	}
	catch (error)
	{
		res.json({ success: false, error });
	}
});

/**
 * Gets prompt by using id.
 */
stellaRoutes.get("/prompts/:id", authMiddleware, async (req, res) =>
{
	const id = req.params.id;
	try
	{
		const prompt = await PromptModel.findById(id);

		res.json({ success: true, prompt });
	}
	catch (error)
	{
		res.json({ success: false, error });
	}
});

/**
 * Gets all Prompts.
 */
stellaRoutes.get("/prompts", authMiddleware, async (req, res) =>
{
	const username = req.query.username;
	const page = req.query.page;

	try
	{
		const prompts = await PromptModel.aggregate([
			{ $match: { username } },
			{
				$redact: {
					$cond: {
						if: {
							$or: [{ $eq: ["$username", username] }],
						},
						then: "$$KEEP",
						else: "$$PRUNE",
					},
				},
			},
			{
				$sort: { _id: -1 },
			},
			{
				$skip: page * 5,
			},
			{
				$limit: 5,
			},
		]);

		res.json({ success: true, prompts: prompts.reverse() });
	}
	catch (error)
	{
		logger.warn(error);
		res.json({ success: false, error });
	}
});

/**
 * Deletes all Prompts.
 */
stellaRoutes.delete("/prompts", authMiddleware, async (req, res) =>
{
	const username = req.query.username;

	try
	{
		await PromptModel.deleteMany({ username });

		res.json({ success: true });
	}
	catch (error)
	{
		logger.warn(error);
		res.json({ success: false, error });
	}
});

/**
 * Return 3 random example prompts from the database.
 * If database has no prompts, then insert the prompt_examples into the database.
 */
stellaRoutes.get("/prompt/examples", authMiddleware, async (_, res) =>
{
	try
	{
		const prompts = await PromptExampleModel.aggregate([
			{ $sample: { size: 3 } },
		]);
		const totalPrompts = await PromptExampleModel.countDocuments();
		if (totalPrompts < prompt_examples.length)
		{
			await PromptExampleModel.deleteMany({});
			await PromptExampleModel.insertMany(prompt_examples);
		}
		else
		{
			await PromptExampleModel.findOneAndUpdate(
				{
					prompt:
						"Capture 20 calibration frames (This creates 20 images bias + dark + flat jobs)",
				},
				{ prompt: "Capture 20 calibration frames" },
			);
		}
		res.json({
			prompts: prompts.length === 0 ? prompt_examples.slice(0, 3) : prompts,
		});
	}
	catch (error)
	{
		logger.warn(error);
		res.json({ success: false });
	}
});

/**
 * Refresh user prompts.
 */
stellaRoutes.post("/refresh-user-prompts", authMiddleware, async (req, res) =>
{
	const { username } = req.query;
	const { planId } = req.body;

	try
	{
		const promptsLeft = await UserController.updateUserPromptsQuantity(
			username,
			{
				promptsQuantity:
					planId === "2" ? 10 : planId === "1" || planId === "4" ? 100 : 99999,
				planId,
			},
		);
		res.json({ promptsLeft });
	}
	catch (error)
	{
		logger.error("Error refreshing user prompts", error, {
			username,
			operation: "refreshUserPrompts",
			planId
		});
		res.status(400).json({ error: error.message });
	}
});

/**
 * Gets all Feedbacks to review.
 */
stellaRoutes.get("/feedback", authMiddleware, async (req, res) =>
{
	const {
		orderBy = "creadetAt",
		page = 0,
		search,
		sortDirection = "desc",
	} = req.query;

	try
	{
		if (!req.ability.can("read", "Prompt"))
		{
			return res.json({ result: false, error: "Forbidden" });
		}
		const aggregatePipeline = [
			{ $sort: { [orderBy]: sortDirection === "desc" ? -1 : 1 } },
			{ $skip: +page * 10 },
			{ $limit: 10 },
		];
		const countPipeline = [];

		if (search)
		{
			const regex = new RegExp(search, "i");
			const matchStage = {
				$match: { $or: [{ username: regex }, { email: regex }] },
			};
			aggregatePipeline.unshift(matchStage);
			countPipeline.unshift(matchStage);
		}
		const feedback = await PromptModel.aggregate([
			{
				$facet: {
					filtered_data: aggregatePipeline,
					total_count: [...countPipeline, { $count: "totalCount" }],
				},
			},
		]);

		res.json({
			feedback: feedback[0].filtered_data,
			count: feedback[0].total_count[0].totalCount,
			result: true,
		});
	}
	catch (error)
	{
		logger.error("Error getting feedback", error, {
			operation: "getFeedback",
			orderBy,
			page,
			search,
			sortDirection
		});
		res.json({ result: false, error: error.message });
	}
});

module.exports = stellaRoutes;
