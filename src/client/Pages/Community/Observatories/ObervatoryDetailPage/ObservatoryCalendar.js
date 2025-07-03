import React, { useState, useEffect } from 'react';
import { 
    Box, 
    Paper, 
    Typography, 
    IconButton, 
    Button,
    Tooltip,
    Avatar,
    Chip
} from '@mui/material';
import { styled } from '@mui/material/styles';
import ArrowBackIosNewIcon from '@mui/icons-material/ArrowBackIosNew';
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos';
import TodayIcon from '@mui/icons-material/Today';
import CircleIcon from '@mui/icons-material/Circle';
import BlockIcon from '@mui/icons-material/Block';
import LaunchIcon from '@mui/icons-material/Launch';
import CloseIcon from '@mui/icons-material/Close';
import InfoIcon from '@mui/icons-material/Info';
import { useNavigate } from 'react-router-dom';
import { useTheme } from "@mui/material";
import { useObservatoryPageContext } from "./ObservatoryPageContext";
import { useDispatch } from 'react-redux';
import { bookingAction } from "@redux/actions";

import axios from 'axios';

const CalendarCell = styled(Box)(({ theme, isToday }) => ({
    padding: '8px',
    height: '120px',
    border: '1px solid',
    borderColor: theme.palette.divider,
    position: 'relative',
    borderColor: isToday 
        ? theme.palette.primary.main 
        : theme.palette.grey[300],
    '&:hover': {
        backgroundColor: theme.palette.grey[600],
    },
}));

const StatusIcon = styled(CircleIcon)(({ theme, status }) => {
    const colors = {
        available: theme.palette.success.main,
        booked: theme.palette.error.main,
        disabled: theme.palette.grey[400]
    };
    return {
        fontSize: '12px',
        color: colors[status] || colors.disabled
    };
});

const ObservatoryCalendar = () => {

	const { observatory } = useObservatoryPageContext();

    const navigate = useNavigate();
    const dispatch = useDispatch();
    const [currentDate, setCurrentDate] = useState(new Date());
    const [isDragging, setIsDragging] = useState(false);
    const [selectedDays, setSelectedDays] = useState([]);
    const [dragStart, setDragStart] = useState(null);
    const [hoverDate, setHoverDate] = useState(null);
    const [dragStartTime, setDragStartTime] = useState(null);
    const [mouseDownTime, setMouseDownTime] = useState(null);
    const { palette } = useTheme();
    const [bookings, setBookings] = useState([]);

    const fetchBookings = async () => {
        const { data } = await axios.get(`/api/observatories/${observatory?._id}/bookings`);
        
        // Transform bookings data into calendar-friendly format
        const transformedBookings = {};

        // First handle availability dates (should be processed first to be overridden by bookings if needed)
        if (observatory?.availability) {
            observatory.availability.forEach(availability => {
                const dateKey = availability.startTime.split('T')[0];
                if (!availability.isAvailable) {
                    transformedBookings[dateKey] = {
                        status: 'disabled'
                    };
                }
            });
        }
        
        data.bookings.forEach(booking => {
            booking.dates.forEach(date => {
                const dateKey = date.date.split('T')[0];
                
                if (date.status === 'approved') {
                    transformedBookings[dateKey] = {
                        status: 'booked',
                        user: {
                            name: booking.renter.socialAccount.social_nickname,
                            avatar: booking.renter.socialAccount.avatar || "/public/profile_default_image.webp"
                        }
                    };
                }
                // else if (date.status === 'cancelled') {
                //     transformedBookings[dateKey] = {
                //         status: 'disabled'
                //     };
                // }
            });
        });
        
        setBookings(transformedBookings);
    };

    useEffect(() => {
        fetchBookings();
    }, []);

    // Mock booking data
    // const bookings = {
    //     // Past bookings
    //     '2025-03-15': { 
    //         status: 'booked',
    //         user: {
    //             name: 'John Doe',
    //             avatar: 'https://mui.com/static/images/avatar/1.jpg'
    //         }
    //     },
    //     // Current month bookings
    //     '2025-03-20': { 
    //         status: 'booked',
    //         user: {
    //             name: 'Jane Smith',
    //             avatar: 'https://mui.com/static/images/avatar/2.jpg'
    //         }
    //     },
    //     '2025-03-21': { 
    //         status: 'booked',
    //         user: {
    //             name: 'Jane Smith',
    //             avatar: 'https://mui.com/static/images/avatar/2.jpg'
    //         }
    //     },
    //     // Maintenance days
    //     '2025-03-25': { 
    //         status: 'disabled'
    //     },
    //     // Future bookings
    //     '2025-04-01': { 
    //         status: 'booked',
    //         user: {
    //             name: 'Alice Johnson',
    //             avatar: 'https://mui.com/static/images/avatar/3.jpg'
    //         }
    //     }
    // };

    useEffect(() => {
        const handleGlobalMouseUp = () => {
            const isShortClick = mouseDownTime && (Date.now() - mouseDownTime < 200);
            
            if (isDragging && !isShortClick) {
                // Finish drag selection
                setIsDragging(false);
                setDragStart(null);
                setHoverDate(null);
            }
            setMouseDownTime(null);
        };

        document.addEventListener('mouseup', handleGlobalMouseUp);
        return () => {
            document.removeEventListener('mouseup', handleGlobalMouseUp);
        };
    }, [isDragging, mouseDownTime]);

    const getDateKey = (date) => {
        return date.toLocaleDateString('en-CA');
    };

    const createDateFromDay = (day) => {
        return new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
    };

    const handleMouseDown = (day, e) => {
        e.preventDefault();
        const clickedDate = createDateFromDay(day);
        const dateKey = getDateKey(clickedDate);
        
        // Check if the date is available
        const { isBooked, isDisabled } = getDateStatus(dateKey);
        if (isBooked || isDisabled) return;

        setMouseDownTime(Date.now());
        setIsDragging(true);
        setDragStart(clickedDate);
        setHoverDate(day);
    };

    const handleMouseEnter = (day) => {
        if (!isDragging) return;
        
        const currentHoverDate = createDateFromDay(day);
        setHoverDate(day);
        
        if (dragStart) {
            const validDays = getValidDaysInRange(dragStart, currentHoverDate);
            setSelectedDays(validDays);
        }
    };

    const handleCellClick = (day) => {
        if (mouseDownTime && (Date.now() - mouseDownTime > 200)) return;

        const clickedDate = createDateFromDay(day);
        const dateKey = getDateKey(clickedDate);
        
        // Check if the date is available
        const { isBooked, isDisabled } = getDateStatus(dateKey);
        if (isBooked || isDisabled) return;

        // Check if adding this date would exceed maximum days
        const isSelected = selectedDays.includes(dateKey);
        if (!isSelected && observatory?.maximumDays && selectedDays.length >= observatory?.maximumDays) {
            return; // Don't add more days if we're at the maximum
        }

        // Toggle the clicked date in selection
        setSelectedDays(prev => {
            const isSelected = prev.includes(dateKey);
            if (isSelected) {
                return prev.filter(d => d !== dateKey);
            } else {
                return [...prev, dateKey].sort();
            }
        });

        // Reset drag-related states
        setIsDragging(false);
        setDragStart(null);
        setHoverDate(null);
        setMouseDownTime(null);
    };

    const getValidDaysInRange = (start, end) => {
        const validDays = [];
        const rangeStart = new Date(Math.min(start.getTime(), end.getTime()));
        const rangeEnd = new Date(Math.max(start.getTime(), end.getTime()));
        
        // Calculate the number of days in the range
        const daysDifference = Math.floor((rangeEnd - rangeStart) / (1000 * 60 * 60 * 24)) + 1;
        
        // If the range would exceed maximum days, adjust the end date
        if (observatory?.maximumDays && daysDifference > observatory.maximumDays) {
            const maxEnd = new Date(rangeStart);
            maxEnd.setDate(maxEnd.getDate() + observatory.maximumDays - 1);
            rangeEnd.setTime(maxEnd.getTime());
        }
        
        const current = new Date(rangeStart);
        while (current <= rangeEnd) {
            const dateKey = getDateKey(current);
            const { isBooked, isDisabled } = getDateStatus(dateKey);
            
            if (!isBooked && !isDisabled) {
                validDays.push(dateKey);
            }
            
            current.setDate(current.getDate() + 1);
        }
        
        return validDays;
    };

    const isDateInPreview = (day) => {
        if (!dragStart || !hoverDate) return false;
        
        const date = createDateFromDay(day);
        const start = dragStart;
        const hover = createDateFromDay(hoverDate);
        
        const rangeStart = new Date(Math.min(start.getTime(), hover.getTime()));
        const rangeEnd = new Date(Math.max(start.getTime(), hover.getTime()));

        return date >= rangeStart && date <= rangeEnd;
    };

    const handleBookingClick = () => {
        if (selectedDays.length === 0) return;
        dispatch(bookingAction.setBookingDates(selectedDays));
        setSelectedDays([]);
        navigate(`/community/profile/observatories/bookings/new?observatory=${observatory?._id}`);
    };

    const renderCalendarCell = (day) => {
        const dateKey = getDateKey(createDateFromDay(day));
        const { isBooked, isDisabled, bookingInfo } = getDateStatus(dateKey);
        const isSelected = selectedDays.includes(dateKey);
        const isPreview = isDragging && isDateInPreview(day);

        return (
            <Box
                onMouseDown={(e) => handleMouseDown(day, e)}
                onMouseEnter={() => handleMouseEnter(day)}
                onClick={() => handleCellClick(day)}
                onMouseUp={(e) => e.preventDefault()}
                sx={{ 
                    height: '100%', 
                    display: 'flex', 
                    flexDirection: 'column',
                    cursor: (isDisabled || isBooked) ? 'not-allowed' : 'pointer',
                    userSelect: 'none',
                    backgroundColor: isSelected 
                        ? palette.primary.main
                        : isPreview
                            ? palette.primary.light
                            : 'transparent',
                    opacity: isDisabled || isBooked 
                        ? 0.5 
                        : (isSelected || isPreview)
                            ? 0.7 
                            : 1,
                    transition: 'all 0.2s',
                    '&:hover': {
                        backgroundColor: (!isDisabled && !isBooked) 
                            ? palette.primary.light
                            : undefined,
                        opacity: (!isDisabled && !isBooked) ? 0.7 : 0.5,
                    },
                }}
            >
                <Box sx={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center',
                    mb: 1
                }}>
                    <Typography variant="body2">{day}</Typography>
                    <Tooltip title={getStatusLabel(bookingInfo.status)}>
                        {bookingInfo.status === 'disabled' || bookingInfo.status === 'booked' ? (
                            <BlockIcon 
                                sx={{ 
                                    color: bookingInfo.status === 'booked' ? palette.primary.main : palette.error.main,
                                    fontSize: '1.2rem'
                                }} 
                            />
                        ) : (
                            <StatusIcon status={bookingInfo.status} />
                        )}
                    </Tooltip>
                </Box>

                {isBooked && bookingInfo.user && (
                    <Box sx={{ 
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1,
                        ml: 1
                    }}>
                        <Avatar 
                            src={bookingInfo.user.avatar}
                            sx={{ width: 24, height: 24 }}
                        >
                            {bookingInfo.user.name[0]}
                        </Avatar>
                        <Typography variant="caption" noWrap>
                            {bookingInfo.user.name}
                        </Typography>
                    </Box>
                )}
            </Box>
        );
    };

    const getDaysInMonth = (date) => {
        const year = date.getFullYear();
        const month = date.getMonth();
        return new Date(year, month + 1, 0).getDate();
    };

    const getFirstDayOfMonth = (date) => {
        return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
    };

    const handlePrevMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1));
    };

    const handleNextMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1));
    };

    const handleTodayClick = () => {
        setCurrentDate(new Date());
    };

    const getDateStatus = (dateKey) => {
        const bookingInfo = bookings[dateKey] || { status: 'available' };
        const isPast = isPastDate(dateKey);
        return {
            isBooked: bookingInfo.status === 'booked',
            isDisabled: bookingInfo.status === 'disabled' || isPast,
            bookingInfo
        };
    };

    const isPastDate = (dateString) => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const compareDate = new Date(dateString);
        return compareDate < today;
    };

    const getStatusLabel = (status) => {
        switch (status) {
            case 'available':
                return 'Available';
            case 'booked':
                return 'Booked';
            case 'disabled':
                return 'Not Available';
            default:
                return '';
        }
    };

    const renderCalendar = () => {
        const daysInMonth = getDaysInMonth(currentDate);
        const firstDay = getFirstDayOfMonth(currentDate);
        const today = new Date();
        const weeks = [];
        let days = [];

        // Add empty cells for days before the first day of the month
        for (let i = 0; i < firstDay; i++) {
            days.push(
                <CalendarCell 
                    key={`empty-${i}`} 
                    sx={{ pointerEvents: 'none' }} 
                />
            );
        }

        // Add cells for each day of the month
        for (let day = 1; day <= daysInMonth; day++) {
            const isToday = 
                today.getDate() === day && 
                today.getMonth() === currentDate.getMonth() && 
                today.getFullYear() === currentDate.getFullYear();

            days.push(
                <CalendarCell 
                    key={day} 
                    isToday={isToday}
                    sx={{
                        transition: 'all 0.2s',
                        cursor: 'pointer',
                        '&:hover': {
                            backgroundColor: 'primary.light',
                            opacity: 0.7,
                        },
                    }}
                >
                    {renderCalendarCell(day)}
                </CalendarCell>
            );

            if ((firstDay + day) % 7 === 0 || day === daysInMonth) {
                weeks.push(
                    <Box 
                        key={`week-${weeks.length}`} 
                        sx={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)' }}
                    >
                        {days}
                    </Box>
                );
                days = [];
            }
        }

        return weeks;
    };

    const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    // Add validation function
    const getBookingValidationError = () => {
        if (!selectedDays.length) return null;

        if (selectedDays.length < observatory?.minimumDays) {
            return `Please select at least ${observatory?.minimumDays} day${observatory?.minimumDays > 1 ? 's' : ''}`;
        }

        if (observatory?.maximumDays && selectedDays.length > observatory?.maximumDays) {
            return `You can select up to ${observatory?.maximumDays} day${observatory?.maximumDays > 1 ? 's' : ''}`;
        }

        return null;
    };

    return (
        <Paper elevation={3} sx={{ p: 2, position: 'relative' }}>
            
            {selectedDays.length > 0 && (
                <Box 
                    sx={{ 
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        zIndex: 1000,
                        backgroundColor: '#fff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '8px 16px',
                        margin: '5px',
                        borderRadius: '5px',
                        backgroundColor: palette.grey[300],
                        animation: 'slideDown 0.3s ease-out',
                        '@keyframes slideDown': {
                            '0%': {
                                transform: 'translateY(-100%)',
                                opacity: 0
                            },
                            '100%': {
                                transform: 'translateY(0)',
                                opacity: 1
                            }
                        }
                    }}
                >
                    <Box>
                        <Typography color="black">
                            {selectedDays.length} {selectedDays.length === 1 ? 'day' : 'days'} selected
                        </Typography>
                        {getBookingValidationError() && (
                            <Typography 
                                color="error" 
                                variant="caption" 
                                sx={{ display: 'block' }}
                            >
                                {getBookingValidationError()}
                            </Typography>
                        )}
                    </Box>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                        <Button
                            variant="contained"
                            color="primary"
                            size="small"
                            onClick={handleBookingClick}
                            startIcon={<LaunchIcon />}
                            disabled={!!getBookingValidationError()}
                            sx={{
                                transition: 'transform 0.2s ease',
                                '&:hover': {
                                    transform: 'scale(1.05)'
                                }
                            }}
                        >
                            Book Now
                        </Button>
                        <IconButton 
                            size="small"
                            onClick={() => setSelectedDays([])}
                            sx={{
                                transition: 'transform 0.2s ease',
                                '&:hover': {
                                    transform: 'scale(1.1)'
                                },
                                color: palette.white[900]
                            }}
                        >
                            <CloseIcon />
                        </IconButton>
                    </Box>
                </Box>
            )}

            <Box sx={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center', 
                mb: 2,
                gap: 2,
                mt: selectedDays.length > 0 ? 6 : 0
            }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <IconButton onClick={handlePrevMonth} style={{ color: 'white' }}>
                        <ArrowBackIosNewIcon />
                    </IconButton>
                    <Typography variant="h6">
                        {currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                    </Typography>
                    <IconButton onClick={handleNextMonth} style={{ color: 'white' }}>
                        <ArrowForwardIosIcon />
                    </IconButton>
                </Box>
                
                <Button 
                    variant="outlined" 
                    startIcon={<TodayIcon />}
                    onClick={handleTodayClick}
                >
                    Today
                </Button>
            </Box>
            
            <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', mb: 1 }}>
                {weekDays.map(day => (
                    <Typography 
                        key={day} 
                        variant="subtitle2" 
                        sx={{ textAlign: 'center', fontWeight: 'bold' }}
                    >
                        {day}
                    </Typography>
                ))}
            </Box>
            
            {renderCalendar()}

            {/* Legend */}
            <Box sx={{ 
                display: 'flex', 
                gap: 2, 
                mt: 2, 
                pt: 2, 
                borderTop: 1, 
                borderColor: 'divider' 
            }}>
                <Tooltip title="Booked">
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <StatusIcon status="booked" />
                        <Typography variant="caption">Booked</Typography>
                    </Box>
                </Tooltip>
                <Tooltip title="Available for Special Event">
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <StatusIcon status="available" />
                        <Typography variant="caption">Available</Typography>
                    </Box>
                </Tooltip>
                {/* <Tooltip title="Special Event">
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <StatusIcon status="special" />
                        <Typography variant="caption">Special Event</Typography>
                    </Box>
                </Tooltip> */}
            </Box>

            {/* Booking Requirements Info */}
            <Box 
                sx={{ 
                    my: 3,
                    p: 2,
                    borderRadius: 1,
                    backgroundColor: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid',
                    borderColor: 'divider'
                }}
            >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                    <InfoIcon color="info" />
                    <Typography variant="subtitle1">Booking Requirements</Typography>
                </Box>
                <Box sx={{ 
                    display: 'flex', 
                    flexWrap: 'wrap',
                    gap: { xs: 2, md: 3 },
                    alignItems: 'center'
                }}>
                    <Typography variant="body2" color={palette.white[900]}>
                        Rate: <Typography component="span" color="primary">${observatory?.hourlyRate || 0}/hour</Typography>
                    </Typography>
                    <Typography variant="body2" color={palette.white[900]}>
                        •
                    </Typography>
                    <Typography variant="body2" color={palette.white[900]}>
                        Minimum Days: <Typography component="span" color="primary">{observatory?.minimumDays} day{observatory?.minimumDays > 1 ? 's' : ''}</Typography>
                    </Typography>
                    <Typography variant="body2" color={palette.white[900]}>
                        •
                    </Typography>
                    <Typography variant="body2" color={palette.white[900]}>
                        Maximum Days: <Typography component="span" color="primary">
                            {observatory?.maximumDays} day{observatory?.maximumDays > 1 ? 's' : ''}
                        </Typography>
                    </Typography>
                    <Typography variant="body2" color={palette.white[900]}>
                        •
                    </Typography>
                    <Typography variant="body2" color={palette.white[900]}>
                        Minimum Hours Per Day: <Typography component="span" color="primary">
                            {observatory?.minimumHoursPerDay === -1 
                                ? 'Full Day (24 hours)'
                                : `${observatory?.minimumHoursPerDay} hour${observatory?.minimumHoursPerDay > 1 ? 's' : ''}`
                            }
                        </Typography>
                    </Typography>
                </Box>
            </Box>

        </Paper>
    );
};

export default ObservatoryCalendar; 