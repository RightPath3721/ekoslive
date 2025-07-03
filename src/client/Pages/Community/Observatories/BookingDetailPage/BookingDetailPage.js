import React, { useState, useEffect, useRef } from 'react';
import { 
    Box, 
    Paper, 
    Typography, 
    Slider, 
    Avatar,
    Divider,
    Card,
    CardContent,
    Stack,
    Button,
    Alert,
    IconButton,
    Tooltip,
    useTheme,
    CircularProgress,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    FormControlLabel,
    Checkbox,
    Link
} from '@mui/material';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import PageContainer from "@components/global/PageContainer";
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import PersonIcon from '@mui/icons-material/Person';
import EmailIcon from '@mui/icons-material/Email';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import ScheduleIcon from '@mui/icons-material/Schedule';
import ArrowBackIosNewIcon from '@mui/icons-material/ArrowBackIosNew';
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos';
import { getTwilightTimes, getHours, getMinutes } from '@utils/getTwilightTime';
import { alpha } from '@mui/material/styles';
import axios from 'axios';
import useActiveUser from "@hooks/useActiveUser";
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import AccessTimeFilledIcon from '@mui/icons-material/AccessTimeFilled';
import PaidIcon from '@mui/icons-material/Paid';
import WbSunnyIcon from '@mui/icons-material/WbSunny';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import LightModeIcon from '@mui/icons-material/LightMode';
import NightsStayIcon from '@mui/icons-material/NightsStay';
import moment from 'moment-timezone';
import 'moment-timezone/data/packed/latest.json';
import { useSelector } from 'react-redux';

const BookingDetailPage = () => {
    const location = useLocation();
    const searchParams = new URLSearchParams(location.search);
    const observatoryId = searchParams.get('observatory');

    const rawDates = useSelector(state => state.bookings.bookingDates);
    const currentUser = useParams().type === "new" ? "renter" : "owner";
    
    // Ensure we have a proper array of dates in YYYY-MM-DD format
    const [formattedDates, setFormattedDates] = useState([]);

    useEffect(() => {
        if (rawDates.length > 0) {
            setFormattedDates(
                rawDates.map(date => date ? date.trim() : '')
                      .filter(date => date !== '')
            );
        }
    }, [rawDates]);
    
    // Start with the first date in the array
    const [currentDateIndex, setCurrentDateIndex] = useState(0);
    const [currentDate, setCurrentDate] = useState(formattedDates[0] || '');
    
    
    // Add refs to track initialization
    const isInitialized = useRef(false);
    const twilightDataRef = useRef({});
    
    const [booking, setBooking] = useState(null);
    const [twilightTimes, setTwilightTimes] = useState({});
    const [timeRanges, setTimeRanges] = useState({});
    const [error, setError] = useState('');
    const { palette } = useTheme();

    // Add new state for booked times
    const [bookedTimes, setBookedTimes] = useState({});
    const [dailyBookings, setDailyBookings] = useState({});
    const [isBookingSubmitted, setIsBookingSubmitted] = useState(false);
    const [showGuidelines, setShowGuidelines] = useState(false);
    const [guidelinesAccepted, setGuidelinesAccepted] = useState(false);
    const [observatory, setObservatory] = useState(null);
	const user = useActiveUser();

    // Add isOwner check
    const isOwner = currentUser === 'owner'; // Modify this based on how you determine ownership

    // Add new state for saving status
    const [isSaving, setIsSaving] = useState(false);
    const [availability, setAvailability] = useState({});

    // Add new state for timezone
    const [timezone, setTimezone] = useState(null);
    const [dstOffset, setDstOffset] = useState(null);
    const [rawOffset, setRawOffset] = useState(null);

    const navigate = useNavigate();

    // Add new loading state
    const [isLoading, setIsLoading] = useState(true);

    // Create a new function to get timezone using Google's API
    const getTimezoneFromGoogle = async (lat, lng) => {
        try {
            // Current timestamp in seconds
            const timestamp = Math.floor(Date.now() / 1000);            
            // Make a request to Google's Time Zone API
            const response = await axios.get(
                'https://maps.googleapis.com/maps/api/timezone/json',
                {
                    params: {
                        location: `${lat},${lng}`,
                        timestamp: timestamp,
                        key: process.env.REACT_APP_GOOGLE_MAPS_KEY
                    }
                }
            );
            
            // Check if the request was successful
            if (response.data.status === 'OK') {
                // Store both the timezone ID and the formatted offset
                return [
                    response.data.timeZoneId, 
                    response.data.dstOffset, 
                    response.data.rawOffset
                ];
            } else {
                console.error('Error from Google Time Zone API:', response.data.status);
                return null;
            }
        } catch (error) {
            console.error('Error fetching timezone from Google API:', error);
            return null;
        }
    };

    // Define the timezone calculation function
    const calculateTimezoneFromCoordinates = (lat, lng) => {
        try {
            // Each timezone is roughly 15 degrees of longitude (360° / 24 hours)
            // This is a simple estimation - for more accuracy you'd need a timezone API
            const timezoneOffset = Math.round(lng / 15);
            
            // Convert to timezone string (e.g., "UTC+2" or "UTC-5")
            const sign = timezoneOffset >= 0 ? '+' : '-';
            const hours = Math.abs(timezoneOffset);
            
            return `UTC${sign}${hours}`;
        } catch (error) {
            console.error('Error calculating timezone:', error);
            return 'UTC'; // Return UTC as fallback
        }
    };

    // Add new function to fetch availability for a specific date
    const fetchAvailabilityForDate = async (date) => {
        if (!observatoryId || !date) return;
        
        try {
            const response = await axios.get(
                `/api/observatories/${observatoryId}/availability?dates=${date}`
            );
            
            const availabilityData = response.data.availability.reduce((acc, item) => {
                if (!item?.startTime) return acc;
                
                // Convert date to YYYY-MM-DD format in observatory timezone
                // The date appears different because the timezone conversion might be shifting the date
                // We need to extract the date from the original ISO string to maintain consistency
                const formattedDate = item.startTime.split('T')[0]; // Extract YYYY-MM-DD from ISO string
                
                // Parse the times correctly, converting hours from midnight to hours from noon (slider reference)
                const convertTimeToSliderValue = (timeStr) => {
                    if (!timeStr) return null;
                    const timeMoment = moment(timeStr).tz(timezone || 'UTC');
                    let hours = timeMoment.hours();
                    // Convert to hours since noon (slider uses 0 = noon, 12 = midnight, etc)
                    let hoursSinceNoon = hours - 12;
                    if (hours < 12) hoursSinceNoon += 24; // Handle morning hours
                    return hoursSinceNoon;
                };
                
                const startValue = convertTimeToSliderValue(item.startTime);
                const endValue = convertTimeToSliderValue(item.endTime);
                
                // Only store valid availability with proper times
                if (startValue !== null && endValue !== null) {
                    acc[formattedDate] = {
                        ...item,
                        startSliderValue: startValue,
                        endSliderValue: endValue
                    };
                }
                
                return acc;
            }, {});
            
            setAvailability(prev => ({
                ...prev,
                ...availabilityData
            }));

            // Update time ranges based on availability
            if (availabilityData[date]?.startSliderValue !== undefined && 
                availabilityData[date]?.endSliderValue !== undefined) {
                
                const start = availabilityData[date].startSliderValue;
                const end = availabilityData[date].endSliderValue;

                setTimeRanges(prev => ({
                    ...prev,
                    [date]: {
                        owner: [start, end],
                        renter: [start, end]
                    }
                }));

            }
        } catch (error) {
            console.error('Error fetching availability:', error);
            setError('Failed to load availability data');
        }
    };

    // Update fetchObservatory to handle loading state
    const fetchObservatory = async () => {
        try {
            const response = await axios.get(
                `/api/observatories/${observatoryId}`
            );
            
            const observatoryData = response.data.observatory;        
            // Set observatory data
            setObservatory(observatoryData);
            
            // Calculate and set timezone based on observatory coordinates
            if (observatoryData?.location?.lat && observatoryData?.location?.lng) {
                try {
                    const [googleTimezone, dstOffset, rawOffset] = await getTimezoneFromGoogle(
                        observatoryData.location.lat,
                        observatoryData.location.lng
                    );

                    if (googleTimezone && dstOffset !== undefined && dstOffset !== null && 
                        rawOffset !== undefined && rawOffset !== null) {
                        setDstOffset(dstOffset);
                        setRawOffset(rawOffset);
                        setTimezone(googleTimezone);

                        // After getting the timezone, update the observatory data (if you're the owner)
                        const updateObservatoryWithTimezone = async (observatoryId, googleTimezone, dstOffset, rawOffset) => {
                            if (!user || !observatoryId || !googleTimezone) return;
                            
                            try {
                                await axios.patch(
                                    `/api/observatories/${observatoryId}`,
                                    { 
                                        timezone: googleTimezone,
                                        dstOffset: dstOffset,
                                        rawOffset: rawOffset
                                    },
                                    {
                                        params: {
                                            username: user.username,
                                            token: user.token,
                                        },
                                    }
                                );
                            } catch (error) {
                                console.error('Failed to update observatory with timezone:', error);
                            }
                        };

                        // Call this function after getting the timezone from Google (if you're the observatory owner)
                        if (googleTimezone && (!observatoryData.timezone || observatoryData.dstOffset === undefined)) {
                            updateObservatoryWithTimezone(observatoryId, googleTimezone, dstOffset, rawOffset);
                        }
                    } else {
                        // Fallback to simple calculation if Google API fails
                        const calculatedTimezone = calculateTimezoneFromCoordinates(
                            observatoryData.location.lat,
                            observatoryData.location.lng
                        );
                        setTimezone(calculatedTimezone);
                    }
                } catch (error) {
                    // Fallback to simple calculation if Google API fails
                    const calculatedTimezone = calculateTimezoneFromCoordinates(
                        observatoryData.location.lat,
                        observatoryData.location.lng
                    );
                    setTimezone(calculatedTimezone);
                }
            } else {
                // Default to UTC if no coordinates are available
                setTimezone('UTC');
            }
        } catch (error) {
            console.error('Error fetching observatory:', error);
            setError('Failed to load observatory data');
        } finally {
            setIsLoading(false);
        }
    };

    // First, let's add a helper function to ensure dates are in consistent format
    const normalizeDate = (date) => {
        // Ensure consistent YYYY-MM-DD format regardless of timezone
        return moment(date).format('YYYY-MM-DD');
    };

    // Simplified navigation handlers that work with indices
    const handlePreviousDay = () => {
        
        if (isOwner) {
            // For owners, calculate previous day regardless of available dates
            const prevDate = moment(currentDate).subtract(1, 'days').format('YYYY-MM-DD');
            setCurrentDate(prevDate);
            fetchAvailabilityForDate(prevDate);
        } else if (currentDateIndex > 0) {
            // For non-owners, move back in the array if possible
            const newIndex = currentDateIndex - 1;
            const prevDate = formattedDates[newIndex];
            setCurrentDateIndex(newIndex);
            setCurrentDate(prevDate);
            fetchAvailabilityForDate(prevDate);
        }
    };

    const handleNextDay = () => {
        
        if (isOwner) {
            // For owners, calculate next day regardless of available dates
            const nextDate = moment(currentDate).add(1, 'days').format('YYYY-MM-DD');
            setCurrentDate(nextDate);
            fetchAvailabilityForDate(nextDate);
        } else if (currentDateIndex < formattedDates.length - 1) {
            // For non-owners, move forward in the array if possible
            const newIndex = currentDateIndex + 1;
            const nextDate = formattedDates[newIndex];
            setCurrentDateIndex(newIndex);
            setCurrentDate(nextDate);
            fetchAvailabilityForDate(nextDate);
        }
    };

    // Update convertToDateObject to use moment.tz
    const convertToDateObject = (date, hourOffset) => {
        // Create a moment object at noon in the observatory's timezone
        const baseDate = moment.tz(date, timezone || 'UTC').hour(12).minute(0).second(0).millisecond(0);
        
        // Add the hour offset, handling next day case
        if (hourOffset < 12) {
            // Move to next day for early morning hours
            return baseDate.add(1, 'days').hour(hourOffset).toDate();
        } else {
            return baseDate.hour(hourOffset).toDate();
        }
    };

    // Update the formatTime function to display time in the observatory's timezone
    const formatTime = (value) => {
        // Convert value (hours from 12 PM) to actual time
        let hours = value + 12; // Add 12 to shift from noon reference
        const isNextDay = hours >= 24;
        hours = hours % 24;
        
        // Create a moment object with the correct time in the observatory's timezone
        const timeStr = moment().tz(timezone || 'UTC').hour(hours).minute(0).format('h:mm A');
        
        return `${timeStr}${isNextDay ? ' (next day)' : ''}`;
    };

    // First, create a new helper function that formats time in both timezones
    const formatTimeWithLocalTime = (value) => {
        // Convert value (hours from 12 PM) to actual time
        let hours = value + 12; // Add 12 to shift from noon reference
        const isNextDay = hours >= 24;
        hours = hours % 24;
        
        // Create a moment object with the correct time in the observatory's timezone
        const obsTimeStr = moment().tz(timezone || 'UTC').hour(hours).minute(0).format('h:mm A');
        
        // Create the same time in the user's local timezone
        // First create a full datetime in observatory timezone
        const obsDateTime = moment.tz(currentDate, timezone || 'UTC').hour(hours).minute(0);
        // Then convert to local timezone
        const localDateTime = obsDateTime.clone().local();
        // Format for display
        const localTimeStr = localDateTime.format('h:mm A');
        
        // Display both times with appropriate labels
        return `${obsTimeStr}${isNextDay ? ' (next day)' : ''}\n${localTimeStr} (local)`;
    };

    // Update the formatTooltipTime function in renderTimelineBackground
    const renderTimelineBackground = (date) => {
        if (!twilightTimes[date]) return null;

        const times = twilightTimes[date];
        const calculatePosition = (time) => {
            let hours = getHours(time);
            const minutes = getMinutes(time) / 60;
            if (hours < 12) {
                hours += 24;
            }
            const value = hours + minutes - 12;
            return (value * 100 / 24);
        };

        const formatTooltipTime = (time) => {
            return moment(time).tz(timezone || 'UTC').format('h:mm A');
        };

        // Add celestial event markers
        const CelestialEventMarker = ({ time, icon, label, color }) => {
            const position = calculatePosition(time);
            return (
                <Tooltip title={`${label}: ${formatTooltipTime(time)}`} arrow>
                    <Box
                        sx={{
                            position: 'absolute',
                            left: `${position}%`,
                            transform: 'translateX(-50%)',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            cursor: 'help',
                            zIndex: 2,
                        }}
                    >
                        {React.cloneElement(icon, {
                            sx: {
                                color: color,
                                fontSize: '1.5rem',
                                filter: 'drop-shadow(0px 0px 4px rgba(0,0,0,0.5))'
                            }
                        })}
                        <Box
                            sx={{
                                height: '100%',
                                width: '2px',
                                backgroundColor: color,
                                opacity: 0.5,
                                mt: 0.5
                            }}
                        />
                    </Box>
                </Tooltip>
            );
        };

        return (
            <Box sx={{ 
                position: 'relative', 
                height: 60, 
                mb: 2,
                bgcolor: 'rgba(25, 118, 210, 0.15)',
                borderRadius: 1,
                border: 1,
                borderColor: 'rgba(255, 255, 255, 0.1)'
            }}>
                {/* Celestial Events Markers */}
                <Box sx={{ position: 'absolute', top: -28, width: '100%', height: '100%' }}>
                    <CelestialEventMarker
                        time={times.sunrise}
                        icon={<LightModeIcon />}
                        label="Sunrise"
                        color="#ffd700"
                    />
                    <CelestialEventMarker
                        time={times.sunset}
                        icon={<WbSunnyIcon />}
                        label="Sunset"
                        color="#ff8c00"
                    />
                    {/* You'll need to add moonrise and moonset times to your twilight calculations */}
                    {times.moonrise && (
                        <CelestialEventMarker
                            time={times.moonrise}
                            icon={<DarkModeIcon />}
                            label="Moonrise"
                            color="#a0a0a0"
                        />
                    )}
                    {times.moonset && (
                        <CelestialEventMarker
                            time={times.moonset}
                            icon={<NightsStayIcon />}
                            label="Moonset"
                            color="#708090"
                        />
                    )}
                </Box>

                {/* Evening Civil Twilight */}
                <Tooltip title={`Civil Twilight: ${formatTooltipTime(times.sunset)} - ${formatTooltipTime(times.civilDusk)}`} arrow>
                    <Box sx={{
                        position: 'absolute',
                        left: `${calculatePosition(times.sunset)}%`,
                        width: `${calculatePosition(times.civilDusk) - calculatePosition(times.sunset)}%`,
                        height: '100%',
                        bgcolor: 'rgba(176, 176, 176, 0.2)', // Lighter gray
                        borderRadius: 1,
                        cursor: 'help'
                    }} />
                </Tooltip>

                {/* Evening Nautical Twilight */}
                <Tooltip title={`Nautical Twilight: ${formatTooltipTime(times.civilDusk)} - ${formatTooltipTime(times.nauticalDusk)}`} arrow>
                    <Box sx={{
                        position: 'absolute',
                        left: `${calculatePosition(times.civilDusk)}%`,
                        width: `${calculatePosition(times.nauticalDusk) - calculatePosition(times.civilDusk)}%`,
                        height: '100%',
                        bgcolor: 'rgba(120, 120, 120, 0.3)', // Medium gray
                        borderRadius: 1,
                        cursor: 'help'
                    }} />
                </Tooltip>

                {/* Evening Astronomical Twilight */}
                <Tooltip title={`Astronomical Twilight: ${formatTooltipTime(times.nauticalDusk)} - ${formatTooltipTime(times.astronomicalDusk)}`} arrow>
                    <Box sx={{
                        position: 'absolute',
                        left: `${calculatePosition(times.nauticalDusk)}%`,
                        width: `${calculatePosition(times.astronomicalDusk) - calculatePosition(times.nauticalDusk)}%`,
                        height: '100%',
                        bgcolor: 'rgba(80, 80, 80, 0.4)', // Darker gray
                        borderRadius: 1,
                        cursor: 'help'
                    }} />
                </Tooltip>

                {/* Astronomical Dark */}
                <Tooltip title={`Astronomical Dark: ${formatTooltipTime(times.astronomicalDusk)} - ${formatTooltipTime(times.astronomicalDawn)}`} arrow>
                    <Box sx={{
                        position: 'absolute',
                        left: `${calculatePosition(times.astronomicalDusk)}%`,
                        width: `${calculatePosition(times.astronomicalDawn) - calculatePosition(times.astronomicalDusk)}%`,
                        height: '100%',
                        bgcolor: '#000',
                        borderRadius: 1,
                        cursor: 'help',
                        border: 1,
                        borderColor: 'primary.main' // Brighter border for emphasis
                    }} />
                </Tooltip>

                {/* Morning Astronomical Twilight */}
                <Tooltip title={`Astronomical Twilight: ${formatTooltipTime(times.astronomicalDawn)} - ${formatTooltipTime(times.nauticalDawn)}`} arrow>
                    <Box sx={{
                        position: 'absolute',
                        left: `${calculatePosition(times.astronomicalDawn)}%`,
                        width: `${calculatePosition(times.nauticalDawn) - calculatePosition(times.astronomicalDawn)}%`,
                        height: '100%',
                        bgcolor: 'rgba(80, 80, 80, 0.4)', // Darker gray
                        borderRadius: 1,
                        cursor: 'help'
                    }} />
                </Tooltip>

                {/* Morning Nautical Twilight */}
                <Tooltip title={`Nautical Twilight: ${formatTooltipTime(times.nauticalDawn)} - ${formatTooltipTime(times.civilDawn)}`} arrow>
                    <Box sx={{
                        position: 'absolute',
                        left: `${calculatePosition(times.nauticalDawn)}%`,
                        width: `${calculatePosition(times.civilDawn) - calculatePosition(times.nauticalDawn)}%`,
                        height: '100%',
                        bgcolor: 'rgba(120, 120, 120, 0.3)', // Medium gray
                        borderRadius: 1,
                        cursor: 'help'
                    }} />
                </Tooltip>

                {/* Morning Civil Twilight */}
                <Tooltip title={`Civil Twilight: ${formatTooltipTime(times.civilDawn)} - ${formatTooltipTime(times.sunrise)}`} arrow>
                    <Box sx={{
                        position: 'absolute',
                        left: `${calculatePosition(times.civilDawn)}%`,
                        width: `${calculatePosition(times.sunrise) - calculatePosition(times.civilDawn)}%`,
                        height: '100%',
                        bgcolor: 'rgba(176, 176, 176, 0.2)', // Lighter gray
                        borderRadius: 1,
                        cursor: 'help'
                    }} />
                </Tooltip>
            </Box>
        );
    };

    const createTimelineMarks = () => {
        return [
            { value: 0, label: '12:00 PM' },
            { value: 6, label: '6:00 PM' },
            { value: 12, label: '12:00 AM' },
            { value: 18, label: '6:00 AM' },
            { value: 24, label: '12:00 PM' }
        ];
    };

    // Add helper function to calculate hours between two values
    const calculateHoursBetween = (start, end) => {
        // Handle case where end is on next day (smaller than start)
        if (end < start) {
            end += 24;
        }
        return end - start;
    };

    // Modified handleRenterTimeChange
    const handleRenterTimeChange = (event, newValue) => {
        if (!isOwner) { // Only allow renters to change their time
            const [start, end] = newValue;
            if (timeRanges[currentDate]?.owner) {
                const [ownerStart, ownerEnd] = timeRanges[currentDate].owner;
                const hours = calculateHoursBetween(start, end);
                
                // If minimumHoursPerDay is -1, prevent any changes and keep renter time synced with owner time
                if (observatory?.minimumHoursPerDay === '-1') {
                    setTimeRanges(prev => ({
                        ...prev,
                        [currentDate]: {
                            ...prev[currentDate],
                            renter: [ownerStart, ownerEnd]
                        }
                    }));
                    return;
                }
                
                // Rest of the existing validation logic
                if (hours < observatory?.minimumHoursPerDay) {
                    setError(`Please select at least ${observatory?.minimumHoursPerDay} hour${observatory?.minimumHoursPerDay > 1 ? 's' : ''}`);
                    return;
                }

                // Check if within owner's range
                if (start >= ownerStart && end <= ownerEnd) {
                    setTimeRanges(prev => ({
                        ...prev,
                        [currentDate]: {
                            ...prev[currentDate],
                            renter: newValue
                        }
                    }));
                    setError(null);
                }
            }
        }
    };

    // Modify handleOwnerTimeChange to correctly format the availability data
    const handleOwnerTimeChange = async (event, newValue) => {
        const [start, end] = newValue;
        if (twilightTimes[currentDate]) {
            const times = twilightTimes[currentDate];
            const hours = calculateHoursBetween(start, end);
            
            // Check minimum hours requirement
            if (hours < observatory?.minimumHoursPerDay) {
                setError(`Please set at least ${observatory?.minimumHoursPerDay} hour${observatory?.minimumHoursPerDay > 1 ? 's' : ''} of availability`);
                return;
            }

            const getStartHourValue = (time) => {
                let hours = getHours(time);
                const minutes = getMinutes(time);
                if (hours < 12) {
                    hours += 24;
                }
                hours = hours - 12;
                
                if (minutes > 0) {
                    hours += 1;
                }
                
                return hours;
            };

            const getEndHourValue = (time) => {
                let hours = getHours(time);
                if (hours < 12) {
                    hours += 24;
                }
                return hours - 12;
            };

            const astroStart = getStartHourValue(times.astronomicalDusk);
            const astroEnd = Math.floor(getEndHourValue(times.astronomicalDawn));

            if (start >= astroStart && end <= astroEnd) {
                // Update local state
                setTimeRanges(prev => ({
                    ...prev,
                    [currentDate]: {
                        ...prev[currentDate],
                        owner: newValue,
                        renter: observatory?.minimumHoursPerDay === '-1' ? newValue : prev[currentDate]?.renter || newValue
                    }
                }));
                setError(null);

                // Auto-save to backend
                try {
                    setIsSaving(true);
                    
                    // Create date object for the selected date in observatory timezone
                    const dateObj = moment.tz(currentDate, timezone || 'UTC');
                    
                    // Calculate start time: add slider value (hours from noon) to noon
                    const startTime = dateObj.clone().hour(start + 12).minute(0).second(0);
                    
                    // Calculate end time: add slider value to noon, handle next day case
                    const endTime = dateObj.clone().hour(end + 12).minute(0).second(0);
                    
                    // If end is on next day (either less than start or >= 12 which means after midnight)
                    if (end < start || end >= 12) {
                        endTime.add(1, 'days');
                    }
                    
                    // Send the data matching the exact schema structure
                    const availabilityData = {
                        startTime: startTime.toISOString(),
                        endTime: endTime.toISOString(),
                        isAvailable: true
                    };

                    // Add the timezone information as separate properties
                    if (timezone) availabilityData.timezone = timezone;
                    if (dstOffset !== null) availabilityData.dstOffset = dstOffset;
                    if (rawOffset !== null) availabilityData.rawOffset = rawOffset;

                    await axios.post(
                        `/api/observatories/${observatoryId}/availability?username=${user.username}&token=${user.token}`, 
                        availabilityData
                    );
                } catch (error) {
                    setError('Failed to save availability. Please try again.');
                    console.error('Save error:', error);
                } finally {
                    setIsSaving(false);
                }
            }
        }
    };

    // Add handler for booking individual days
    const handleDayBooking = (date) => {
        if (!timeRanges[date]?.renter) return;
        
        setDailyBookings(prev => ({
            ...prev,
            [date]: {
                timeRange: timeRanges[date].renter,
                status: 'confirmed'
            }
        }));
    };

    // Update the handleFinalBookingSubmit function
    const handleFinalBookingSubmit = async () => {
        try {
            const bookingData = {
                dates: Object.entries(dailyBookings).map(([date, data]) => {
                    // Get the owner's available time range for this date
                    const ownerTimeRange = timeRanges[date]?.owner || [0, 24];
                    
                    // Convert owner's available times to proper format
                    const availableStartTime = convertToDateObject(date, ownerTimeRange[0] + 12);
                    const availableEndTime = convertToDateObject(date, ownerTimeRange[1] + 12);
                    
                    // Convert booked times
                    const bookedStartTime = convertToDateObject(date, data.timeRange[0] + 12);
                    const bookedEndTime = convertToDateObject(date, data.timeRange[1] + 12);

                    return {
                        date,
                        availableStartTime,
                        availableEndTime,
                        bookedStartTime,
                        bookedEndTime,
                        timezone: timezone,
                        status: 'pending'
                    };
                })
            };

            const response = await axios.post(
                `/api/observatories/${observatoryId}/bookings?username=${user.username}&token=${user.token}`, 
                bookingData
            );

            setIsBookingSubmitted(true);
            
            // Show success message briefly before redirecting
            setTimeout(() => {
                // Navigate back to previous page
                navigate(-1);
            }, 1500); // Wait 1.5 seconds before redirecting to show the success message

        } catch (error) {
            console.error('Error submitting booking:', error);
            setError('Failed to submit booking. Please try again.');
        }
    };

    // Helper to check if all dates are booked
    const areAllDatesBooked = () => {
        return formattedDates.length === Object.keys(dailyBookings).length;
    };

    // Update handleResetToAstroDark function to correctly format the data
    const handleResetToAstroDark = async () => {
        if (!twilightTimes[currentDate]) return;
        
        const times = twilightTimes[currentDate];
        const getStartHourValue = (time) => {
            let hours = getHours(time);
            const minutes = getMinutes(time);
            if (hours < 12) {
                hours += 24;
            }
            hours = hours - 12;
            
            if (minutes > 0) {
                hours += 1;
            }
            
            return hours;
        };

        const getEndHourValue = (time) => {
            let hours = getHours(time);
            if (hours < 12) {
                hours += 24;
            }
            return hours - 12;
        };

        const astroStart = getStartHourValue(times.astronomicalDusk);
        const astroEnd = Math.floor(getEndHourValue(times.astronomicalDawn));

        // Update local state
        setTimeRanges(prev => ({
            ...prev,
            [currentDate]: {
                ...prev[currentDate],
                owner: [astroStart, astroEnd],
                renter: observatory?.minimumHoursPerDay === '-1' ? [astroStart, astroEnd] : prev[currentDate]?.renter || [astroStart, astroEnd]
            }
        }));

        // Save to backend
        try {
            setIsSaving(true);
            
            // Create a date object in observatory timezone
            const dateObj = moment.tz(currentDate, timezone || 'UTC');
            
            // Calculate start time: add slider value (hours from noon) to noon
            const startTime = dateObj.clone().hour(astroStart + 12).minute(0).second(0);
            
            // Calculate end time: add slider value to noon, handle next day case
            const endTime = dateObj.clone().hour(astroEnd + 12).minute(0).second(0);
            
            // If end is on next day
            if (astroEnd < astroStart || astroEnd >= 12) {
                endTime.add(1, 'days');
            }
            
            // Send the data matching the exact schema structure
            const availabilityData = {
                startTime: startTime.toISOString(),
                endTime: endTime.toISOString(),
                isAvailable: true
            };

            // Add the timezone information as separate properties
            if (timezone) availabilityData.timezone = timezone;
            if (dstOffset !== null) availabilityData.dstOffset = dstOffset;
            if (rawOffset !== null) availabilityData.rawOffset = rawOffset;

            await axios.post(
                `/api/observatories/${observatoryId}/availability?username=${user.username}&token=${user.token}`, 
                availabilityData
            );
        } catch (error) {
            setError('Failed to save availability. Please try again.');
            console.error('Reset error:', error);
        } finally {
            setIsSaving(false);
        }
    };

    // Add new function to handle renter's reset
    const handleResetToOwnerTime = () => {
        if (!timeRanges[currentDate]?.owner) return;
        
        setTimeRanges(prev => ({
            ...prev,
            [currentDate]: {
                ...prev[currentDate],
                renter: [...prev[currentDate].owner] // Create new array to avoid reference issues
            }
        }));
        setError(null);
    };

    // Add this helper function near other helper functions
    const calculateTotalHours = (bookings) => {
        return Object.values(bookings).reduce((total, booking) => {
            const [start, end] = booking.timeRange;
            return total + calculateHoursBetween(start, end);
        }, 0);
    };

    // Inside the BookingDetailPage component, add this before the return statement
    const totalDays = Object.keys(dailyBookings).length;
    const totalHours = calculateTotalHours(dailyBookings);
    // Assuming $10 per hour - you might want to make this dynamic based on observatory pricing
    const totalPrice = totalHours * observatory?.hourlyRate;

    useEffect(() => {
        fetchObservatory();
    }, []);

    // Add useEffect to fetch availability when currentDate changes
    useEffect(() => {
        if (!observatory) return;
        fetchAvailabilityForDate(currentDate);
    }, [currentDate, observatory]);

    // First useEffect to calculate twilight times
    useEffect(() => {
        if (!observatory || !currentDate || !timezone) return;

        const calculateTwilightTimes = () => {            
            const times = getTwilightTimes(
                observatory.location?.lat ?? 51.4934,
                observatory.location?.lng ?? 0.0098,
                currentDate,
                timezone
            );
            
            const getStartHourValue = (time) => {
                let hours = getHours(time);
                const minutes = getMinutes(time);
                if (hours < 12) {
                    hours += 24;
                }
                hours = hours - 12;
                
                // For start time, if there are any minutes, round up to the next hour
                if (minutes > 0) {
                    hours += 1;
                }
                
                return hours;
            };

            const getEndHourValue = (time) => {
                let hours = getHours(time);
                if (hours < 12) {
                    hours += 24;
                }
                return hours - 12;
            };

            const astroStart = getStartHourValue(times.astronomicalDusk);
            const astroEnd = Math.floor(getEndHourValue(times.astronomicalDawn));

            twilightDataRef.current = { [currentDate]: times };
            setTwilightTimes(prev => ({ ...prev, [currentDate]: times }));
            setTimeRanges(prev => ({
                ...prev,
                [currentDate]: {
                    owner: [astroStart, astroEnd],
                    renter: [astroStart, astroEnd]
                }
            }));
        };

        calculateTwilightTimes();
        isInitialized.current = true;
    }, [observatory, currentDate, timezone]);

    // if (!booking) {
    //     return <div>Loading...</div>;
    // }

    // Also update the useEffect for initializing the currentDate when observatory data is loaded
    useEffect(() => {
        if (formattedDates.length > 0 && observatory && timezone) {
            // If we need to adjust to observatory timezone, do it here
            // But keep tracking by index to avoid confusion
            const observatoryLocalDate = moment.tz(formattedDates[currentDateIndex], timezone || 'UTC').format('YYYY-MM-DD');
            if (observatoryLocalDate !== currentDate) {
                setCurrentDate(observatoryLocalDate);
            }
        }
    }, [formattedDates, currentDateIndex, observatory, timezone]);

    // Also, let's add a function to ensure we're always using the correct timezone with DST
    // Add this function to your component
    const getEffectiveTimezone = () => {
        // If we have timezone and DST information, use it
        if (timezone) {
            return timezone;
        }
        // Fallback to UTC if no timezone information is available
        return 'UTC';
    };

    // Update the return statement to show loading state
    if (isLoading || !observatory || !timezone || (!isOwner && formattedDates.length === 0)) {
        return (
            <PageContainer>
                <Box 
                    sx={{ 
                        display: 'flex', 
                        justifyContent: 'center', 
                        alignItems: 'center',
                        minHeight: '60vh',
                        flexDirection: 'column',
                        gap: 2
                    }}
                >
                    <CircularProgress size={40} />
                    <Typography variant="h6">
                        Loading booking details...
                    </Typography>
                </Box>
            </PageContainer>
        );
    }

    return (
        <PageContainer>
            <Box sx={{ p: { xxs: 2, md: 3 } }}>

                {error && (
                    <Alert 
                        severity="warning" 
                        sx={{ mb: 2 }}
                        onClose={() => setError(null)}
                    >
                        {error}
                    </Alert>
                )}

                {/* Add Back Button */}
                <Button
                    startIcon={<ArrowBackIosNewIcon />}
                    onClick={() => navigate(-1)}
                    sx={{ mb: 2 }}
                >
                    Go Back
                </Button>

                {/* <Typography variant="h4" sx={{ mb: 3 }}>
                    Booking Details
                </Typography> */}

                {/* Date Navigation */}
                <Box sx={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center',
                    mb: 3,  // Increased bottom margin
                    mt: 1,  // Added top margin
                    px: 1   // Added horizontal padding
                }}>
                    <Button 
                        onClick={handlePreviousDay}
                        disabled={!isOwner && currentDateIndex <= 0}
                        variant="contained"
                        color="primary"
                        startIcon={<ArrowBackIosNewIcon />}
                        sx={{ 
                            borderRadius: '8px',
                            height: '44px',
                            minWidth: '120px', 
                            boxShadow: 3,
                            '&:hover': {
                                boxShadow: 5
                            },
                            '&.Mui-disabled': {
                                opacity: 0.5,
                                color: 'rgba(255, 255, 255, 0.6)'
                            }
                        }}
                    >
                        Previous
                    </Button>
                    
                    <Typography variant="h6" color="primary" sx={{ 
                        fontWeight: 'bold',
                        px: 2,
                        py: 1,
                        borderRadius: '8px',
                        bgcolor: 'background.paper',
                        boxShadow: 1
                    }}>
                        {moment(currentDate).format('YYYY-MM-DD')}
                        {(dstOffset !== undefined && dstOffset !== null && rawOffset !== undefined && rawOffset !== null) && ` UTC${(dstOffset + rawOffset)/3600 >= 0 ? '+' : ''}${(dstOffset + rawOffset)/3600}`}
                    </Typography>
                    
                    <Button 
                        onClick={handleNextDay}
                        disabled={!isOwner && currentDateIndex >= formattedDates.length - 1}
                        variant="contained"
                        color="primary"
                        endIcon={<ArrowForwardIosIcon />}
                        sx={{ 
                            borderRadius: '8px',
                            height: '44px',
                            minWidth: '120px',
                            boxShadow: 3,
                            '&:hover': {
                                boxShadow: 5
                            },
                            '&.Mui-disabled': {
                                opacity: 0.5,
                                color: 'rgba(255, 255, 255, 0.6)'
                            }
                        }}
                    >
                        Next
                    </Button>
                </Box>

                <Stack spacing={3}>
                    <Card>
                        <CardContent>
                            <Box sx={{ mb: 2 }}>
                                <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                                    <CalendarTodayIcon />
                                    {isOwner ? "Available Hours" : "Booking Hours"}
                                </Typography>
                                <Typography variant="body1" color={palette.white[900]}>
                                    {moment.tz(currentDate, timezone || 'UTC').format('dddd, MMMM D, YYYY')}
                                    {(dstOffset !== undefined && dstOffset !== null && rawOffset !== undefined && rawOffset !== null) && ` UTC${(dstOffset + rawOffset)/3600 >= 0 ? '+' : ''}${(dstOffset + rawOffset)/3600}`}
                                </Typography>
                            </Box>

                            <Divider sx={{ my: 2 }} />

                            {/* Timeline visualization */}
                            <Box sx={{ position: 'relative', mt: 4, mb: 2, px: 2 }}>
                                {/* Show owner's slider only if user is owner or if user is renter (disabled) */}
                                <Typography variant="subtitle1" sx={{ mb: 1 }}>
                                    {"Almanac"}
                                </Typography>
                                
                                {/* Timeline visualization */}
                                <Box sx={{ position: 'relative', height: 60, mb: 4 }}>
                                    {renderTimelineBackground(currentDate)}
                                </Box>

                                {/* Owner's Slider */}
                                {twilightTimes[currentDate] && (
                                    <Box sx={{ mt: 5 }}>
                                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                                            <Typography variant="subtitle1">
                                                {isOwner ? "Set Available Time Range" : "Available Time Range"}
                                            </Typography>
                                            {isOwner && (
                                                <Button
                                                    variant="outlined"
                                                    color="primary"
                                                    size="small"
                                                    onClick={handleResetToAstroDark}
                                                    disabled={isSaving}
                                                    startIcon={<ScheduleIcon />}
                                                >
                                                    Reset
                                                </Button>
                                            )}
                                        </Box>
                                        <Slider
                                            value={timeRanges[currentDate]?.owner || [0, 24]}
                                            onChange={handleOwnerTimeChange}
                                            valueLabelDisplay="on"
                                            valueLabelFormat={formatTime}
                                            disabled={!isOwner || isSaving}
                                            min={0}
                                            max={24}
                                            step={1}
                                            marks={createTimelineMarks()}
                                            sx={{
                                                '& .MuiSlider-valueLabel': {
                                                    backgroundColor: 'primary.main',
                                                },
                                                '& .MuiSlider-track': {
                                                    backgroundColor: 'primary.main',
                                                    opacity: 0.8,
                                                    border: 'none',
                                                },
                                                '& .MuiSlider-rail': {
                                                    backgroundColor: 'grey.500',
                                                    opacity: 0.4,
                                                },
                                                '& .MuiSlider-thumb': {
                                                    width: 16,
                                                    height: 16,
                                                    '&:hover, &.Mui-focusVisible': {
                                                        boxShadow: `0 0 0 8px ${alpha(palette.primary.main, 0.16)}`,
                                                    },
                                                },
                                                '& .MuiSlider-mark': {
                                                    backgroundColor: 'grey.500',
                                                },
                                                '& .MuiSlider-markLabel': {
                                                    color: palette.white[900],
                                                },
                                            }}
                                        />
                                    </Box>
                                )}

                                {/* Show renter's section only if user is not owner */}
                                {!isOwner && (
                                    <Box sx={{ mt: 4 }}>
                                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                                            <Typography variant="subtitle1">
                                                Select Your Booking Time
                                            </Typography>
                                            <Button
                                                variant="outlined"
                                                color="secondary"
                                                size="small"
                                                onClick={handleResetToOwnerTime}
                                                disabled={observatory?.minimumHoursPerDay === '-1' || !timeRanges[currentDate]?.owner}
                                                startIcon={<ScheduleIcon />}
                                            >
                                                Reset
                                            </Button>
                                        </Box>
                                        {twilightTimes[currentDate] && (
                                            <Box sx={{ mt: 2 }}>
                                                <Slider
                                                    value={observatory?.minimumHoursPerDay === '-1' ? 
                                                        (timeRanges[currentDate]?.owner || [0, 24]) : 
                                                        (timeRanges[currentDate]?.renter || timeRanges[currentDate]?.owner || [0, 24])
                                                    }
                                                    onChange={handleRenterTimeChange}
                                                    valueLabelDisplay="on"
                                                    valueLabelFormat={formatTimeWithLocalTime}
                                                    disabled={observatory?.minimumHoursPerDay === '-1'} // Disable slider if full time is required
                                                    min={0}
                                                    max={24}
                                                    step={1}
                                                    marks={createTimelineMarks()}
                                                    sx={{
                                                        '& .MuiSlider-valueLabel': {
                                                            backgroundColor: 'secondary.main',
                                                            minWidth: '130px',
                                                            whiteSpace: 'pre-line',
                                                            fontSize: '0.75rem',
                                                            padding: '8px 6px',
                                                        },
                                                        '& .MuiSlider-track': {
                                                            backgroundColor: 'secondary.main',
                                                            opacity: 0.8,
                                                            border: 'none',
                                                        },
                                                        '& .MuiSlider-rail': {
                                                            backgroundColor: 'grey.500',
                                                            opacity: 0.4,
                                                        },
                                                        '& .MuiSlider-thumb': {
                                                            width: 16,
                                                            height: 16,
                                                            '&:hover, &.Mui-focusVisible': {
                                                                boxShadow: `0 0 0 8px ${alpha(palette.secondary.main, 0.16)}`,
                                                            },
                                                        },
                                                        '& .MuiSlider-mark': {
                                                            backgroundColor: 'grey.500',
                                                        },
                                                        '& .MuiSlider-markLabel': {
                                                            color: palette.white[900],
                                                        },
                                                        color: "secondary.main"
                                                    }}
                                                />
                                            </Box>
                                        )}
                                    </Box>
                                )}
                            </Box>

                            {/* Show Book Day Button only for renters */}
                            {!isOwner && (
                                <Box sx={{ mt: 2, display: 'flex', justifyContent: 'center' }}>
                                    <Button
                                        variant="contained"
                                        color="secondary"
                                        onClick={() => handleDayBooking(currentDate)}
                                        disabled={!timeRanges[currentDate]?.renter}
                                    >
                                        {dailyBookings[currentDate] ? 'Update Booking' : 'Book This Day'}
                                    </Button>
                                </Box>
                            )}
                        </CardContent>
                    </Card>

                    {/* User Information Card */}
                    {/* <Card>
                        <CardContent>
                            <Typography variant="h6" sx={{ mb: 3 }}>
                                Booked By
                            </Typography>
                            
                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                                <Avatar
                                    src={booking.user.avatar}
                                    sx={{ width: 64, height: 64, mr: 2 }}
                                />
                                <Box>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                                        <PersonIcon color="action" />
                                        <Typography variant="body1">
                                            {booking.user.name}
                                        </Typography>
                                    </Box>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                        <EmailIcon color="action" />
                                        <Typography variant="body1">
                                            {booking.user.email}
                                        </Typography>
                                    </Box>
                                </Box>
                            </Box>
                        </CardContent>
                    </Card> */}

                    {/* Add new Booked Times Card */}
                    {/* <Card>
                        <CardContent>
                            <Typography variant="h6" sx={{ mb: 2 }}>
                                Already Booked Times for {currentDate}
                            </Typography>
                            {bookedTimes[currentDate]?.length > 0 ? (
                                bookedTimes[currentDate].map((timeRange, index) => (
                                    <Typography key={index} color="error.main">
                                        {formatTime(timeRange[0])} - {formatTime(timeRange[1])}
                                    </Typography>
                                ))
                            ) : (
                                <Typography color="text.secondary">
                                    No bookings for this date
                                </Typography>
                            )}
                        </CardContent>
                    </Card> */}

                    {/* Show Booking Summary and Final Booking Button only for renters */}
                    {!isOwner && (
                        <>
                            <Card>
                                <CardContent>
                                    <Box sx={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                                        <Typography variant="h6" sx={{ mb: 3 }}>
                                            Booking Summary
                                        </Typography>

                                        {/* Add Summary Statistics */}
                                        <Box sx={{ 
                                            display: 'flex', 
                                            gap: 3, 
                                            mb: 3,
                                            flexWrap: 'wrap'
                                        }}>
                                            <Tooltip title={`Total Days: ${totalDays} day${totalDays !== 1 ? 's' : ''}`} arrow>
                                                <Box sx={{ 
                                                    display: 'flex', 
                                                    alignItems: 'center', 
                                                    gap: 1
                                                }}>
                                                    <CalendarMonthIcon color="primary" />
                                                    <Typography variant="h6">
                                                        {totalDays}
                                                    </Typography>
                                                </Box>
                                            </Tooltip>

                                            <Tooltip title={`Total Hours: ${totalHours} hour${totalHours !== 1 ? 's' : ''}`} arrow>
                                                <Box sx={{ 
                                                    display: 'flex', 
                                                    alignItems: 'center', 
                                                    gap: 1
                                                }}>
                                                    <AccessTimeFilledIcon color="primary" />
                                                    <Typography variant="h6">
                                                        {totalHours}
                                                    </Typography>
                                                </Box>
                                            </Tooltip>

                                            <Tooltip title={`Total Price: $${totalPrice.toFixed(2)}`} arrow>
                                                <Box sx={{ 
                                                    display: 'flex', 
                                                    alignItems: 'center', 
                                                    gap: 1
                                                }}>
                                                    <PaidIcon color="primary" />
                                                    <Typography variant="h6">
                                                        ${totalPrice.toFixed(2)}
                                                    </Typography>
                                                </Box>
                                            </Tooltip>
                                        </Box>
                                    </Box>

                                    <Divider sx={{ mb: 3 }} />

                                    {/* Existing daily bookings list */}
                                    {formattedDates.map(date => (
                                        <Box 
                                            key={date} 
                                            sx={{ 
                                                display: 'flex', 
                                                justifyContent: 'space-between',
                                                alignItems: 'center',
                                                mb: 1,
                                                p: 1,
                                                bgcolor: dailyBookings[date] ? 'success.dark' : 'background.paper',
                                                borderRadius: 1,
                                                transition: 'background-color 0.3s ease',
                                                '&:hover': {
                                                    bgcolor: dailyBookings[date] ? alpha(palette.success.dark, 0.3) : alpha(palette.action.hover, 0.1)
                                                }
                                            }}
                                        >
                                            <Typography>
                                                {moment.tz(date, timezone || 'UTC').format('ddd, MMM D')}
                                            </Typography>
                                            {dailyBookings[date] ? (
                                            <Typography>
                                                {moment(dailyBookings[date].startTime).tz(timezone).format('MMM Do, YYYY HH:mm')} - 
                                                {moment(dailyBookings[date].endTime).tz(timezone).format('HH:mm')}
                                                    <Typography variant="caption" display="block" sx={{ fontStyle: 'italic' }}>
                                                        {/* Convert these times to local timezone */}
                                                        {(() => {
                                                            const startHours = dailyBookings[date].timeRange[0] + 12;
                                                            const endHours = dailyBookings[date].timeRange[1] + 12;
                                                            
                                                            const obsStart = moment.tz(date, timezone || 'UTC').hour(startHours % 24).minute(0);
                                                            const obsEnd = moment.tz(date, timezone || 'UTC').hour(endHours % 24).minute(0);
                                                            
                                                            // Handle next day case
                                                            if (endHours >= 24) {
                                                                obsEnd.add(1, 'days');
                                                            }
                                                            
                                                            // Convert to local time
                                                            const localStart = obsStart.clone().local().format('h:mm A');
                                                            const localEnd = obsEnd.clone().local().format('h:mm A');
                                                            
                                                            return `${localStart} - ${localEnd} (local time)`;
                                                        })()}
                                                    </Typography>
                                                </Typography>
                                            ) : (
                                                <Typography color="text.secondary">
                                                    {timeRanges[date]?.owner ? 
                                                        `Available ${formatTime(timeRanges[date].owner[0])} - ${formatTime(timeRanges[date].owner[1])}` :
                                                        'Time range not set'
                                                    }
                                                </Typography>
                                            )}
                                        </Box>
                                    ))}
                                </CardContent>
                            </Card>

                            {/* Guidelines acceptance section */}
                            {areAllDatesBooked() && (
                                <Card sx={{ mt: 2 }}>
                                    <CardContent>
                                        <Box sx={{ 
                                            display: 'flex', 
                                            alignItems: 'center', 
                                            justifyContent: 'space-between',
                                            mb: 2
                                        }}>
                                            <Typography variant="h6">Usage Guidelines</Typography>
                                            <Button
                                                variant="outlined"
                                                size="small"
                                                onClick={() => setShowGuidelines(true)}
                                            >
                                                View Guidelines
                                            </Button>
                                        </Box>
                                        
                                        <FormControlLabel
                                            control={
                                                <Checkbox
                                                    checked={guidelinesAccepted}
                                                    onChange={(e) => setGuidelinesAccepted(e.target.checked)}
                                                    name="guidelinesAccepted"
                                                    color="primary"
                                                />
                                            }
                                            label={
                                                <Typography variant="body2">
                                                    I have read and agree to the observatory usage guidelines
                                                </Typography>
                                            }
                                        />
                                    </CardContent>
                                </Card>
                            )}

                            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
                                {isBookingSubmitted ? (
                                    <Alert severity="success" sx={{ mb: 2 }}>
                                        Booking request submitted successfully!
                                    </Alert>
                                ) : (
                                    <Button
                                        variant="contained"
                                        color="primary"
                                        size="large"
                                        onClick={handleFinalBookingSubmit}
                                        disabled={!areAllDatesBooked() || !guidelinesAccepted}
                                    >
                                        Submit Final Booking Request
                                    </Button>
                                )}
                            </Box>

                            {/* Guidelines Dialog */}
                            <Dialog
                                open={showGuidelines}
                                onClose={() => setShowGuidelines(false)}
                                maxWidth="md"
                                fullWidth
                            >
                                <DialogTitle>Observatory Usage Guidelines</DialogTitle>
                                <DialogContent>
                                    {observatory?.usageGuidelines ? (
                                        <Box 
                                            sx={{ 
                                                color: palette.white[900],
                                                "& img": { maxWidth: "100%" },
                                                "& a": { color: palette.primary.main }
                                            }}
                                            dangerouslySetInnerHTML={{ __html: observatory.usageGuidelines }} 
                                        />
                                    ) : (
                                        <Typography variant="body1" sx={{ whiteSpace: 'pre-line', mb: 2 }}>
                                            Remote Observatory Usage Guidelines

                                            Introduction
                                            This document outlines the essential procedures and guidelines for using the remote observatory facility. Adherence to these protocols ensures equipment longevity, successful observation sessions, and equal access for all authorized users.

                                            Pre-Session Guidelines
                                            Check weather forecasts and observatory status before your session.
                                            Log in to the ekoslive web-based platform 15 minutes before your scheduled time to verify connectivity.
                                            Review any maintenance notices or equipment restrictions before beginning.

                                            During Your Session
                                            Run the observatory startup sequence as documented in the control software.
                                            Verify all systems are operational before beginning observations.
                                            Monitor weather conditions throughout your session.
                                            Immediately abort session if adverse weather conditions develop.
                                            Report any unusual equipment behavior through the issue tracking system.
                                            Respect your allocated time slot and prepare to conclude operations promptly.

                                            End of Session Procedures
                                            Close all active imaging sequences and application processes.
                                            Park the telescope mount in its home position.
                                            If a dome is present, rotate it to the park position (typically north).
                                            Close the dome slit completely.
                                            Turn off any cooling systems for cameras or other equipment.
                                            Complete the post-observation form documenting your session.

                                            Safety and Security
                                            Never share your access credentials with others.
                                            In case of emergency, contact the observatory manager at the emergency number provided.
                                        </Typography>
                                    )}
                                </DialogContent>
                                <DialogActions>
                                    <Button onClick={() => setShowGuidelines(false)}>Close</Button>
                                    <Button 
                                        variant="contained" 
                                        color="primary"
                                        onClick={() => {
                                            setGuidelinesAccepted(true);
                                            setShowGuidelines(false);
                                        }}
                                    >
                                        Accept Guidelines
                                    </Button>
                                </DialogActions>
                            </Dialog>
                        </>
                    )}
                </Stack>

                
            </Box>
        </PageContainer>
    );
};

export default BookingDetailPage;
