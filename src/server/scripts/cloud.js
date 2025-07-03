const sharp = require("sharp");
const path = require("path");
const fs = require("fs"); // Use the promises API of fs
const { default: axios } = require("axios");
const logger = require("../logger");

const DocumentsPath = "/var/www/tiles/";
const ZOOM_LEVELS = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

const ensureDirectoryExists = (filePath) =>
{
	const dir = path.dirname(filePath);
	if (!fs.existsSync(dir))
	{
		fs.mkdirSync(dir, { recursive: true });
	}
};

/**
 * Converts a Base64 image to WebP and saves it to the specified path.
 * @param base64String - String to convert to webp.
 * @param outputPath - Destination path.
 */
const convertBase64ToWebp = async (base64String, outputPath) =>
{
	try
	{
		const base64Data = base64String.replace(/^data:image\/\w+;base64,/, "");
		const buffer = Buffer.from(base64Data, "base64");
		ensureDirectoryExists(outputPath);
		await sharp(buffer).webp().toFile(outputPath);
	}
	catch (error)
	{
		logger.error("Error converting Base64 to WebP", error, {
			operation: "convertBase64ToWebp",
			outputPath
		});
	}
};

/**
 * @param {{x:number,y:number,z:number,username:string}} data - Object with coordinates of tile and username.
 * @returns {Buffer} Base64 buffer fetched from online if successful, or throws an error on failure.
 */
const fetchCloudsTile = async ({ x, y, z }) =>
{
	const maxRetries = 3;
	let attempt = 0;
	let success = false;
	let response = null;

	// Function to add a delay between retries
	const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

	while (attempt < maxRetries && !success)
	{
		try
		{
			attempt++;
			response = await axios.get(
				`https://tile.openweathermap.org/map/clouds_new/${z}/${x}/${y}.png?appid=b827f892b32d0f93e3511027bae60f27`,
				{
					responseType: "arraybuffer",
					headers: {
						"User-Agent": "Application/Stellarmate",
						"Content-Type": "application/json",
					},
					timeout: 10000, // Timeout for the request
				},
			);
			return Buffer.from(response.data, "binary").toString("base64");
		}
		catch (error)
		{
			// Check if the error is related to the fetch operation (network, timeout, etc.)
			if (error.code === "ECONNABORTED" || error.response === undefined)
			{
				// These are network errors or timeouts, retry
				logger.error("Failed to fetch cloud tile (network error or timeout)", error, {
					operation: "fetchCloudsTile",
					attempt,
					x,
					y,
					z,
					errorType: "network_timeout"
				});
			}
			else
			{
				// Other errors are not retriable (e.g., bad URL, server errors)
				logger.error("Failed to fetch cloud tile", error, {
					operation: "fetchCloudsTile",
					x,
					y,
					z,
					errorType: "server_error"
				});
			}

			// If it's the last attempt, rethrow the error
			if (attempt === maxRetries)
			{
				logger.error("Failed after max attempts to fetch cloud tile", error, {
					operation: "fetchCloudsTile",
					maxRetries,
					x,
					y,
					z
				});
			}

			// Delay before retrying
			await delay(1000); // 1 seconds delay before retrying
		}
	}
};

const isTileFresh = async (tileFile) =>
{
	try
	{
		const stats = await fs.statSync(tileFile);
		// Get the last modified time of the file
		const lastModified = stats.mtimeMs;
		const fourHoursAgo = Date.now() - 4 * 60 * 60 * 1000;

		// Determine if the file is fresh
		const isFresh = lastModified > fourHoursAgo;
		return isFresh;
	}
	catch (error)
	{
		// Log specific errors for debugging

		// Return false if the file does not exist or there's an error
		return false;
	}
};

const fetchCloudData = async (x, y, z) =>
{
	try
	{
		const response = await fetchCloudsTile({ x, y, z });
		const tilePath = path.join(DocumentsPath, "clouds", `${z}`, `${x}`);
		const tileFile = path.join(tilePath, `${y}.webp`);

		// Skip fetching if the file is fresh
		const checkTile = await isTileFresh(tileFile);
		if (checkTile)
		{
			return;
		}
		await convertBase64ToWebp(response, tileFile);
		logger.info(`saved: webp: z ${z} / x ${x} / y ${y}`);
	}
	catch (error)
	{
		logger.error("Failed to fetch cloud data", error, {
			operation: "fetchCloudData",
			x,
			y,
			z
		});
	}
};

/**
 * Execute the cloud data refresh task.
 */
const executeTask = async () =>
{
	logger.info("Starting cloud data refresh...");
	try
	{
		for (const zoom of ZOOM_LEVELS)
		{
			const maxTiles = Math.pow(2, zoom);
			for (let x = 0; x < maxTiles; x++)
			{
				for (let y = 0; y < maxTiles; y++)
				{
					await fetchCloudData(x, y, zoom);
				}
			}
		}
		logger.info("Cloud data refresh completed.");
	}
	catch (error)
	{
		logger.error("Cloud data refresh could not be completed", error, {
			operation: "executeTask"
		});
	}
};

/**
 * Schedule periodic cloud data refresh.
 */
const scheduleTask = async () =>
{
	logger.info("Starting cloud data refresh immediately...");
	await executeTask(); // Run the task immediately when the server starts.
};

// Call the function to start the task and schedule.
scheduleTask();
