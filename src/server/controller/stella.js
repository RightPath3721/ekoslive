const { create } = require("xmlbuilder2");
const { default: OpenAI } = require("openai");
const { openAIKey, openAIModel } = require("../config");
const logger = require("../logger");
const fs = require("fs");
const path = require("path");
const xml2js = require("xml2js");
const { default: axios } = require("axios");
const { get, isEmpty, clamp } = require("lodash");
const Readable = require("stream").Readable;
const PromptModel = require("../models/prompt");
const openai = new OpenAI({
	apiKey: openAIKey,
	dangerouslyAllowBrowser: true,
});

const SQ_FORMAT_VERSION = "2.6";

/**
 * Description placeholder
 *
 * @class StellaController
 * @typedef {StellaController}
 */
class StellaController
{
	/**
	 * Adjusts lists within a data object so that all lists have the same length.
	 * The length of all lists is set to the length of the longest list found.
	 * Lists are extended by repeating their first element.
	 * @param {object} data JSON document with extracted key:value pairs from OpenAI that specifies which settings the user want to apply.
	 * @returns {object} The modified data object with lists adjusted to have the same length.
	 */
	equalizeListLengths(data)
	{
		const maxLength = this.findMaxListLength(data);
		const ignore = ["Name", "ShutdownProcedure", "Steps"];

		function fillLists(item)
		{
			if (item !== null && typeof item === "object" && !Array.isArray(item))
			{
				for (const key in item)
				{
					if (ignore.includes(key)) continue;
					fillLists(item[key]); // Recursive call to process nested objects
				}
			}
			else if (Array.isArray(item) && item.length > 0)
			{
				const extensionLength = maxLength - item.length;
				if (extensionLength > 0)
				{
					const filler = new Array(extensionLength).fill(item[0]);
					item.push(...filler);
				}
			}
		}

		fillLists(data);
		return data;
	}

	/**
	 * Recursively finds the maximum length of any list (array) within the provided data object.
	 * The function ignores lists under the keys "Name", "ShutdownProcedure", and "Steps".
	 * @param {object} data The data object which may contain nested objects and arrays.
	 * @returns {number} The maximum length of any list found within the data object.
	 */
	findMaxListLength(data)
	{
		let maxLength = 1;
		const ignore = ["Name", "ShutdownProcedure", "Steps"];

		function recursiveFindMaxLength(item)
		{
			if (item !== null && typeof item === "object" && !Array.isArray(item))
			{
				for (const key in item)
				{
					if (ignore.includes(key)) continue;
					recursiveFindMaxLength(item[key]); // Recursive call for nested objects
				}
			}
			else if (Array.isArray(item) && item.length > maxLength)
			{
				maxLength = item.length;
			}
		}

		recursiveFindMaxLength(data);
		return maxLength;
	}

	/**
	 * Converts a fractional representation of a day to hours and minutes(hh:mm) format
	 * @param {number} fraction A number between 0 and 1 representing the fraction of the day.
	 * @param {boolean} [wrapToTomorrow=false] If true, forces the resulting time to be on the next day if it is earlier than the current time.
	 * @returns {string} A string representing the time in HH:MM format.
	 */
	fractionToHM = (fraction, wrapToTomorrow = false) =>
	{
		const now = Date.now();
		let fractionTime = new Date();
		fractionTime.setHours(0, 0, 0, 0);
		const value = fraction * 24 * 3600;
		fractionTime.setSeconds(fractionTime.getSeconds() + value);
		if (wrapToTomorrow && fractionTime < now)
			fractionTime.setDate(fractionTime.getDate() + 1);
		let h = fractionTime.getHours();
		if (h < 10) h = `0${h}`;
		let m = fractionTime.getMinutes();
		if (m < 10) m = `0${m}`;
		return `${h}:${m}`;
	};

	/**
	 * Generate a JSON document with extracted key:value pairs from OpenAI based on user settings.
	 * @param {string} message User prompt that specifies the settings to be applied.
	 * @param {Array} filterList List of available filters.
	 * @param {string} model The OpenAI GPT model name to be used for processing the request.
	 * @param {object} captureSettings Current default capture settings from Ekos.
	 * @returns {object} A JSON document with extracted key:value pairs from OpenAI that specifies which settings the user wants to apply.
	 */
	async getKey(message, filterList, model, captureSettings)
	{
		const guideDeviation_value = captureSettings.guideDeviation;
		const today = new Date();

		const key_data_extraction = [
			{
				type: "function",
				function: {
					name: "extract_kstar_info",
					description:
						"This textual instruction includes several jobs. Each job has configuration parameters for astronomical imaging. Extracts this all parameters. It parses key information such as image count, binning, filters, exposure times, and other relevant settings. For each parameter, if a specific value is not mentioned in the instruction set, the function will resort to predetermined default values. And the length of the list of all parameters should be same.",
					parameters: {
						type: "object",
						properties: {
							Name: {
								type: "string",
								description:
									"The name of the astronomical object to be captured. Astronomical objects can be stars, comets, asteroids, nebulae, galaxies, planets, clusters, supernovae and so on. Flat or calibration frames are not considered target names. Ensure you do not confuse filters or frames with the target name.",
							},
							RefocusOnTemperatureDelta: {
								type: "number",
								description:
									"Specifies when to refocus based on temperature changes",
							},

							GuideDeviation: {
								type: "number",
								description: "Specifies the limit of guiding Root Mean Square.",
							},
							GuideStartDeviation: {
								type: "number",
								description:
									"Abort sequence if guiding deviation exceed this value N consecutive times.",
							},
							HFRDeviation: {
								type: "number",
								description:
									"deviation or variation in the Half-Flux Radius (HFR) values of stars or other celestial objects in the captured image.",
							},
							HFRCheckThreshold: {
								type: "number",
								description:
									"threshold or criterion used in an algorithm to check the Half-Flux Radius (HFR) values. Specity the % to apply to the HFR Check value appropriate to the selected algorithm, to use as the threshold to perform the HFR check",
							},
							HFRCheckFrames: {
								type: "number",
								description:
									"number of frames or images that are used for checking or calculating the Half-Flux Radius (HFR) values",
								default: 4,
							},
							HFRCheckAlgorithm: {
								type: "number",
								description:
									"Algorithm or method used to check or calculate the Half-Flux Radius (HFR) values. 0 is for Last Autofocus, 1 is for Fixed, 2 is for Relative Measure. This should be a number.",
								enum: [0, 1, 2],
								default: 0,
							},
							RefocusEveryN: {
								type: "number",
								description:
									"Refocusing procedure that will be done per set seconds, for example refocus per 60 seconds",
							},
							RefocusOnMeridianFlip: {
								type: "number",
								description:
									"after performing a meridian flip, initiate the a refocusing procedure automatically",
							},
							FITSDirectory: {
								type: "string",
								description: "Base local capture directory",
							},
							RemoteDirectory: {
								type: "string",
								description:
									"When storing images on remote devices, specify the directory where captured images are saved to.",
							},
							UploadMode: {
								type: "number",
								description: `Select the upload mode. It should be number:
                                0 means Locally - Captured images are saved locally on disk in the directory specified above.
                                1 means Remotely - When connecting to a remote device, select this option to save images on the remote device only.
                                No images are uploaded to Ekos.
                                2 means Both - Captured images are saved on both the remote computer and on the local disk as well.`,
								enum: [0, 1, 2],
								default: 0,
							},
							PlaceholderFormat: {
								type: "string",
								description:
									"Format is used to define the image file names by the use of placeholder tags",
							},

							Exposure: {
								type: "array",
								items: {
									type: "number",
									description: "Defines exposure times in seconds per image",
								},
								description:
									"An array of exposures, each specified by a number",
							},
							Encoding: {
								type: "string",
								description:
									"Determines the image file format (e.g., FITS for CCDs).",
								enum: ["FITS", "Native", "XISF"],
							},
							Binning: {
								type: "object",
								properties: {
									X: {
										type: "array",
										items: {
											type: "number",
											description: "Specify horizontal (X) binning",
										},
										description:
											"An array of binning X, each specified by a number",
										default: [1],
									},
									Y: {
										type: "array",
										items: {
											type: "number",
											description: "Specify vertical (Y) binning.",
										},
										description:
											"An array of binning Y, each specified by a number",
										default: [1],
									},
								},
							},
							Frame: {
								type: "object",
								properties: {
									X: {
										type: "number",
										description:
											"Specify the left (X) of the desired CCD frame.",
										default: 0,
									},
									Y: {
										type: "number",
										description:
											"Specify the top (Y) of the desired CCD frame.",
										default: 0,
									},
									W: {
										type: "number",
										description:
											"Specify the width (W) of the desired CCD frame.",
										default: 1280,
									},
									H: {
										type: "number",
										description:
											"Specify the height (H) of the desired CCD frame.",
										default: 1024,
									},
								},
							},
							Count: {
								type: "array",
								items: {
									type: "number",
									description: "Number of images to capture for each job",
								},
								description: "An array of counts, each specified by a number",
							},
							Filter: {
								type: "array",
								items: {
									type: "string",
									description:
										"Specify desired filter.Options which can be Green, Red , Blue, HA, Hydrogen Alpha, SII, Sulfar Two, OIII, Oxygen three, LPR, Clear, and Luminance",
									enum: [
										"Red",
										"Green",
										"Blue",
										"HA",
										"SII",
										"OIII",
										"LPR",
										"Clear",
										"Luminance",
									],
								},
								description:
									"An array of filters, each specified by a string value. For example, 'Capture 5 frames each 30 seconds long using LRGB filters, followed by dark frames of the same duration', there are two frames Light and Dark, so in this case filters should be L, R, G, B, L, R, G, B.",
								default: ["R"],
							},
							Delay: {
								type: "array",
								items: {
									type: "number",
									description: "Delay in seconds between image captures.",
								},
								description:
									"An array of delays, each specified by a number value.",
								default: [0],
							},
							Type: {
								type: "array",
								items: {
									type: "string",
									enum: ["Light", "Bias", "Dark", "Flat", "DarkFlat"],
									description:
										"Specify the type of desired CCD frame. Options are Light, Dark, Bias, Flat, and DarkFlat frames. In general, Light frame is used. Don't confuse 'Dark Flat' frames with 'Dark' frames. For example, 'capture 5 RGB frames, followed by flats and dark flats', the frames should be Light, Flat, and DarkFlat.",
								},
								description:
									"An array of Types, each specified by a string value.",
							},

							GuideDitherPerJob: {
								type: "number",
								description: "dither per job every",
							},
							Temperature: {
								type: "number",
								description:
									"Toggle Cooler On/Off. Set the desired temperature, if your camera is equipped with a cooler. Check the option to force temperature setting before any capture. Capture process is only started after the measured temperature is within requested temperature tolerance. The default tolerance is 0.1 degrees Celsius but can be adjusted in Capture options under Ekos configuration.",
							},
							Properties: {
								type: "object",
								properties: {
									Gain: {
										type: "number",
										description:
											"Camera gain is a number depends on the camera sensor",
									},
									Offset: {
										type: "number",
										description: "The value of offset",
									},
								},
							},
							Calibration: {
								type: "object",
								properties: {
									Type: {
										type: "string",
										description:
											"Specify the duration of the flat field frame. The duration can be either manual or based on ADU calculations.The value can be only ADU or Manual",
										enum: ["ADU", "Manual"],
									},
									Value: {
										type: "number",
										description: "The value of ADU",
									},
									Tolerance: {
										type: "number",
										description:
											"Accept ADU values that fall within this range around the disired ADU target.",
									},
									SkyFlat: {
										type: "boolean",
										description:
											"When shooting flats on sky that can change intensity. Will use simpler exposure calculation.",
									},
								},
							},
							Steps: {
								type: "array",
								items: {
									type: "string",
									description:
										"a step which should be taken at the start of the job.",
									enum: ["Track", "Focus", "Align", "Guide"],
								},
								description:
									"An array of steps, each specified by a string value.",
							},
							MinimumAltitude: {
								type: "number",
								description: "The minimum altitude to capture the target",
							},
							MoonSeparation: {
								type: "number",
								description: "The minimum moon separation",
							},
							EnforceWeather: {
								type: "boolean",
								description: "Specific condition related with weather.",
								default: false,
							},
							EnforceTwilight: {
								type: "boolean",
								description:
									"Specific condition related with twilight. Schedule capturing only during astronomical twilight",
								default: false,
							},
							EnforceArtificialHorizon: {
								type: "boolean",
								description:
									"Specific condition related with artificialhorizon. When capturing the target, consider artificalhorizon or not. In other words, can capture above aritifical horizon in enabled status",
								default: false,
							},
							StartupConditionAt: {
								type: "string",
								description: `It is specified date and time to start the job. It should be in 'yyyy-mm-ddThh:mm:ss' dataTime format. Today is ${today}`,
							},
							StartupConditionASAP: {
								type: "boolean",
								description: `Start the observation job as soon as all the constraints, if any, are met.
                                The best candidate target shall be imaged first.`,
								default: false,
							},
							CompletionConditionSequence: {
								type: "boolean",
								description:
									"Specific completion condition for sequence. The observation job is completed when the sequence is complete",
								default: false,
							},
							CompletionConditionRepeat: {
								type: "number",
								description:
									"Specific completion condition to restart job until it is executed this many times",
							},
							CompletionConditionRepeatUntilterminated: {
								type: "boolean",
								description:
									"Specific completion condition to restart the sequence job indefinitely",
								default: false,
							},
							CompletionConditionRepeatUntil: {
								type: "string",
								description: `Terminate the job on the given date and time. It should be in 'yyyy-mm-ddThh:mm:ss' format, Today is ${today}`,
							},
							StartupProcedureUnparkDome: {
								type: "boolean",
								description:
									"Specific startup procedure to process of preparing the observatory dome for operation by reversing the park configuration",
								default: false,
							},
							StartupProcedureUnparkMount: {
								type: "boolean",
								description:
									"Specific startup procedure for releasing the telescope mount from its parked position",
								default: false,
							},
							StartupProcedureUnparkCap: {
								type: "boolean",
								description:
									"Specific startup procedure for removing or opening the telescope cap or cover",
								default: false,
							},
							ShutdownProcedureWarmCCD: {
								type: "boolean",
								description:
									"Specific shutdown procedure to process of turning off a CCD camera while keeping it powered and at a stable operating temperature",
								default: false,
							},
							ShutdownProcedureParkCap: {
								type: "boolean",
								description:
									"Specific shutdown procedure to process of placing or securing the telescope cap or cover in its designated position before shutting down the telescope",
								default: false,
							},
							ShutdownProcedureParkMount: {
								type: "boolean",
								description:
									"Specific shutdown procedure for moving the telescope mount to a predefined 'park' position",
								default: false,
							},
							ShutdownProcedureParkDome: {
								type: "boolean",
								description:
									"Specific shutdown procedure to process of positioning an observatory dome or enclosure in a specific 'park' configuration",
								default: false,
							},
						},
					},
				},
			},
		];

		try
		{
			const instruction = `You should only extract properties from user prompt. Don't generate it by yourself.
            For extract_kstar_info function tool, Here are some examples.
            For this task, 'Capture 5 frames each 30 seconds long using LRGB filters, followed by dark frames of the same duration'. Since there are 4 filters (L, R, G, B) and 2 types of frames (Light and DarkFlat), there will be a total of 8 jobs (4 x 2). The sequence of filters should be [L, R, G, B, L, R, G, B], the type of frames should be [Light, Light, Light, Light, DarkFlat, DarkFlat, DarkFlat, DarkFlat], and the counts should be [5, 5, 5, 5, 5, 5, 5, 5].
            For this task, 'Capture 5 RGB frames, followed by flats and dark flats'. Since there are 3 filters (R, G, B) and 3 types of frames (Light, Flat and DarkFlat), there will be a total of 9 jobs (3 x 3). The sequence of filters should be [R, G, B, R, G, B, R, G, B], the type of frames should be [Light, Light, Light, Flat, Flat, Flat, DarkFlat, DarkFlat, DarkFlat], and the counts should be [5,5,5,5,5,5,5,5,5].
            For this task, 'Capture 5 R frames each 10 seconds'. Since there is one filter (R) and one type of frames (Light), there will be one job (1 x 1). The sequence of filters should be [R], the type of frames should be [Light], and the counts should be [5].
            `;
			let custom_key_data = key_data_extraction;

			custom_key_data[0].function.parameters.properties.GuideDeviation.default =
				guideDeviation_value;
			custom_key_data[0].function.parameters.properties.Filter.items.enum =
				filterList;

			const response = await openai.chat.completions.create({
				model: model,
				messages: [
					{ role: "system", content: instruction },
					{ role: "user", content: message },
				],
				tools: custom_key_data,
				tool_choice: "auto",
			});

			let json_data = {};

			if (response.choices[0].message.tool_calls)
			{
				json_data = JSON.parse(
					response.choices[0].message.tool_calls[0].function.arguments,
				);
			}
			else
			{
				json_data = response.choices[0].message.content;
			}
			const result = this.equalizeListLengths(json_data);
			return result;
		}
		catch (error)
		{
			console.error(error);
			return null;
		}
	}

	/**
	 * Processes the given message using the OpenAI model to rewrite it for confirmation purposes.
	 * @param {string} message The user's original message that needs to be confirmed or rewritten.
	 * @param {string} model The OpenAI GPT model name to be used for processing the request.
	 * @returns {string} The rewritten confirmation message.
	 */
	async getConfirm(message, model, username)
	{
		try
		{
			// const response = await openai.chat.completions.create({
			// 	model: model,
			// 	messages: [
			// 		{
			// 			role: "system",
			// 			content:
			// 				"You are a helpful assistant to briefly rewrite the text. If there are multiple steps, then write each step on a separate line in an unordered list. If there a number followed immediately by C, then replace C with degrees Celsius. In general, the degree is altitude degree, not temperature.",
			// 		},
			// 		{ role: "user", content: `${message}` },
			// 	],
			// });

			// Get the latest 5 messages from mongodb
			// const prompts = await PromptModel.aggregate([
			// 	{ $match: { username } },
			// 	{
			// 		$sort: { createdAt: -1 },
			// 	},
			// 	{
			// 		$limit: 1,
			// 	},
			// ]);

			const messages = [
				{
					role: "system",
					content:
						"You are a helpful assistant tasked with briefly rewriting the current user prompt based on the chat history. If there are multiple steps, present each step on a separate line in an unordered list. Replace any number followed immediately by 'C' with 'degrees Celsius.' Generally, assume references to degrees pertain to altitude rather than temperature. Ignore any occurrence of 'Tap or Say Execute to proceed.' within the chat history.",
				},
				// ...prompts.flatMap((item) => [
				// 	{
				// 		role: "user",
				// 		content:
				// 			item.type == "request"
				// 				? item.response.replace("Tap or Say Execute to proceed.", "")
				// 				: "",
				// 	},
				// 	{
				// 		role: "assistant",
				// 		content: item.type == "request" ? item.response : "",
				// 	},
				// ]),
				{ role: "user", content: message },
			];

			const response = await openai.chat.completions.create({
				model: model,
				messages: messages,
			});

			const result =
				response.choices[0].message.content +
				"\n\nTap or Say Execute to proceed.";
			return result;
		}
		catch (error)
		{
			console.error(error);
			return error;
		}
	}

	/**
	 * Classifies the given user input as either "request" or "general" using the OpenAI model.
	 * @param {string} userInput The user's input that needs to be classified.
	 * @param {string} model The OpenAI GPT model name to be used for processing the request.
	 * @returns {string} "request" or "general" based on the classification.
	 */
	async classifyUserPrompt(userInput, model, username)
	{
		// Define the prompt that instructs the AI to classify the input
		const prompt = `
        Based on the chat history, please classify the current user prompt as either "request" or "general":
        
        Examples of requests:
        - "Capture 5 images. Ensure guide RMS does not exceed 3 arcsecs and refocus every 60 seconds"
        - "Capture 10 flat frames with ADU 25000 and tolerance 1000"
        - "Capture M 42 when it is 40 degrees above the horizon. Don't capture if weather is alert status"
        - "Acquire 10 x 15s light frames. Abort sequence if the guide deviation occurs more than 4 times"
		- Schedule Andromeda Galaxy using Track, Align, and Guide Steps
        
        Examples of general inputs:
        - "Find all nebula above 30 degrees."
        - "Can you help me?"
        - "Give me images with filter red"
        - "Tell me about astronomy"
        - "Every sunrise park my telescope"
        - "Park my telescope at specific time"
        - "Go and Solve M 31"
        - "Go to M 31"
        - "Delete Scheduler jobs"
        - "capture preview"

        Ensure the inputs that are related with parking telescope, going and solving, are general type inputs.
        
        User input: "${userInput}"
        Just answer "request" or "general".
        `;

		// Call the OpenAI API to get the classification
		try
		{
			// const prompts = await PromptModel.aggregate([
			// 	{ $match: { username } },
			// 	{
			// 		$sort: { createdAt: -1 },
			// 	},
			// 	{
			// 		$limit: 1,
			// 	},
			// ]);

			const messages = [
				{
					role: "system",
					content: prompt,
				},
				// ...prompts.flatMap((item) => [
				// 	{
				// 		role: "user",
				// 		content:
				// 			item.type == "request"
				// 				? item.response.replace("Tap or Say Execute to proceed.", "")
				// 				: "",
				// 	},
				// 	{
				// 		role: "assistant",
				// 		content: item.type == "request" ? item.response : "",
				// 	},
				// ]),
				{ role: "user", content: userInput },
			];

			const response = await openai.chat.completions.create({
				model: model,
				messages: messages,
				temperature: 0,
			});

			const classification = response.choices[0].message.content.trim();

			return classification;
		}
		catch (error)
		{
			console.error("Error classifying the user prompt:", error);
			return null;
		}
	}

	/**
	 * Creates a job element within a sequence queue based on given data and configuration values.
	 * @param {object} SequenceQueue The XML element where the job will be appended.
	 * @param {object} data The data object containing potential configuration values for the job.
	 * @param {number} number The index to access specific values within the data object arrays.
	 * @param {object} value Default current capture settings from Ekos.
	 */
	job(SequenceQueue, data, number, settings)
	{
		const Job = SequenceQueue.ele("Job");

		let defaultCalibrationType = "Manual";
		if ("captureCalibrationUseADU" in settings) defaultCalibrationType = "ADU";
		const calibrationType = get(
			data,
			"Calibration.Type",
			defaultCalibrationType,
		);

		// Frame Type
		// If a user say "Capture a frame for ...." without specifying a type
		// then they mean LIGHT frame. So default should always be light
		// and we should not use our default frame type from Ekos
		let frameType = get(data, `Type.[${number}]`, "Light");
		if (frameType === "DarkFlat") frameType = "Dark";

		// Exposure
		let exposure = get(data, `Exposure.[${number}]`, settings.captureExposureN);
		// Clamp Range
		// If we are capturing a flat frame with ADU, then we always set exposure to 1 seconds
		// Ekos can then start from that and iterate
		// For bias, make sure the exposure is minimal
		if (frameType == "Flat" && calibrationType == "ADU") exposure = 1;
		else if (frameType == "Bias" && exposure > 1) exposure = 0.000001;
		Job.ele("Exposure").txt(clamp(exposure, 0.000001, 3600));

		// Format
		let format = get(data, `Format.[${number}]`, settings.captureFormatS);
		// Take default format
		if (format === "--") format = settings.formatsList[0];
		Job.ele("Format").txt(format);

		// Encoding
		let encoding = get(data, "Encoding", settings.captureEncodingS);
		if (isEmpty(encoding)) encoding = "FITS";
		Job.ele("Encoding").txt(encoding);

		// Binning
		const Binning = Job.ele("Binning");
		const binX = get(data, `Binning.X.[${number}]`, settings.captureBinHN);
		const binY = get(data, `Binning.Y.[${number}]`, settings.captureBinVN);
		Binning.ele("X").txt(binX);
		Binning.ele("Y").txt(binY);

		// Frame
		const Frame = Job.ele("Frame");
		Frame.ele("X").txt(get(data, "Frame", get(settings, "captureFrameXN", 0)));
		Frame.ele("Y").txt(get(data, "Frame", get(settings, "captureFrameYN", 0)));
		Frame.ele("W").txt(
			get(data, "Frame", get(settings, "captureFrameWN", 1280)),
		);
		Frame.ele("H").txt(
			get(data, "Frame", get(settings, "captureFrameHN", 1024)),
		);

		// Temperature
		const Temperature = Job.ele("Temperature", {
			force: data.Temperature ? "true" : "false",
		});
		Temperature.txt(get(data, "Temperature", settings.cameraTemperatureN));

		// Filter
		const filter = get(data, `Filter[${number}]`, settings.FilterPosCombo);
		if (filter) {
			Job.ele("Filter").txt(filter);
		}

		// Frame Type
		Job.ele("Type").txt(frameType);

		// Count
		// N.B. Do no take default captureCountN from Ekos
		// Always assume 1 since the capture count there could be set to any value
		// but if the user does not specify a number, assume it is a single capture
		const count = get(data, `Count.[${number}]`, 1);
		Job.ele("Count").txt(count);

		// Delay
		const delay = get(data, "Delay", get(settings, "captureDelayN", 0));
		Job.ele("Delay").txt(delay);

		// Target Name
		if (!isEmpty(settings.targetNameT))
		{
			Job.ele("TargetName").txt(settings.targetNameT);
		}

		// Dither
		const guideDither = get(
			data,
			"GuideDitherPerJob",
			settings.guideDitherPerJobFrequency,
		);
		Job.ele("GuideDitherPerJob").txt(guideDither);

		// Save Directory
		const localDirectory = get(data, "FITSDirectory", settings.fileDirectoryT);
		Job.ele("FITSDirectory").txt(localDirectory);

		// Remote Directory
		const remoteDirectory = get(
			data,
			"RemoteDirectory",
			settings.fileRemoteDirT,
		);
		if (remoteDirectory) {
			Job.ele("RemoteDirectory").txt(remoteDirectory);
		}

		// Placeholder Format
		const placeholderFormat = get(
			data,
			"PlaceholderFormat",
			settings.placeholderFormatT,
		);
		Job.ele("PlaceholderFormat").txt(placeholderFormat);

		// Placeholder Suffix
		const placeholderSuffix = get(
			data,
			"PlaceholderSuffix",
			settings.formatSuffixN,
		);
		Job.ele("PlaceholderSuffix").txt(placeholderSuffix);

		// Uploade Mode
	        const uploadModeMap = { "Locally": 0, "Remotely": 1, "Both": 2 };
                const settingsMode = get(settings, "fileUploadModeS");
                const defaultMode = uploadModeMap[settingsMode] ?? 0;
                const uploadMode = get(data, "UploadMode", defaultMode);

		Job.ele("UploadMode").txt(uploadMode);

		// Calibration Steps

		// PreAction.
		// FIXME it should not be hardcoded to 1
		// e.g. Capture flat frames but make sure the mount is parked first. This would check Park Mount in calibration frame
		// And preAction value would be 5
		const Calibration = Job.ele("Calibration");
		Calibration.ele("PreAction").ele("Type").txt("1");

		// Flat Duration
		// Type
		const FlatDuration = Calibration.ele("FlatDuration", {
			dark: data?.Type?.[number] === "DarkFlat" ? "true" : "false",
		});
		FlatDuration.ele("Type").txt(calibrationType);

		const calibrationValue = get(
			data,
			"Calibration.Value",
			settings.captureCalibrationADUValue,
		);
		const calibrationTolerance = get(
			settings,
			"captureCalibrationADUTolerance",
			1000,
		);
		const calibrationSkyFlats = get(
			data,
			"Calibration.SkyFlat",
			settings.captureCalibrationSkyFlats,
		);

		// Flat duration settings
		if (calibrationType === "ADU")
		{
			FlatDuration.ele("Value").txt(calibrationValue);
			FlatDuration.ele("Tolerance").txt(calibrationTolerance);
			FlatDuration.ele("SkyFlat").txt(calibrationSkyFlats);
		}

		const Properties = Job.ele("Properties");
		if (data?.Properties?.Gain)
		{
			const PropertyVectorGain = Properties.ele("PropertyVector", {
				name: "CCD_GAIN",
			});
			PropertyVectorGain.ele("OneElement", { name: "GAIN" }).txt(
				data?.Properties.Gain || String(settings.captureGainN),
			);
		}
		if (data?.Properties?.Offset)
		{
			const PropertyVectorOffset = Properties.ele("PropertyVector", {
				name: "CCD_OFFSET",
			});
			PropertyVectorOffset.ele("OneElement", { name: "OFFSET" }).txt(
				data.Properties.Offset || String(settings.captureOffsetN),
			);
		}
	}

	/**
	 * Creates a sequence of jobs based on the provided data and configuration values, and returns the sequence as an XML string.
	 * @param {object} data The data object containing potential configuration values for the sequence.
	 * @param {object} value Default current capture settings from Ekos.
	 * @returns {string} An XML string representing the sequence of jobs
	 */
	makeSequence(data, settings)
	{
		if (isEmpty(settings)) return "";
		const job_count = this.findMaxListLength(data);
		const root = create({ version: "1.0", encoding: "UTF-8" }).ele(
			"SequenceQueue",
			{ version: SQ_FORMAT_VERSION },
		);

		root
			.ele("GuideDeviation", {
				enabled: data["GuideDeviation"]
					? "true"
					: String(settings.enforceGuideDeviation),
			})
			.txt(data["GuideDeviation"] || String(settings.guideDeviation));

		root
			.ele("GuideStartDeviation", {
				enabled: data["GuideStartDeviation"]
					? "true"
					: String(settings.enforceStartGuiderDrift),
			})
			.txt(data["GuideStartDeviation"] || String(settings.startGuideDeviation));

		const HFRCheck = root.ele("HFRCheck", {
			enabled:
				data["HFRDeviation"] ||
				data["HFRCheckAlgorithm"] ||
				data["HFRCheckThreshold"] ||
				data["HFRCheckFrames"]
					? "true"
					: String(settings.enforceAutofocusHFR),
		});
		HFRCheck.ele("HFRDeviation").txt(
			data["HFRDeviation"] || String(settings.hFRDeviation),
		);
		const hfrCheckAlgorithm = data["HFRCheckAlgorithm"] || String(settings.hFRCheckAlgorithm);

		HFRCheck.ele("HFRCheckAlgorithm").txt(
			{
				"Last Autofocus": "0",
				"Fixed": "1", 
				"Relative Measure": "2"
			}[hfrCheckAlgorithm] || hfrCheckAlgorithm
		);

		HFRCheck.ele("HFRCheckThreshold").txt(
			data["HFRCheckThreshold"] || String(settings.hFRThresholdPercentage),
		);
		HFRCheck.ele("HFRCheckFrames").txt(
			data["HFRCheckFrames"] || String(settings.inSequenceCheckFrames),
		);

		root
			.ele("RefocusOnTemperatureDelta", {
				enabled: data["RefocusOnTemperatureDelta"]
					? "true"
					: String(settings.enforceAutofocusOnTemperature),
			})
			.txt(
				data["RefocusOnTemperatureDelta"] ||
					String(settings.maxFocusTemperatureDelta),
			);

		root
			.ele("RefocusEveryN", {
				enabled: data["RefocusEveryN"]
					? "true"
					: String(settings.enforceRefocusEveryN),
			})
			.txt(data["RefocusEveryN"] || String(settings.refocusEveryN));

		root.ele("RefocusOnMeridianFlip", {
			enabled: data["RefocusOnMeridianFlip"]
				? "true"
				: String(settings.refocusAfterMeridianFlip),
		});

		for (let i = 0; i < job_count; i++)
		{
			this.job(root, data, i, settings);
		}

		const xmlStr = root.end({ prettyPrint: true });
		return xmlStr;
	}

	/**
	 * Creates a job element within a document for a scheduler based on the provided data and settings.
	 * @param {object} doc Scheduler List XML document
	 * @param {object} data JSON document with extracted key:value pairs from OpenAI that specifies which settings the user want to apply.
	 * @param {object} settings Default current scheduler settings from Ekos. We merged these settings with the data settings from OpenAI.
	 * OpenAI data settings have priority.
	 *
	 */
	async schedulerJob(doc, data, settings)
	{
		const targetName = data.Name;

		const target_info = await this.getObjectInfo(targetName);

		const job = doc.ele("Job");

		job.ele("Name").txt(target_info.name);

		job.ele("Group");

		const coordinates = job.ele("Coordinates");

		// Convert to hours
		const ra0 = parseFloat(target_info.ra0) / 15.0;
		// Keep as float
		const de0 = parseFloat(target_info.de0);

		coordinates.ele("J2000RA").txt(ra0);
		coordinates.ele("J2000DE").txt(de0);

		// TODO: This should be extracted from user query
		job.ele("PositionAngle").txt("-181");

		// Clear sequence as we will later set it
		job.ele("Sequence").txt("");

		// TODO: Needs to be simplified
		// Done
		const startupCondition = job.ele("StartupCondition");

		const startupConditionMappings = [
			{
				conditionKey: "StartupConditionASAP",
				check: () =>
					data["StartupConditionASAP"] ||
					(!data["StartupConditionAt"] && !settings.startupTimeConditionR),
				value: "ASAP",
			},
			{
				conditionKey: "StartupConditionAt",
				check: () =>
					data["StartupConditionAt"] ||
					(!data["StartupConditionASAP"] && settings.startupTimeConditionR),
				getAttributes: () => ({
					value: data["StartupConditionAt"] || settings.startupTimeEdit,
				}),
				value: "At",
			},
		];

		startupConditionMappings.forEach(
			({ check, getAttributes = () => ({}), value }) =>
			{
				if (check())
				{
					startupCondition.ele("Condition", getAttributes()).txt(value);
				}
			},
		);

		// TODO: Needs to be simplified
		// Done
		const constraints = job.ele("Constraints");

		const constraintMappings = [
			{
				key: "MinimumAltitude",
				settingKey: "schedulerAltitude",
				valueKey: "schedulerAltitudeValue",
			},
			{
				key: "MoonSeparation",
				settingKey: "schedulerMoonSeparation",
				valueKey: "schedulerMoonSeparationValue",
			},
			{ key: "EnforceWeather", settingKey: "schedulerWeather" },
			{ key: "EnforceTwilight", settingKey: "schedulerTwilight" },
			{ key: "EnforceArtificialHorizon", settingKey: "schedulerHorizon" },
		];

		constraintMappings.forEach(({ key, settingKey, valueKey }) =>
		{
			if (data[key] || settings[settingKey])
			{
				const constraint = constraints.ele("Constraint");
				if (valueKey)
				{
					constraint.att("value", data[key] || settings[valueKey]);
				}
				constraint.txt(key);
			}
		});

		const completionCondition = job.ele("CompletionCondition");

		const completionConditionMappings = [
			{
				check: () =>
					data["CompletionConditionSequence"] ||
					settings.schedulerCompleteSequences,
				value: "Sequence",
			},
			{
				check: () =>
					data["CompletionConditionRepeat"] ||
					settings.schedulerRepeatSequences,
				getAttributes: () => ({
					value:
						data["CompletionConditionRepeat"] ||
						settings.schedulerExecutionSequencesLimit,
				}),
				value: "Repeat",
			},
			{
				check: () =>
					data["CompletionConditionRepeatUntilterminated"] ||
					settings.schedulerUntilTerminated,
				value: "Loop",
			},
			{
				check: () =>
					data["CompletionConditionRepeatUntil"] || settings.schedulerUntil,
				getAttributes: () => ({
					value:
						data["CompletionConditionRepeatUntil"] ||
						settings.schedulerUntilValue,
				}),
			},
		];

		completionConditionMappings.forEach(
			({ check, getAttributes = () => ({}), value }) =>
			{
				if (check())
				{
					completionCondition
						.ele("Condition", getAttributes())
						.txt(value || "");
				}
			},
		);

		const steps = job.ele("Steps");
		let initialList = [];
		if (settings.schedulerTrackStep) initialList.push("Track");
		if (settings.schedulerFocusStep) initialList.push("Focus");
		if (settings.schedulerAlignStep) initialList.push("Align");
		if (settings.schedulerGuideStep) initialList.push("Guide");

		const stepList = data["Steps"] || initialList;

		for (const key of stepList)
		{
			steps.ele("Step").txt(key);
		}
	}

	/**
	 * Creates a scheduler XML document based on provided data and default settings merged with the data.
	 * OpenAI data settings have priority over the default settings from Ekos.
	 * @param {object} data JSON document with extracted key:value pairs from OpenAI that specifies which settings the user want to apply.
	 * @param {object} settings Default current scheduler settings from Ekos. We merged these settings with the data settings from OpenAI.
	 * OpenAI data settings have priority.
	 * @returns {string} The XML string representing the scheduler, or an empty string if the target name is not provided.
	 */
	async makeScheduler(data, settings)
	{
		// We must have scheduler settings and Target name
		if (isEmpty(settings) || isEmpty(data.Name)) return "";

		// Create the XML Document
		const doc = create({ version: "1.0", encoding: "UTF-8" }).ele(
			"SchedulerList",
			{ version: "1.6" },
		);

		await this.schedulerJob(doc, data, settings);

		const ErrorHandlingStrategy = doc.ele("ErrorHandlingStrategy", {
			value: "1",
		});
		ErrorHandlingStrategy.ele("delay").txt("0");

		const StartupProcedure = doc.ele("StartupProcedure");
		if (data["StartupProcedureUnparkDome"] || settings.schedulerUnparkDome)
		{
			StartupProcedure.ele("Procedure").txt("UnparkDome");
		}
		if (data["StartupProcedureUnparkMount"] || settings.schedulerUnparkMount)
		{
			StartupProcedure.ele("Procedure").txt("UnparkMount");
		}
		if (data["StartupProcedureUnparkCap"] || settings.schedulerOpenDustCover)
		{
			StartupProcedure.ele("Procedure").txt("UnparkCap");
		}
		const ShutdownProcedure = doc.ele("ShutdownProcedure");
		if (data["ShutdownProcedureWarmCCD"] || settings.schedulerWarmCCD)
		{
			ShutdownProcedure.ele("Procedure").txt("WarmCCD");
		}
		if (data["ShutdownProcedureParkCap"] || settings.schedulerCloseDustCover)
		{
			ShutdownProcedure.ele("Procedure").txt("ParkCap");
		}
		if (data["ShutdownProcedureParkMount"] || settings.schedulerParkMount)
		{
			ShutdownProcedure.ele("Procedure").txt("ParkMount");
		}
		if (data["ShutdownProcedureParkDome"] || settings.schedulerParkDome)
		{
			ShutdownProcedure.ele("Procedure").txt("ParkDome");
		}

		// const procedure_list = data.ShutdownProcedure || [""];
		// procedure_list.forEach((proc) =>
		// {
		//     ShutdownProcedure.ele("Procedure").txt(proc);
		// });

		const xmlStr = doc.end({ prettyPrint: true });
		return xmlStr;
	}

	/**
	 * Parses VOTable (XML format) content and extracts the first row of table data.
	 * @param {string} votContent The VOTable XML content as a string.
	 * @returns {object} An object containing the extracted Right Ascension (ra0) and Declination (de0).
	 */
	parseVOTable(votContent)
	{
		return new Promise((resolve, reject) =>
		{
			xml2js.parseString(votContent, (err, result) =>
			{
				if (err)
				{
					reject(err);
				}
				else
				{
					const tableData =
						result.VOTABLE.RESOURCE[0].TABLE[0].DATA[0].TABLEDATA[0].TR[0];
					const ra0 = tableData.TD[0];
					const de0 = tableData.TD[1];
					resolve({ ra0, de0 });
				}
			});
		});
	}

	/**
	 * Checks if a list of strings contains a specific name, case-insensitively.
	 * @param {Array<string>} list The list of strings to search through
	 * @param {string} name The name to search for in the list
	 * @returns {Boolean} Returns `true` if the list contains the name (case-insensitively), `false` otherwise.
	 */
	containsName(list, name)
	{
		return list.some((str) => str.toLowerCase() === name);
	}

	/**
	 * Retrieves information about an astronomical object using its name and designations
	 * @param {string} objectName The name of the astronomical object
	 * @returns {object} An object containing the primary name and coordinates(ra0, de0) of the object.
	 */
	async getObjectInfo(objectName)
	{
		if (!objectName) return null;
		try
		{
			const data = fs.readFileSync(
				path.resolve(__dirname, "./astro_designations.json"),
				"utf8",
			);
			const designations = JSON.parse(data);
			let name = objectName;

			const smallName = name.toLowerCase();
			let foundExactMatch = false;

			// Try to get primary object name if possible to align with KStars
			designations.forEach((oneDesignation) =>
			{
				if (this.containsName(oneDesignation.designations, smallName))
				{
					name = oneDesignation.primary;
					foundExactMatch = true;
				}
			});

			// Only try fuzzy matching if no exact match was found
			if (!foundExactMatch)
			{
				let bestMatch = null;
				let highestSimilarity = 0;

				designations.forEach((oneDesignation) =>
				{
					oneDesignation.designations.forEach((designation) =>
					{
						// Simple similarity score based on character matching
						const similarity = this.calculateSimilarity(
							smallName,
							designation.toLowerCase(),
						);
						if (similarity > highestSimilarity && similarity > 0.8)
						{
							// 80% similarity threshold
							highestSimilarity = similarity;
							bestMatch = oneDesignation.primary;
						}
					});
				});

				if (bestMatch)
				{
					name = bestMatch;
				}
			}

			// Convert Sh2 XXX format to Sh 2-XXX format
			const formattedName = name.match(/^Sh2\s+\d+$/) ? 
				name.replace(/^Sh2\s+(\d+)$/, 'Sh 2-$1') : name;

			const url = `https://simbad.cds.unistra.fr/simbad/sim-id?Ident=${formattedName}&output.format=VOTABLE&output.params=coo(d;ICRS;2000)`;
			// Next use SIMBAD to query for the object
			const response = await axios.get(url);
			const coords = await this.parseVOTable(response.data);
			return { name, ...coords };

		}
		catch (error)
		{
			logger.error("Error getting object info from SIMBAD", error, {
				objectName,
				formattedName: name.match(/^Sh2\s+\d+$/) ? 
					name.replace(/^Sh2\s+(\d+)$/, 'Sh 2-$1') : name
			});
			return null;
		}
	}

	/**
	 * Calculates a simple similarity score between two strings
	 * @param {string} str1 First string to compare
	 * @param {string} str2 Second string to compare
	 * @returns {number} Similarity score between 0 and 1
	 */
	calculateSimilarity(str1, str2)
	{
		const len1 = str1.length;
		const len2 = str2.length;
		const matrix = Array(len1 + 1)
			.fill()
			.map(() => Array(len2 + 1).fill(0));

		for (let i = 0; i <= len1; i++) matrix[i][0] = i;
		for (let j = 0; j <= len2; j++) matrix[0][j] = j;

		for (let i = 1; i <= len1; i++)
		{
			for (let j = 1; j <= len2; j++)
			{
				const cost = str1[i - 1] === str2[j - 1] ? 0 : 1;
				matrix[i][j] = Math.min(
					matrix[i - 1][j] + 1,
					matrix[i][j - 1] + 1,
					matrix[i - 1][j - 1] + cost,
				);
			}
		}

		const maxLen = Math.max(len1, len2);
		return (maxLen - matrix[len1][len2]) / maxLen;
	}

	/**
	 * Gets parameters for searching targets or filtering views
	 * @param {string} prompt The user prompt for searching targets or filering views
	 * @returns {object} An object containing `function_name` and `function_args` that will be used to search targets and filer views
	 */
	async functionRun(prompt)
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
						description: "minimum duration.",
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
					"maxFOV",
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
							"filter.Options can be Green, Red , Blue, HA, Hydrogen Alpha, SII, Sulfar Two, OIII, Oxygen three, LPR, Clear, and Luminance",
						enum: [
							"Red",
							"Green",
							"Blue",
							"HA",
							"SII",
							"OIII",
							"LPR",
							"Clear",
							"Luminance",
						],
					},
					frame: {
						type: "string",
						description:
							"Image frame type, could be either Light, Dark, Bias, Flat, or DarkFlat",
						enum: ["Light", "Bias", "Dark", "Flat"],
					},
					telescope: {
						type: "string",
						description: "telescope name used to capture the image",
					},
					object: {
						type: "string",
						description: "The target object",
					},
					temperature: {
						type: "number",
						description: "The limit temperature that image can be captured.",
					},
					gain: {
						type: "number",
						description: "The camera gain",
					},
					offset: {
						type: "number",
						description: "The camera offset",
					},
				},
				required: [],
			},
		};

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

		const response = await openai.chat.completions.create({
			model: model,
			messages: [
				{ role: "system", content: instructions },
				{ role: "user", content: prompt },
			],
			tools: tools,
			tool_choice: "auto",
		});

		if (response.choices[0].message.tool_calls)
		{
			const function_name =
				response.choices[0].message.tool_calls[0].function.name;
			const function_args = JSON.parse(
				response.choices[0].message.tool_calls[0].function.arguments,
			);
			let result = {
				function_name,
				function_args,
			};

			return result;
		}
		else
		{
			return response.choices[0].message.content;
		}
	}

	/**
	 * Processes the given prompt using the OpenAI model and returns either a general response or parameters for Ekos actions.
	 * @param {string} prompt - The user prompt for a general request or Ekos actions.
	 * @returns {string|object} A string containing the answer for general requests or an object containing the `function_name` and `function_args` for Ekos actions.
	 */
	async getGeneral(prompt, status)
	{
		const today = new Date();

		const model = openAIModel;
		const statusString = JSON.stringify(status);
		let instructions = `
		As you are an assistant, your name is Stella.
		You are a revolutionary new way to interact with StellarMate. 
		You leverage text, voice, and images to help users accomplish in seconds what used to take much longer before.
		You can capture frames using any number of parameters, and you can plan and schedule users' targets from observatory startup to shutdown.
		You can recognize objects in images, and you also understand the user's current environment.
		When you should generate date, please reference ${today}. And consider this status: ${statusString}`;

		const url = `http://localhost:8000/query?query=${prompt}`;
		let context = "";
		try
		{
			const result = await axios.get(url);
			context = result.data.map((item) => item.content).join("\n");
		}
		catch (error)
		{
			logger.error("Error fetching context data", error, {
				url,
				prompt: prompt?.substring(0, 100) // First 100 chars for context
			});
		}

		const template = context
			? `
			Following Context is data that user want to know about information of.
			If the user sends a greeting such as 'hi','hello' and 'good morning', don't make other answers, just send the user greeting and ask what you can help.
			Context: ${context}
			Question: ${prompt}
		`
			: prompt;

		const autoPark = {
			name: "autoPark",
			description: "Auto park telescope.",
			parameters: {
				type: "object",
				properties: {
					everyday: {
						type: "boolean",
						description: "This is to show everyday option.",
					},
					time: {
						type: "string",
						description: `This is for time to park telescope. It should be in 'hh:mm:ss' time format.`,
					},
					sunrise: {
						type: "boolean",
						description: "This is to show sunrise option.",
					},
					dawn: {
						type: "boolean",
						description: "This is to show dawn option.",
					},
				},
			},
		};
		const parkToggle = {
			name: "parkToggle",
			description: "Toggle park mount, dome or cap.",
			parameters: {
				type: "object",
				properties: {
					target: {
						type: "string",
						description:
							"This is the target to auto park or unpark. When user ask 'park or unpark my telescope', then the target should be mount",
						enum: ["mount", "dome", "cap"],
					},
					park: {
						type: "boolean",
						description:
							"This is to show park or unpark. true means park, and false means unpark",
					},
					abort: {
						type: "boolean",
						description: "This is to show abort option.",
					},
				},
				required: ["target"],
			},
		};

		const gotoAndSolve = {
			name: "gotoAndSolve",
			description: "Go to the specific target and solve plate.",
			parameters: {
				type: "object",
				properties: {
					target: {
						type: "string",
						description:
							"The name of the astronomical object to be captured. Astronomical objects can be stars, comets, asteroids, nebulae, galaxies, planets, clusters, supernovae and so on. Flat or calibration frames are not considered target names. Ensure you do not confuse filters or frames with the target name.",
					},
					solve: {
						type: "boolean",
						description: "This is to show solving plate option.",
					},
				},
				required: [],
			},
		};

		const scheduler = {
			name: "scheduler",
			description: "Scheduler Jobs",
			parameters: {
				type: "object",
				properties: {
					deleteJobs: {
						type: "boolean",
						description: "This is to show deleting scheduler jobs.",
					},
					start: {
						type: "boolean",
						description: "This is to show start option.",
					},
				},
			},
		};

		const capture = {
			name: "capture",
			description: "Capture image",
			parameters: {
				type: "object",
				properties: {
					preview: {
						type: "boolean",
						description: "This is for preview",
					},
				},
			},
		};

		// const liveStack = {
		//     "name": "liveStack",
		//     "description": "Live stacking",
		//     "parameters": {
		//         "type": "object",
		//         "properties": {
		//             "start": {
		//                 "type": "boolean",
		//                 "description": "This is for starting live stacking."
		//             }
		//         }
		//     }
		// }

		const profileToggle = {
			name: "profileToggle",
			description: "Profile",
			parameters: {
				type: "object",
				properties: {
					enabled: {
						type: "boolean",
						description:
							"This is to show start or stop profile. true means start, and false means stop",
					},
				},
			},
		};

		const tools = [
			{
				type: "function",
				function: parkToggle,
			},
			{
				type: "function",
				function: autoPark,
			},
			{
				type: "function",
				function: gotoAndSolve,
			},
			{
				type: "function",
				function: scheduler,
			},
			{
				type: "function",
				function: capture,
			},
			// {
			//     type: 'function',
			//     function: liveStack
			// },
			{
				type: "function",
				function: profileToggle,
			},
		];

		const response = await openai.chat.completions.create({
			model: model,
			messages: [
				{
					role: "system",
					content: `You are a helpful assistant in astromomy field. ${instructions}`,
				},
				{ role: "user", content: template },
			],
			tools: tools,
			tool_choice: "auto",
		});
		if (response.choices[0].message.tool_calls)
		{
			const function_name =
				response.choices[0].message.tool_calls[0].function.name;
			const function_args = JSON.parse(
				response.choices[0].message.tool_calls[0].function.arguments,
			);
			let result = {
				function_name,
				function_args,
			};

			return result;
		}
		else
		{
			return response.choices[0].message.content;
		}
	}

	/**
	 * Transcribes audio from an input file to text using the OpenAI speech-to-text model.
	 * @param {File|Blob|Buffer} file The audio file to be transcribed. This can be of type File, Blob, or Buffer
	 * @returns {string} The transcribed text.
	 */
	async speechToText(file)
	{
		const transcription = await openai.audio.transcriptions.create({
			file: file,
			model: "whisper-1",
		});

		return transcription.text;
	}

	/**
	 * Converts the given text to speech using the OpenAI text-to-speech model and returns the audio as a buffer.
	 * @param {string} text The text to be converted into speech
	 * @returns {Promise<Buffer>} A Buffer containing the speech audio in MP3 format.
	 */
	async textToSpeech(text)
	{
		try
		{
			const mp3 = await openai.audio.speech.create({
				// model: "tts-1",
				model: "gpt-4o-mini-tts",
				voice: "nova",
				input: text,
			});
			const buffer = Buffer.from(await mp3.arrayBuffer());
			return buffer;
		}
		catch (error)
		{
			console.error(error);
			throw error;
		}
	}

	/**
	 * Converts the given text to speech using the OpenAI text-to-speech model and returns a streaming response.
	 * @param {string} text The text to be converted into speech
	 * @returns {Promise<Response>} A streaming response containing the speech audio
	 */
	async textToSpeechStream(text)
	{
		try
		{
			const response = await openai.audio.speech.create({
				// model: "tts-1",
				model: "gpt-4o-mini-tts",
				voice: "nova",
				input: text,
				response_format: "mp3",
				speed: 1,
			});

			const readableStream = response.body;

			// Create a new stream that we'll return to the client
			const outputStream = new Readable();
			outputStream._read = () =>
			{};

			// Pipe the OpenAI stream to our output stream
			readableStream.on("data", (chunk) =>
			{
				outputStream.push(chunk);
			});

			readableStream.on("end", () =>
			{
				outputStream.push(null);
			});

			readableStream.on("error", (error) =>
			{
				console.error("Stream error:", error);
				outputStream.destroy(error);
			});

			return { body: outputStream };
		}
		catch (error)
		{
			console.error("Text-to-speech streaming error:", error);
			throw error;
		}
	}
}

module.exports = new StellaController();
