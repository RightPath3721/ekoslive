import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
    Paper,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    IconButton,
    Chip,
    TablePagination,
    Button,
} from '@mui/material';
import VisibilityIcon from '@mui/icons-material/Visibility';
import { format } from 'date-fns';
import { useTheme } from '@mui/material';
import axios from 'axios';
import useActiveUser from '@hooks/useActiveUser';
import { useNavigate } from 'react-router-dom';
import { nameConvertorForURL } from '@utils/nameConvertorForURL';
import { bookingAction } from '@redux/actions/booking.action';

const MyBookings = () => {
    const [page, setPage] = React.useState(0);
    const [rowsPerPage, setRowsPerPage] = React.useState(10);
    const { palette } = useTheme();
    const user = useActiveUser();
    const [currentTime, setCurrentTime] = useState(new Date());
    const navigate = useNavigate();
    const dispatch = useDispatch();
    
    // Get bookings from Redux store
    const bookings = useSelector(state => state.bookings.bookings) || [];

    const fetchBookings = async () => {
        if (!user || !user.username || !user.token) {
            return;
        }
        
        try {
            const { data } = await axios.get(`/api/observatories/mybookings?username=${user.username}&token=${user.token}`);
            
            // Process bookings to handle multiple dates
            const processedBookings = [];
            data.bookings.forEach(booking => {
                if (booking.dates && booking.dates.length > 0) {
                    // Sort dates by date and time
                    const sortedDates = [...booking.dates].sort((a, b) => {
                        const dateA = new Date(a.date);
                        const dateB = new Date(b.date);
                        
                        if (dateA.getTime() !== dateB.getTime()) {
                            return dateA - dateB;
                        }
                        
                        const startTimeA = new Date(a.bookedStartTime || a.negotiatedStartTime);
                        const startTimeB = new Date(b.bookedStartTime || b.negotiatedStartTime);
                        
                        return startTimeA - startTimeB;
                    });
                    
                    const now = new Date();
                    
                    const activeDate = sortedDates.find(dateEntry => {
                        const startTimeStr = dateEntry.negotiatedStartTime || dateEntry.bookedStartTime;
                        const endTimeStr = dateEntry.negotiatedEndTime || dateEntry.bookedEndTime;
                        
                        const startTime = new Date(startTimeStr);
                        const endTime = new Date(endTimeStr);
                        
                        return now >= startTime && now <= endTime;
                    });
                    
                    if (activeDate) {
                        processedBookings.push({
                            ...booking,
                            dateEntry: activeDate,
                        });
                    } else {
                        const futureDate = sortedDates.find(dateEntry => {
                            const startTimeStr = dateEntry.negotiatedStartTime || dateEntry.bookedStartTime;
                            const startTime = new Date(startTimeStr);
                            
                            return startTime > now;
                        });
                        
                        if (futureDate) {
                            processedBookings.push({
                                ...booking,
                                dateEntry: futureDate,
                            });
                        } else if (sortedDates.length > 0) {
                            processedBookings.push({
                                ...booking,
                                dateEntry: sortedDates[sortedDates.length - 1],
                            });
                        } else {
                            processedBookings.push(booking);
                        }
                    }
                } else {
                    processedBookings.push(booking);
                }
            });
            
            // Update Redux store with processed bookings
            dispatch(bookingAction.setBookings(processedBookings));
        } catch (error) {
            console.error("Error fetching bookings:", error);
        }
    };

    useEffect(() => {
        fetchBookings();
        
        const timer = setInterval(() => {
            setCurrentTime(new Date());
        }, 1000);
        
        return () => clearInterval(timer);
    }, []);

    const handleChangePage = (event, newPage) => {
        setPage(newPage);
    };

    const handleChangeRowsPerPage = (event) => {
        setRowsPerPage(parseInt(event.target.value, 10));
        setPage(0);
    };

    const handleViewDetail = (booking) => {
        navigate(`/community/bookings/my-booking/${nameConvertorForURL(booking.renter.username)}-${booking._id}`);
    };
    
    // Format ISO date strings as "May 4th, 2025 17:00 - 19:00"
    const formatBookingDate = (dateEntry) => {
        if (!dateEntry || !dateEntry.startTime) return 'N/A';
        
        // Parse ISO date strings
        const startTime = new Date(dateEntry.startTime);
        const endTime = new Date(dateEntry.endTime);
        
        const formattedDate = format(startTime, 'MMM do, yyyy');
        const formattedStart = format(startTime, 'HH:mm');
        const formattedEnd = format(endTime, 'HH:mm');
        
        return `${formattedDate} ${formattedStart} - ${formattedEnd}`;
    };
    
    // Modify calculateTimeRemaining to check booking status
    const calculateTimeRemaining = (dateEntry, status) => {
        // Return null if booking is not approved
        if (status !== 'approved') return null;
        
        if (!dateEntry || !dateEntry.date) return null;
        
        // Rest of the existing calculateTimeRemaining logic
        const startTimeStr = dateEntry.negotiatedStartTime || dateEntry.bookedStartTime;
        const endTimeStr = dateEntry.negotiatedEndTime || dateEntry.bookedEndTime;
        
        const startTime = new Date(startTimeStr);
        const endTime = new Date(endTimeStr);
        
        const isPreparing = currentTime < startTime && 
                           (startTime - currentTime) <= 24 * 60 * 60 * 1000;
        
        const isActive = currentTime >= startTime && currentTime <= endTime;
        
        if (!isPreparing && !isActive) return null;
        
        const targetTime = isActive ? endTime : startTime;
        const diff = targetTime - currentTime;
        
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);
        
        return {
            hours,
            minutes,
            seconds,
            isActive,
            isPreparing
        };
    };
    
    // Check if booking is currently active
    const isBookingActive = (dateEntry) => {
        if (!dateEntry || !dateEntry.date) return false;
        
        // Use negotiated times if available, otherwise use booked times
        const startTimeStr = dateEntry.negotiatedStartTime || dateEntry.bookedStartTime;
        const endTimeStr = dateEntry.negotiatedEndTime || dateEntry.bookedEndTime;
        
        const startTime = new Date(startTimeStr);
        const endTime = new Date(endTimeStr);
        
        return currentTime >= startTime && currentTime <= endTime;
    };
    
    // Format timer display
    const formatTimer = (timeRemaining) => {
        if (!timeRemaining) return '00:00';
        
        const { hours, minutes, seconds } = timeRemaining;
        return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
    };

    const handleAccess = async (booking) => {
        try {
            // Get the observatory details to retrieve the machine_id
            const { data } = await axios.get(`/api/observatories/${booking.observatory._id}?username=${user.username}&token=${user.token}`);
            
            if (data && data.observatory) {
                const observatory = data.observatory;
                
                if (observatory.machine_id) {
                    // Navigate to the renter page with observatory name and machine_id
                    navigate(`/renter?observatory=${nameConvertorForURL(observatory.name)}&machine_id=${observatory.machine_id}`);
                } else {
                    // If machine_id is not available, show an error message
                    const notification = {
                        severity: 3,
                        message: "The owner has not connected to this observatory yet. Please try again later.",
                        uuid: "machine_id_missing"
                    };
                    // You can implement a notification system here
                    console.error("Machine ID not available for this observatory");
                }
            }
        } catch (error) {
            console.error("Error fetching observatory details:", error);
        }
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
        <TableContainer component={Paper} sx={{ margin: 2 }}>
            <Table aria-label="my bookings table">
                <TableHead>
                    <TableRow>
                        <TableCell sx={{ color: palette.white[900] }}>Observatory</TableCell>
                        <TableCell sx={{ color: palette.white[900] }}>Owner</TableCell>
                        <TableCell sx={{ color: palette.white[900] }}>Status</TableCell>
                        <TableCell sx={{ color: palette.white[900] }}>Date</TableCell>
                        <TableCell sx={{ color: palette.white[900] }}>Timer</TableCell>
                        <TableCell align="center" sx={{ color: palette.white[900] }}>Actions</TableCell>
                    </TableRow>
                </TableHead>
                <TableBody>
                    {bookings
                        .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                        .map((row) => (
                            <TableRow
                                key={row.id}
                                sx={{ 
                                    '&:last-child td, &:last-child th': { border: 0 },
                                    '& td': { color: palette.white[900] }
                                }}
                            >
                                <TableCell sx={{ color: palette.white[900] }}>{row.observatory?.name}</TableCell>
                                <TableCell sx={{ color: palette.white[900] }}>{row.owner?.username}</TableCell>
                                <TableCell>
                                    <Chip
                                        label={row.status.charAt(0).toUpperCase() + row.status.slice(1)}
                                        color={getStatusColor(row.status)}
                                        size="small"
                                    />
                                </TableCell>
                                <TableCell sx={{ color: palette.white[900] }}>
                                    {formatBookingDate(row.dateEntry)}
                                </TableCell>
                                <TableCell>
                                    {(() => {
                                        const timeRemaining = calculateTimeRemaining(row.dateEntry, row.status);
                                        if (!timeRemaining) return null;
                                        
                                        return (
                                            <span style={{ 
                                                color: timeRemaining.isActive ? '#4caf50' : '#ff9800'
                                            }}>
                                                {formatTimer(timeRemaining)}
                                            </span>
                                        );
                                    })()}
                                </TableCell>
                                <TableCell align="center" sx={{ display: 'flex', justifyContent: 'center', gap: 1 }}>
                                    <IconButton 
                                        sx={{ color: palette.white[900] }} 
                                        onClick={() => handleViewDetail(row)}
                                    >
                                        <VisibilityIcon />
                                    </IconButton>
                                    <Button
                                        variant="contained"
                                        size="small"
                                        disabled={!isBookingActive(row.dateEntry) || row.status !== 'approved'}
                                        onClick={() => handleAccess(row)}
                                        title={row.status !== 'approved' ? 'Access is only available for approved bookings' : 
                                               !isBookingActive(row.dateEntry) ? 'This booking is not currently active' : 
                                               'Access observatory'}
                                    >
                                        Access
                                    </Button>
                                </TableCell>
                            </TableRow>
                    ))}
                </TableBody>
            </Table>
            <TablePagination
                component="div"
                count={bookings.length}
                page={page}
                onPageChange={handleChangePage}
                rowsPerPage={rowsPerPage}
                onRowsPerPageChange={handleChangeRowsPerPage}
                sx={{ 
                    color: palette.white[900],
                    '& .MuiTablePagination-select': {
                        color: palette.white[900]
                    },
                    '& .MuiTablePagination-selectIcon': {
                        color: palette.white[900]
                    },
                    '& .MuiTablePagination-displayedRows': {
                        color: palette.white[900]
                    },
                    '& .MuiTablePagination-actions': {
                        color: palette.white[900]
                    }
                }}
            />
        </TableContainer>
    );
};

export default MyBookings;
