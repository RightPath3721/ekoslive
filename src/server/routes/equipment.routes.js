const express = require("express");
const authMiddleware = require("../middlewares/auth");
const { upload, convertToWebP } = require("../utils/multerUpload");
const ObservatoryController = require("../controller/observatory");
const EquipmentController = require("../controller/equipment");
const PostController = require("../controller/post");
const logger = require("../logger");
const EquipmentModelSchema = require("../models/observatory/model");
const equipmentRoutes = express.Router();

equipmentRoutes.get("/", async (req, res) =>
{
	const { profileId } = req.query;
	try
	{
		const equipmentList =
			await EquipmentController.getProfileEquipment(profileId);
		res.json({ equipmentList });
	}
	catch (error)
	{
		res.status(400).json({ error: error.message });
	}
});

equipmentRoutes.get(
	"/indi-drivers",
	authMiddleware,
	async (req, res) =>
	{
		try
		{
			const indiDrivers = await EquipmentController.getIndiDrivers();
			indiDrivers.sort();
			res.status(200).json({ indiDrivers });
		}
		catch (error)
		{
			logger.error("Error fetching INDI drivers", error, {
				operation: "getIndiDrivers"
			});
			res.status(400).json({ error: error.message });
		}
	},
);

equipmentRoutes.get("/pending-tasks", async (req, res) =>
{
	try
	{
		const manufacturers = await EquipmentController.getPendingManufacturers();
		const models = await EquipmentController.getPendingModels();
		const posts = await PostController.getPendingPosts();
		const observatories = await ObservatoryController.getPendingObservatories();
		const abuseReports = await PostController.getAbuseReports(req.body);
		const count = [
			posts.length,
			manufacturers.length,
			models.length,
			observatories.length,
			abuseReports.length,
		];
		res.json({ count });
	}
	catch (error)
	{
		res.status(400).json({ error: error.message });
	}
});

equipmentRoutes.get(
	"/equipment-profile/:profileId/:modelId",
	authMiddleware,
	async (req, res) =>
	{
		const { profileId, modelId } = req.params;
		try
		{
			const equipmentList = await EquipmentController.addEquipmentModel(
				profileId,
				modelId,
			);
			res.json({ equipmentList });
		}
		catch (error)
		{
			res.status(400).json({ error: error.message });
		}
	},
);

equipmentRoutes.post("/", authMiddleware, async (req, res) =>
{
	const { username } = req.query;
	try
	{
		const { profile, observatory_id } = req.body;
		await ObservatoryController.checkObservatoryOwner(username, observatory_id);
		const equipmentProfile = await EquipmentController.createEquipmentProfile(
			observatory_id,
			profile,
		);
		res.json({ equipmentProfile });
	}
	catch (error)
	{
		logger.error("Error creating equipment profile", error, {
			username,
			operation: "createEquipmentProfile",
			observatory_id: req.body.observatory_id
		});
		res.status(400).json({ error: error.message });
	}
});

equipmentRoutes.delete("/:id", authMiddleware, async (req, res) =>
{
	const { observatoryId, equipmentProfileId } = req.body;
	const { username } = req.query;
	const { id } = req.params;

	try
	{
		await EquipmentController.deleteEquipment(
			username,
			id,
			observatoryId,
			equipmentProfileId,
		);
		res.status(204).json();
	}
	catch (error)
	{
		res.status(400).json({ error: error.message });
	}
});

equipmentRoutes.get("/manufacturers", authMiddleware, async (req, res) =>
{
	try
	{
		const manufacturers = await EquipmentController.getManufacturers();
		res.status(200).json({ manufacturers });
	}
	catch (error)
	{
		logger.error("Error getting manufacturers", error, {
			operation: "getManufacturers"
		});
		res.status(400).json({ error: error.message });
	}
});

equipmentRoutes.post("/moderation", authMiddleware, async (req, res) =>
{
	try
	{
		const moderation = await EquipmentController.equipmentsModeration(req.body);
		if (moderation)
		{
			res.status(200).json("Success");
		}
		else
		{
			res.status(404).json({ message: "Moderation not found or unsuccessful" });
		}
	}
	catch (error)
	{
		logger.error("Error in equipments moderation", error, {
			operation: "equipmentsModeration",
			requestBody: req.body
		});
		res.status(400).json({ error: error.message });
	}
});

equipmentRoutes.get(
	"/manufacturers/pending",
	authMiddleware,
	async (req, res) =>
	{
		try
		{
			const manufacturers = await EquipmentController.getPendingManufacturers();
			res.status(200).json({ manufacturers });
		}
		catch (error)
		{
			logger.error("Error getting pending manufacturers", error, {
				operation: "getPendingManufacturers"
			});
			res.status(400).json({ error: error.message });
		}
	},
);

equipmentRoutes.get("/equipment-models", authMiddleware, async (req, res) =>
{
	try
	{
		const models = await EquipmentController.getModels();
		res.status(200).json({ models });
	}
	catch (error)
	{
		logger.error("Error getting equipment models", error, {
			operation: "getModels"
		});
		res.status(400).json({ error: error.message });
	}
});

equipmentRoutes.get(
	"/equipment-models-with-populate",
	async (req, res) =>
	{
		const page = parseInt(req.query.page, 10) || 0;
		const limit = parseInt(req.query.limit, 10) || 20;
		const search = req.query.search;
		try
		{
			const models = await EquipmentController.getModelsWithAggregation({
				page,
				limit,
				search,
			});
			res.status(200).json({ models });
		}
		catch (error)
		{
			logger.error("Error getting equipment models with aggregation", error, {
				operation: "getModelsWithAggregation",
				page,
				limit,
				search
			});
			res.status(400).json({ error: error.message });
		}
	},
);

equipmentRoutes.get(
	"/equipment-models/pending",
	authMiddleware,
	async (req, res) =>
	{
		try
		{
			const models = await EquipmentController.getPendingModels();
			res.status(200).json({ models });
		}
		catch (error)
		{
			logger.error("Error getting pending equipment models", error, {
				operation: "getPendingModels"
			});
			res.status(400).json({ error: error.message });
		}
	},
);

equipmentRoutes.get("/manufacturers/:equipmentTypeId", async (req, res) =>
{
	const { equipmentTypeId } = req.params;
	try
	{
		const manufacturers =
			await EquipmentController.getManufacturersByEquipmentTypeId(
				equipmentTypeId,
			);
		const numberofModels = await EquipmentModelSchema.countDocuments({
			equipment_type: equipmentTypeId,
		});
		res.status(200).json({ manufacturers, numberofModels });
	}
	catch (error)
	{
		logger.error("Error getting manufacturers by equipment type", error, {
			operation: "getManufacturersByEquipmentTypeId",
			equipmentTypeId
		});
		res.status(400).json({ error: error.message });
	}
});

equipmentRoutes.get(
	"/equipment-models/:equipmentTypeId/:manufacturerId",
	async (req, res) =>
	{
		const { equipmentTypeId, manufacturerId } = req.params;
		try
		{
			const equipmentModels =
				await EquipmentController.getEquipmentModelsByEquipmentTypeAndManufacturer(
					equipmentTypeId,
					manufacturerId,
				);
			res.status(200).json({ equipmentModels });
		}
		catch (error)
		{
			logger.error("Error getting equipment models by type and manufacturer", error, {
				operation: "getEquipmentModelsByEquipmentTypeAndManufacturer",
				equipmentTypeId,
				manufacturerId
			});
			res.status(400).json({ error: error.message });
		}
	},
);

equipmentRoutes.get("/equipment-model/:modelId", async (req, res) =>
{
	const { modelId } = req.params;
	try
	{
		const equipmentModel =
			await EquipmentController.getEquipmentModelById(modelId);
		res.status(200).json({ equipmentModel });
	}
	catch (error)
	{
		logger.error("Error getting equipment model by ID", error, {
			operation: "getEquipmentModelById",
			modelId
		});
		res.status(400).json({ error: error.message });
	}
});

equipmentRoutes.get("/equipment-model/name/:modelName", async (req, res) =>
{
	const { modelName } = req.params;
	try
	{
		const equipmentModel =
			await EquipmentController.getEquipmentModelByName(modelName);
		res.status(200).json({ equipmentModel });
	}
	catch (error)
	{
		logger.error("Error getting equipment model by name", error, {
			operation: "getEquipmentModelByName",
			modelName
		});
		res.status(400).json({ error: error.message });
	}
});

equipmentRoutes.get("/equipment-types", async (_, res) =>
{
	try
	{
		const equipmentTypes = await EquipmentController.getEquipmentTypes();
		res.json({ equipmentTypes });
	}
	catch (error)
	{
		logger.error("Error getting equipment types", error, {
			operation: "getEquipmentTypes"
		});
		res.status(400).json({ error: error.message });
	}
});

equipmentRoutes.get("/equipment-types/:equipmentTypeId", async (req, res) =>
{
	const { equipmentTypeId } = req.params;
	try
	{
		const equipmentType =
			await EquipmentController.getEquipmentTypeById(equipmentTypeId);
		res.json({ equipmentType });
	}
	catch (error)
	{
		logger.error("Error getting equipment type by ID", error, {
			operation: "getEquipmentTypeById",
			equipmentTypeId
		});
		res.status(400).json({ error: error.message });
	}
});

equipmentRoutes.get("/equipment-types/name/:equipmentTypeName", async (req, res) =>
{
	const { equipmentTypeName } = req.params;
	try
	{
		const equipmentType =
			await EquipmentController.getEquipmentTypeByName(equipmentTypeName);
		res.json({ equipmentType });
	}
	catch (error)
	{
		logger.error("Error getting equipment type by name", error, {
			operation: "getEquipmentTypeByName",
			equipmentTypeName
		});
		res.status(400).json({ error: error.message });
	}
});

equipmentRoutes.get("/:observatoryId", async (req, res) =>
{
	const { observatoryId } = req.params;
	try
	{
		const profiles =
			await ObservatoryController.getObservatoriesEquipmentProfiles(
				observatoryId,
			);
		res.json({ profiles });
	}
	catch (error)
	{
		logger.error("Error getting observatory equipment profiles", error, {
			operation: "getObservatoriesEquipmentProfiles",
			observatoryId
		});
		res.status(400).json({ error: error.message });
	}
});

equipmentRoutes.post(
	"/:observatoryId/:profileId",
	authMiddleware,
	async (req, res) =>
	{
		const { username } = req.query;
		const { observatoryId, profileId } = req.params;

		try
		{
			await EquipmentController.addEquipment(
				username,
				observatoryId,
				profileId,
				req.body,
			);
			res.status(204).send();
		}
		catch (error)
		{
			logger.error("Error adding equipment", error, {
				username,
				operation: "addEquipment",
				observatoryId,
				profileId
			});
			res.status(400).json({ error: error.message });
		}
	},
);

equipmentRoutes.patch(
	"/equipment-profile/:id",
	authMiddleware,
	async (req, res) =>
	{
		const { id } = req.params;
		const { username } = req.query;

		try
		{
			const { observatoryID, data } = req.body;
			const updatedProfile = await EquipmentController.updateEquipmentProfile(
				username,
				observatoryID,
				id,
				data,
			);
			res.json(updatedProfile);
		}
		catch (error)
		{
			logger.error("Error updating equipment profile", error, {
				username,
				operation: "updateEquipmentProfile",
				profileId: id,
				observatoryID: req.body.observatoryID
			});
			res.status(400).json({ error: error.message });
		}
	},
);

equipmentRoutes.get(
	"/equipment-values/:typeId/:field",
	authMiddleware,
	async (req, res) =>
	{
		const { field, typeId } = req.params;
		try
		{
			const result = await EquipmentController.getValueExamples(typeId, field);
			res.json({ result });
		}
		catch (error)
		{
			logger.error("Error getting equipment values", error, {
				operation: "getValueExamples",
				typeId,
				field
			});
			res.status(400).json({ message: error.message });
		}
	},
);

equipmentRoutes.post(
	"/manufacturers",
	authMiddleware,
	upload.single("logo"),
	convertToWebP,
	async (req, res) =>
	{
		req.body.submissionStatus = req.ability.can("update", "ModeratingStatus")
			? req.body.submissionStatus
			: "PENDING";
		const { username } = req.query;
		try
		{
			const manufacturer = await EquipmentController.createManufacturer(
				req.body,
				req.file,
				username,
			);
			if (req.body.submissionStatus === "APPROVED")
			{
				res.status(200).json({ manufacturer });
			}
			else
			{
				res.json({ message: "success" });
			}
		}
		catch (error)
		{
			// handling mongo duplicate key error in case if manufacturer with provided label already exists
			if (error?.code === 11000)
			{
				res
					.status(400)
					.json({ error: `Model with name ${req.body.label} already exists` });
			}
			else
			{
				logger.error("Error creating manufacturer", error, {
					username,
					operation: "createManufacturer",
					manufacturerLabel: req.body.label
				});
				res.status(500).json({ error: error.message });
			}
		}
	},
);

equipmentRoutes.patch(
	"/manufacturers/:manufacturerId",
	authMiddleware,
	upload.single("logo"),
	convertToWebP,
	async (req, res) =>
	{
		const { manufacturerId } = req.params;

		try
		{
			const manufacturer = await EquipmentController.updateManufacturer(
				manufacturerId,
				req.body,
				req.file,
			);
			res.status(200).json({ manufacturer });
		}
		catch (error)
		{
			if (error?.code === 11000)
			{
				res.status(400).json({
					error: `Manufacturer with name ${req.body.name} already exists`,
				});
			}
			else
			{
				logger.error("Error updating manufacturer", error, {
					operation: "updateManufacturer",
					manufacturerId,
					manufacturerName: req.body.name
				});
				res.status(400).json({ error: error.message });
			}
		}
	},
);

equipmentRoutes.post(
	"/equipment-models",
	authMiddleware,
	upload.single("logo"),
	convertToWebP,
	async (req, res) =>
	{
		const { username } = req.query;

		req.body.submissionStatus = req.ability.can("update", "ModeratingStatus")
			? req.body.submissionStatus
			: "PENDING";

		try
		{
			const equipmentModel = await EquipmentController.createEquipmentModel(
				req.body,
				req.file,
				username,
			);
			if (req.body.submissionStatus === "APPROVED")
			{
				res.status(200).json({ equipmentModel });
			}
			else
			{
				res.json({ message: "success" });
			}
		}
		catch (error)
		{
			// handling mongo duplicate key error in case if equipment with provided label already exists
			if (error?.code === 11000)
			{
				res
					.status(400)
					.json({ error: `Model with name ${req.body.label} already exists` });
			}
			else
			{
				logger.error("Error creating equipment model", error, {
					username,
					operation: "createEquipmentModel",
					modelLabel: req.body.label
				});
				res.status(500).json({ error: error.message });
			}
		}
	},
);

equipmentRoutes.patch(
	"/equipment-models/:equipmentModelId",
	authMiddleware,
	upload.single("logo"),
	convertToWebP,
	async (req, res) =>
	{
		const { equipmentModelId } = req.params;

		try
		{
			const equipmentModel = await EquipmentController.updateEquipmentModel(
				equipmentModelId,
				req.body,
				req.file,
			);
			res.status(200).json({ equipmentModel });
		}
		catch (error)
		{
			if (error?.code === 11000)
			{
				res
					.status(400)
					.json({ error: `Model with name ${req.body.label} already exists` });
			}
			else
			{
				logger.error("Error updating equipment model", error, {
					operation: "updateEquipmentModel",
					equipmentModelId,
					modelLabel: req.body.label
				});
				res.status(400).json({ error: error.message });
			}
		}
	},
);

equipmentRoutes.patch(
	"/:observatoryId/:equipmentId",
	authMiddleware,
	async (req, res) =>
	{
		const { username } = req.query;
		const { observatoryId, equipmentId } = req.params;

		try
		{
			const equipment = await EquipmentController.updateEquipment(
				username,
				observatoryId,
				equipmentId,
				req.body,
			);
			await equipment.populate("manufacturer");
			await equipment.populate("equipment_type");
			res.json({ equipment });
		}
		catch (error)
		{
			logger.error("Error updating equipment", error, {
				username,
				operation: "updateEquipment",
				observatoryId,
				equipmentId
			});
			res.status(400).json({ error: error.message });
		}
	},
);

equipmentRoutes.get("/manufacturer/:manufacturerId", async (req, res) =>
{
	const { manufacturerId } = req.params;
	try
	{
		const manufacturer =
			await EquipmentController.getManufacturerById(manufacturerId);
		res.status(200).json({ manufacturer });
	}
	catch (error)
	{
		logger.error("Error getting manufacturer by ID", error, {
			operation: "getManufacturerById",
			manufacturerId
		});
		res.status(400).json({ error: error.message });
	}
});

equipmentRoutes.get("/manufacturer/name/:manufacturerName", async (req, res) =>
{
	const { manufacturerName } = req.params;
	try
	{
		const manufacturer =
			await EquipmentController.getManufacturerByName(manufacturerName);
		res.status(200).json({ manufacturer });
	}
	catch (error)
	{
		logger.error("Error getting manufacturer by name", error, {
			operation: "getManufacturerByName",
			manufacturerName
		});
		res.status(400).json({ error: error.message });
	}
});

equipmentRoutes.get(
	"/:observatoryId/:profileId/:fieldName",
	authMiddleware,
	async (req, res) =>
	{
		const { profileId, observatoryId, fieldName } = req.params;
		const { username } = req.query;

		try
		{
			const equipments = await EquipmentController.getEquipmentByType(
				username,
				observatoryId,
				profileId,
				fieldName,
			);
			res.json(equipments);
		}
		catch (error)
		{
			logger.error("Error getting equipment by type", error, {
				username,
				operation: "getEquipmentByType",
				observatoryId,
				profileId,
				fieldName
			});
			res.status(400).json({ message: error.message });
		}
	},
);

equipmentRoutes.get("/filters/:model", async (req, res) =>
{
	const { model } = req.params;

	try
	{
		const filtersList = await EquipmentController.getFiltersForModel(model);
		res.json(filtersList);
	}
	catch (error)
	{
		res.status(400).json({ message: error.message });
	}
});

equipmentRoutes.get("/filtered/:model", async (req, res) =>
{
	const { model } = req.params;

	try
	{
		delete req.query.token;
		delete req.query.username;

		const result = await EquipmentController.getFilteredValues(
			model,
			req.query,
			req.ability.can("update", "ModeratingStatus"),
		);
		res.json(result);
	}
	catch (error)
	{
		logger.error("Error getting filtered values", error, {
			operation: "getFilteredValues",
			model
		});
		res.status(400).json({ message: error.message });
	}
});

equipmentRoutes.delete(
	"/delete-equipment-from-profile/:id",
	authMiddleware,
	async (req, res) =>
	{
		const { equipmentProfileId } = req.query;
		const { id } = req.params;

		try
		{
			await EquipmentController.deleteEquipmentFromProfile(
				id,
				equipmentProfileId,
			);
			res.status(204).json();
		}
		catch (error)
		{
			res.status(400).json({ error: error.message });
		}
	},
);

equipmentRoutes.delete(
	"/delete-equipment-profile/:id",
	authMiddleware,
	async (req, res) =>
	{
		const { observatoryId } = req.query;
		const { id } = req.params;

		try
		{
			await EquipmentController.deleteEquipmentProfile(id, observatoryId);
			res.status(204).json();
		}
		catch (error)
		{
			res.status(400).json({ error: error.message });
		}
	},
);

equipmentRoutes.post(
	"/check-indi-drivers",
	authMiddleware,
	async (req, res) =>
	{
		try
		{
			const { indiDrivers } = req.body;
			if (!indiDrivers || !Array.isArray(indiDrivers)) {
				return res.status(400).json({ error: "Invalid input. Expected array of INDI drivers." });
			}
			
			const results = await EquipmentController.checkIndiDriversInDatabase(indiDrivers);
			res.status(200).json({ results });
		}
		catch (error)
		{
			logger.error("Error checking INDI drivers", error, {
				operation: "checkIndiDriversInDatabase",
				driversCount: indiDrivers?.length || 0
			});
			res.status(400).json({ error: error.message });
		}
	},
);

module.exports = equipmentRoutes;
