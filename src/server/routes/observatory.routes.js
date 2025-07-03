const express = require("express");
const observatoryRoutes = express.Router();
const ObservatoryController = require("../controller/observatory");
const ObservatoryModel = require("../models/observatory/observatory");
const authMiddleware = require("../middlewares/auth");
const { getObjectUrl } = require("../utils/minio");
const { upload, convertToWebPs } = require("../utils/multerUpload");
const logger = require("../logger");
const NotificationModel = require("../models/notification");
const UserModel = require("../models/user");
const {wssMessageManager} = require("../websocket");
const getObjectPrimaryName = require("../utils/getObjectPrimaryName");
const mongoose = require('mongoose');

// Get user role for an observatory
observatoryRoutes.get("/role", authMiddleware, async (req, res) => {
  const { username, machineID } = req.query;
  
  if (!username || !machineID) {
    return res.status(400).json({ error: "Missing required parameters" });
  }
  
  try {
    // Get the user's role from the WebSocket manager
    const role = req.app.wssManager.getUserRole(username, machineID);
    
    if (!role) {
      return res.status(404).json({ error: "Role not found" });
    }
    
    return res.json({ role });
  } catch (error) {
    logger.error("Error getting user role", error, {
      operation: "getUserRole",
      username,
      machineID
    });
    return res.status(500).json({ error: "Internal server error" });
  }
});

observatoryRoutes.get("/", authMiddleware, async (req, res) =>
{
	const { username } = req.query;

	try
	{
		const observatories =
			await ObservatoryController.getObservatories(username);
		const updatedObservatories = await Promise.all(
			observatories.map(async (observatory) =>
			{
				await observatory.populate("location");
				const photoUrls = await Promise.all(
					observatory.photos.map(async (photoName) => getObjectUrl(photoName)),
				);
				return { ...observatory._doc, photos: photoUrls };
			}),
		);
		res.json({ observatories: updatedObservatories });
	}
	catch (error)
	{
		logger.error("Error getting observatories", error, {
			username,
			operation: "getObservatories"
		});
		res.status(400).json({ error: error.message });
	}
});

observatoryRoutes.get("/pending", authMiddleware, async (req, res) =>
{
	try
	{
		const observatories =
			await ObservatoryController.getPendingObservatories();

		res.json({ observatories: observatories });
	}
	catch (error)
	{
		logger.error("Error getting pending observatories", error, {
			operation: "getPendingObservatories"
		});
		res.status(400).json({ error: error.message });
	}
});

observatoryRoutes.get("/get-primary-name", async (req, res) =>
{
	const { objectName } = req.query;

	try
	{
		const primaryName = await getObjectPrimaryName(objectName);
		res.json({ primaryName });
	}
	catch (error)
	{
		logger.error("Error getting primary name", error, {
			operation: "getObjectPrimaryName",
			objectName
		});
		res.status(400).json({ error: error.message });
	}
});

observatoryRoutes.post(
	"/",
	authMiddleware,
	upload.array("images"),
	convertToWebPs,
	async (req, res) =>
	{
		const { username } = req.query;
		const previewImgs = req.files;

		try
		{
			req.body.submissionStatus = req.body.submissionStatus ? req.body.submissionStatus : "APPROVED";
			
			const observatory = await ObservatoryController.createObservatory(
				username,
				req.body,
				previewImgs,
			);
			if (req.body.submissionStatus === "APPROVED") {
				res.status(201).json({ observatory });
			} else {
				res.json({ message: "sucess" });
			}
		}

		catch (error)
		{
			logger.error("Error creating observatory", error, {
				username,
				operation: "createObservatory",
				submissionStatus: req.body.submissionStatus
			});
			res.status(400).json({ error: error.message });
		}
	},
);

observatoryRoutes.get("/locations", async (req, res) =>
{
	try
	{
		const observatoriesData =
			await ObservatoryController.getObservatoriesLocation(
				req.query.observatories ?? [],
			);

		res.json(observatoriesData);
	}
	catch (error)
	{
		logger.error("Error getting observatories location", error, {
			operation: "getObservatoriesLocation",
			observatoriesCount: req.query.observatories?.length || 0
		});
		res.status(400).json({ message: error.message });
	}
});

observatoryRoutes.get("/profile/:nickname", async (req, res) =>
{
	const { nickname } = req.params;

	try
	{
		const observatories =
			await ObservatoryController.getObservatoriesBySocialProfile(nickname);
		const updatedObservatories = await Promise.all(
			observatories
				.filter((observatory) => observatory.visibility)
				.map(async (observatory) =>
				{
					const photos = await Promise.all(
						observatory.photos.map(async (photoName) =>
							getObjectUrl(photoName),
						),
					);
					return { ...observatory._doc, photos };
				}),
		);
		res.json(updatedObservatories);
	}
	catch (error)
	{
		logger.error("Error getting observatories by social profile", error, {
			operation: "getObservatoriesBySocialProfile",
			nickname
		});
		res.status(400).json({ message: error.message });
	}
});

observatoryRoutes.get(
	"/check-owner/:observatoryId",
	authMiddleware,
	async (req, res) =>
	{
		const { observatoryId } = req.params;
		const { username } = req.query;

		try
		{
			const permissions = {};
			if (req.ability.can("manage", "all"))
			{
				permissions.canEdit = true;
			}
			else
			{
				permissions.canEdit = false;
			}

			try
			{
				await ObservatoryController.checkObservatoryOwner(
					username,
					observatoryId,
				);
				permissions.isOwner = true;
				permissions.canEdit = true;
			}
			catch (error)
			{
				permissions.isOwner = false;
			}

			res.status(200).json(permissions);
		}
		catch (error)
		{
			res.status(401).send();
		}
	},
);

observatoryRoutes.get("/mybookings", authMiddleware, async (req, res) => {
	const { username } = req.query;

	try {
		const bookings = await ObservatoryController.getMyBookings(username);
		res.json({ bookings });
	} catch (error) {
		logger.error("Error getting my bookings", error, {
			username,
			operation: "getMyBookings"
		});
		res.status(400).json({ error: error.message });
	}
});

observatoryRoutes.get("/mybookings/pending", authMiddleware, async (req, res) => {
	const { username } = req.query;

	try {
		const count = await ObservatoryController.getPendingMyBookings(username);	
		res.json({ count });
	} catch (error) {
		logger.error("Error getting pending my bookings", error, {
			username,
			operation: "getPendingMyBookings"
		});
		res.status(400).json({ error: error.message });
	}
});



observatoryRoutes.get("/receivedbookings", authMiddleware, async (req, res) => {
	const { username } = req.query;

	try {
		const bookings = await ObservatoryController.getReceivedBookings(username);
		res.json({ bookings });
	} catch (error) {
		logger.error("Error getting received bookings", error, {
			username,
			operation: "getReceivedBookings"
		});
		res.status(400).json({ error: error.message });
	}
});

observatoryRoutes.get("/receivedbookings/pending", authMiddleware, async (req, res) => {
	const { username } = req.query;

	try {
		const count = await ObservatoryController.getPendingReceivedBookings(username);
		res.json({ count });
	} catch (error) {
		logger.error("Error getting pending received bookings", error, {
			username,
			operation: "getPendingReceivedBookings"
		});
		res.status(400).json({ error: error.message });
	}
});

observatoryRoutes.get("/:id", async (req, res) =>
{
	const { id } = req.params;

	try
	{
		const observatory = await ObservatoryController.getObservatoryById(id);
		res.json({ observatory });
	}
	catch (error)
	{
		logger.error("Error getting observatory by ID", error, {
			operation: "getObservatoryById",
			observatoryId: id
		});
		res.status(400).json({ error: error.message });
	}
});

observatoryRoutes.get("/:id/bookings", async (req, res) => {
	const { id } = req.params;

	try {
		const bookings = await ObservatoryController.getBookingsByObservatoryId(id);
		res.json({ bookings });
	} catch (error) {
		logger.error("Error getting bookings by observatory ID", error, {
			operation: "getBookingsByObservatoryId",
			observatoryId: id
		});
		res.status(400).json({ error: error.message });
	}
});

observatoryRoutes.patch(
	"/:id",
	authMiddleware,
	upload.array("images"),
	convertToWebPs,
	async (req, res) =>
	{
		const { username } = req.query;
		const { id } = req.params;
		const previewImgs = req.files;

		try
		{
			req.body.submissionStatus = req.body.submissionStatus ? req.body.submissionStatus : "APPROVED";
			
			// Parse the location data if it exists as a string
			if (req.body.location && typeof req.body.location === 'string') {
				try {
					const locationData = JSON.parse(req.body.location);
					logger.info(`Parsed location data for observatory ${id}: ${JSON.stringify(locationData)}`);
					
					// Get the observatory to find its current location reference
					const observatory = await ObservatoryModel.findById(id);
					if (!observatory) {
						return res.status(404).json({ error: 'Observatory not found' });
					}
					
					// Get the Location model directly
					const LocationModel = mongoose.model('Location');
					
					if (observatory.location) {
						// Update existing location document
						await LocationModel.findByIdAndUpdate(
							observatory.location,
							{
								lng: locationData.lng,
								lat: locationData.lat,
								region: locationData.region || '',
								country: locationData.country || '',
								public: observatory.isPublicLocation || true
							}
						);
						logger.info(`Updated existing location ${observatory.location} for observatory ${id}`);
					} else {
						// Create new location document
						const newLocation = new LocationModel({
							lng: locationData.lng,
							lat: locationData.lat,
							region: locationData.region || '',
							country: locationData.country || '',
							public: observatory.isPublicLocation || true
						});
						const savedLocation = await newLocation.save();
						
						// Update observatory with the new location reference
						await ObservatoryModel.findByIdAndUpdate(
							id,
							{ location: savedLocation._id }
						);
						logger.info(`Created new location ${savedLocation._id} for observatory ${id}`);
					}
					
					// Remove location from req.body since we've handled it separately
					delete req.body.location;
				} catch (parseError) {
					logger.error("Error parsing location data", parseError, {
						operation: "parseLocationData",
						observatoryId: id
					});
					delete req.body.location;
				}
			}

			const observatory = await ObservatoryController.updateObservatoryById(
				username,
				id,
				req.body,
				previewImgs,
			);
			
			// Make sure location is populated in the response
			await observatory.populate("location");
			
			res.json({ observatory });
		}
		catch (error)
		{
			logger.error("Error updating observatory", error, {
				username,
				operation: "updateObservatoryById",
				observatoryId: id
			});
			res.status(400).json({ error: error.message });
		}
	},
);

observatoryRoutes.delete("/:id", authMiddleware, async (req, res) =>
{
	const { username } = req.query;
	const { id } = req.params;

	try
	{
		await ObservatoryController.deleteObservatory(username, id);
		res.json({ result: true });
	}
	catch (error)
	{
		res.status(400).json({ result: false, message: error.message });
	}
});

observatoryRoutes.delete("/image/:id/:imageIndex", authMiddleware, async (req, res) => {
	const { id, imageIndex } = req.params;
	const { username } = req.query;

	try {
		const observatory = await ObservatoryController.deleteObservatoryImage(username, id, imageIndex);
		res.json({ observatory });
	} catch (error) {
		res.status(400).json({ result: false, message: error.message });
	}
});

// Add booking routes
observatoryRoutes.post("/:id/bookings", authMiddleware, async (req, res) => {
	const { username } = req.query;
	const { id } = req.params;
	const { dates } = req.body;

	try {
		const booking = await ObservatoryController.createBooking(username, id, dates);

		wssMessageManager.sendMessageByUsernames([booking.renter.username], {
            type: 'new_booking_renter',
            payload: { booking }
        });

		wssMessageManager.sendMessageByUsernames([booking.owner.username], {
            type: 'new_booking_owner',
            payload: { booking }
        });

		res.status(201).json({ booking });
	} catch (error) {
		logger.error("Error creating booking", error, {
			username,
			operation: "createBooking",
			observatoryId: id,
			datesCount: dates?.length || 0
		});
		res.status(400).json({ error: error.message });
	}
});

observatoryRoutes.get("/bookings/:bookingId", authMiddleware, async (req, res) => {
	const { bookingId } = req.params;
	const { username } = req.query;

	try {
		const booking = await ObservatoryController.getBookingById(bookingId);
		res.json({ booking });
	} catch (error) {
		logger.error("Error getting booking by ID", error, {
			operation: "getBookingById",
			bookingId
		});
		res.status(400).json({ error: error.message });
	}
});

observatoryRoutes.patch("/bookings/:bookingId", authMiddleware, async (req, res) => {
	const { bookingId } = req.params;
	const { status, dates } = req.body;
	const { username } = req.query;

	try {
		const booking = await ObservatoryController.updateBookingStatus(bookingId, status, dates, username);

		// Send WebSocket notifications using wssMessageManager
        const statusMessage = {
            type: 'booking_status_change',
            payload: { bookingId, status }
        };
		wssMessageManager.sendMessageByUsernames(
            [booking.owner.username, booking.renter.username],
            statusMessage
        );
		res.json({ booking });
	} catch (error) {
		logger.error("Error updating booking status", error, {
			username,
			operation: "updateBookingStatus",
			bookingId,
			status
		});
		res.status(400).json({ error: error.message });
	}
});

observatoryRoutes.get("/:id/bookings", authMiddleware, async (req, res) => {
	const { id } = req.params;
	const { status } = req.query;

	try {
		const bookings = await ObservatoryController.getBookings(id, status);
		res.json({ bookings });
	} catch (error) {
		logger.error("Error getting bookings", error, {
			operation: "getBookings",
			observatoryId: id,
			status
		});
		res.status(400).json({ error: error.message });
	}
});

observatoryRoutes.patch("/:id/bookings/:bookingId/dates/:dateId", authMiddleware, async (req, res) => {
	const { username } = req.query;
	const { id, bookingId, dateId } = req.params;
	const { status, feedback } = req.body;

	try {
		const booking = await ObservatoryController.updateBookingStatus(
			username, 
			id, 
			bookingId, 
			dateId, 
			status, 
			feedback
		);
		res.json({ booking });
	} catch (error) {
		logger.error("Error updating booking status for date", error, {
			username,
			operation: "updateBookingStatusForDate",
			observatoryId: id,
			bookingId,
			dateId,
			status
		});
		res.status(400).json({ error: error.message });
	}
});

// Add new route for disabling dates
observatoryRoutes.post("/:id/disable-dates", authMiddleware, async (req, res) => {
	const { id } = req.params;
	const { dates, disabled } = req.body;

	try {
		const observatory = await ObservatoryController.updateAvailabilityDates(id, dates, disabled);
		res.json({ observatory });
	} catch (error) {
		logger.error("Error updating availability dates", error, {
			operation: "updateAvailabilityDates",
			observatoryId: id,
			datesCount: dates?.length || 0,
			disabled
		});
		res.status(400).json({ error: error.message });
	}
});

// Add new route for managing observatory availability
observatoryRoutes.post("/:id/availability", authMiddleware, async (req, res) => {
	const { username } = req.query;
	const { id } = req.params;
	const { startTime, endTime, isAvailable, timezone, dstOffset, rawOffset } = req.body;

	try {
		const observatory = await ObservatoryController.setAvailability(
			username,
			id,
			startTime,
			endTime,
			isAvailable,
			timezone,
			dstOffset,
			rawOffset
		);
		res.json({ observatory });
	} catch (error) {
		logger.error("Error setting availability", error, {
			username,
			operation: "setAvailability",
			observatoryId: id,
			isAvailable,
			timezone
		});
		res.status(400).json({ error: error.message });
	}
});

// Add route to get availability for specific dates
observatoryRoutes.get("/:id/availability", async (req, res) => {
	const { id } = req.params;
	const { dates } = req.query; // Expects comma-separated dates

	try {
		const dateArray = dates ? dates.split(',') : [];
		const availability = await ObservatoryController.getAvailability(id, dateArray);
		res.json({ availability });
	} catch (error) {
		logger.error("Error getting availability", error, {
			operation: "getAvailability",
			observatoryId: id,
			datesCount: dateArray?.length || 0
		});
		res.status(400).json({ error: error.message });
	}
});

// Update the booking creation route to handle time ranges
observatoryRoutes.post("/:id/bookings", authMiddleware, async (req, res) => {
	const { username } = req.query;
	const { id } = req.params;
	const { dates } = req.body; // Array of { date, bookedStartTime, bookedEndTime }

	try {
		const booking = await ObservatoryController.createBooking(
			username,
			id,
			dates
		);
		res.status(201).json({ booking });
	} catch (error) {
		logger.error("Error creating booking", error, {
			username,
			operation: "createBooking",
			observatoryId: id,
			datesCount: dates?.length || 0
		});
		res.status(400).json({ error: error.message });
	}
});

// Add route to get existing bookings for specific dates
observatoryRoutes.get("/:id/bookings/dates", async (req, res) => {
	const { id } = req.params;
	const { dates } = req.query; // Expects comma-separated dates

	try {
		const dateArray = dates ? dates.split(',') : [];
		const bookings = await ObservatoryController.getBookingsByDates(id, dateArray);
		res.json({ bookings });
	} catch (error) {
		logger.error("Error getting bookings by dates", error, {
			operation: "getBookingsByDates",
			observatoryId: id,
			datesCount: dateArray?.length || 0
		});
		res.status(400).json({ error: error.message });
	}
});	


// Add new route for updating settings
observatoryRoutes.patch("/:id/settings", authMiddleware, async (req, res) => {
	const { id } = req.params;
	const settings = req.body;

	try {
		const observatory = await ObservatoryController.updateSettings(id, settings);
		res.json({ observatory });
	} catch (error) {
		logger.error("Error updating observatory settings", error, {
			operation: "updateSettings",
			observatoryId: id
		});
		res.status(400).json({ error: error.message });
	}
});

// Announcement routes
// Get all announcements for an observatory
observatoryRoutes.get("/:id/announcements", async (req, res) => {
	const { id } = req.params;

	try {
		const announcements = await ObservatoryController.getAnnouncements(id);
		res.json({ announcements });
	} catch (error) {
		logger.error("Error getting announcements", error, {
			operation: "getAnnouncements",
			observatoryId: id
		});
		res.status(400).json({ error: error.message });
	}
});

// Create a new announcement
observatoryRoutes.post("/:id/announcements", authMiddleware, async (req, res) => {
	const { username } = req.query;
	const { id } = req.params;
	const announcementData = req.body;

	try {
		const announcement = await ObservatoryController.createAnnouncement(
			username,
			id,
			announcementData
		);
		res.status(201).json({ announcement });
	} catch (error) {
		logger.error("Error creating announcement", error, {
			username,
			operation: "createAnnouncement",
			observatoryId: id
		});
		res.status(400).json({ error: error.message });
	}
});

// Update an announcement
observatoryRoutes.put("/:id/announcements/:announcementId", authMiddleware, async (req, res) => {
	const { username } = req.query;
	const { id, announcementId } = req.params;
	const announcementData = req.body;

	try {
		const announcement = await ObservatoryController.updateAnnouncement(
			username,
			id,
			announcementId,
			announcementData
		);
		res.json({ announcement });
	} catch (error) {
		logger.error("Error updating announcement", error, {
			username,
			operation: "updateAnnouncement",
			observatoryId: id,
			announcementId
		});
		res.status(400).json({ error: error.message });
	}
});

// Delete an announcement
observatoryRoutes.delete("/:id/announcements/:announcementId", authMiddleware, async (req, res) => {
	const { username } = req.query;
	const { id, announcementId } = req.params;

	try {
		const result = await ObservatoryController.deleteAnnouncement(
			username,
			id,
			announcementId
		);
		res.json(result);
	} catch (error) {
		logger.error("Error deleting announcement", error, {
			username,
			operation: "deleteAnnouncement",
			observatoryId: id,
			announcementId
		});
		res.status(400).json({ error: error.message });
	}
});

// Pin/unpin an announcement
observatoryRoutes.put("/:id/announcements/:announcementId/pin", authMiddleware, async (req, res) => {
	const { username } = req.query;
	const { id, announcementId } = req.params;

	try {
		const announcement = await ObservatoryController.pinAnnouncement(
			username,
			id,
			announcementId
		);
		res.json({ announcement });
	} catch (error) {
		logger.error("Error pinning announcement", error, {
			username,
			operation: "pinAnnouncement",
			observatoryId: id,
			announcementId
		});
		res.status(400).json({ error: error.message });
	}
});

// Update observatory usage guidelines
observatoryRoutes.patch("/:id/guidelines", authMiddleware, async (req, res) => {
	const { username } = req.query;
	const { id } = req.params;
	const { guidelines } = req.body;

	try {
		const observatory = await ObservatoryController.updateGuidelines(
			username,
			id,
			guidelines
		);
		res.json({ success: true, observatory });
	} catch (error) {
		logger.error("Error updating guidelines", error, {
			username,
			operation: "updateGuidelines",
			observatoryId: id
		});
		res.status(400).json({ success: false, error: error.message });
	}
});

// Update rentable profile for an observatory
observatoryRoutes.patch("/:id/rentable-profile", authMiddleware, async (req, res) => {
	const { username } = req.query;
	const { id } = req.params;
	const { profileId } = req.body;

	try {
		const observatory = await ObservatoryController.updateRentableProfile(
			username,
			id,
			profileId
		);
		res.json({ observatory });
	} catch (error) {
		logger.error("Error updating rentable profile", error, {
			username,
			operation: "updateRentableProfile",
			observatoryId: id,
			profileId
		});
		res.status(400).json({ error: error.message });
	}
});

// Update machine ID for an observatory
observatoryRoutes.patch("/:id/machine-id", authMiddleware, async (req, res) => {
	const { id } = req.params;
	const { machineId } = req.body;

	try {
		if (!machineId) {
			return res.status(400).json({ success: false, message: 'Machine ID is required' });
		}

		const observatory = await ObservatoryModel.findByIdAndUpdate(
			id,
			{ machine_id: machineId },
			{ new: true }
		);

		if (!observatory) {
			return res.status(404).json({ success: false, message: 'Observatory not found' });
		}

		logger.info(`Updated machine_id for observatory ${observatory.name}: ${machineId}`);
		
		return res.status(200).json({ 
			success: true, 
			message: 'Machine ID updated successfully',
			observatory
		});
	} catch (error) {
		logger.error("Error updating machine ID", error, {
			operation: "updateMachineId",
			observatoryId: id,
			machineId
		});
		return res.status(500).json({ success: false, message: error.message });
	}
});

// Revoke access for a renter
observatoryRoutes.post("/revoke-access", authMiddleware, async (req, res) => {
	try {
		const { observatoryId, username, machineId } = req.body;
		const requestingUser = req.query.username;
		
		// Verify the requesting user is the owner
		const observatory = await ObservatoryModel.findById(observatoryId);
		if (!observatory) {
			return res.status(404).json({ success: false, message: 'Observatory not found' });
		}
		
		// // Get the owner's username
		// const owner = await UserModel.findById(observatory.owner, 'username');
		// if (!owner || owner.username !== requestingUser) {
		// 	return res.status(403).json({ success: false, message: 'Permission denied' });
		// }
		
		// Find the renter in the accessList
		const renterEntry = observatory.accessList.find(entry => 
			entry.username === username && entry.role === 'renter'
		);
		
		if (!renterEntry) {
			return res.status(404).json({ success: false, message: 'Renter not found in access list' });
		}
		
		// 1. Remove renter from accessList in database
		await ObservatoryModel.updateOne(
			{ _id: observatoryId },
			{ $pull: { accessList: { username, role: 'renter' } } }
		);
		
		// 2. Force logout the renter
		const { forceLogoutUser } = require('../services/bookingAccessService');
		await forceLogoutUser(username, machineId);
		
		// 3. Update only the currently active booking date status to rejected
		const BookingModel = require('../models/observatory/booking');
		const renterUser = await UserModel.findOne({ username }).populate('socialAccount');
		
		if (renterUser) {
			// Find active bookings for this renter and observatory
			const bookings = await BookingModel.find({ 
				renter: renterUser._id,
				observatory: observatoryId,
				status: 'approved'
			});
			
			const now = new Date();
			
			// Update each booking
			for (const booking of bookings) {
				let foundActiveDate = false;
				
				// Only update the currently active date entry to rejected
				booking.dates = booking.dates.map(dateEntry => {
					const startTimeStr = dateEntry.negotiatedStartTime || dateEntry.bookedStartTime;
					const endTimeStr = dateEntry.negotiatedEndTime || dateEntry.bookedEndTime;
					
					const startTime = new Date(startTimeStr);
					const endTime = new Date(endTimeStr);
					
					// If this date entry is currently active, mark it as rejected
					if (now >= startTime && now <= endTime) {
						foundActiveDate = true;
						logger.info(`Marking active date entry as rejected for booking ${booking._id}`);
						return {
							...dateEntry,
							status: 'rejected'
						};
					}
					
					return dateEntry;
				});
				
				// Only update the booking status if we found and updated an active date
				if (foundActiveDate) {
					// Check if all dates are now rejected or completed
					const allDatesRejectedOrCompleted = booking.dates.every(
						date => date.status === 'rejected' || date.status === 'completed'
					);
					
					// If all dates are rejected or completed, update the booking status to rejected
					if (allDatesRejectedOrCompleted) {
						booking.status = 'rejected';
					}
					
					await booking.save();
					logger.info(`Updated booking ${booking._id} with rejected date`);
				}
			}
		}
		
		// 4. Send notification to the renter
		const notification = await NotificationModel.create({
			type: "REJECTED",
			content: "Your access has been revoked by the observatory owner.",
			target_users: [renterUser.socialAccount._id],
			read_users: [],
			channel: "COMMUNITY",
			role: "REGISTERED",
			actions: [{ type: "Booking" }]
		});
		
		wssMessageManager.sendMessageByUsernames([username], {
			notification,
			type: "new_unread_notification",
		});
		
		// Log the action
		logger.info(`Access revoked for user ${username} from observatory ${observatoryId} by owner ${requestingUser}`);
		
		res.json({ success: true });
	} catch (error) {
		logger.error("Error revoking access", error, {
			operation: "revokeAccess",
			observatoryId,
			username,
			machineId,
			requestingUser
		});
		res.status(500).json({ success: false, message: error.message });
	}
});

module.exports = observatoryRoutes;
