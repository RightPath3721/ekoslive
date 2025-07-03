const get = require("lodash/get");
const util = require("util");
const logger = require("../logger");
const exec = util.promisify(require("node:child_process").exec);

class MetadataController
{
	static mimeTypes = ["image/png", "image/jpeg", "application/octet-stream"];

	async processFile(filePath, mimeType)
	{
		// Check if supported.
		if (!MetadataController.mimeTypes.includes(mimeType))
		{
			return {};
		}
		// extract the metadata
		try
		{
			const { stdout, stderr } = await exec(
				'/usr/bin/smfitstools --meta "' + filePath + '"',
			);
			if (stderr)
			{
				logger.error("Error extracting metadata from image", new Error(stderr), {
					filePath,
					mimeType
				});
				return {};
			}
			const info = JSON.parse(stdout);

			return info;
		}
		catch (error)
		{
			logger.error("Error processing metadata file", error, {
				filePath,
				mimeType
			});
			return {};
		}
	}

	async createPreviewImage(filePath, mimeType)
	{
		// Check if supported.
		if (!MetadataController.mimeTypes.includes(mimeType))
		{
			return null;
		}
		try
		{
			// Create Preview file
			const previewImage = filePath.replace(".fits", "_preview.jpg");
			await exec(
				"/usr/bin/smfitstools --save-preview " +
					previewImage +
					' "' +
					filePath +
					'"',
			);
			return previewImage;
		}
		catch (error)
		{
			logger.error("Error creating preview image", error, {
				filePath,
				mimeType
			});
			return null;
		}
	}
}

module.exports = new MetadataController();
