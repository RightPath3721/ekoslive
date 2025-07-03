const mongoose = require("mongoose");
const { deleteImgFromBucket, getObjectUrl } = require("../../utils/minio");
const logger = require("../../logger");
const moderationReport = require("../moderation/moderationReport");


// Update the bookingSchema to better handle multi-date bookings
const bookingSchema = new mongoose.Schema({
	user: {
		type: mongoose.Schema.Types.ObjectId,
		ref: 'User',
		required: true
	},
	observatory: {
		type: mongoose.Schema.Types.ObjectId,
		ref: 'Observatory',
		required: true
	},
	dates: [{
		startTime: { type: Date, required: true },
		endTime: { type: Date, required: true },
		status: {
			type: String,
			enum: ['pending', 'approved', 'rejected', 'cancelled'],
			default: 'pending'
		},
		feedback: String
	}],
	totalPrice: { type: Number, required: true },
	status: {
		type: String,
		enum: ['pending', 'approved', 'rejected', 'cancelled'],
		default: 'pending'
	},
	createdAt: { type: Date, default: Date.now },
	updatedAt: { type: Date, default: Date.now }
});

const observatoryScheme = new mongoose.Schema({
	name: { type: String, required: true },
	visibility: { type: Boolean, default: true },
	rentable: { 
		type: Boolean, 
		default: false, 
		nullable: true,
		validate: {
			validator: function(value) {
				// Only allow rentable to be true if visibility is true
				return !value || this.visibility === true;
			},
			message: 'Rentable can only be true when visibility is true'
		}
	},
	rentable_profile_id: {
		type: mongoose.Schema.Types.ObjectId,
		ref: "EquipmentProfile",
		nullable: true
	},
	bortle_scale: { type: Number, default: 1 },
	hours_used: Number,
	notes: String,
	previewImg: String,
	photos: [String],
	machine_id: { type: String, nullable: true },
	isPublicLocation: { type: Boolean, default: true },
	location: {
		type: mongoose.Schema.Types.ObjectId,
		ref: "Location",
	},
	equipment_profiles: [
		{
			type: mongoose.Schema.Types.ObjectId,
			ref: "EquipmentProfile",
		},
	],
	aperture: Number,
	owner: String,
	posted_by: {
		type: mongoose.Schema.Types.ObjectId,
		ref: "Social",
	},
	images_captured: { type: Number, default: 0 },
	moderation_report: {
		type: mongoose.Schema.Types.ObjectId,
		ref: "ModerationReport",
	},
	isAvailableForRent: { type: Boolean, default: false, nullable: true },
	hourlyRate: { type: Number, default: 0, nullable: true },
	minimumDays: { type: Number, default: 1, nullable: true },
	maximumDays: { type: Number, nullable: true },
	minimumHoursPerDay: { type: Number, default: 1, nullable: true },
	shutdownProcedure: { type: Boolean, default: true, nullable: true },
	availability: [{
		startTime: { type: Date },
		endTime: { type: Date },
		isAvailable: { type: Boolean, default: true }
	}],

	bookings: [bookingSchema],
	announcements: [{
		title: { type: String, required: true },
		content: { type: String, required: true },
		createdAt: { type: Date, default: Date.now },
		isPinned: { type: Boolean, default: false }
	}],
	negotiationSettings: {
		type: {
			defaultConfirmHours: { type: Number, default: 48 },
			maxNegotiationRounds: { type: Number, default: 3 }
		},
		nullable: true,
		default: null
	},
	usageGuidelines: { 
		type: String, 
		default: `<p><em><strong>Remote Observatory Usage Guidelines</strong></em></p><p><em><strong><br></strong></em>
</p><p>
<strong>Introduction</strong></p><ol><li>
This document outlines the essential procedures and guidelines for using the remote observatory facility.&nbsp;Adherence to these protocols ensures equipment longevity, successful observation sessions, and equal access for all authorized users.
</li><li><br></li><li>
<strong>Pre-Session Guidelines</strong></li><li><ul><li>- Check weather forecasts and observatory status before your session.
</li><li>- Log in to the ekoslive web-based platform 15 minutes before your scheduled time to verify connectivity.
</li><li>- Review any maintenance notices or equipment restrictions before beginning.
</li><li><br></li><li>
<strong>During Your Session</strong>
</li><li>- Run the observatory startup sequence as documented in the control software.
</li><li>- Verify all systems are operational before beginning observations.</li><li>- Monitor weather conditions throughout your session.
</li><li>- Immediately abort session if adverse weather conditions develop.
</li><li>- Report any unusual equipment behavior through the issue tracking system.
</li><li>- Respect your allocated time slot and prepare to conclude operations promptly.
</li><li><br></li><li>
<strong>End of Session Procedures</strong>
</li><li>- Close all active imaging sequences and application processes.
</li><li>- Park the telescope mount in its home position.
</li><li>- If a dome is present, rotate it to the park position (typically north).
</li><li>- Close the dome slit completely.
</li><li>- Turn off any cooling systems for cameras or other equipment.
</li><li>- Complete the post-observation form documenting your session.
</li><li><br></li><li>
<strong>Safety and Security</strong>
</li><li>- Never share your access credentials with others.
</li><li>- In case of emergency, contact the observatory manager at the emergency number provided.</li></ul></li></ol>`
	},
    
    // Access list - users who can access this observatory
    accessList: [{
        username: { type: String, required: true },
        role: { 
            type: String, 
            enum: ['master', 'renter', 'spectator'],
            required: true 
        },
        // For renters, track rental period
        rentalStart: { type: Date },
        rentalEnd: { type: Date }
    }],
    timezone: {
        type: String,
		nullable: true
    },
});

observatoryScheme.pre("findOneAndDelete", async function (next)
{
	const observatory = await this.model.db
		.model("Observatory")
		.findById(this.getQuery()._id);
	await deleteImgFromBucket(observatory.photos ?? []);
	await this.model.db
		.model("EquipmentProfile")
		.deleteMany({ _id: { $in: observatory.equipment_profiles } });
	next();
});

observatoryScheme.pre("save", async function (next)
{
	if (this.isNew)
	{
		const moderation_report = new moderationReport();
		await moderation_report.save();
		this.moderation_report = moderation_report._id;
	}
	next();
});

observatoryScheme.post("aggregate", async function (res, next)
{
	const data = res[0]?.data;

	if (!data)
	{
		return next();
	}
	else
	{
		const observatories = await Promise.allSettled(
			data.map(async (observatory) =>
			{
				const photos = await Promise.all(
					observatory.photos.map(async (photoName) => getObjectUrl(photoName)),
				);
				return { ...observatory, photos };
			}),
		);

		res[0].data = observatories
			.map((result) => (result.status === "fulfilled" ? result.value : null))
			.filter((observatory) => observatory);

		return next();
	}
});

observatoryScheme.post("findOne", async function (res, next)
{
	if (!res)
	{
		return next();
	}
	else
	{
		if (this.getOptions().skipPhotoTransform)
		{
			return next();
		}
		
		const photos = await Promise.all(
			res.photos.map(async (photoName) => getObjectUrl(photoName)),
		);
		res.photos = photos;
		next();
	}
});

observatoryScheme.post("save", async function (res, next)
{
	try
	{
		const observatory = await this.db.model("Observatory").findById(res._id);
		// Only create an equipment profile if the observatory has no equipment profiles
		if (observatory.equipment_profiles?.length === 0) {
			const equipmentProfile = await this.db.model("EquipmentProfile").create({
				equipments: [],
				name: "My Gear",
			});

			await this.db.model("Observatory").findByIdAndUpdate(res._id, {
				$push: { equipment_profiles: equipmentProfile._id },
			});
			
			logger.info(`Created initial equipment profile for observatory ${res._id}`);
		}
	}
	catch (error)
	{
		logger.error("Error creating initial equipment profile for observatory", error, {
			operation: "observatorySchemaPostSave",
			observatoryId: res._id
		});
	}
	next();
});

observatoryScheme.methods.setAvailability = async function(startTime, endTime, isAvailable = true) {
	this.availability.push({
		startTime: new Date(startTime),
		endTime: new Date(endTime),
		isAvailable
	});
	await this.save();
};

observatoryScheme.methods.checkAvailability = function(startTime, endTime) {
	return this.availability.some(slot => 
		slot.isAvailable &&
		slot.startTime <= new Date(startTime) &&
		slot.endTime >= new Date(endTime)
	);
};

// Add methods for booking management
observatoryScheme.methods.createBooking = async function(userId, dates) {
	const booking = {
		user: userId,
		observatory: this._id,
		dates: dates.map(date => ({
			startTime: new Date(date.startTime),
			endTime: new Date(date.endTime),
			status: 'pending'
		})),
		totalPrice: dates.reduce((total, date) => {
			const hours = ((new Date(date.endTime) - new Date(date.startTime)) / (1000 * 60 * 60)).toFixed(2);
			return total + (hours * this.hourlyRate);
		}, 0)
	};

	this.bookings.push(booking);
	await this.save();
	return booking;
};

observatoryScheme.methods.updateBookingStatus = async function(bookingId, dateId, status, feedback = '') {
	const booking = this.bookings.id(bookingId);
	if (!booking) throw new Error('Booking not found');

	const bookingDate = booking.dates.id(dateId);
	if (!bookingDate) throw new Error('Booking date not found');

	bookingDate.status = status;
	bookingDate.feedback = feedback;

	// Update overall booking status based on dates
	const allDatesStatus = booking.dates.map(d => d.status);
	if (allDatesStatus.every(s => s === 'approved')) {
		booking.status = 'approved';
	} else if (allDatesStatus.every(s => s === 'rejected')) {
		booking.status = 'rejected';
	} else if (allDatesStatus.some(s => s === 'cancelled')) {
		booking.status = 'cancelled';
	}

	booking.updatedAt = new Date();
	await this.save();
	return booking;
};

// Add utility function at bottom

module.exports = mongoose.model("Observatory", observatoryScheme);
