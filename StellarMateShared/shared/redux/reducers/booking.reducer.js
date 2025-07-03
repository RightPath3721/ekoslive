import { bookingConstants } from "../constants";
import { WEBSOCKET_MESSAGE } from "redux-websocket";

const initialState =
{
    bookingDates: [],

    // My bookings (as a renter)
    bookings: [],
    
    // Received bookings (as an observatory owner)
    receivedBookings: [],
};

export const bookings = (state = initialState, action) =>
{
    switch (action.type)
    {
        case bookingConstants.SET_BOOKING_DATES:
            {
                return { ...state, bookingDates: action.payload };
            };

        case WEBSOCKET_MESSAGE:
            if (action.payload.event.target.url.includes("/message/user") === false)
                return state;
                
            const message = JSON.parse(action.payload.data);
            
            // Handle booking updates from WebSocket
            if (message.type === "booking_update") {
                const { booking } = message.payload;
                
                // Update in my bookings if I'm the renter
                if (booking.renter?.username === action.meta?.username) {
                    return {
                        ...state,
                        bookings: state.bookings.map(b => 
                            b._id === booking._id ? booking : b
                        )
                    };
                }
                
                // Update in received bookings if I'm the owner
                if (booking.owner?.username === action.meta?.username) {
                    return {
                        ...state,
                        receivedBookings: state.receivedBookings.map(b => 
                            b._id === booking._id ? booking : b
                        )
                    };
                }
            }
            
            if (message.type === "new_booking_owner") {
                const { booking } = message.payload;
                return {
                    ...state,
                    receivedBookings: [booking, ...state.receivedBookings]
                };
            }

            if (message.type === "new_booking_renter") {
                const { booking } = message.payload;
                
                return {
                    ...state,
                    bookings: [booking, ...state.bookings]
                };
            }
            
            // Handle booking status changes
            if (message.type === "booking_status_change") {
                const { bookingId, status } = message.payload;
                
                return {
                    ...state,
                    bookings: state.bookings.map(b => 
                        b._id == bookingId.toString() ? { ...b, status } : b
                    ),
                    receivedBookings: state.receivedBookings.map(b => 
                        b._id == bookingId.toString() ? { ...b, status } : b
                    )
                };
            }
            
            // Handle booking time updates
            if (message.type === "booking_time_update") {
                const { bookingId, dateId, startTime, endTime } = message.payload;
                
                const updateDates = (booking) => {
                    if (booking._id !== bookingId) return booking;
                    
                    return {
                        ...booking,
                        dates: booking.dates.map(d => 
                            d._id === dateId 
                                ? { 
                                    ...d, 
                                    negotiatedStartTime: startTime,
                                    negotiatedEndTime: endTime
                                } 
                                : d
                        )
                    };
                };
                
                return {
                    ...state,
                    bookings: state.bookings.map(updateDates),
                    receivedBookings: state.receivedBookings.map(updateDates)
                };
            }
            
            return state;
            
        case bookingConstants.SET_BOOKINGS:
            return {
                ...state,
                bookings: action.payload
            };
            
        case bookingConstants.UPDATE_BOOKING:
            return {
                ...state,
                bookings: state.bookings.map(b => 
                    b._id === action.payload._id ? action.payload : b
                )
            };
            
        case bookingConstants.SET_RECEIVED_BOOKINGS:
            return {
                ...state,
                receivedBookings: action.payload
            };
            
        case bookingConstants.UPDATE_RECEIVED_BOOKING:
            return {
                ...state,
                receivedBookings: state.receivedBookings.map(b => 
                    b._id === action.payload._id ? action.payload : b
                )
            };
            
        case bookingConstants.BOOKING_STATUS_CHANGE:
            const { bookingId, status } = action.payload;
            return {
                ...state,
                bookings: state.bookings.map(b => 
                    b._id === bookingId ? { ...b, status } : b
                ),
                receivedBookings: state.receivedBookings.map(b => 
                    b._id === bookingId ? { ...b, status } : b
                )
            };
            
        case bookingConstants.BOOKING_TIME_UPDATE:
            const { dateId, startTime, endTime } = action.payload;
            
            const updateDates = (booking) => {
                if (booking._id !== action.payload.bookingId) return booking;
                
                return {
                    ...booking,
                    dates: booking.dates.map(d => 
                        d._id === dateId 
                            ? { 
                                ...d, 
                                negotiatedStartTime: startTime,
                                negotiatedEndTime: endTime
                            } 
                            : d
                    )
                };
            };
            
            return {
                ...state,
                bookings: state.bookings.map(updateDates),
                receivedBookings: state.receivedBookings.map(updateDates)
            };
            
        case bookingConstants.CLEAR_BOOKINGS:
            return initialState;
            
        default:
            return state;
    }
};
