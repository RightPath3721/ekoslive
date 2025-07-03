const mongoose = require("mongoose");

/**
 * Gets a Mongoose model based on its name.
 * @param {string} name - The name of the Mongoose model.
 * @returns {MongooseModel|null} The Mongoose model if found, otherwise null.
 */
const getMongooseModelByName = async (name) =>
{
	const modelNames = mongoose.modelNames();
    const modelName = modelNames.find(
		(model) => model.toLowerCase() === name.toLowerCase(),
	);
	if (!modelName)
	{
		return null;
	}
	else
	{
		const model = mongoose.model(modelName);
		return model;
	}
};

module.exports = getMongooseModelByName;
