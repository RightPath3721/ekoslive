const escapeRegExp = require("lodash/escapeRegExp");
const FilterModel = require("../models/filter");
const getMongooseModelByName = require("../utils/getMongooseModelByName");

class FiltersController
{
	async createFilter(filterData, model)
	{
		const filter = await FilterModel.create({
			...filterData,
			collection: model,
		});
		return filter;
	}

	async getFilters(modelName)
	{
		const model = await getMongooseModelByName(modelName);
		if (!model) throw new Error(`Model with name ${modelName} not found`);

		const advancedFilters = await FilterModel.find({
			collection: model.modelName,
		});
		if (!advancedFilters)
			throw new Error(`Advanced filters for ${modelName} not found`);

		return advancedFilters;
	}

	async getFilteredData(modelName, filters)
	{
		const model = await getMongooseModelByName(modelName);
		if (!model) throw new Error(`Model with name ${modelName} not found`);

		const advancedFilters = await FilterModel.find({
			collection: model.modelName,
		});
		if (!advancedFilters)
			throw new Error(`Advanced filters for ${modelName} not found`);

		const aggregatePipeline = [];
		Object.values(filters).forEach(([key, value]) =>
		{
			const advancedFilter = advancedFilters.find(
				(filter) => filter.key === key,
			);
			if (!advancedFilter) return;

			switch (advancedFilter.type) {
				case "String":
					const regex = new RegExp(escapeRegExp(value), "i");
					aggregatePipeline.unshift({
						$match: {
							$or: advancedFilters.search_fields?.map((field) => ({
								[field]: regex,
							})),
						},
					});
					break;

				case "Range":
					aggregatePipeline.push({
						$match: { [advancedFilter.key]: { $gt: value[1], $lt: value[0] } },
					});
					break;

				case "Enum":
				case "Boolean":
				case "Number":
					aggregatePipeline.push({ $match: { [field]: value } });
					break;

				default:
					break;
			}
		});

		const data = await model.aggregate([
			...aggregatePipeline,
			{ $skip: (+filters.page ?? 0) * (+limit ?? 10) },
			{ $limit: +limit ?? 10 },
		]);

		return data;
	}
}

module.exports = new FiltersController();
