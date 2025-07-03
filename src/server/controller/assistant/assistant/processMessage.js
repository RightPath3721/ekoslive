const logger = require("../../../logger");
const AssistantController = require("../assistant");
const functionTools = require("./functionTools");
const { openAIModel } = require("../../../config");

const assistantId = process.env.ASSISTANT_ID;

const processMessage = async (prompt, objectsInImage = null) =>
{
	const today = new Date();
	// funtion tools
	const findTargetObjects = {
		name: "findTargetObjects",
		description:
			"find target objects with given minAlt, maxMagnitude, direction, minDuration, minFOV and objectTypes",
		parameters: {
			type: "object",
			properties: {
				minAlt: {
					type: "number",
					description:
						"minimum altitude. This value should be in degree unit. Convert unit to the degree. 1 hour is 15 degrees, 1 degree is 60 arcmins, and 1 arcmin is 60 arcsecs.",
					default: 15,
				},
				maxMagnitude: {
					type: "number",
					description: "maximum magnitude",
					default: 10,
				},
				direction: {
					type: "string",
					description: "direction",
					enum: ["North", "East", "South", "West", "All"],
					default: "All",
				},
				minDuration: {
					type: "number",
					description: "minimum duration",
					default: 1,
				},
				minFOV: {
					type: "number",
					description:
						"minimum FOV(Field of View). This value should be in arcmin unit. Convert unit to the arcmin. 1 hour is 15 degrees, 1 degree is 60 arcmins, and 1 arcmin is 60 arcsecs.",
					default: 5,
				},
				maxFOV: {
					type: "number",
					description:
						"maximum FOV(Field of View). This value should be in arcmin unit. Convert unit to the arcmin. 1 hour is 15 degrees, 1 degree is 60 arcmins, and 1 arcmin is 60 arcsecs.",
					default: 0,
				},
				objectType: {
					type: "string",
					description:
						"type of target objects. Ensure narrowband objects are emission nebula and perhaps planetary nebula, and broadband objects are galaxies, open clusters and globular clusters.",
					enum: [
						"Stars",
						"Planets",
						"Open Clusters",
						"Globular Clusters",
						"Gaseous Nebulae",
						"Planetary Nebulae",
						"Galaxies",
						"Comets",
						"Asteroids",
						"Supernovae",
					],
					default: "Galaxies",
				},
				night: {
					type: "boolean",
					description: "This is to show night option.",
					default: false,
				},
				time: {
					type: "string",
					description: `This is for time. It should be in 'yyyy-mm-ddThh:mm:ss' dataTime format. Today is ${today}`,
				},
				observable: {
					type: "boolean",
					description: "This is for observability.",
					default: false,
				},
			},
			required: [
				"minAlt",
				"maxMagnitude",
				"direction",
				"minDuration",
				"minFOV",
				"objectType",
			],
		},
	};

	const filterImages = {
		name: "filterImages",
		description: "filter images with given parameters.",
		parameters: {
			type: "object",
			properties: {
				airmass: {
					type: "object",
					properties: {
						min: {
							type: "number",
							description:
								"Minimum airmass amount of Earth's atmosphere an astronomical object passes through, affecting its observed brightness and color.",
						},
						max: {
							type: "number",
							description:
								"Maximum airmass amount of Earth's atmosphere an astronomical object passes through, affecting its observed brightness and color.",
						},
					},
				},
				binning: {
					type: "object",
					properties: {
						X: {
							type: "number",
							description: "Specify horizontal (X) binning",
							default: 1,
						},
						Y: {
							type: "number",
							description: "Specify vertical (Y) binning.",
							default: 1,
						},
					},
				},
				camera: {
					type: "string",
					description: "Camera name used to capture the image",
					default: "CCD Simulator",
				},
				date: {
					type: "string",
					description: `This is for date of image. It should be in 'yyyy-mm-ddThh:mm:ss' dataTime format. Today is ${today}`,
				},
				exposure: {
					type: "object",
					properties: {
						min: {
							type: "number",
							description: "Minimum exposure time in seconds per image",
						},
						max: {
							type: "number",
							description: "Maximum exposure time in seconds per image",
						},
					},
				},
				filename: {
					type: "string",
					description: "Name of the image file",
				},
				filter: {
					type: "string",
					description:
						"filter.Options can be Green, Red , Blue, H_Alpha, HA, SII, OIII, LPR and Luminance",
					enum: [
						"Red",
						"Green",
						"Blue",
						"HA",
						"SII",
						"OIII",
						"LPR",
						"Luminance",
						"Clear",
					],
				},
				frame: {
					type: "string",
					description:
						"Image frame type, could be either Light, Dark, Bias, Flat, or DarkFlat",
					enum: ["Light", "Bias", "Dark", "Flat"],
				},
				mount: {
					type: "string",
					description: "Mount name used to capture the image",
				},
				object: {
					type: "string",
					description: "The target object",
				},
				temperature: {
					type: "number",
					description: "The litmit temperature that image can be captured.",
				},
			},
			required: [],
		},
	};

	// Sequence and Scheduler

	const tools = [
		{
			type: "function",
			function: findTargetObjects,
		},
		{
			type: "function",
			function: filterImages,
		},
	];

	const model = openAIModel;
	let instructions = `When you should generate date, please reference ${today}`;

	if (objectsInImage)
	{
		let objectsInImageString = objectsInImage.join(",");
		instructions =
			instructions +
			`In uploaded image, there are objects like ${objectsInImageString}`;
	}

	let assistantController = new AssistantController();

	let assistant_instructions = "";
	let messages_items = [];
	let threadId;

	const getUniqueId = () =>
	{
		return (
			Math.random().toString(36).substring(2) +
			new Date().getTime().toString(36)
		);
	};

	const messageId = getUniqueId();

	const wait = (delay) =>
	{
		return new Promise((resolve) => setTimeout(resolve, delay));
	};
	try
	{
		// update assistant
		const assistant = await assistantController.updateAssistant({
			assistantId,
			model,
			instructions,
			tools,
		});
		// const assistant = await assistantController.getAssistant({ assistantId: assistantId })
		assistant_instructions = assistant.instructions;

		if (threadId)
		{
			const exist_thread = await assistantController.getThread({
				threadId: threadId,
			});

			logger.debug("get-thread", { exist_thread });

			if (exist_thread.error)
			{
				threadId = "";
			}
		}

		if (!threadId)
		{
			const new_thread = await assistantController.createTread();

			logger.debug("new-thread", { new_thread });

			threadId = new_thread.id;
		}

		const message = await assistantController.addMessage({
			threadId: threadId,
			message: prompt,
			messageId: messageId,
		});

		logger.debug("message", { message });

		const run = await assistantController.startRun({
			assistantId: assistantId,
			threadId: threadId,
			instructions: assistant_instructions,
		});

		logger.debug("run", { run });

		const run_id = run.id;

		let flagFinish = false;

		let MAX_COUNT = 2 * 600;
		let TIME_DELAY = 100;
		let count = 0;

		do
		{
			logger.debug(`Loop: ${count}`);
			const run_data = await assistantController.getRun({
				threadId: threadId,
				runId: run_id,
			});

			const status = run_data.status;
			if (status === "completed")
			{
				const messages = await assistantController.getMessages({
					threadId: threadId,
				});

				let new_messages = [];

				for (let i = 0; i < messages.length; i++)
				{
					if (
						Object.prototype.hasOwnProperty.call(messages[i].metadata, "id")
					)
					{
						if (messages[i].metadata.id === messageId)
						{
							break;
						}
					}
					else
					{
						new_messages.push(messages[i]);
					}
				}

				logger.debug("new-messages", { new_messages });

				messages_items = new_messages;

				flagFinish = true;
			}
			else if (status === "requires_action")
			{
				logger.debug("run-data", { run_data });

				const required_action = run_data.required_action;
				const required_tools = required_action.submit_tool_outputs.tool_calls;

				logger.debug("required-action", { required_action });
				logger.debug("required-tools", { required_tools });

				let tool_output_items = [];
				for (let rtool of required_tools)
				{
					const function_name = rtool.function.name;
					const tool_args = JSON.parse(rtool.function.arguments);

					logger.debug("Tool function call:", { function_name, tool_args });
					let tool_output = await functionTools(function_name, tool_args);

					tool_output_items.push({
						tool_call_id: rtool.id,
						output: JSON.stringify(tool_output),
					});
				}

				logger.debug("tool_output_items", { tool_output_items });

				const ret_tool = await assistantController.submitOutputs({
					threadId: threadId,
					runId: run_id,
					tool_outputs: tool_output_items,
				});

				logger.debug("ret-tool", { ret_tool });
			}
			else if (
				status === "expired" ||
				status === "cancelled" ||
				status === "failed"
			)
			{
				flagFinish = true;
			}
			if (!flagFinish)
			{
				count++;
				if (count >= MAX_COUNT)
				{
					flagFinish = true;
				}
				else
				{
					await wait(TIME_DELAY);
				}
			}
		} while (!flagFinish);
	}
	catch (error)
	{
		logger.error("Assistant processing error", error, {
			prompt: prompt?.substring(0, 100), // First 100 chars for context
			hasObjectsInImage: !!objectsInImage,
			assistantId
		});
	}

	return { threadId: threadId, messages: messages_items };
};

module.exports = processMessage;
