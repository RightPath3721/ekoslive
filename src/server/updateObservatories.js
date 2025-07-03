const mongoose = require("mongoose");
const ObservatoryModel = require("./models/observatory/observatory");
const ModerationReport = require("./models/moderation/moderationReport");
const logger = require("./logger");
const { database } = require("./config");

const createModerationReportForObservatories = async () =>
{
	try
	{
		const observatories = await ObservatoryModel.find();

		for (let i = 0; i < observatories.length; i++)
		{
			const observatory = observatories[i];

			try
			{
				if (!observatory.moderation_report)
				{
					const newModerationReport = new ModerationReport({
						status: "APPROVED",
					});

					await newModerationReport.save();

					observatory.moderation_report = newModerationReport._id;

					if (
						observatory.isPublicLocation !== null &&
						typeof observatory.isPublicLocation === "boolean"
					)
					{
						await observatory.save();
						logger.info(
							`Added new moderation report to observatory with ID: ${observatory._id}`,
						);
					}
					else
					{
						logger.warn(
							`Skipping observatory with invalid isPublicLocation value: ${observatory._id}`,
						);
					}
				}
				else
				{
					const existingReport = await ModerationReport.findById(
						observatory.moderation_report,
					);

					if (!existingReport)
					{
						const newModerationReport = new ModerationReport({
							status: "APPROVED",
						});

						await newModerationReport.save();

						observatory.moderation_report = newModerationReport._id;

						if (
							observatory.isPublicLocation !== null &&
							typeof observatory.isPublicLocation === "boolean"
						)
						{
							await observatory.save();
							logger.info(
								`Replaced missing moderation report for observatory with ID: ${observatory._id}`,
							);
						}
						else
						{
							logger.warn(
								`Skipping observatory with invalid isPublicLocation value: ${observatory._id}`,
							);
						}
					}
					else
					{
						logger.info(
							`Moderation report already exists for observatory with ID: ${observatory._id}`,
						);
					}
				}
			}
			catch (err)
			{
				logger.error("Error processing observatory", err, {
					observatoryId: observatory._id
				});
				continue;
			}
		}

		logger.info("Completed updating all observatories with moderation report");
	}
	catch (error)
	{
		logger.error("Error occurred while updating observatories", error);
	}
};

const updateObservatories = () =>
{
	mongoose
		.connect(database, { useNewUrlParser: true })
		.then(() =>
		{
			createModerationReportForObservatories();
		})
		.catch((err) => logger.error("Error running sync script", err));
};

updateObservatories();
