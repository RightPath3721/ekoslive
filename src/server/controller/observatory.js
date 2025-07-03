const mongoose = require("mongoose");
const { get } = require("lodash");
const ObservatoryModel = require("../models/observatory/observatory");
const UserModel = require("../models/user");
const BookingModel = require("../models/observatory/booking");
const LocationController = require("./location");
const SocialController = require("./social");
const MessageController = require("./message");
const findOwner = require("../utils/findOwner");
const { saveImgInBucket, getObjectUrl, deleteImgFromBucket } = require("../utils/minio");
const ModerationReport = require("../models/moderation/moderationReport");
const { wssMessageManager } = require("../websocket");
const NotificationModel = require("../models/notification");
const BookingLogModel = require("../models/observatory/bookingLog");
const logger = require("../logger");
const reminderService = require("../services/reminderService");
const {
	secret,
	server,
	stellarmateWebsiteUrl,
	ekoslive_non,
	recaptcha_secret_key,
	cleantalk_api_key,
	smtp_host,
	smtp_port,
	smtp_user,
	smtp_pass,
	smtp_from_name,
	smtp_from_email,
	app_url,
	joomlaApiKey,
	reminder_delay_hours,
} = require("../config");
const nameConvertorForURL = require("../utils/nameConvertorForURL");
const nodemailer = require("nodemailer");
const fs = require('fs');
const path = require('path');
const moment = require('moment');

class ObservatoryController
{
	async createObservatory(username, observatoryData, files)
	{
		const user = await UserModel.findOne({ username }).populate(
			"socialAccount",
		);
		if (observatoryData.location && observatoryData.location !== "null")
		{
			const location = await LocationController.createLocation(
				observatoryData.location,
			);
			observatoryData.location = location;
		}
		const observatory = await ObservatoryModel.create({
			...observatoryData,
			status: "disabled",
			hours_used: 0,
			location: observatoryData.location ? observatoryData.location._id : null,
			posted_by: user.socialAccount._id,
			accessList: [{
				username: user.username,
				role: "master"
			}]
		});
		const moderationReport = await ModerationReport.findById(
			observatory.moderation_report,
		);
		moderationReport.status = observatoryData.submissionStatus;
		moderationReport.tags = observatoryData.tags;
		moderationReport.note = observatoryData.note;

		await moderationReport.save();
		await UserModel.findByIdAndUpdate(user._id, {
			$setOnInsert: { observatories: [] },
		});

		await UserModel.findByIdAndUpdate(user._id, {
			$push: { observatories: observatory._id },
		}).then((doc) =>
		{
			if (doc === null)
			{
				throw new Error("Error creating observatory");
			}
		});
		if (observatoryData.submissionStatus === "PENDING")
		{
			await this.createNotification(user, observatoryData);
		}
		if (!files) return observatory; // If no files, return observatory

		// Processing each file
		const photoPromises = files.map(async (file, index) =>
		{
			const objectName = `users/observatories/${observatory._id}/${index}`; // Include a unique part in the object name if necessary
			await saveImgInBucket(objectName, file);
			return objectName;
		});

		const photoNames = await Promise.all(photoPromises);

		const updatedObservatory = await ObservatoryModel.findByIdAndUpdate(
			observatory._id,
			{ $push: { photos: { $each: photoNames } } },
			{ new: true },
		);
		await Promise.all(
			updatedObservatory.photos.map(async (photo, idx) =>
			{
				const url = await getObjectUrl(photo);
				updatedObservatory.photos[idx] = url;
			}),
		);
		await updatedObservatory.populate("location");
		return updatedObservatory;
	}

	async createNotification(user, observatoryData)
	{
		await NotificationModel.create({
			type: "PENDING",
			content: `#${user.socialAccount.social_nickname}# created a new observatory.`,
			target_users: user.socialAccount._id,
			read_users: [user.socialAccount._id],
			channel: "COMMUNITY",
			role: "MODERATOR",
			actions: [{ type: "Moderation" }],
		});

		const notification = await NotificationModel.create({
			type: "PENDING",
			content: `Your observatory is pending. Please wait until it is approved.`,
			target_users: [user.socialAccount._id],
			read_users: [],
			channel: "COMMUNITY",
			role: "REGISTERED",
			actions: [{ type: "Observatory" }],
		});

		const targetUserNames = await this.getTargetUserNames(
			notification.target_users,
		);
		wssMessageManager.sendMessageByUsernames(targetUserNames, {
			notification,
			type: "new_unread_notification",
		});
	}

	async getTargetUserNames(targetUserIds)
	{
		const targetUserNames = await Promise.all(
			targetUserIds.map(async (item) =>
			{
				const targetUser = await UserModel.findOne({ socialAccount: item });
				if (!targetUser) return null;
				return targetUser.username;
			}),
		);
		return targetUserNames.filter((username) => !!username);
	}

	async getObservatories(username)
	{
		const owner = await findOwner(username);
		await owner.populate("observatories");
		return owner.observatories;
	}

	async getPendingObservatories()
	{
		const observatories = await ObservatoryModel.aggregate([
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
			observatories.map(async (observatory) =>
			{
				const postedByAvatar = observatory.posted_by?.avatar
					? await getObjectUrl(observatory.posted_by.avatar)
					: null;

				const photos = await Promise.all(
					observatory.photos.map(async (photo) =>
					{
						return await getObjectUrl(photo);
					}),
				);

				return {
					...observatory,
					posted_by: {
						...observatory.posted_by,
						avatar: postedByAvatar,
					},
					photos: photos,
				};
			}),
		);
	}

	async getObservatoryById(observatoryId)
	{
		const observatory = await ObservatoryModel.findById(observatoryId).populate("location");

		return observatory;
	}

	async updateObservatoryById(username, observatoryId, data, files)
	{
		await this.checkObservatoryOwner(username, observatoryId);
		if (get(data, "machine_id", false))
		{
			await this.checkIfMachineIdExists(data.machine_id);
		}

		if (data.location)
		{
			await LocationController.updateLocationByObservatoryId(
				observatoryId,
				data.location,
			);
			delete data.location;
		}

		const observatory = await ObservatoryModel.findByIdAndUpdate(
			observatoryId,
			data,
			{ new: true },
		);

		const moderationReport = await ModerationReport.findById(
			observatory.moderation_report,
		);
		moderationReport.status = data.submissionStatus;
		moderationReport.tags = data.tags;
		moderationReport.note = data.note;

		await moderationReport.save();
		await observatory.populate("location");
		await Promise.all(
			observatory.photos.map(async (photo, idx) =>
			{
				const url = await getObjectUrl(photo);
				observatory.photos[idx] = url;
			}),
		);
		if (!files) return observatory;

		const lastPhotoIndex = observatory.photos.length > 0
			? Math.max(...observatory.photos.map(photo => parseInt(photo.split('/').pop())))
			: -1;

		const photoPromises = files.map(async (file, index) =>
		{
			const objectName = `users/observatories/${observatory._id}/${lastPhotoIndex + 1 + index}`;
			await saveImgInBucket(objectName, file);
			return objectName;
		});

		const photoNames = await Promise.all(photoPromises);

		const updatedObservatory = await ObservatoryModel.findByIdAndUpdate(
			observatory._id,
			{ $push: { photos: photoNames } },
			{ new: true },
		);
		await Promise.all(
			updatedObservatory.photos.map(async (photo, idx) =>
			{
				const url = await getObjectUrl(photo);
				updatedObservatory.photos[idx] = url;
			}),
		);
		await updatedObservatory.populate("location");
		return updatedObservatory;
	}

	async getObservatoriesEquipmentProfiles(observatoryId)
	{
		const observatory = await this.getObservatoryById(observatoryId);
		await observatory.populate("equipment_profiles");
		return observatory.equipment_profiles;
	}

	async deleteObservatory(username, observatoryId)
	{
		await this.checkObservatoryOwner(username, observatoryId);
		try
		{
			await ObservatoryModel.findOneAndDelete({ _id: observatoryId });
			// Find users who have this observatory in their observatories array
			const user = await UserModel.findOne({ observatories: observatoryId });
			if (user)
			{
				user.observatories = user.observatories.filter(id => id.toString() !== observatoryId.toString());
				await UserModel.findByIdAndUpdate(user._id, { $set: { observatories: user.observatories } });
			}
		}
		catch (error)
		{
			logger.error("Error deleting observatory", error, {
				username,
				observatoryId
			});
			throw new Error("Error when deleting an observatory, please try again");
		}
	}

	async deleteObservatoryImage(username, observatoryId, imageIndex)
	{
		await this.checkObservatoryOwner(username, observatoryId);
		const observatory = await ObservatoryModel.findById(observatoryId).setOptions({ skipPhotoTransform: true });

		if (!observatory)
		{
			throw new Error('Observatory not found');
		}

		if (imageIndex < 0)
		{
			throw new Error('Invalid image index');
		}

		const photoToRemove = `users/observatories/${observatoryId}/${imageIndex}`;

		try
		{
			await deleteImgFromBucket(photoToRemove);
			const updatedObservatory = await ObservatoryModel.findByIdAndUpdate(
				observatoryId,
				{ $pull: { photos: photoToRemove } },
				{ new: true }
			);
			await Promise.all(
				updatedObservatory.photos.map(async (photo, idx) =>
				{
					const url = await getObjectUrl(photo);
					updatedObservatory.photos[idx] = url;
				})
			);
			return updatedObservatory;
		} catch (error)
		{
			logger.error("Error deleting observatory image", error, {
				username,
				observatoryId,
				imageIndex,
				photoToRemove
			});
			throw new Error('Failed to delete observatory image');
		}
	}

	async getObservatoriesLocation(observatoriesIds)
	{
		const observatories = await ObservatoryModel.find({
			_id: { $in: observatoriesIds },
		}).populate("location");

		return observatories;
	}

	async getObservatoriesBySocialProfile(nickname)
	{
		const profile = await SocialController.getSocialProfile(nickname);

		if (!profile) throw new Error(`User with nickname ${nickname} not found`);

		const user = await UserModel.findById(profile.owner);

		if (!user) throw new Error(`User with nickname ${nickname} not found`);

		await user.populate("observatories");

		return user.observatories ?? [];
	}

	/**
	 * Checks if the user with the given username owns the observatory with the provided ID.
	 * @param {string} username - The username of the user to check.
	 * @param {string} observatoryId - The ID of the observatory to verify ownership.
	 * @returns {Promise<void>} - Resolves if the user owns the observatory, otherwise rejects with an error.
	 * @throws {Error} - Throws an error with the message "Access denied" if the user doesn't own the observatory.
	 */
	async checkObservatoryOwner(username, observatoryId)
	{
		const user = await findOwner(username);
		if (!user.observatories.includes(observatoryId))
			throw new Error("Access denied");
	}

	/**
	 * Checks if an observatory with the provided machine ID already exists.
	 * @param {string} machine_id - The unique machine ID of the observatory to check.
	 * @returns {Promise<void>} - Resolves if no observatory with the machine ID exists, otherwise rejects with an error.
	 * @throws {Error} - Throws an error if an observatory with the given machine ID exists.
	 */
	async checkIfMachineIdExists(machine_id)
	{
		if (!machine_id || machine_id === "null") return;
		const observatory = await ObservatoryModel.findOne({ machine_id });
		if (!observatory) return;
		throw new Error(
			`This KStars already connected to the ${observatory.name}, please unlink that connection first`,
		);
	}

	async updateImagesCaptured(machineID)
	{
		try
		{
			await ObservatoryModel.findOneAndUpdate(
				{
					machine_id: machineID,
				},
				{ $inc: { images_captured: 1 } },
			);
		}
		catch (error)
		{
			logger.error("Error updating images captured", error, {
				machineID
			});
		}
	}

	async getBase64Logo()
	{
		try
		{
			const logoPath = path.join(__dirname, '../../public/logo-black-small.webp');
			const logoBuffer = await fs.promises.readFile(logoPath);
			return `data:image/webp;base64,${logoBuffer.toString('base64')}`;
		} catch (error)
		{
			logger.error("Error reading logo file", error, {
				logoPath: path.join(__dirname, '../../public/logo-black-small.webp')
			});
			return null;
		}
	}

	async createBooking(username, observatoryId, dates)
	{
		const renter = await UserModel.findOne({ username }).populate("socialAccount");
		const owner = await UserModel.findOne({ observatories: observatoryId }).populate("socialAccount");
		if (!renter || !owner) throw new Error('User not found');

		const observatory = await ObservatoryModel.findById(observatoryId);
		if (!observatory) throw new Error('Observatory not found');

		const referenceNumber = await BookingModel.generateReferenceNumber();

		const booking = await BookingModel.create({
			renter: renter._id,
			owner: owner._id,
			observatory: observatoryId,
			dates: dates,
			referenceNumber
		});

		await booking.populate('renter');
		await booking.populate('owner');
		await booking.populate('observatory');

		await BookingLogModel.create({
			source: renter._id,
			destination: owner._id,
			status: 'pending',
			notes: `${renter.socialAccount.social_nickname} wants to book ${owner.socialAccount.social_nickname}'s observatory. Reference: ${referenceNumber}`,
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

		// Send email to owner
		const ownerEmailHtml = await this.generateEmailTemplate(
			'New Booking Request',
			owner.socialAccount.social_nickname,
			`<strong>${renter.socialAccount.social_nickname}</strong> would like to book time with your observatory.<br><br>
			<strong>Booking Reference:</strong> ${referenceNumber}<br>
			Please review their request at your earliest convenience.`,
			'View Booking Request',
			`${app_url}community/bookings/${nameConvertorForURL(renter.socialAccount.social_nickname)}-${booking._id}`
		);

		await transporter.sendMail({
			from: {
				name: smtp_from_name,
				address: smtp_from_email,
			},
			to: owner.email,
			subject: `New Booking Request - Ref: ${referenceNumber}`,
			text: `Hello ${owner.socialAccount.social_nickname},
${renter.socialAccount.social_nickname} wants to book your observatory.
Booking Reference: ${referenceNumber}
Please go to the following link to view the booking request:
${app_url}community/bookings/${nameConvertorForURL(renter.socialAccount.social_nickname)}-${booking._id}`,
			html: ownerEmailHtml
		});

		// Send confirmation email to renter
		const renterEmailHtml = await this.generateEmailTemplate(
			'Booking Request Confirmation',
			renter.socialAccount.social_nickname,
			`Your booking request for <strong>${owner.socialAccount.social_nickname}'s</strong> observatory has been submitted.<br><br>
			<strong>Booking Reference:</strong> ${referenceNumber}<br>
			We'll notify you once the owner reviews your request.`,
			'View Booking Details',
			`${app_url}community/bookings/${nameConvertorForURL(renter.socialAccount.social_nickname)}-${booking._id}`
		);

		await transporter.sendMail({
			from: {
				name: smtp_from_name,
				address: smtp_from_email,
			},
			to: renter.email,
			subject: `Booking Request Confirmation - Ref: ${referenceNumber}`,
			text: `Hello ${renter.socialAccount.social_nickname},
Your booking request for ${owner.socialAccount.social_nickname}'s observatory has been submitted.
Booking Reference: ${referenceNumber}
You can view your booking details at:
${app_url}community/bookings/${nameConvertorForURL(renter.socialAccount.social_nickname)}-${booking._id}`,
			html: renterEmailHtml
		});

		const notification = await NotificationModel.create({
			type: "PENDING",
			content: `${renter.socialAccount.social_nickname} wants to book your observatory. Ref: ${referenceNumber}`,
			target_users: [owner.socialAccount._id],
			read_users: [],
			channel: "COMMUNITY",
			role: "REGISTERED",
			actions: [{ type: "Booking" }],
		});

		const targetUserNames = await this.getTargetUserNames(
			notification.target_users,
		);
		wssMessageManager.sendMessageByUsernames(targetUserNames, {
			notification,
			type: "new_unread_notification",
		});

		// Schedule reminder email using the reminder service
		await reminderService.scheduleReminder(
			booking,
			owner,
			renter,
			referenceNumber,
			reminder_delay_hours
		);

		return booking;
	}

	async getMyBookings(username)
	{
		const user = await UserModel.findOne({ username });
		if (!user) throw new Error('User not found');

		const bookings = await BookingModel
			.find({ renter: user._id })
			.populate('observatory')
			.populate({
				path: 'owner',
				select: 'username socialAccount'
			})
			.populate({
				path: 'renter',
				select: 'username socialAccount'
			});

		// Process each booking to update observatory photos with correct URLs
		const processedBookings = await Promise.all(bookings.map(async booking =>
		{
			const bookingObj = booking.toObject();
			if (bookingObj.observatory && bookingObj.observatory.photos)
			{
				bookingObj.observatory.photos = await Promise.all(
					bookingObj.observatory.photos.map(photo => getObjectUrl(photo))
				);
			}
			return bookingObj;
		}));

		return processedBookings;
	}

	async getPendingMyBookings(username)
	{
		const user = await UserModel.findOne({ username });
		if (!user) throw new Error('User not found');

		const bookings = await BookingModel
			.find({ renter: user._id, status: 'pending' })
		return bookings.length;
	}

	async getReceivedBookings(username)
	{
		const user = await UserModel.findOne({ username });
		if (!user) throw new Error('User not found');

		const bookings = await BookingModel
			.find({ owner: user._id })
			.populate('observatory')
			.populate({
				path: 'owner',
				select: 'username socialAccount'
			})
			.populate({
				path: 'renter',
				select: 'username socialAccount'
			});
		return bookings;
	}

	async getPendingReceivedBookings(username)
	{
		const user = await UserModel.findOne({ username });
		if (!user) throw new Error('User not found');

		const bookings = await BookingModel
			.find({ owner: user._id, status: 'pending' })
		return bookings.length;
	}

	async getBookings(observatoryId, status)
	{
		const observatory = await ObservatoryModel.findById(observatoryId)
			.populate({
				path: 'bookings.user',
				select: 'username socialAccount',
				populate: {
					path: 'socialAccount',
					select: 'social_nickname avatar'
				}
			});

		if (!observatory) throw new Error('Observatory not found');

		let bookings = observatory.bookings;
		if (status)
		{
			bookings = bookings.filter(booking => booking.status === status);
		}

		return bookings;
	}

	async getBookingsByObservatoryId(observatoryId)
	{
		const bookings = await BookingModel.find({ observatory: new mongoose.Types.ObjectId(observatoryId) })
			.populate({
				path: 'renter',
				select: 'username socialAccount',
				populate: {
					path: 'socialAccount',
					select: 'social_nickname avatar'
				}
			});

		return bookings;
	}

	async getBookingById(bookingId)
	{
		const booking = await BookingModel
			.findById(bookingId)
			.populate('observatory')
			.populate({
				path: 'owner',
				select: 'username socialAccount'
			})
			.populate({
				path: 'renter',
				select: 'username socialAccount'
			});

		if (!booking) throw new Error('Booking not found');
		return booking;
	}

	async updateBookingStatus(bookingId, status, dates, username)
	{
		const booking = await BookingModel.findById(bookingId);
		const user = await UserModel.findOne({ username }).populate("socialAccount");
		const renter = await UserModel.findById(booking.renter).populate("socialAccount");
		const owner = await UserModel.findById(booking.owner).populate("socialAccount");

		if (user._id.toString() === booking.owner.toString())
		{
			await BookingLogModel.create({
				source: user._id,
				destination: booking.renter,
				status: status,
				notes: `Owner ${user.socialAccount.social_nickname} has ${status} the booking.`,
			});

			// Create notification for renter
			const notification = await NotificationModel.create({
				type: status.toUpperCase(),
				content: `${user.socialAccount.social_nickname} has ${status} your booking request.`,
				target_users: [renter.socialAccount._id],
				read_users: [],
				channel: "COMMUNITY",
				role: "REGISTERED",
				actions: [{ type: "Booking" }],
			});

			// Send WebSocket notification
			const targetUserNames = await this.getTargetUserNames(notification.target_users);
			wssMessageManager.sendMessageByUsernames(targetUserNames, {
				notification,
				type: "new_unread_notification",
			});

			// Send a message to the renter when the booking is approved
			if (status === "approved")
			{
				try
				{
					const observatory = await ObservatoryModel.findById(booking.observatory);
					const messageContent = `Your booking request for "${observatory.name}" has been approved. You can now proceed with your booking. Reference: ${booking.referenceNumber}`;

					// Send the message using MessageController
					const message = await MessageController.sendMessage(
						user.username, // owner username (sender)
						renter.username, // renter username (receiver)
						messageContent
					);

					// Send real-time WebSocket notification to the renter
					try
					{
						// Format the message for WebSocket
						const messagePayload = {
							type: "new_message",
							payload: {
								id: message.id,
								senderId: message.senderId === 'self' ? message.receiverId : message.senderId,
								receiverId: message.receiverId,
								text: message.text,
								timestamp: message.timestamp,
								senderName: user.username,
								status: "sent"
							}
						};

						// Send to the receiver (renter)
						wssMessageManager.sendMessageByUsername(renter.username, messagePayload);

						wssMessageManager.sendMessageByUsername(receiverUsername, {
							type: "new_pending_request",
							payload: {
								id: message.id,
								senderId: message.senderId === 'self' ? message.receiverId : message.senderId,
								senderName: user.username,
								text: message.text,
								timestamp: message.timestamp
							}
						});

						// Create a global notification for the receiver
						const notification = await NotificationModel.create({
							type: "MESSAGE",
							content: `${user.socialAccount.social_nickname || user.username} sent you a message: "${messageContent.substring(0, 50)}${messageContent.length > 50 ? '...' : ''}"`,
							target_users: [renter.socialAccount._id],
							read_users: [],
							channel: "COMMUNITY",
							role: "REGISTERED",
							actions: [{ type: "Booking" }],
						});

						// Send notification via WebSocket
						wssMessageManager.sendMessageByUsername(renter.username, {
							notification,
							type: "new_unread_notification"
						});
					} catch (wsError)
					{
						// Don't fail if WebSocket notification fails
						logger.warn(`Could not send WebSocket notification: ${wsError.message}`);
					}
				} catch (error)
				{
					logger.error("Error sending approval message", error, {
						username,
						bookingId,
						status
					});
					// Don't throw the error to avoid disrupting the booking status update
				}
			}

		} else if (user._id.toString() === booking.renter.toString())
		{
			await BookingLogModel.create({
				source: user._id,
				destination: booking.owner,
				status: status,
				notes: `Renter ${user.socialAccount.social_nickname} has ${status} the booking.`,
			});

			// Create notification for owner
			const notification = await NotificationModel.create({
				type: status.toUpperCase(),
				content: `${user.socialAccount.social_nickname} has ${status} their booking request.`,
				target_users: [owner.socialAccount._id],
				read_users: [],
				channel: "COMMUNITY",
				role: "REGISTERED",
				actions: [{ type: "Booking" }],
			});

			// Send WebSocket notification
			const targetUserNames = await this.getTargetUserNames(notification.target_users);
			wssMessageManager.sendMessageByUsernames(targetUserNames, {
				notification,
				type: "new_unread_notification",
			});
		}

		// Send email notification
		const recipient = user._id.toString() === booking.owner.toString() ?
			await UserModel.findById(booking.renter).populate("socialAccount") :
			await UserModel.findById(booking.owner).populate("socialAccount");

		const transporter = nodemailer.createTransport({
			host: smtp_host,
			port: smtp_port,
			secure: false,
			auth: {
				user: smtp_user,
				pass: smtp_pass,
			},
		});

		const bookingUrl = `${app_url}community/bookings/${nameConvertorForURL(renter.socialAccount.social_nickname)}-${booking._id}`;
		const emailHtml = await this.generateEmailTemplate(
			'Booking Status Update',
			recipient.socialAccount.social_nickname,
			`<strong>${user.socialAccount.social_nickname}</strong> has ${status} the booking request.`,
			'View Booking Details',
			bookingUrl
		);

		await transporter.sendMail({
			from: {
				name: smtp_from_name,
				address: smtp_from_email,
			},
			to: recipient.email,
			subject: `Booking Status Update: ${status}`,
			text: `Hello ${recipient.socialAccount.social_nickname},
${user.socialAccount.social_nickname} has ${status} the booking request.
Please go to the following link to view the booking details:
${bookingUrl}`,
			html: emailHtml
		});

		if (!booking) throw new Error('Booking not found');
		booking.status = status;
		booking.dates = booking.dates.map(date =>
		{
			const matchingNewDate = dates.find(newDate => date._id.toString() === newDate._id);
			if (matchingNewDate)
			{
				return {
					...date.toObject(),
					date: matchingNewDate.date || date.date,
					bookedStartTime: matchingNewDate.bookedStartTime || date.bookedStartTime,
					bookedEndTime: matchingNewDate.bookedEndTime || date.bookedEndTime,
					negotiatedStartTime: matchingNewDate.negotiatedStartTime || date.negotiatedStartTime,
					negotiatedEndTime: matchingNewDate.negotiatedEndTime || date.negotiatedEndTime,
					status: ['pending', 'negotiating'].includes(matchingNewDate.status || date.status) ? status : (matchingNewDate.status || date.status),
				};
			}
			return date;
		});
		await booking.save();
		await booking.populate('renter');
		await booking.populate('owner');
		return booking;
	}

	async sendBookingNotification(observatory, user, booking)
	{
		// Implementation for sending notifications
		// ... 
	}

	async sendBookingUpdateNotification(booking)
	{
		// Implementation for sending update notifications
		// ...
	}

	async updateAvailabilityDates(observatoryId, dates, disabled)
	{
		const observatory = await ObservatoryModel.findById(observatoryId).setOptions({ skipPhotoTransform: true });
		if (!observatory)
		{
			throw new Error('Observatory not found');
		}

		// Initialize availability array if it doesn't exist
		if (!observatory.availability)
		{
			observatory.availability = [];
		}

		// Update or add availability entries for each date
		dates.forEach(date =>
		{
			const existingIndex = observatory.availability.findIndex(
				a => a.startTime ? new Date(a.startTime).toISOString().split('T')[0] === date : false
			);

			if (existingIndex >= 0)
			{
				// Preserve existing fields, only update isAvailable
				observatory.availability[existingIndex] = {
					...observatory.availability[existingIndex].toObject(),
					isAvailable: !disabled
				};
			} else
			{
				observatory.availability.push({
					isAvailable: !disabled
				});
			}
		});

		// Save and return updated observatory
		await observatory.save();
		return observatory;
	}

	async setAvailability(username, observatoryId, startTime, endTime, isAvailable = true, timezone = null, dstOffset = null, rawOffset = null)
	{
		// Verify ownership
		await this.checkObservatoryOwner(username, observatoryId);

		const observatory = await ObservatoryModel.findById(observatoryId).setOptions({ skipPhotoTransform: true });
		if (!observatory)
		{
			throw new Error('Observatory not found');
		}

		// Initialize availability array if it doesn't exist
		if (!observatory.availability)
		{
			observatory.availability = [];
		}

		// Extract the date portion for checking existing entries
		const startDate = new Date(startTime);
		const dateStr = startDate.toISOString().split('T')[0];

		// Parse the start and end times as proper Date objects
		const startTimeDate = new Date(startTime);
		const endTimeDate = new Date(endTime);

		// Find existing availability entry for this date
		const existingIndex = observatory.availability.findIndex(
			a => a.startTime.toISOString().split('T')[0] === dateStr
		);

		if (existingIndex >= 0)
		{
			// Update existing availability
			observatory.availability[existingIndex] = {
				startTime: startTimeDate,
				endTime: endTimeDate,
				isAvailable
			};
		} else
		{
			// Add new availability
			observatory.availability.push({
				startTime: startTimeDate,
				endTime: endTimeDate,
				isAvailable
			});
		}

		// Update timezone information if provided
		if (timezone) {
			observatory.timezone = timezone;
		}
		
		if (dstOffset !== null && dstOffset !== undefined) {
			observatory.dstOffset = dstOffset;
		}
		
		if (rawOffset !== null && rawOffset !== undefined) {
			observatory.rawOffset = rawOffset;
		}

		// Save and return updated observatory
		await observatory.save();
		return observatory;
	}

	async getAvailability(observatoryId, dates)
	{
		const observatory = await ObservatoryModel.findById(observatoryId)
			.setOptions({ skipPhotoTransform: true })
			.populate({
				path: 'bookings',
				match: {
					'dates.startTime': {
						$in: dates.map(date => new RegExp(date))
					},
					status: { $nin: ['cancelled', 'rejected'] }
				}
			});

		if (!observatory)
		{
			throw new Error('Observatory not found');
		}

		// If no dates provided, return all availability
		if (!dates || dates.length === 0)
		{
			return observatory.availability || [];
		}

		// Filter availability for requested dates
		const availability = dates.map(date =>
		{
			const dateStr = new Date(date).toISOString().split('T')[0];
			
			// Find availability entries that match the requested date
			const existingAvailability = observatory.availability?.find(
				a => a.startTime.toISOString().split('T')[0] === dateStr
			);

			if (existingAvailability)
			{
				// Convert to a plain JavaScript object (not Mongoose document)
				const availabilityObject = existingAvailability.toObject();
				
				// Find bookings for this date
				const dateBookings = observatory.bookings
					.filter(booking =>
						booking.dates.some(d =>
							new Date(d.startTime).toISOString().split('T')[0] === dateStr
						)
					)
					.map(booking => ({
						bookingId: booking._id,
						userId: booking.user,
						status: booking.status,
						timeSlot: booking.dates
							.find(d => new Date(d.startTime).toISOString().split('T')[0] === dateStr)
					}));
					
				return {
					...availabilityObject,
					bookings: dateBookings
				};
			}

			// Return default availability if none exists
			return {
				date: new Date(date), // Keep date for client compatibility
				startTime: null,
				endTime: null,
				isAvailable: true,
				bookings: []
			};
		});

		return availability;
	}

	async updateSettings(observatoryId, settings)
	{
		try
		{
			const observatory = await ObservatoryModel.findById(observatoryId).setOptions({ skipPhotoTransform: true });
			if (!observatory)
			{
				throw new Error('Observatory not found');
			}

			// Validate settings
			if (settings.hourlyRate !== undefined)
			{
				if (settings.hourlyRate < 0)
				{
					throw new Error('Hourly rate cannot be negative');
				}
				observatory.hourlyRate = settings.hourlyRate;
			}

			if (settings.minimumDays !== undefined)
			{
				if (settings.minimumDays < 1)
				{
					throw new Error('Minimum days must be at least 1');
				}
				if (observatory.maximumDays && settings.minimumDays > observatory.maximumDays)
				{
					throw new Error('Minimum days cannot be greater than maximum days');
				}
				observatory.minimumDays = settings.minimumDays;
			}

			if (settings.maximumDays !== undefined)
			{
				if (settings.maximumDays < observatory.minimumDays)
				{
					throw new Error('Maximum days cannot be less than minimum days');
				}
				observatory.maximumDays = settings.maximumDays;
			}

			if (settings.minimumHoursPerDay !== undefined)
			{
				// -1 represents "Max" (24 hours)
				if (settings.minimumHoursPerDay !== -1 &&
					(settings.minimumHoursPerDay < 1 || settings.minimumHoursPerDay > 24))
				{
					throw new Error('Minimum hours per day must be between 1 and 24, or -1 for Max');
				}
				observatory.minimumHoursPerDay = settings.minimumHoursPerDay;
			}

			if (settings.shutdownProcedure !== undefined)
			{
				observatory.shutdownProcedure = settings.shutdownProcedure;
			}

			await observatory.save();
			return observatory;
		} catch (error)
		{
			logger.error("Error updating observatory settings", error, {
				observatoryId,
				settingsKeys: Object.keys(settings || {})
			});
			throw error;
		}
	}

	// Announcement Management Methods
	async getAnnouncements(observatoryId)
	{
		try
		{
			const observatory = await ObservatoryModel.findById(observatoryId);
			if (!observatory)
			{
				throw new Error('Observatory not found');
			}

			// Sort announcements with pinned first, then by date (newest first)
			const sortedAnnouncements = [...observatory.announcements].sort((a, b) =>
			{
				if (a.isPinned && !b.isPinned) return -1;
				if (!a.isPinned && b.isPinned) return 1;
				return new Date(b.createdAt) - new Date(a.createdAt);
			});

			return sortedAnnouncements;
		} catch (error)
		{
			logger.error("Error getting announcements", error, {
				observatoryId
			});
			throw error;
		}
	}

	async createAnnouncement(username, observatoryId, announcementData)
	{
		try
		{
			await this.checkObservatoryOwner(username, observatoryId);

			const observatory = await ObservatoryModel.findById(observatoryId).setOptions({ skipPhotoTransform: true });
			if (!observatory)
			{
				throw new Error('Observatory not found');
			}

			// If this is the first pinned announcement, unpin any existing pinned announcements
			if (announcementData.isPinned)
			{
				observatory.announcements.forEach(announcement =>
				{
					if (announcement.isPinned)
					{
						announcement.isPinned = false;
					}
				});
			}

			observatory.announcements.push(announcementData);
			await observatory.save();

			return observatory.announcements[observatory.announcements.length - 1];
		} catch (error)
		{
			logger.error("Error creating announcement", error, {
				username,
				observatoryId,
				title: announcementData?.title
			});
			throw error;
		}
	}

	async updateAnnouncement(username, observatoryId, announcementId, announcementData)
	{
		try
		{
			await this.checkObservatoryOwner(username, observatoryId);

			const observatory = await ObservatoryModel.findById(observatoryId).setOptions({ skipPhotoTransform: true });
			if (!observatory)
			{
				throw new Error('Observatory not found');
			}

			const announcementIndex = observatory.announcements.findIndex(
				a => a._id.toString() === announcementId
			);

			if (announcementIndex === -1)
			{
				throw new Error('Announcement not found');
			}

			// If this announcement is being pinned, unpin any existing pinned announcements
			if (announcementData.isPinned && !observatory.announcements[announcementIndex].isPinned)
			{
				observatory.announcements.forEach(announcement =>
				{
					if (announcement._id.toString() !== announcementId && announcement.isPinned)
					{
						announcement.isPinned = false;
					}
				});
			}

			// Update the announcement
			Object.keys(announcementData).forEach(key =>
			{
				observatory.announcements[announcementIndex][key] = announcementData[key];
			});

			await observatory.save();

			return observatory.announcements[announcementIndex];
		} catch (error)
		{
			logger.error("Error updating announcement", error, {
				username,
				observatoryId,
				announcementId,
				title: announcementData?.title
			});
			throw error;
		}
	}

	async deleteAnnouncement(username, observatoryId, announcementId)
	{
		try
		{
			await this.checkObservatoryOwner(username, observatoryId);

			const observatory = await ObservatoryModel.findById(observatoryId).setOptions({ skipPhotoTransform: true });
			if (!observatory)
			{
				throw new Error('Observatory not found');
			}

			const announcementIndex = observatory.announcements.findIndex(
				a => a._id.toString() === announcementId
			);

			if (announcementIndex === -1)
			{
				throw new Error('Announcement not found');
			}

			observatory.announcements.splice(announcementIndex, 1);
			await observatory.save();

			return { success: true, message: 'Announcement deleted successfully' };
		} catch (error)
		{
			logger.error("Error deleting announcement", error, {
				username,
				observatoryId,
				announcementId
			});
			throw error;
		}
	}

	async pinAnnouncement(username, observatoryId, announcementId)
	{
		try
		{
			await this.checkObservatoryOwner(username, observatoryId);

			const observatory = await ObservatoryModel.findById(observatoryId).setOptions({ skipPhotoTransform: true });
			if (!observatory)
			{
				throw new Error('Observatory not found');
			}

			const announcementIndex = observatory.announcements.findIndex(
				a => a._id.toString() === announcementId
			);

			if (announcementIndex === -1)
			{
				throw new Error('Announcement not found');
			}

			// Unpin any existing pinned announcements
			observatory.announcements.forEach(announcement =>
			{
				if (announcement._id.toString() !== announcementId)
				{
					announcement.isPinned = false;
				}
			});

			// Toggle the pin status of the target announcement
			observatory.announcements[announcementIndex].isPinned =
				!observatory.announcements[announcementIndex].isPinned;

			await observatory.save();

			return observatory.announcements[announcementIndex];
		} catch (error)
		{
			logger.error("Error pinning announcement", error, {
				username,
				observatoryId,
				announcementId
			});
			throw error;
		}
	}

	async updateGuidelines(username, observatoryId, guidelines)
	{
		try
		{
			await this.checkObservatoryOwner(username, observatoryId);

			const observatory = await ObservatoryModel.findById(observatoryId).setOptions({ skipPhotoTransform: true });
			if (!observatory)
			{
				throw new Error('Observatory not found');
			}

			observatory.usageGuidelines = guidelines;
			await observatory.save();

			return observatory;
		} catch (error)
		{
			logger.error("Error updating guidelines", error, {
				username,
				observatoryId,
				guidelinesLength: guidelines?.length || 0
			});
			throw error;
		}
	}

	async updateRentableProfile(username, observatoryId, profileId)
	{
		try
		{
			await this.checkObservatoryOwner(username, observatoryId);

			const observatory = await ObservatoryModel.findById(observatoryId).setOptions({ skipPhotoTransform: true });
			if (!observatory)
			{
				throw new Error('Observatory not found');
			}

			// Verify the profile exists and belongs to this observatory
			const profileExists = observatory.equipment_profiles.some(
				profile => profile.toString() === profileId
			);

			if (!profileExists)
			{
				throw new Error('Profile not found or does not belong to this observatory');
			}

			// Verify the profile is synced
			const profile = await mongoose.model('EquipmentProfile').findById(profileId);
			if (!profile || !profile.isSynced)
			{
				throw new Error('Only synced profiles can be used for rentals');
			}

			// Update the rentable profile
			observatory.rentable_profile_id = profileId;
			await observatory.save();

			return observatory;
		} catch (error)
		{
			logger.error("Error updating rentable profile", error, {
				username,
				observatoryId,
				profileId
			});
			throw error;
		}
	}

	async generateEmailTemplate(title, recipientName, message, buttonText, buttonUrl)
	{
		return `
		<div style="max-width: 600px; margin: 0 auto; font-family: 'Segoe UI', Arial, sans-serif;">
			<div style="background: linear-gradient(135deg, #1a237e 0%, #0d47a1 100%); padding: 30px 0; text-align: center;">
				<img src="https://ekoslive.s3.amazonaws.com/logo-white-small.png" 
					 alt="EkosLive Logo" 
					 style="width: 200px; height: auto; margin-bottom: 20px; filter: brightness(0) invert(1);"
				/>
				<h1 style="color: white; margin: 0; font-size: 28px;">${title}</h1>
			</div>
			
			<div style="background-color: #ffffff; padding: 40px 30px; border-radius: 0 0 10px 10px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
				<p style="font-size: 18px; color: #333; margin-bottom: 25px;">Hello <strong>${recipientName}</strong>,</p>
				
				<p style="color: #555; line-height: 1.6; margin-bottom: 25px;">${message}</p>
				
				<div style="text-align: center; margin: 35px 0;">
					<a href="${buttonUrl}" 
					   style="background-color: #2196f3; 
							  color: white; 
							  text-decoration: none; 
							  padding: 14px 30px; 
							  border-radius: 50px; 
							  font-size: 16px;
							  font-weight: bold;
							  display: inline-block;
							  transition: background-color 0.3s ease;">
						${buttonText}
					</a>
				</div>
				
				<p style="color: #666; font-size: 14px; line-height: 1.6;">
					You can manage all your observatory bookings from your dashboard.
				</p>
				
				<div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #eee;">
					<p style="color: #888; margin-bottom: 5px;">Clear skies!</p>
					<p style="color: #888; font-weight: bold;">The EkosLive Team</p>
				</div>
			</div>
			
			<div style="text-align: center; padding: 20px; color: #666; font-size: 12px;">
				<p>&copy; ${new Date().getFullYear()} EkosLive. All rights reserved.</p>
				<p style="color: #888;">
					This is an automated message, please do not reply to this email.
				</p>
			</div>
		</div>`;
	}
}

module.exports = new ObservatoryController();
