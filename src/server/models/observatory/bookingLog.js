const mongoose = require("mongoose");
const logger = require("../../logger");
const moderationReport = require("../moderation/moderationReport");

// Update the bookingSchema to better handle multi-date bookings
const bookingLogSchema = new mongoose.Schema({
	source: {
		type: mongoose.Schema.Types.ObjectId,
		ref: 'User',
		required: true
	},
	destination: {
		type: mongoose.Schema.Types.ObjectId,
		ref: 'User',
		required: true
	},
	status: {
		type: String,
		required: true,
		enum: ['pending', 'negotiating', 'approved', 'rejected', 'cancelled'],
		default: 'pending'
	},
	notes: {
		type: String,
		trim: true
	},
}, { timestamps: true });

module.exports = mongoose.model('BookingLog', bookingLogSchema);
