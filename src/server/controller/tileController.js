const fs = require("fs");
const { readFile, writeFile } = require("fs/promises");
const axios = require("axios");
const logger = require("../logger");

class TileController
{
	static HomeDir = require("os").homedir() + "/.local/share/ekoslive";

	constructor()
	{
		this.cloudMap = new Map();
	}

	// Get tile from filesystem
	async findTile(root, x, y, z)
	{
		const tilePath = `${root}/${x}/${y}/${z}/tile.png`;
		try
		{
			return await readFile(tilePath, "base64");
		}
		catch (error)
		{
			throw new Error(`Error reading tile from ${tilePath}: ${error.message}`);
		}
	}

	/**
	 * @param {number} x - OSM X Tile.
	 * @param {number} y - OSM Y Tile.
	 * @param {number} z - OSM Zoom Level.
	 * @returns {boolean} True if cloud tile timestamp is within the last hour. Otherwise false.
	 */
	async isCloudTileValid(x, y, z)
	{
		const uid = (z << 16) | (y << 8) | x;
		const tileTS = this.cloudMap.get(uid);
		const isValid = tileTS && +new Date() - tileTS <= 60 * 60 * 1000;
		return isValid;
	}

	/**
	 * @param {{x:number,y:number,z:number,username:string}} data - Object with coordinates of tile and username.
	 * @returns {Buffer} Base64 buffer fetched from online if successful, or throws an error on failure.
	 */
	async fetchCloudsTile({ x, y, z })
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

				// If the request is successful, process and return the data
				const uid = (z << 16) | (y << 8) | x;
				this.cloudMap.set(uid, +new Date());

				success = true; // Mark as successful
				return Buffer.from(response.data, "binary").toString("base64");
			}
			catch (error)
			{
				// Check if the error is related to the fetch operation (network, timeout, etc.)
				if (error.code === "ECONNABORTED" || error.response === undefined)
				{
					// These are network errors or timeouts, retry
					logger.error("Failed to fetch cloud tile - network error or timeout", error, {
						attempt,
						z,
						x,
						y,
						errorCode: error.code
					});
				}
				else
				{
					// Other errors are not retriable (e.g., bad URL, server errors)
					logger.error("Failed to fetch cloud tile", error, {
						z,
						x,
						y,
						statusCode: error.response?.status
					});
				}

				// If it's the last attempt, rethrow the error
				if (attempt === maxRetries)
				{
					logger.error("Failed after max retries to fetch cloud tile", error, {
						maxRetries,
						z,
						x,
						y
					});
				}

				// Delay before retrying
				await delay(1000); // 1 seconds delay before retrying
			}
		}
	}
}

module.exports = new TileController();
