import React, { useState, useEffect } from 'react';
import { 
    Box, 
    Paper, 
    Typography, 
    IconButton, 
    Button,
    Tooltip,
    Avatar,
    Chip,
    TextField,
    MenuItem,
    Checkbox
} from '@mui/material';
import { styled } from '@mui/material/styles';
import ArrowBackIosNewIcon from '@mui/icons-material/ArrowBackIosNew';
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos';
import TodayIcon from '@mui/icons-material/Today';
import CircleIcon from '@mui/icons-material/Circle';
import BlockIcon from '@mui/icons-material/Block';
import LaunchIcon from '@mui/icons-material/Launch';
import CloseIcon from '@mui/icons-material/Close';
import { useDispatch } from 'react-redux';
import { bookingAction } from "@redux/actions";
import { useNavigate } from 'react-router-dom';
import { useTheme } from "@mui/material";
import { useObservatoryPageContext } from "./ObservatoryPageContext";
import useActiveUser from "@hooks/useActiveUser";
import axios from 'axios';
import { CircularProgressbar, buildStyles } from "react-circular-progressbar";
import "react-circular-progressbar/dist/styles.css";

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

const ObservatorySettingCalendar = ({ lat = 46.4825, lon = 30.7233 }) => {

	const { observatory } = useObservatoryPageContext();

    const navigate = useNavigate();
    const user = useActiveUser();
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

    // Update settings state
    const [settings, setSettings] = useState({
        hourlyRate: observatory?.hourlyRate || 0,
        minimumDays: observatory?.minimumDays || 1,
        maximumDays: observatory?.maximumDays || 30,
        minimumHoursPerDay: observatory?.minimumHoursPerDay || 1,
        shutdownProcedure: observatory?.shutdownProcedure ?? true,
    });

    // Add new state for rental statistics
    const [rentalStats, setRentalStats] = useState({
        totalDays: 0,
        bookedDays: 0,
        disabledDays: 0,
        availableDays: 0
    });

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

        // Then handle existing bookings (these will override availability if there's an overlap)
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
            });
        });
        
        setBookings(transformedBookings);
    };

    useEffect(() => {
        fetchBookings();
    }, []);

    // Modify calculateRentalStats function to use the selected month
    const calculateRentalStats = () => {
        const stats = {
            totalDays: 0,
            bookedDays: 0,
            disabledDays: 0,
            availableDays: 0
        };

        // Get first and last day of selected month
        const firstDay = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
        const lastDay = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // Count days in selected month
        const current = new Date(firstDay);
        while (current <= lastDay) {
            const dateKey = getDateKey(current);
            
            // Only count future dates and current date
            if (current >= today) {
                stats.totalDays++;
                
                const bookingInfo = bookings[dateKey];
                if (bookingInfo?.status === 'booked') {
                    stats.bookedDays++;
                } else if (bookingInfo?.status === 'disabled') {
                    stats.disabledDays++;
                } else {
                    stats.availableDays++;
                }
            }
            
            current.setDate(current.getDate() + 1);
        }
        
        setRentalStats(stats);
    };

    // Update useEffect to recalculate stats when currentDate changes
    useEffect(() => {
        calculateRentalStats();
    }, [bookings, currentDate]); // Add currentDate as dependency

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
        
        // Only check if the date is booked, allow disabled dates
        const { isBooked } = getDateStatus(dateKey);
        if (isBooked) return;

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
        
        // Only check if the date is booked
        const { isBooked } = getDateStatus(dateKey);
        if (isBooked) return;

        setSelectedDays(prev => {
            const isSelected = prev.includes(dateKey);
            if (isSelected) {
                return prev.filter(d => d !== dateKey);
            } else {
                return [...prev, dateKey].sort();
            }
        });

        setIsDragging(false);
        setDragStart(null);
        setHoverDate(null);
        setMouseDownTime(null);
    };

    const getValidDaysInRange = (start, end) => {
        const validDays = [];
        const rangeStart = new Date(Math.min(start.getTime(), end.getTime()));
        const rangeEnd = new Date(Math.max(start.getTime(), end.getTime()));
        
        const current = new Date(rangeStart);
        while (current <= rangeEnd) {
            const dateKey = getDateKey(current);
            const { isBooked } = getDateStatus(dateKey);
            
            // Only exclude booked dates
            if (!isBooked) {
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
        
        navigate(`/community/profile/observatories/bookings/new?observatory=${observatory?._id}&dates=${
            selectedDays.join(',')
        }`);
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
                    position: 'relative',
                    cursor: isBooked ? 'not-allowed' : 'pointer', // Only booked dates are not-allowed
                    userSelect: 'none',
                    backgroundColor: isSelected 
                        ? palette.primary.main
                        : isPreview
                            ? palette.primary.light
                            : 'transparent',
                    opacity: isBooked 
                        ? 0.5 
                        : (isSelected || isPreview)
                            ? 0.7 
                            : 1,
                    transition: 'all 0.2s',
                    '&:hover': {
                        backgroundColor: !isBooked 
                            ? palette.primary.light
                            : undefined,
                        opacity: !isBooked ? 0.7 : 0.5,
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

                <IconButton
                    size="medium"
                    onClick={(e) => {
                        e.stopPropagation(); // Prevent cell click
                        dispatch(bookingAction.setBookingDates([dateKey]));
                        navigate(`/community/profile/observatories/bookings/setting?observatory=${observatory?._id}`)
                    }}
                    sx={{ 
                        position: 'absolute',
                        bottom: 8,
                        right: 8,
                        backgroundColor: 'rgba(255, 255, 255, 0.1)',
                        color: palette.white[900],
                        '&:hover': {
                            backgroundColor: 'rgba(255, 255, 255, 0.2)'
                        }
                    }}
                >
                    <LaunchIcon />
                </IconButton>
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

    // Modify handleDisableDays to toggle the status
    const handleDisableDays = async () => {
        if (selectedDays.length === 0) return;
        
        try {
            // Check if all selected days are currently disabled
            const allDisabled = selectedDays.every(dateKey => 
                bookings[dateKey]?.status === 'disabled'
            );
            
            // Toggle the disabled status
            const response = await axios.post(`/api/observatories/${observatory?._id}/disable-dates?username=${user.username}&token=${user.token}`, {
                dates: selectedDays,
                disabled: !allDisabled // Toggle the status
            });
            
            if (response.status === 200) {
                // Update the local bookings state
                const newBookings = { ...bookings };
                selectedDays.forEach(dateKey => {
                    if (allDisabled) {
                        // If it was disabled, remove the disabled status
                        delete newBookings[dateKey];
                    } else {
                        // If it wasn't disabled, set it as disabled
                        newBookings[dateKey] = {
                            status: 'disabled'
                        };
                    }
                });
                setBookings(newBookings);
                setSelectedDays([]);
            }
        } catch (error) {
            console.error('Error toggling dates:', error);
        }
    };

    // Replace handleSettingChange with this version that saves automatically
    const handleSettingChange = (field) => async (event) => {
        const newValue = event.target.value;
        
        try {
            // Update local state
            setSettings(prev => ({
                ...prev,
                [field]: newValue
            }));

            // Save to database
            await axios.patch(`/api/observatories/${observatory?._id}/settings?username=${user.username}&token=${user.token}`, {
                [field]: newValue
            });
        } catch (error) {
            console.error('Error saving settings:', error);
            // Optionally revert the local state if save fails
            setSettings(prev => ({
                ...prev,
                [field]: prev[field]
            }));
        }
    };

    // Modify RentalStatistics component to handle edge cases
    const RentalStatistics = () => {
        const { palette } = useTheme();
        const bookedPercentage = rentalStats.totalDays > 0 
            ? Math.round((rentalStats.bookedDays / rentalStats.totalDays) * 100)
            : 0;

        const monthYear = currentDate.toLocaleDateString('en-US', { 
            month: 'long', 
            year: 'numeric' 
        });

        return (
            <Box sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: 3,
                p: 2,
                borderRadius: 1,
                mb: 2
            }}>
                <Box sx={{ width: 100, height: 100 }}>
                    <Tooltip 
                        title={rentalStats.totalDays > 0 
                            ? `${rentalStats.bookedDays} of ${rentalStats.totalDays} available days booked in ${monthYear}`
                            : `No available days in ${monthYear}`
                        }
                        arrow
                    >
                        <Box>
                            <CircularProgressbar
                                value={bookedPercentage}
                                text={`${bookedPercentage}%`}
                                styles={buildStyles({
                                    textSize: '22px',
                                    pathColor: bookedPercentage >= 90 
                                        ? palette.error.main 
                                        : bookedPercentage >= 60 
                                            ? palette.warning.main 
                                            : palette.primary.main,
                                    textColor: palette.white[900],
                                    trailColor: palette.grey[300],
                                })}
                            />
                        </Box>
                    </Tooltip>
                </Box>

                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                    <Typography variant="h6">{monthYear} Overview</Typography>
                    <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                        {rentalStats.totalDays > 0 ? (
                            <>
                                <Chip 
                                    label={`${rentalStats.bookedDays} Booked`}
                                    sx={{ backgroundColor: palette.error.main }}
                                />
                                <Chip 
                                    label={`${rentalStats.disabledDays} Unavailable`}
                                    sx={{ backgroundColor: palette.grey[600] }}
                                />
                                <Chip 
                                    label={`${rentalStats.availableDays} Available`}
                                    sx={{ backgroundColor: palette.success.main }}
                                />
                            </>
                        ) : (
                            <Typography variant="body2" color="text.secondary">
                                No available days in this month
                            </Typography>
                        )}
                    </Box>
                </Box>
            </Box>
        );
    };

    return (
        <Paper elevation={3} sx={{ p: 2, position: 'relative' }}>
            {/* Add RentalStatistics component at the top */}
            <RentalStatistics />

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
                    <Typography color="black">
                        {selectedDays.length} {selectedDays.length === 1 ? 'day' : 'days'} selected
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                        <Button
                            variant="contained"
                            color="primary"
                            size="small"
                            onClick={handleDisableDays}
                            startIcon={selectedDays.every(dateKey => 
                                bookings[dateKey]?.status === 'disabled'
                            ) ? <CircleIcon /> : <BlockIcon />}
                            sx={{
                                transition: 'transform 0.2s ease',
                                '&:hover': {
                                    transform: 'scale(1.05)'
                                }
                            }}
                        >
                            {selectedDays.every(dateKey => 
                                bookings[dateKey]?.status === 'disabled'
                            ) ? 'Available' : 'Unavailable'}
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

            {/* Settings Section */}
            <Box sx={{ 
                mt: 2, 
                pt: 2, 
                borderTop: 1, 
                borderColor: 'divider',
            }}>
                <Typography variant="h6" sx={{ mb: 2 }}>Booking Settings</Typography>
                <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
                    <TextField
                        label="Hourly Rate ($)"
                        type="number"
                        value={settings.hourlyRate}
                        onChange={handleSettingChange('hourlyRate')}
                        InputProps={{ inputProps: { min: 0 } }}
                        size="small"
                    />
                    <TextField
                        label="Minimum Days"
                        type="number"
                        value={settings.minimumDays}
                        onChange={handleSettingChange('minimumDays')}
                        InputProps={{ inputProps: { min: 1 } }}
                        size="small"
                    />
                    <TextField
                        label="Maximum Days"
                        type="number"
                        value={settings.maximumDays}
                        onChange={handleSettingChange('maximumDays')}
                        InputProps={{ inputProps: { min: 1 } }}
                        size="small"
                    />
                    <TextField
                        select
                        label="Minimum Hours Per Day"
                        value={settings.minimumHoursPerDay}
                        onChange={handleSettingChange('minimumHoursPerDay')}
                        size="small"
                        sx={{ minWidth: 200 }}
                    >
                        <MenuItem value={1}>1 Hour</MenuItem>
                        <MenuItem value={2}>2 Hours</MenuItem>
                        <MenuItem value={3}>3 Hours</MenuItem>
                        <MenuItem value={-1}>Max</MenuItem>
                    </TextField>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Tooltip title="Enable automatic shutdown procedure after each observation session">
                            <Box sx={{ 
                                display: 'flex', 
                                alignItems: 'center',
                                gap: 1,
                                border: 1,
                                borderColor: 'divider',
                                borderRadius: 1,
                                p: 1
                            }}>
                                <Checkbox
                                    checked={settings.shutdownProcedure}
                                    onChange={(e) => handleSettingChange('shutdownProcedure')(
                                        { target: { value: e.target.checked } }
                                    )}
                                    color="primary"
                                />
                                <Typography>Auto-shutdown after rental session</Typography>
                            </Box>
                        </Tooltip>
                    </Box>
                </Box>
            </Box>

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
                <Tooltip title="Special Event">
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <StatusIcon status="special" />
                        <Typography variant="caption">Special Event</Typography>
                    </Box>
                </Tooltip>
            </Box>
        </Paper>
    );
};

export default ObservatorySettingCalendar; 