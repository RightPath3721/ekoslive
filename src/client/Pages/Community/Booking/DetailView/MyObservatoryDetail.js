import React, { useEffect } from 'react';
import {
    Paper,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    IconButton,
    Typography,
    Box,
    Button,
    Chip,
    Slider,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Select,
    MenuItem,
    FormControl,
    InputLabel,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import CheckIcon from '@mui/icons-material/Check';
import { useTheme } from '@mui/material';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import useActiveUser from '@hooks/useActiveUser';
import axios from 'axios';
import ArrowBackIosNewIcon from '@mui/icons-material/ArrowBackIosNew';
import { useNavigate } from 'react-router-dom';

// Add this utility function at the top of the file
const timeToMinutes = (timeStr) => {
    const [hours, minutes] = timeStr.split(':').map(Number);
    return hours * 60 + minutes;
};

const minutesToTime = (minutes) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    const period = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 || 12; // Convert to 12-hour format
    return `${displayHours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')} ${period}`;
};

const parseTimeRange = (timeStr) => {
    // Handle "(Next day)" notation
    const isNextDay = timeStr.includes('(Next day)');
    const times = timeStr.replace('(Next day)', '').split(' - ');
    let [start, end] = times.map(t => timeToMinutes(t.trim()));
    
    // Adjust end time if it's next day
    if (isNextDay) {
        end += 24 * 60; // Add 24 hours worth of minutes
    }
    
    return [start, end];
};

const formatTimeRange = (start, end) => {
    const startTime = minutesToTime(start);
    let endTime = minutesToTime(end % (24 * 60)); // Normalize end time
    
    if (end > 24 * 60) {
        return `${startTime} - ${endTime}(Next day)`;
    }
    return `${startTime} - ${endTime}`;
};

const MyObservatoryDetail = ({ bookingId }) => {
    const { palette } = useTheme();
    const [bookingData, setBookingData] = React.useState(null);
    const [bookings, setBookings] = React.useState([]);
    const [editingId, setEditingId] = React.useState(null);
    const [timeRange, setTimeRange] = React.useState([0, 24]);
    const [availableRange, setAvailableRange] = React.useState([0, 24]);
    const user = useActiveUser();
    const navigate = useNavigate();

    const fetchBooking = async () => {
        try {
            const { data } = await axios.get(`/api/observatories/bookings/${bookingId}?username=${user.username}&token=${user.token}`);
            setBookingData(data.booking);
            
            const transformedBookings = data.booking.dates.map(date => {
                const startTime = new Date(date.bookedStartTime);
                const endTime = new Date(date.bookedEndTime);
                const availStart = new Date(date.availableStartTime);
                const availEnd = new Date(date.availableEndTime);
                
                let negotiationTimes = '';
                if (date.negotiatedStartTime && date.negotiatedEndTime) {
                    const negStart = new Date(date.negotiatedStartTime);
                    const negEnd = new Date(date.negotiatedEndTime);
                    const isNextDay = negEnd.getDate() > negStart.getDate();
                    
                    negotiationTimes = `${convertTo12Hour(negStart.getHours())} - ${convertTo12Hour(negEnd.getHours())}${isNextDay ? '(Next day)' : ''}`;
                }

                // Convert available times to 12-hour format
                const availStartHour = availStart.getHours() % 12 || 12;
                const availEndHour = availEnd.getHours() % 12 || 12;
                const isAvailNextDay = availEnd.getDate() > availStart.getDate();
                
                const isBookedNextDay = endTime.getDate() > startTime.getDate();
                
                return {
                    id: date._id,
                    date: new Date(date.date).toISOString().split('T')[0],
                    availableTimes: `${availStartHour.toString().padStart(2, '0')}:00 ${availStart.getHours() >= 12 ? 'PM' : 'AM'} - ${availEndHour.toString().padStart(2, '0')}:00 ${availEnd.getHours() >= 12 ? 'PM' : 'AM'}${isAvailNextDay ? '(Next day)' : ''}`,
                    bookedTimes: `${convertTo12Hour(startTime.getHours())} - ${convertTo12Hour(endTime.getHours())}${isBookedNextDay ? '(Next day)' : ''}`,
                    negotiationTimes,
                    negotiatedStartTime: date.negotiatedStartTime,
                    negotiatedEndTime: date.negotiatedEndTime,
                    status: date.status
                };
            });
            
            setBookings(transformedBookings);
        } catch (error) {
            console.error('Error fetching booking:', error);
        }
    };

    useEffect(() => {
        fetchBooking();
    }, []);

    const parseTime = (timeStr) => {
        // Convert "HH:MM AM/PM" to 24-hour format
        const [time, period] = timeStr.split(' ');
        let [hours, minutes] = time.split(':').map(Number);
        
        if (period === 'PM' && hours !== 12) {
            hours += 12;
        } else if (period === 'AM' && hours === 12) {
            hours = 0;
        }
        
        return hours;
    };

    const convertTo12Hour = (hour) => {
        const adjustedHour = hour % 12 || 12;
        const period = (hour % 24) >= 12 ? 'PM' : 'AM';
        return `${adjustedHour.toString().padStart(2, '0')}:00 ${period}`;
    };

    const handleEditClick = (booking) => {
        try {
            // Parse available times
            const [availStartStr, availEndRaw] = booking.availableTimes.split(' - ');
            const availStart = parseTime(availStartStr);
            const availEnd = parseTime(availEndRaw.replace('(Next day)', ''));
            
            // Set available range
            setAvailableRange([
                availStart,
                booking.availableTimes.includes('(Next day)') ? availEnd + 24 : availEnd
            ]);

            // If there are negotiation times, use them; otherwise use booked times
            const timeToUse = booking.negotiationTimes || booking.bookedTimes;
            const [startStr, endRaw] = timeToUse.split(' - ');
            const start = parseTime(startStr);
            const end = parseTime(endRaw.replace('(Next day)', ''));
            
            // Set time range
            setTimeRange([
                start,
                timeToUse.includes('(Next day)') ? end + 24 : end
            ]);
            
            setEditingId(booking.id);
        } catch (error) {
            console.error('Error parsing times:', error);
        }
    };

    const handleTimeChange = (type) => (event) => {
        const newValue = parseInt(event.target.value);
        setTimeRange(prev => {
            if (type === 'start') {
                return [newValue, prev[1]];
            } else {
                return [prev[0], newValue];
            }
        });
    };

    const isTimeWithinAvailable = (time, type) => {
        if (type === 'start') {
            return time >= availableRange[0] && time <= availableRange[1];
        } else {
            return time >= timeRange[0] && time <= availableRange[1];
        }
    };

    const convertToISOTime = (date, timeStr) => {
        // Convert "HH:MM AM/PM" to ISO time string for the given date
        const [time, period] = timeStr.split(' ');
        let [hours, minutes] = time.split(':').map(Number);
        
        if (period === 'PM' && hours !== 12) {
            hours += 12;
        } else if (period === 'AM' && hours === 12) {
            hours = 0;
        }

        const baseDate = new Date(date);
        baseDate.setHours(hours, minutes, 0, 0);
        return baseDate.toISOString();
    };

    const handleSaveEdit = (id) => {
        try {
            const startTime = convertTo12Hour(timeRange[0]);
            const endTime = convertTo12Hour(timeRange[1] % 24);
            const isNextDay = timeRange[1] >= 24;
            
            const booking = bookings.find(b => b.id === id);
            const baseDate = new Date(booking.date);
            
            // Convert to ISO time strings
            let negotiatedStartTime = convertToISOTime(baseDate, startTime);
            let negotiatedEndTime;
            
            if (isNextDay) {
                const nextDay = new Date(baseDate);
                nextDay.setDate(nextDay.getDate() + 1);
                negotiatedEndTime = convertToISOTime(nextDay, endTime);
            } else {
                negotiatedEndTime = convertToISOTime(baseDate, endTime);
            }
            
            // Update local state
            setBookings(bookings.map(booking => 
                booking.id === id 
                    ? { 
                        ...booking, 
                        negotiatedStartTime,
                        negotiatedEndTime,
                        status: 'negotiating',
                        // Keep bookedTimes for display purposes
                        negotiationTimes: `${startTime} - ${endTime}${isNextDay ? '(Next day)' : ''}`
                      }
                    : booking
            ));

            setEditingId(null);
        } catch (error) {
            console.error('Error saving times:', error);
        }
    };

    const handleBookingUpdate = async (overallStatus) => {
        try {
            // Prepare the updated dates data
            const updatedDates = bookings.map(booking => ({
                _id: booking.id,
                status: booking.status,
                bookedStartTime: booking.bookedStartTime,
                bookedEndTime: booking.bookedEndTime,
                negotiatedStartTime: booking.negotiatedStartTime || null,
                negotiatedEndTime: booking.negotiatedEndTime || null
            }));


            // Send single API call with all updates
            await axios.patch(`/api/observatories/bookings/${bookingId}?username=${user.username}&token=${user.token}`, {
                status: overallStatus,
                dates: updatedDates
            });

            // Refresh booking data after successful update
            fetchBooking();
        } catch (error) {
            console.error('Error updating booking:', error);
        }
    };

    const generateTimeOptions = () => {
        const options = [];
        // Generate regular 24-hour options
        for (let i = 0; i < 24; i++) {
            options.push({
                value: i,
                label: convertTo12Hour(i)
            });
        }
        // Add next day options
        for (let i = 0; i < 24; i++) {
            options.push({
                value: i + 24,
                label: `${convertTo12Hour(i)} (Next day)`
            });
        }
        return options;
    };

    const handleStatusChange = (id, status) => {
        setBookings(bookings.map(booking => 
            booking.id === id ? { ...booking, status } : booking
        ));
    };

    const isCheckButtonEnabled = (booking) => {
        return !booking.negotiationTimes || booking.negotiationTimes === booking.bookedTimes;
    };

    const isApproveButtonEnabled = () => {
        return bookings.every(booking => 
            !booking.negotiationTimes || booking.negotiationTimes === booking.bookedTimes
        );
    };

    const getStatusColor = (status) => {
        if (!status) return 'default';
        switch (status.toLowerCase()) {
            case 'pending':
                return 'warning';
            case 'approved':
                return 'success';
            case 'rejected':
                return 'error';
            case 'cancelled':
                return 'error';
            case 'negotiating':
                return 'info';
            default:
                return 'default';
        }
    };

    return (
        <Box sx={{ p: 3 }}>
            <Box sx={{ mb: 2 }}>
                <Button
                    startIcon={<ArrowBackIosNewIcon />}
                    onClick={() => navigate(-1)}
                    sx={{ mb: 2 }}
                >
                    Go Back
                </Button>
            </Box>

            <Paper sx={{ p: 3, color: palette.white[900] }}>
                <Box sx={{ mb: 3 }}>
                    <Typography variant="h6">
                        Observatory: {bookingData?.observatory?.name || ''}
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', mt: 1 }}>
                        <Typography>
                            Renter: {bookingData?.renter?.username || ''}
                        </Typography>
                        <Typography>
                            Status: <Chip label={bookingData?.status.charAt(0).toUpperCase() + bookingData?.status.slice(1) || 'pending'} color={getStatusColor(bookingData?.status)} size="small" />
                        </Typography>
                    </Box>
                </Box>

                <TableContainer component={Paper} >
                    <Table aria-label="booking details table">
                        <TableHead>
                            <TableRow>
                                <TableCell sx={{ color: palette.white[900] }}>Date</TableCell>
                                <TableCell sx={{ color: palette.white[900] }}>Available Times</TableCell>
                                <TableCell sx={{ color: palette.white[900] }}>Booked Times</TableCell>
                                <TableCell sx={{ color: palette.white[900] }}>Negotiation Times</TableCell>
                                <TableCell sx={{ color: palette.white[900] }}>Actions</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {bookings.map((booking) => (
                                <TableRow 
                                    key={booking.id}
                                    sx={{
                                        bgcolor: booking.status === 'approved' 
                                            ? palette.success.dark
                                            : booking.status === 'rejected' 
                                                ? palette.error.light
                                                : (booking.negotiationTimes && 
                                                   booking.negotiationTimes !== booking.bookedTimes && 
                                                   booking.status !== 'approved' && 
                                                   booking.status !== 'rejected')
                                                    ? palette.orange.main
                                                    : 'inherit'
                                    }}
                                >
                                    <TableCell sx={{ color: palette.white[900] }}>{booking.date}</TableCell>
                                    <TableCell sx={{ color: palette.white[900] }}>{booking.availableTimes}</TableCell>
                                    <TableCell sx={{ color: palette.white[900], bgcolor: 'rgba(255, 255, 0, 0.1)' }}>
                                        {booking.bookedTimes}
                                    </TableCell>
                                    <TableCell sx={{ color: palette.white[900], bgcolor: 'rgba(255, 255, 0, 0.1)' }}>
                                        {booking.negotiationTimes}
                                    </TableCell>
                                    <TableCell>
                                        <Box sx={{ display: 'flex', gap: 1 }}>
                                            <IconButton 
                                                size="small" 
                                                sx={{ color: 'success.main' }}
                                                onClick={() => handleStatusChange(booking.id, 'approved')}
                                                disabled={['cancelled', 'approved', 'rejected'].includes(bookingData?.status?.toLowerCase()) || !isCheckButtonEnabled(booking)}
                                            >
                                                <CheckIcon />
                                            </IconButton>
                                            <IconButton 
                                                size="small" 
                                                sx={{ color: palette.white[900] }}
                                                onClick={() => handleEditClick(booking)}
                                                disabled={['cancelled', 'approved', 'rejected'].includes(bookingData?.status?.toLowerCase())}
                                            >
                                                <EditIcon />
                                            </IconButton>
                                            <IconButton 
                                                size="small" 
                                                sx={{ color: 'error.main' }}
                                                onClick={() => handleStatusChange(booking.id, 'rejected')}
                                                disabled={['cancelled', 'approved', 'rejected'].includes(bookingData?.status?.toLowerCase())}
                                            >
                                                <DeleteIcon />
                                            </IconButton>
                                        </Box>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>

                <Box sx={{ mt: 3, display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
                    <Button 
                        variant="contained" 
                        color={isApproveButtonEnabled() ? "success" : "warning"}
                        sx={{ minWidth: 100 }}
                        onClick={() => isApproveButtonEnabled() ? handleBookingUpdate('approved') : handleBookingUpdate('negotiating')}
                        disabled={['cancelled', 'approved', 'rejected'].includes(bookingData?.status?.toLowerCase())}
                    >
                        {isApproveButtonEnabled() ? "Approve" : "Negotiate"}
                    </Button>
                    <Button 
                        variant="contained" 
                        color="error"
                        sx={{ minWidth: 100 }}
                        onClick={() => handleBookingUpdate('rejected')}
                        disabled={['cancelled', 'approved', 'rejected'].includes(bookingData?.status?.toLowerCase())}
                    >
                        Reject
                    </Button>
                </Box>
            </Paper>

            <Dialog 
                open={editingId !== null} 
                onClose={() => setEditingId(null)}
                PaperProps={{
                    sx: { 
                        minWidth: '400px',
                        color: palette.white[900]
                    }
                }}
            >
                <DialogTitle>Edit Negotiation Time</DialogTitle>
                <DialogContent>
                    <Box sx={{ 
                        px: 2, 
                        py: 4,
                        display: 'flex',
                        gap: 2,
                        alignItems: 'center'
                    }}>
                        <FormControl fullWidth>
                            <InputLabel 
                                id="start-time-label"
                                sx={{ color: palette.white[900] }}
                            >
                                Start Time
                            </InputLabel>
                            <Select
                                labelId="start-time-label"
                                value={timeRange[0]}
                                onChange={handleTimeChange('start')}
                                sx={{
                                    color: palette.white[900],
                                    '.MuiOutlinedInput-notchedOutline': {
                                        borderColor: palette.white[900],
                                    },
                                    '&:hover .MuiOutlinedInput-notchedOutline': {
                                        borderColor: palette.white[900],
                                    },
                                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                                        borderColor: palette.white[900],
                                    },
                                }}
                            >
                                {generateTimeOptions()
                                    .filter(option => isTimeWithinAvailable(option.value, 'start'))
                                    .map((option) => (
                                        <MenuItem 
                                            key={option.value} 
                                            value={option.value}
                                            sx={{
                                                color: palette.white[900],
                                                '&:hover': {
                                                    bgcolor: 'rgba(255, 255, 255, 0.1)',
                                                },
                                            }}
                                        >
                                            {option.label}
                                        </MenuItem>
                                    ))}
                            </Select>
                        </FormControl>

                        <Typography sx={{ color: palette.white[900] }}>to</Typography>

                        <FormControl fullWidth>
                            <InputLabel 
                                id="end-time-label"
                                sx={{ color: palette.white[900] }}
                            >
                                End Time
                            </InputLabel>
                            <Select
                                labelId="end-time-label"
                                value={timeRange[1]}
                                onChange={handleTimeChange('end')}
                                sx={{
                                    color: palette.white[900],
                                    '.MuiOutlinedInput-notchedOutline': {
                                        borderColor: palette.white[900],
                                    },
                                    '&:hover .MuiOutlinedInput-notchedOutline': {
                                        borderColor: palette.white[900],
                                    },
                                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                                        borderColor: palette.white[900],
                                    },
                                }}
                            >
                                {generateTimeOptions()
                                    .filter(option => isTimeWithinAvailable(option.value, 'end'))
                                    .map((option) => (
                                        <MenuItem 
                                            key={option.value} 
                                            value={option.value}
                                            sx={{
                                                color: palette.white[900],
                                                '&:hover': {
                                                    bgcolor: 'rgba(255, 255, 255, 0.1)',
                                                },
                                            }}
                                        >
                                            {option.label}
                                        </MenuItem>
                                    ))}
                            </Select>
                        </FormControl>
                    </Box>
                    <Typography sx={{ mt: 2, textAlign: 'center', color: palette.white[900] }}>
                        Available Time: {convertTo12Hour(availableRange[0])} - {convertTo12Hour(availableRange[1])}
                        {availableRange[1] < availableRange[0] ? ' (Next Day)' : ''}
                    </Typography>
                    <Typography sx={{ mt: 1, textAlign: 'center', color: palette.white[900] }}>
                        {timeRange[1] < timeRange[0] ? '(Next Day)' : ''}
                    </Typography>
                </DialogContent>
                <DialogActions>
                    <Button 
                        onClick={() => setEditingId(null)}
                        sx={{ color: palette.white[900] }}
                    >
                        Cancel
                    </Button>
                    <Button 
                        onClick={() => handleSaveEdit(editingId)} 
                        variant="contained"
                    >
                        Save
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default MyObservatoryDetail;
