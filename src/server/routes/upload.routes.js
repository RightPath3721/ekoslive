const express = require("express");
const { isEmpty } = require("lodash");
const multer = require("multer");
const fs = require("fs");
const logger = require("../logger");

const uploadRoutes = express.Router();
const localPath = require("os").homedir() + "/Documents";
const fileStorage = multer.diskStorage({
	destination: (req, file, cb) =>
	{
		if (!isEmpty(req.body))
		{
			const { username } = req.body;
			const date = file.originalname.substring(5, 15);
			const path = `${localPath}/${username}/${date}`;
			// create the folder directories, if does not exist
			if (!fs.existsSync(path))
			{
				fs.mkdir(path, { recursive: true }, (err) =>
				{
					if (err)
					{
						logger.info("Directory does not exist. Creating: " + path);
					}
				});
			}
			// upload the file
			cb(null, path);
		}
	},
	filename: (_, file, cb) =>
	{
		cb(null, file.originalname);
	},
});
const upload = multer({ storage: fileStorage });

uploadRoutes.post("/logs", upload.array("files"), (_, res) =>
{
	res.status(200).send("Files uploaded successfully");
});

module.exports = uploadRoutes;
