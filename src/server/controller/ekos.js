const EkosModel = require("../models/ekos");
const logger = require("../logger");

class ekosController
{
	register(ekosInfo)
	{
		EkosModel.findOneAndUpdate(
			{ machine_id: ekosInfo.machine_id },
			{ ...ekosInfo, connected: true },
			{ new: true, upsert: true },
		).then((ekos) =>
		{
			if (ekos === null)
			{
				logger.error("EkosModel username not found", new Error("User not found"), {
					username: ekosInfo.username,
					machine_id: ekosInfo.machine_id
				});
			}
			else
			{
				logger.log(
					"debug",
					ekos.username + ": Successfully registered ekos connection.",
				);
			}
		});
	}

	/**
	 * @param {string} machine_id - Ekos machine id.
	 * @param {{key: value}} property - Property that needs to be saved.
	 */
	saveProperty(machine_id, property)
	{
		EkosModel.findOneAndUpdate({ machine_id }, property)
			.then((ekos) =>
			{
				if (ekos === null)
				{
					logger.error("Failed to save property: no Ekos profile exists", new Error("Profile not found"), {
						machine_id,
						property: JSON.stringify(property)
					});
				}
				else
				{
					logger.debug(
						ekos.username +
							":[Ekos] Successfully saved property: " +
							JSON.stringify(property),
					);
				}
			})
			.catch(() =>
			{});
	}

	/**
	 * @param {string} username
	 * @param {string} arrayName
	 * @param {string} arrayKey
	 * @param {string} property
	 * @param {string} payload
	 */
	savePropertyInArray(username, arrayName, arrayKey, property, payload)
	{
		const query = { username, [arrayName + ".name"]: arrayKey };
		const update = { [arrayName + ".0." + property]: payload };
		EkosModel.findOneAndUpdate(query, update).then((ekos) =>
		{
			if (ekos === null)
			{
				logger.error("Failed to save property in array: no Ekos profile exists", new Error("Profile not found"), {
					username,
					arrayName,
					arrayKey,
					property: JSON.stringify(property)
				});
			}
		});
	}

	increaseProperty(username, property, value)
	{
		const query = { [property]: value };
		EkosModel.findOneAndUpdate(
			{ username },
			{ $inc: query },
			{ upsert: true },
		).then((ekos) =>
		{
			if (ekos === null)
			{
				logger.error("Failed to increase property: no Ekos profile exists", new Error("Profile not found"), {
					username,
					property,
					value
				});
			}
		});
	}

	clearProperty(token, property)
	{
		EkosModel.findOneAndUpdate({ token }, { $unset: property })
			.then((ekos) =>
			{
				if (ekos === null)
				{
					logger.error("Failed to clear property: no Ekos profile exists", new Error("Profile not found"), {
						token,
						property
					});
				}
				else
				{
					logger.log("debug", token + ": Clear property " + property);
				}
			})
			.catch((err) =>
			{
				logger.error("Failed to clear property", err, {
					token,
					property
				});
			});
	}

	async getEkosInfo({
		orderBy,
		sortDirection,
		page,
		limit,
		search,
		connected,
	})
	{
		const aggregatePipeline = [
			{ $sort: { [orderBy]: sortDirection === "desc" ? -1 : 1 } },
			{ $skip: +page * limit },
			{ $limit: limit },
		];
		const countPipeline = [];

		if (search)
		{
			const regex = new RegExp(search, "i");
			const matchStage = {
				$match: {
					$or: [{ username: regex }, { email: regex }, { machine_id: regex }],
				},
			};
			aggregatePipeline.unshift(matchStage);
			countPipeline.unshift(matchStage);
		}

		try
		{
			const parsedFilter = JSON.parse(connected);
			const filterByConnectedStage = { $match: { connected: parsedFilter } };
			aggregatePipeline.unshift(filterByConnectedStage);
			countPipeline.unshift(filterByConnectedStage);
		}
		catch
		{}

		const ekos = await EkosModel.aggregate([
			{
				$facet: {
					filtered_data: aggregatePipeline,
					total_count: [...countPipeline, { $count: "totalCount" }],
				},
			},
		]);
		return {
			ekos: ekos[0].filtered_data,
			count: ekos[0].total_count?.[0]?.totalCount,
			result: true,
		};
	}

	async getConnectedEkosCount()
	{
		const count = await EkosModel.aggregate([
			{
				$match: { connected: true },
			},
			{
				$count: "connectedEkosCount",
			},
		]);
		return count?.[0]?.connectedEkosCount ?? 0;
	}
}

module.exports = new ekosController();
