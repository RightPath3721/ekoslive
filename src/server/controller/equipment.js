const mongoose = require("mongoose");
const escapeRegExp = require("lodash/escapeRegExp");
const ObservatoryController = require("./observatory");
const EquipmentTypeModel = require("../models/observatory/equipmentType");
const ObservatoryModel = require("../models/observatory/observatory");
const EquipmentModel = require("../models/observatory/equipment");
const EquipmentProfileModel = require("../models/observatory/equipmentProfile");
const ManufacturerModel = require("../models/observatory/manufacturer");
const EquipmentModelSchema = require("../models/observatory/model");
const { saveImgInBucket, getObjectUrl } = require("../utils/minio");
const ModerationReport = require("../models/moderation/moderationReport");
const UserModel = require("../models/user");
const NotificationModel = require("../models/notification");
const _ = require("../models/formField");
const FilterModel = require("../models/filter");
const getMongooseModelByName = require("../utils/getMongooseModelByName");
const getMongooseDefaultAggregatePipeline = require("../utils/getMongooseDefaultAggregatePipeline");
const { getAllIndiDrivers } = require("../utils/getINDIdriversFromXML");
const logger = require("../logger");
const { wssMessageManager } = require("../websocket");
const nodemailer = require("nodemailer");
const { generateEmailTemplate } = require("../utils/emailTemplates");
const {
	smtp_host,
	smtp_port,
	smtp_user,
	smtp_pass,
	smtp_from_name,
	smtp_from_email,
	app_url,
} = require("../config");

const equipmentTypes = [
	{
		name: "Mount",
	},
	{
		name: "Telescope / Lense",
	},
	{
		name: "Camera",
	},
	{
		name: "Focuser",
	},
	{
		name: "Filter Wheel",
	},
	{
		name: "Dome",
	},
	{
		name: "Adaptive Optic",
	},
	{
		name: "Weather Station",
	},
	{
		name: "Rotator",
	},
	{
		name: "Dust Cap",
	},
	{
		name: "Light Box",
	},
	{
		name: "Auxiliary",
	},
	{
		name: "Barlow / Reducer",
	},
	{
		name: "Observatory Controller",
	},
	{
		name: "Tripod",
	},
	{
		name: "Mount Handset",
	},
	{
		name: "Counterweight System",
	},
	{
		name: "Pier",
	},
	{
		name: "Thread Adapter",
	},
	{
		name: "Visual Back",
	},
	{
		name: "Extension Tube",
	}
];

class EquipmentController
{
	static notFilteredKeys = [
		"password",
		"__v",
		"createdAt",
		"updatedAt",
		"id",
		"_id",
		"logo",
		"url",
	];

	async createEquipmentProfile(observatory_id, profileData)
	{
		const equipmentProfile = await EquipmentProfileModel.create(profileData);
		await ObservatoryModel.findByIdAndUpdate(observatory_id, {
			$push: { equipment_profiles: equipmentProfile._id },
		});
		return equipmentProfile;
	}

	async getProfileEquipment(profile_id)
	{
		const equipment_profile = await EquipmentProfileModel.findById(profile_id);
		await equipment_profile.populate("equipments");
		await equipment_profile.populate("equipments.equipment_type");
		return await Promise.all(
			equipment_profile.equipments.map(async (equipment) => ({
				...equipment._doc,
				manufacturer: await this.getManufacturerById(equipment.manufacturer),
			})),
		);
	}

	async getEquipmentTypes()
	{
		try
		{
			const existingTypes = await EquipmentTypeModel.find();
			const existingNames = existingTypes.map((type) => type.name);
			const typesToAdd = equipmentTypes.filter(
				(newType) => !existingNames.includes(newType.name),
			);

			if (typesToAdd.length > 0)
			{
				const newTypes = await EquipmentTypeModel.create(typesToAdd);
				return [...existingTypes, ...newTypes];
			}

			return existingTypes;
		}
		catch (error)
		{
			logger.error("Error fetching or creating equipment types", error);
		}
	}

	async getEquipmentTypeById(equipmentTypeId)
	{
		const type =
			await EquipmentTypeModel.findById(equipmentTypeId).populate("fields");
		const indiDrivers = await getAllIndiDrivers();

		type.fields.forEach((item) =>
		{
			if (item.label === "INDI Driver")
			{
				item.options = indiDrivers;
			}
		});

		return type;
	}

	async getEquipmentTypeByName(equipmentTypeName)
	{
		const searchTerms = equipmentTypeName.split('-').map(term => 
			term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') 
		);

		const pattern = searchTerms
        	.join('[^a-zA-Z0-9]+');

		const type =
			await EquipmentTypeModel.findOne({ 
				name: {
					$regex: new RegExp(`^${pattern}$`, 'i')
				}
			}).populate("fields");
			
		const indiDrivers = await getAllIndiDrivers();

		type.fields.forEach((item) =>
		{
			if (item.label === "INDI Driver")
			{
				item.options = indiDrivers;
			}
		});

		return type;
	}

	async updateEquipment(username, observatory_id, equipmentId, equipmentData)
	{
		await ObservatoryController.checkObservatoryOwner(username, observatory_id);

		const updatedEquipment = await EquipmentModel.findByIdAndUpdate(
			equipmentId,
			{
				label: equipmentData.label,
				model: equipmentData.model,
				manufacturer: equipmentData.manufacturer,
			},
			{ new: true },
		);
		return updatedEquipment;
	}

	async updateEquipmentProfile(username, observatory_id, profile_id, data)
	{
		await ObservatoryController.checkObservatoryOwner(username, observatory_id);
		const updatedProfile = await EquipmentProfileModel.findByIdAndUpdate(
			profile_id,
			data,
			{ new: true },
		);

		return updatedProfile;
	}

	async addEquipmentModel(profileId, equipmentModelId)
	{
		try
		{
			// Find the equipment profile by ID
			const equipmentProfile = await EquipmentProfileModel.findById(profileId);

			if (!equipmentProfile)
			{
				throw new Error("Equipment profile not found");
			}

			if (!equipmentProfile.equipments.includes(equipmentModelId))
			{
				await this.updateObservatoryAperture(equipmentModelId, profileId);
				// Add the equipment model ID to the equipments array
				equipmentProfile.equipments.push(equipmentModelId);

				// Save the updated profile
				await equipmentProfile.save();
			}
			return equipmentProfile;
		}
		catch (error)
		{
			console.error("Error adding equipment model:", error);
			throw error; // Re-throw the error to handle it in the calling function if needed
		}
	}

	async addEquipment(
		username,
		observatory_id,
		equipment_profile_id,
		equipmentData,
	)
	{
		if (!equipmentData || !mongoose.isValidObjectId(equipmentData?._id))
			throw new Error("Bad input");
		await this.updateObservatoryAperture(
			equipmentData._id,
			equipment_profile_id,
		);
		await ObservatoryController.checkObservatoryOwner(username, observatory_id);
		await EquipmentProfileModel.findByIdAndUpdate(equipment_profile_id, {
			$addToSet: { equipments: equipmentData._id },
		});
	}

	async deleteEquipment(username, equipment_id, observatory_id, profile_id)
	{
		await ObservatoryController.checkObservatoryOwner(username, observatory_id);
		await this.#checkIfProfileInObservatory(observatory_id, profile_id);

		await EquipmentModel.findByIdAndDelete(equipment_id);
	}

	async getValueExamples(equipment_type_id, field_name)
	{
		const res = await EquipmentModel.find({
			equipment_type: equipment_type_id,
		}).populate("equipment_model");
		return [...new Set(res.map((equipment) => equipment[field_name]))];
	}

	async createEquipmentModel(data, logo, username)
	{
		const user = await this.#getUser(username);
		if (data.logo === "undefined" || data.logo === "null") delete data.logo;
		data.optional_fields = JSON.parse(data.optional_fields);
		const equipmentModel = await EquipmentModelSchema.create({
			...data,
			posted_by: user.socialAccount._id,
		});

		const moderationReport = await ModerationReport.findById(
			equipmentModel.moderation_report,
		);
		moderationReport.status = data.submissionStatus;
		moderationReport.tags = data.tags;
		moderationReport.note = data.note;

		await moderationReport.save();

		if (logo)
		{
			const objectName = `products/manufacturers/${data.manufacturer}/products/${equipmentModel._id}`;
			await saveImgInBucket(objectName, logo);
			await EquipmentModelSchema.findByIdAndUpdate(equipmentModel._id, {
				logo: objectName,
			});
			const logoUrl = await getObjectUrl(objectName);
			const populatedEquipmentModel = await EquipmentModelSchema.findById(
				equipmentModel._id,
			)
				.populate("moderation_report")
				.lean();
			return { ...populatedEquipmentModel, logo: logoUrl };
		}

		if (data.submissionStatus === "APPROVED")
		{
			// create notification
			await NotificationModel.create({
				type: "MODEL",
				content: `#${user.socialAccount.social_nickname}# created a new model.`,
				target_users: user.socialAccount._id,
				read_users: [user.socialAccount._id],
				channel: "COMMUNITY",
				role: "REGISTERED",
				actions: [{ type: "Equipment" }],
			});
		}
		else if (data.submissionStatus === "PENDING")
		{
			// create notification
			await NotificationModel.create({
				type: "PENDING",
				content: `#${user.socialAccount.social_nickname}# created a new model.`,
				target_users: user.socialAccount._id,
				read_users: [user.socialAccount._id],
				channel: "COMMUNITY",
				role: "MODERATOR",
				actions: [{ type: "Moderation" }],
			});

			const notification = await NotificationModel.create({
				type: "PENDING",
				content: `Your model is pending. Please wait until it is approved.`,
				target_users: [user.socialAccount._id],
				read_users: [],
				channel: "COMMUNITY",
				role: "REGISTERED",
				actions: [{ type: "Equipment" }],
			});

			const transporter = nodemailer.createTransport({
				host: smtp_host,
				port: smtp_port,
				secure: false,
				auth: {
					user: smtp_user,
					pass: smtp_pass,
				},
			});

			// Updated email content for Equipment Model pending notification
			const creatorEmailHtml = generateEmailTemplate(
				'New Equipment Model Request',
				user.socialAccount.social_nickname,
				`<strong>${user.socialAccount.social_nickname}</strong> has submitted a request to create a new equipment model.<br><br>
				Your equipment model submission is currently pending review by our team. You will be notified once it has been approved or if additional information is needed.`,
				'Go to the Equipment Page',
				`${app_url}community/equipment`
			);
	
			await transporter.sendMail({
				from: {
					name: smtp_from_name,
					address: smtp_from_email,
				},
				to: user.email, // Send to the submitter
				subject: 'Your Equipment Model Request is Pending Review',
				text: `Hello ${user.socialAccount.social_nickname},

Thank you for submitting a new equipment model. Your request is currently pending review by our team.
You will be notified once it has been approved or if additional information is needed.

To view the status of your equipment model request, please visit:
${app_url}community/equipment`,
				html: creatorEmailHtml
			});

			const targetUserNames = await this.getTargetUserNames(
				notification.target_users,
			);
			wssMessageManager.sendMessageByUsernames(targetUserNames, {
				notification,
				type: "new_unread_notification",
			});
		}

		// Populate the moderation report before returning
		const populatedEquipmentModel = await EquipmentModelSchema.findById(
			equipmentModel._id,
		)
			.populate("moderation_report")
			.lean();
		return populatedEquipmentModel;
	}

	async updateEquipmentModel(id, data, logo)
	{
		if (data.logo === "undefined" || data.logo === "null")
		{
			delete data.logo;
		}
		data.optional_fields = JSON.parse(data.optional_fields);
		const equipmentModel = await EquipmentModelSchema.findById(id);
		if (!equipmentModel)
		{
			throw new Error("EquipmentModel not found");
		}

		// Update the equipment model
		Object.assign(equipmentModel, data);
		await equipmentModel.save();

		// Update moderation report
		const moderationReport = await ModerationReport.findById(
			equipmentModel.moderation_report,
		);
		moderationReport.status = data.submissionStatus;
		moderationReport.tags = data.tags;
		moderationReport.note = data.note;
		await moderationReport.save();

		// Handle logo upload if provided
		if (logo)
		{
			const objectName = `products/manufacturers/${data.manufacturer}/products/${equipmentModel._id}`;
			await saveImgInBucket(objectName, logo);
			equipmentModel.logo = objectName;
			await equipmentModel.save();
		}

		// Get logo URL if exists
		let logoUrl;
		if (equipmentModel.logo && equipmentModel.logo !== "undefined")
		{
			logoUrl = await getObjectUrl(equipmentModel.logo);
		}

		// Get manufacturer details
		await equipmentModel.populate(["manufacturer", "equipment_type"]);
		const manufacturerName = equipmentModel.manufacturer?.name;
		const equipmentTypeName = equipmentModel.equipment_type?.name;

		// Return updated model with required fields
		return {
			...equipmentModel.toObject(),
			logo: logoUrl,
			manufacturerName,
			equipmentTypeName,
			moderation_report: moderationReport
		};
	}

	async createManufacturer(data, logo, username)
	{
		const user = await this.#getUser(username);
		data.equipment_types = data.equipment_types.map(
			(item) => new mongoose.Types.ObjectId(item),
		);
		if (data.logo === "undefined" || data.logo === "null") delete data.logo;
		await this.#checkIfManufacturerExist(data.name);
		const manufacturer = await ManufacturerModel.create({
			...data,
			posted_by: user.socialAccount._id,
		});
		const moderationReport = await ModerationReport.findById(
			manufacturer.moderation_report,
		);
		moderationReport.status = data.submissionStatus;
		moderationReport.tags = data.tags;
		moderationReport.note = data.note;
		await moderationReport.save();

		if (logo)
		{
			const objectName = `products/manufacturers/${manufacturer._id}/logo`;
			await saveImgInBucket(objectName, logo);
			await ManufacturerModel.findByIdAndUpdate(manufacturer._id, {
				logo: objectName,
			});
			const logoUrl = await getObjectUrl(objectName);
			const populatedManufacturer = await ManufacturerModel.findById(
				manufacturer._id,
			)
				.populate("moderation_report")
				.lean();
			return { ...populatedManufacturer, logo: logoUrl };
		}

		if (data.submissionStatus === "APPROVED")
		{
			// create notification
			await NotificationModel.create({
				type: "MANUFACTURER",
				content: `#${user.socialAccount.social_nickname}# created a new manufacturer.`,
				target_users: user.socialAccount._id,
				read_users: [user.socialAccount._id],
				channel: "COMMUNITY",
				role: "REGISTERED",
				actions: [{ type: "Equipment" }],
			});
		}
		else if (data.submissionStatus === "PENDING")
		{
			// create notification
			await NotificationModel.create({
				type: "PENDING",
				content: `#${user.socialAccount.social_nickname}# created a new manufacturer.`,
				target_users: user.socialAccount._id,
				read_users: [user.socialAccount._id],
				channel: "COMMUNITY",
				role: "MODERATOR",
				actions: [{ type: "Moderation" }],
			});

			const notification = await NotificationModel.create({
				type: "PENDING",
				content: `Your manufacturer is pending. Please wait until it is approved.`,
				target_users: [user.socialAccount._id],
				read_users: [],
				channel: "COMMUNITY",
				role: "REGISTERED",
				actions: [{ type: "Equipment" }],
			});

			const transporter = nodemailer.createTransport({
				host: smtp_host,
				port: smtp_port,
				secure: false,
				auth: {
					user: smtp_user,
					pass: smtp_pass,
				},
			});
	
			// Updated email content for manufacturer pending notification
			const creatorEmailHtml = generateEmailTemplate(
				'New Manufacturer Request',
				user.socialAccount.social_nickname,
				`<strong>${user.socialAccount.social_nickname}</strong> has submitted a request to create a new manufacturer.<br><br>
				Your manufacturer submission is currently pending review by our team. You will be notified once it has been approved or if additional information is needed.`,
				'Go to the Equipment Page',
				`${app_url}community/equipment`
			);
	
			await transporter.sendMail({
				from: {
					name: smtp_from_name,
					address: smtp_from_email,
				},
				to: user.email, // Send to the submitter
				subject: 'Your Manufacturer Request is Pending Review',
				text: `Hello ${user.socialAccount.social_nickname},

Thank you for submitting a new manufacturer. Your request is currently pending review by our team.
You will be notified once it has been approved or if additional information is needed.

To view the status of your manufacturer request, please visit:
${app_url}community/equipment`,
				html: creatorEmailHtml
			});

			const targetUserNames = await this.getTargetUserNames(
				notification.target_users,
			);
			wssMessageManager.sendMessageByUsernames(targetUserNames, {
				notification,
				type: "new_unread_notification",
			});
		}

		// Populate the moderation report before returning
		const populatedManufacturer = await ManufacturerModel.findById(
			manufacturer._id,
		)
			.populate("moderation_report")
			.lean();

		return populatedManufacturer;
	}

	async handleManufacturerNotification(sourceId, action) {
		const manufacturer = await ManufacturerModel.findById(sourceId);
		const user = await UserModel.findOne({ socialAccount: manufacturer.posted_by }).populate("socialAccount");

		if(action === "APPROVED") {
			const notification = await NotificationModel.create({
				type: "MANUFACTURER",
				content: `Your manufacturer has been approved.`,
				target_users: [user.socialAccount._id],
				read_users: [],
				channel: "COMMUNITY",
				role: "REGISTERED",
				actions: [{ type: "Equipment" }],
			});

			const targetUserNames = await this.getTargetUserNames(
				notification.target_users,
			);
			wssMessageManager.sendMessageByUsernames(targetUserNames, {
				notification,
				type: "new_unread_notification",
			});
		} else if(action === "REJECTED") {
			const notification = await NotificationModel.create({
				type: "MANUFACTURER",
				content: `Your manufacturer has been rejected.`,
				target_users: [user.socialAccount._id],
				read_users: [],
				channel: "COMMUNITY",
				role: "REGISTERED",
				actions: [{ type: "Equipment" }],
			});

			const transporter = nodemailer.createTransport({
				host: smtp_host,
				port: smtp_port,
				secure: false,
				auth: {
					user: smtp_user,
					pass: smtp_pass,
				},
			});

			const creatorEmailHtml = generateEmailTemplate(
				'Manufacturer Rejected',
				user.socialAccount.social_nickname,
				`Your manufacturer has been rejected.`,
				'Go to the Equipment Page',
				`${app_url}community/equipment`
			);

			await transporter.sendMail({
				from: {
					name: smtp_from_name,
					address: smtp_from_email,
				},
				to: user.email,
				subject: 'Your manufacturer has been rejected',
				text: `Hello ${user.socialAccount.social_nickname},

Your manufacturer has been rejected.`,
				html: creatorEmailHtml
			});

			const targetUserNames = await this.getTargetUserNames(
				notification.target_users,
			);
			wssMessageManager.sendMessageByUsernames(targetUserNames, {
				notification,
				type: "new_unread_notification",
			});
		}
	}

	async handleModelNotification(sourceId, action) {
		const model = await EquipmentModelSchema.findById(sourceId);
		const user = await UserModel.findOne({ socialAccount: model.posted_by }).populate("socialAccount");

		if(action === "APPROVED") {
			const notification = await NotificationModel.create({
				type: "MODEL",
				content: `Your model has been approved.`,
				target_users: [user.socialAccount._id],
				read_users: [],
				channel: "COMMUNITY",
				role: "REGISTERED",
				actions: [{ type: "Equipment" }],
			});

			const targetUserNames = await this.getTargetUserNames(
				notification.target_users,
			);
			wssMessageManager.sendMessageByUsernames(targetUserNames, {
				notification,
				type: "new_unread_notification",
			});
		} else if(action === "REJECTED") {
			const notification = await NotificationModel.create({
				type: "MODEL",
				content: `Your model has been rejected.`,
				target_users: [user.socialAccount._id],
				read_users: [],
				channel: "COMMUNITY",
				role: "REGISTERED",
				actions: [{ type: "Equipment" }],
			});

			const transporter = nodemailer.createTransport({
				host: smtp_host,
				port: smtp_port,
				secure: false,
				auth: {
					user: smtp_user,
					pass: smtp_pass,
				},
			});

			const creatorEmailHtml = generateEmailTemplate(
				'Model Rejected',
				user.socialAccount.social_nickname,
				`Your model has been rejected.`,
				'Go to the Equipment Page',
				`${app_url}community/equipment`
			);

			await transporter.sendMail({
				from: {
					name: smtp_from_name,
					address: smtp_from_email,
				},
				to: user.email,
				subject: 'Your model has been rejected',
				text: `Hello ${user.socialAccount.social_nickname},

Your model has been rejected.`,
				html: creatorEmailHtml
			});

			const targetUserNames = await this.getTargetUserNames(
				notification.target_users,
			);
			wssMessageManager.sendMessageByUsernames(targetUserNames, {
				notification,
				type: "new_unread_notification",
			});
		}
	}

	async #getUser(username)
	{
		const user = await UserModel.findOne({ username }).populate(
			"socialAccount",
		);
		if (!user) throw new Error("User not found");
		return user;
	}

	async updateModerationStatus(entity, action)
	{
		const status =
			action === "unpublish"
				? "PENDING"
				: action === "trash"
					? "TRASHED"
					: action === "blacklist"
						? "BLACKLISTED"
						: "REJECTED";

		if (entity.moderation_report)
		{
			// Fetch the existing moderation report and update its status
			const moderationReport = await ModerationReport.findById(
				entity.moderation_report,
			);
			if (moderationReport)
			{
				moderationReport.status = status;
				await moderationReport.save();
			}
		}
		else
		{
			// Create a new moderation report and associate it with the entity
			const moderationReport = new ModerationReport({ status });
			await moderationReport.save();
			entity.moderation_report = moderationReport._id;
			await entity.save();
		}
	}

	async processEntity(itemId, type, action)
	{
		let entity;
		if (type === "manufacturer")
		{
			entity = await ManufacturerModel.findById(itemId);
		}
		else if (type === "model")
		{
			entity = await EquipmentModelSchema.findById(itemId);
		}

		if (entity)
		{
			await this.updateModerationStatus(entity, action);
		}
	}

	async equipmentsModeration(data)
	{
		const { items, type, action } = data;
		const promises = items.map((item) =>
			this.processEntity(item, type, action),
		);
		await Promise.all(promises);
		return true;
	}

	async getTargetUserNames(targetUserIds)
	{
		let targetUserNames = await Promise.all(
			targetUserIds.map(async (item) =>
			{
				let targetUser = await UserModel.findOne({ socialAccount: item });
				return targetUser.username;
			}),
		);
		return targetUserNames;
	}

	async updateManufacturer(id, data, logo)
	{
		if (data.equipment_types)
		{
			data.equipment_types = data.equipment_types.map(
				(item) => new mongoose.Types.ObjectId(item),
			);
		}

		if (data.logo === "undefined" || data.logo === "null")
		{
			delete data.logo;
		}

		// Check if the manufacturer exists. You can reuse the existing checkIfManufacturerExist method with necessary adjustments if needed.
		const manufacturer = await ManufacturerModel.findById(id);
		if (!manufacturer)
		{
			throw new Error("Manufacturer not found");
		}

		// Update the manufacturer data
		Object.assign(manufacturer, data);
		await manufacturer.save();

		const moderationReport = await ModerationReport.findById(
			manufacturer.moderation_report,
		);
		moderationReport.status = data.submissionStatus;
		moderationReport.tags = data.tags;
		moderationReport.note = data.note;

		if (logo)
		{
			const objectName = `products/manufacturers/${manufacturer._id}/logo`;
			await saveImgInBucket(objectName, logo);
			await ManufacturerModel.findByIdAndUpdate(manufacturer._id, {
				logo: objectName,
			});
			const logoUrl = await getObjectUrl(objectName);
			const populatedManufacturer = await ManufacturerModel.findById(
				manufacturer._id,
			)
				.populate("moderation_report")
				.lean();
			return { ...populatedManufacturer, logo: logoUrl };
		}

		let logoUrl;
		if (manufacturer.logo && manufacturer.logo !== "undefined") {
			logoUrl = await getObjectUrl(manufacturer.logo);
		}

		const populatedManufacturer = await ManufacturerModel.findById(
			manufacturer._id,
		)
			.populate("moderation_report")
			.lean();
		return {
			...populatedManufacturer,
			logo: logoUrl
		};
	}

	async getManufacturers()
	{
		const manufacturers =
			await ManufacturerModel.find().populate("moderation_report");
		return await Promise.all(
			manufacturers.map(async (manufacturer) => ({
				...manufacturer._doc,
				logo: manufacturer.logo ? await getObjectUrl(manufacturer.logo) : null,
			})),
		);
	}

	async getPendingManufacturers()
	{
		const manufacturers = await ManufacturerModel.aggregate([
			{ $sort: { createdAt: -1 } },
			{
				$lookup: {
					from: "moderationreports",
					as: "moderation_report",
					foreignField: "_id",
					localField: "moderation_report",
				},
			},
			{
				$addFields: {
					moderation_report: { $arrayElemAt: ["$moderation_report", 0] },
				},
			},
			{
				$match: {
					"moderation_report.status": "PENDING",
				},
			},
			{
				$lookup: {
					from: "socials",
					as: "posted_by",
					foreignField: "_id",
					localField: "posted_by",
				},
			},
			{
				$addFields: {
					posted_by: { $arrayElemAt: ["$posted_by", 0] },
				},
			},
		]);
		return await Promise.all(
			manufacturers.map(async (manufacturer) => ({
				...manufacturer,
				posted_by: {
					...manufacturer.posted_by,
					avatar: manufacturer.posted_by?.avatar
						? await getObjectUrl(manufacturer.posted_by.avatar)
						: null,
				},
				logo: manufacturer.logo ? await getObjectUrl(manufacturer.logo) : null,
			})),
		);
	}

	async getModels()
	{
		const models =
			await EquipmentModelSchema.find().populate("moderation_report");
		return await Promise.all(
			models.map(async (model) => ({
				...model,
				logo: model.logo ? await getObjectUrl(model.logo) : null,
			})),
		);
	}

	async getModelsWithAggregation({ page = 0, limit = 20, search = "" })
	{
		try
		{
			const skip = page * Number(limit);
			const matchStage = search
				? {
						$match: {
							label: { $regex: search, $options: "i" },
						},
					}
				: null;

			const pipeline = [
				...(matchStage ? [matchStage] : []),
				{ $sort: { label: 1 } },
				{ $skip: skip },
				{ $limit: limit },
				{
					$lookup: {
						from: "moderationreports",
						localField: "moderation_report",
						foreignField: "_id",
						as: "moderation_report",
					},
				},
				{
					$addFields: {
						moderation_report: { $arrayElemAt: ["$moderation_report", 0] },
					},
				},
				{
					$match: {
						"moderation_report.status": "APPROVED"
					}
				},
				{
					$lookup: {
						from: "equipmenttypes",
						localField: "equipment_type",
						foreignField: "_id",
						as: "equipment_type",
					},
				},
				{
					$addFields: {
						equipment_type: { $arrayElemAt: ["$equipment_type", 0] },
					},
				},
				{
					$lookup: {
						from: "manufacturers",
						localField: "manufacturer",
						foreignField: "_id",
						as: "manufacturer",
					},
				},
				{
					$addFields: {
						manufacturer: { $arrayElemAt: ["$manufacturer", 0] },
					},
				},
			];

			const total = search
				? await EquipmentModelSchema.aggregate([
						...(matchStage ? [matchStage] : []),
						{ $count: "totalCount" },
					]).then((res) => (res[0] ? res[0].totalCount : 0))
				: await EquipmentModelSchema.countDocuments();

			const models = await EquipmentModelSchema.aggregate(pipeline);

			return {
				models,
				total,
				totalPages: Math.ceil(total / limit),
				currentPage: page,
			};
		}
		catch (error)
		{
			console.error("Error fetching models with aggregation:", error);
			throw error;
		}
	}

	async getPendingModels()
	{
		const models = await EquipmentModelSchema.aggregate([
			{ $sort: { createdAt: -1 } },
			{
				$lookup: {
					from: "manufacturers", 
					localField: "manufacturer",
					foreignField: "_id",
					as: "manufacturerDoc"
				}
			},
			{
				$addFields: {
					manufacturerName: { $arrayElemAt: ["$manufacturerDoc.name", 0] }
				}
			},
			{
				$lookup: {
					from: "equipmenttypes", 
					localField: "equipment_type",
					foreignField: "_id",
					as: "equipmentTypeDoc"
				}
			},
			{
				$addFields: {
					equipmentTypeName: { $arrayElemAt: ["$equipmentTypeDoc.name", 0] }
				}
			},
			{
				$lookup: {
					from: "moderationreports",
					as: "moderation_report",
					foreignField: "_id", 
					localField: "moderation_report"
				}
			},
			{
				$addFields: {
					moderation_report: { $arrayElemAt: ["$moderation_report", 0] }
				}
			},
			{
				$match: {
					"moderation_report.status": "PENDING"
				}
			},
			{
				$lookup: {
					from: "socials",
					as: "posted_by",
					foreignField: "_id",
					localField: "posted_by"
				}
			},
			{
				$addFields: {
					posted_by: { $arrayElemAt: ["$posted_by", 0] }
				}
			}
		]);
		return await Promise.all(
			models.map(async (model) => ({
				...model,
				posted_by: {
					...model.posted_by,
					avatar: model.posted_by?.avatar
						? await getObjectUrl(model.posted_by.avatar)
						: null,
				},
				logo: model.logo ? await getObjectUrl(model.logo) : null,
			})),
		);
	}

	async getManufacturersByEquipmentTypeId(equipmentTypeId)
	{
		const equipmentTypeObjectId = new mongoose.Types.ObjectId(equipmentTypeId);

		let manufacturers = await ManufacturerModel.aggregate([
			{ $sort: { createdAt: -1 } },
			{
				$match: {
					equipment_types: { $in: [equipmentTypeObjectId] },
				},
			},
			{
				$lookup: {
					from: "moderationreports",
					as: "moderation_report",
					foreignField: "_id",
					localField: "moderation_report",
				},
			},
			{
				$addFields: {
					moderation_report: { $arrayElemAt: ["$moderation_report", 0] },
				},
			},
			{
				$match: {
					"moderation_report.status": "APPROVED",
				},
			},
		]);

		return await Promise.all(
			manufacturers.map(async (manufacturer) => ({
				...manufacturer,
				logo: manufacturer.logo ? await getObjectUrl(manufacturer.logo) : null,
			})),
		);
	}

	async getEquipmentModelsByEquipmentTypeAndManufacturer(
		equipmentTypeId,
		manufacturerId,
	)
	{
		const equipmentTypeObjectId = new mongoose.Types.ObjectId(equipmentTypeId);
		const manufacturerObjectId = new mongoose.Types.ObjectId(manufacturerId);
		const equipmentModels = await EquipmentModelSchema.aggregate([
			{ $sort: { createdAt: -1 } },
			{
				$match: {
					equipment_type: equipmentTypeObjectId,
					manufacturer: manufacturerObjectId,
				},
			},
			{
				$lookup: {
					from: "moderationreports",
					as: "moderation_report",
					foreignField: "_id",
					localField: "moderation_report",
				},
			},
			{
				$addFields: {
					moderation_report: { $arrayElemAt: ["$moderation_report", 0] },
				},
			},
			{
				$match: {
					"moderation_report.status": "APPROVED",
				},
			},
		]);

		return await Promise.all(
			equipmentModels.map(async (equipmentModel) => ({
				...equipmentModel,
				logo: equipmentModel.logo
					? await getObjectUrl(equipmentModel.logo)
					: null,
			})),
		);
	}

	async getEquipmentModelById(id)
	{
		const equipmentModel = await EquipmentModelSchema.findById(id)
			.populate("manufacturer")
			.populate("moderation_report")
			.populate("posted_by");
		if (equipmentModel.logo && equipmentModel.logo !== "undefined")
		{
			const logoUrl = await getObjectUrl(equipmentModel.logo);
			equipmentModel.logo = logoUrl;
		}
		else
		{
			equipmentModel.logo = null;
		}
		return equipmentModel;
	}

	async getEquipmentModelByName(name) {
		// Strip everything except alphanumeric characters
		const searchTerm = name
			.toLowerCase()
			.replace(/[^a-z0-9]/g, '');  // Remove ALL non-alphanumeric chars
			
		const pattern = searchTerm
			.split('')  // Split into individual characters
			.join('[^a-z0-9]*');  // Allow any non-alphanumeric chars between each character

		const equipmentModel = await EquipmentModelSchema.findOne({ 
			label: {
				$regex: new RegExp(pattern, 'i')  // Case insensitive search
			}
		})
		.populate("manufacturer")
		.populate("moderation_report")
		.populate("posted_by");

		if (!equipmentModel) {
			return null;
		}

		if (equipmentModel.logo && equipmentModel.logo !== "undefined") {
			const logoUrl = await getObjectUrl(equipmentModel.logo);
			equipmentModel.logo = logoUrl;
		} else {
			equipmentModel.logo = null;
		}
		return equipmentModel;
	}

	async getManufacturerById(id)
	{
		const manufacturer =
			await ManufacturerModel.findById(id).populate("moderation_report");
		if (manufacturer.logo && manufacturer.logo !== "undefined")
		{
			const logoUrl = await getObjectUrl(manufacturer.logo);
			manufacturer.logo = logoUrl;
		}
		else
		{
			manufacturer.logo = null;
		}
		return manufacturer;
	}

	async getManufacturerByName(name)
	{
		const searchTerms = name.split('-').map(term => 
			term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') // Escape regex special chars
		);

		const pattern = searchTerms
			.join('[^a-zA-Z0-9]+');

		const manufacturer =
			await ManufacturerModel.findOne({ 
				name: {
					$regex: new RegExp(`^${pattern}$`, 'i')
				}
			}).populate("moderation_report");
		if (manufacturer.logo && manufacturer.logo !== "undefined")
		{
			const logoUrl = await getObjectUrl(manufacturer.logo);
			manufacturer.logo = logoUrl;
		}
		else
		{
			manufacturer.logo = null;
		}
		return manufacturer;
	}

	async getEquipmentByType(
		username,
		observatoryId,
		equipmentProfileId,
		equipmentType,
	)
	{
		const equipments = await this.getProfileEquipment(equipmentProfileId);
		return await Promise.all(
			equipments.map(async (equipment) =>
			{
				const equipment_type = await EquipmentTypeModel.findById(
					equipment.equipment_type,
				);
				return { ...equipment, equipment_type };
			}),
		);
	}

	async getFilteredValues(modelName, filters, isAdmin)
	{
		const model = await getMongooseModelByName(modelName);

		if (!model) throw new Error(`Model with name ${modelName} not found`);

		const { aggregatePipeline, countPipeline } =
			getMongooseDefaultAggregatePipeline({
				...filters,
				...(!isAdmin && "moderation_report" in model?.schema?.obj
					? { "moderation_report.status": "APPROVED" }
					: {}),
			});

		const res = await model.aggregate([
			{
				$facet: {
					data: [
						...aggregatePipeline,
						{
							$lookup: {
								from: "moderationreports",
								localField: "moderation_report",
								foreignField: "_id",
								as: "moderation_report",
							},
						},
						{
							$addFields: {
								moderation_report: { $arrayElemAt: ["$moderation_report", 0] },
							},
						},
					],
					count: countPipeline,
				},
			},
		]);

		return {
			data: res?.[0]?.data ?? [],
			count: res?.[0]?.count?.[0]?.totalCount ?? 0,
		};
	}

	async getFiltersForModel(modelName)
	{
		const model = await getMongooseModelByName(modelName);
		if (!model) throw new Error(`Model with name ${modelName} not found`);

		const data = await FilterModel.find({ model: { $in: model.modelName } });
		return data;
	}

	async updateObservatoryAperture(modelId, equipmentProfileId)
	{
		try
		{
			const observatory = await ObservatoryModel.findOne({
				equipment_profiles: equipmentProfileId,
			});

			const model =
				await EquipmentModelSchema.findById(modelId).populate("equipment_type");

			if (!observatory || !model) return;

			if ("aperture" in model?.optional_fields)
			{
				const shouldUpdate =
					isNaN(observatory.aperture) ||
					+observatory.aperture < +model?.optional_fields?.aperture;
				if (shouldUpdate)
				{
					await ObservatoryModel.findByIdAndUpdate(observatory._id, {
						aperture: +model.optional_fields?.aperture,
					});
				}
			}
		}
		catch (error)
		{
			logger.error("Error updating observatory aperture", error, {
				modelId,
				equipmentProfileId
			});
		}
	}

	async #checkIfProfileInObservatory(observatory_id, profile_id)
	{
		const observatory = await ObservatoryModel.findById(observatory_id);
		if (!observatory.equipment_profiles.includes(profile_id))
			throw new Error(
				"Equipment profile does not belong to provided observatory",
			);
	}

	async #checkIfTypeExist(type_id)
	{
		const equipmentType = await EquipmentTypeModel.findById(type_id);
		if (!equipmentType)
			throw new Error("Provided equipment type does not exist");
	}

	async #checkIfManufacturerExist(name)
	{
		const manufacturer = await ManufacturerModel.findOne({
			name: new RegExp(escapeRegExp(name), "i"),
		});
		if (manufacturer)
			throw new Error(`Manufacturer with name ${name} already exist`);
	}

	async deleteEquipmentFromProfile(equipment_id, profile_id)
	{
		await EquipmentProfileModel.findByIdAndUpdate(
			{ _id: profile_id },
			{ $pull: { equipments: equipment_id } },
		);
	}

	async deleteEquipmentProfile(profile_id, observatory_id)
	{
		await ObservatoryModel.findByIdAndUpdate(observatory_id, {
			$pull: { equipment_profiles: profile_id },
		});
		await EquipmentProfileModel.findByIdAndDelete(profile_id);
	}

	async checkIndiDriversInDatabase(indiDrivers) {
		if (!indiDrivers || !Array.isArray(indiDrivers) || indiDrivers.length === 0) {
			return {};
		}

		const results = {};
		
		// Check each INDI driver to see if it exists in any equipment model's optional_fields.indi_driver
		for (const driver of indiDrivers) {
			// Look for models where the indi_driver field contains this driver
			const models = await EquipmentModelSchema.find({
				$or: [
					{ "optional_fields.indi_driver": driver },
					{ "optional_fields.indi_driver": { $in: [driver] } }
				]
			});
			
			// If any models are found, this driver exists in the database
			results[driver] = models.length > 0;
		}
		
		return results;
	}

	async getIndiDrivers() {
		try {
			const indiDrivers = await getAllIndiDrivers();
			return indiDrivers;
		} catch (error) {
			logger.error("Error fetching INDI drivers", error);
			return [];
		}
	}
}

module.exports = new EquipmentController();
