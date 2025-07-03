const LocationModel = require("../models/observatory/location");
const ObservatoryModel = require("../models/observatory/observatory");
const logger = require("../logger");

class LocationController
{
	async createLocation(locationData)
	{
		try
		{
			if (typeof locationData === "string")
			{
				locationData = await JSON.parse(locationData);
			}
			const location = await LocationModel.create(locationData);
			return location;
		}
		catch (error)
		{
			logger.error("Error saving location information", error, {
				locationData: typeof locationData === "string" ? locationData : JSON.stringify(locationData)
			});
			return null;
		}
	}

	async updateLocationByObservatoryId(observatoryId, locationData)
	{
		const observatory = await ObservatoryModel.findById(observatoryId);
		if (!observatory) return;

		let updatedLocation;
		if (!observatory.location) {
			// Create new location if none exists
			updatedLocation = await this.createLocation(locationData);
			// Update observatory with new location reference
			await ObservatoryModel.findByIdAndUpdate(
				observatoryId,
				{ location: updatedLocation._id },
				{ new: true }
			);
		} else {
			// Update existing location
			updatedLocation = await LocationModel.findByIdAndUpdate(
				observatory.location,
				locationData,
				{ new: true },
			);
		}

		return updatedLocation;
	}
}

module.exports = new LocationController();
