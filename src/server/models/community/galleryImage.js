const mongoose = require("mongoose");
const { getObjectUrl, deleteImgFromBucket } = require("../../utils/minio");

const galleryImageSchema = new mongoose.Schema({
	metadata: { type: mongoose.Schema.Types.ObjectId, ref: "Metadata" },
	captured_by: { type: mongoose.Schema.Types.ObjectId, ref: "Social" },
	preview: String,
	thumbnail: String,
	hashtags: [{ type: mongoose.Schema.Types.ObjectId, ref: "Hashtag" }],
});

galleryImageSchema.post("find", async function (docs, next)
{
	await Promise.all(
		docs.map(async (doc) =>
		{
			doc.preview = await getObjectUrl(doc.preview);
			doc.thumbnail = await getObjectUrl(doc.thumbnail);
		}),
	);
	next();
});

galleryImageSchema.pre("findOneAndDelete", async function (next)
{
	const galleryImage = await this.model.db
		.model("GalleryImage")
		.findById(this.getQuery()?._id);
	await this.model.db
		.model("Metadata")
		.findByIdAndDelete(galleryImage.metadata);
	await deleteImgFromBucket(galleryImage.thumbnail);
	next();
});

module.exports = mongoose.model("GalleryImage", galleryImageSchema);
