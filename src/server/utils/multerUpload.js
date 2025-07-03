const multer = require("multer");
const sharp = require("sharp");
const path = require("path");
const fs = require("fs/promises");

const MAX_FILE_SIZE_LIMIT = 100 * 1024 * 1024; // 100 MB

const storage = multer.diskStorage({
	destination: (req, file, cb) =>
	{
		cb(null, "/tmp/uploads");
	},
	filename: (req, file, cb) =>
	{
		const ext =
			file.mimetype === "application/octet-stream"
				? ".fits"
				: `.${file.mimetype?.split?.("/")?.[1] ?? ""}`;
		const uniqueSuffix = `${Date.now()}${Math.round(Math.random() * 1e9)}`;
		cb(null, `${uniqueSuffix}${ext}`);
	},
});
const upload = multer({ storage, limits: { fileSize: MAX_FILE_SIZE_LIMIT } });

const convertToWebP = async (req, res, next) => {
  if (!req.file) {
    return next();
  }

  const outputFilePath = path.join("/tmp/uploads", `${req.file.filename}.webp`);
  const thumbnailFilePath = path.join("/tmp/uploads", `${req.file.filename}-thumbnail.webp`);

  try {
	const buffer = await fs.readFile(req.file.path, (err, data) =>
		{
			if (err)
			{
				throw new Error(err);
			}
			else
			{
				return Buffer.from(data);
			}
		});

    // Generate the preview image
    await sharp(buffer)
      .resize({ width: 4000, withoutEnlargement: true })
      .webp({ quality: 80 })
      .toFile(outputFilePath);

    // Generate the thumbnail image
    await sharp(buffer)
      .resize({ width: 500 }) // Set the width for the thumbnail
      .webp({ quality: 80 })
      .toFile(thumbnailFilePath);

    // Update the file paths in the request object
    req.file.path = outputFilePath;
    req.file.thumbnailPath = thumbnailFilePath; // Add the thumbnail path

  } catch (error) {
    console.error("Error converting image to WebP:", error);
    return res.status(500).send("Failed to process the image.");
  }

  next();
};

const convertToWebPs = async (req, res, next) => {
	// Check for the existence of files
	if (!req.files || req.files.length === 0) {
		return next();
	}

	try {
	// Iterate over each file in req.files
	const conversionPromises = req.files.map(async (file) => {
		const outputFilePath = path.join("/tmp/uploads", `${file.filename}.webp`);

		// Read the file using fs.promises
		const buffer = await fs.readFile(file.path);

		// Convert the file to WebP
		await sharp(buffer)
		.webp({ quality: 80 })
		.toFile(outputFilePath);

		// Update the file path to the new WebP file
		file.path = outputFilePath;

		return file; // Return the updated file object
	});

	// Await all conversions
	await Promise.all(conversionPromises);

	} catch (error) {
	console.error("Error converting images to WebP:", error);
	return res.status(500).send("Failed to process images.");
	}

	next();
};

module.exports = { upload, convertToWebP, convertToWebPs };

