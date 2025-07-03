const express = require("express");
const { upload } = require("../utils/multerUpload");
const metadata = require("../controller/metadata");
const authMiddleware = require("../middlewares/auth");

const MetadataRouter = express.Router();

MetadataRouter.post(
	"/",
	authMiddleware,
	upload.single("file"),
	async (req, res) =>
	{
		const file = req.file;
		if (!file)
		{
			return res.status(400).json("Fits file is missing");
		}
		if (!file.filename.includes(".fits"))
		{
			return res.status(400).json("File should be in .fits format");
		}
		else
		{
			const fileMetadata = await metadata.processFile(file.path, file.mimetype);
			res.json(fileMetadata);
		}
	},
);

MetadataRouter.post(
	"/preview",
	authMiddleware,
	upload.single("file"),
	async (req, res) =>
	{
		const file = req.file;
		if (!file)
		{
			return res.status(400).json("Fits file is mssing");
		}
		if (!file.filename.includes(".fits"))
		{
			return res.status(400).json("File should be in .fits format");
		}
		else
		{
			const previewPath = await metadata.createPreviewImage(
				file.path,
				file.mimetype,
			);
			if (!previewPath)
			{
				res.status(500).json({
					message:
						"Couldn't create an image from the selected file, try again.",
				});
			}
			else
			{
				res.sendFile(previewPath);
			}
		}
	},
);

module.exports = MetadataRouter;
