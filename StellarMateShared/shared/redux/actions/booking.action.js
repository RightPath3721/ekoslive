import { bookingConstants } from "../constants/bookings.constants";

export const bookingAction = {
    setBookingDates,
    setBookings,
    updateBooking,
    setReceivedBookings,
    updateReceivedBooking,
    updateBookingStatus,
    updateBookingTime,
    clearBookings
};

function setBookingDates(bookingDates)
{
    return {
        type: bookingConstants.SET_BOOKING_DATES,
        payload: bookingDates,
    }
}

function setBookings(bookings) {
    return {
        type: bookingConstants.SET_BOOKINGS,
        payload: bookings
    }
}

function updateBooking(booking) {
    return {
        type: bookingConstants.UPDATE_BOOKING,
        payload: booking
    }
}

function setReceivedBookings(bookings) {
    return {
        type: bookingConstants.SET_RECEIVED_BOOKINGS,
        payload: bookings
    }
}

function updateReceivedBooking(booking) {
    return {
        type: bookingConstants.UPDATE_RECEIVED_BOOKING,
        payload: booking
    }
}

function updateBookingStatus(bookingId, status) {
    return {
        type: bookingConstants.BOOKING_STATUS_CHANGE,
        payload: { bookingId, status }
    }
}

function updateBookingTime(bookingId, dateId, startTime, endTime) {
    return {
        type: bookingConstants.BOOKING_TIME_UPDATE,
        payload: { bookingId, dateId, startTime, endTime }
    }
}

function clearBookings() {
    return {
        type: bookingConstants.CLEAR_BOOKINGS
    }
} 