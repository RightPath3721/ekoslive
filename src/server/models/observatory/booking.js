const mongoose = require("mongoose");
const logger = require("../../logger");
const moderationReport = require("../moderation/moderationReport");

// Update the bookingSchema to better handle multi-date bookings
const bookingSchema = new mongoose.Schema({
	renter: {
		type: mongoose.Schema.Types.ObjectId,
		ref: 'User',
		required: true
	},
	owner: {
		type: mongoose.Schema.Types.ObjectId,
		ref: 'User',
		required: true
	},
	referenceNumber: {
		type: String,
		required: true,
		unique: true,
		maxLength: 6
	},
	observatory: {
		type: mongoose.Schema.Types.ObjectId,
		ref: 'Observatory',
		required: true
	},
	dates: [{
		date: { type: Date, required: true },
		availableStartTime: { type: Date, required: true },
		availableEndTime: { type: Date, required: true },
		bookedStartTime: { type: Date, required: true },
		bookedEndTime: { type: Date, required: true },
        negotiatedStartTime: { type: Date, nullable: true },
        negotiatedEndTime: { type: Date, nullable: true },
        
		status: {
			type: String,
			enum: ['pending', 'negotiating', 'approved', 'rejected', 'cancelled'],
			default: 'pending'
		},
	}],
	status: {
		type: String,
		enum: ['pending', 'negotiating', 'approved', 'rejected', 'cancelled'],
		default: 'pending'
	},
	createdAt: { type: Date, default: Date.now },
	updatedAt: { type: Date, default: Date.now }
});

// Generate a random reference number
bookingSchema.statics.generateReferenceNumber = async function() {
	const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
	let referenceNumber;
	let isUnique = false;

	while (!isUnique) {
		referenceNumber = Array.from(
			{ length: 6 }, 
			() => chars.charAt(Math.floor(Math.random() * chars.length))
		).join('');

		// Check if this reference number already exists
		const existing = await this.findOne({ referenceNumber });
		if (!existing) {
			isUnique = true;
		}
	}

	return referenceNumber;
};

module.exports = mongoose.model('Booking', bookingSchema);
