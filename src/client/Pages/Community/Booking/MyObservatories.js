import React, { useEffect } from 'react';
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
} from '@mui/material';
import VisibilityIcon from '@mui/icons-material/Visibility';
import { useTheme } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { nameConvertorForURL } from '@utils/nameConvertorForURL';
import useActiveUser from '@hooks/useActiveUser';
import axios from 'axios';
import { bookingAction } from '@redux/actions/booking.action';

const mockData = [
    { id: 1, observatory: 'Observatory 1', renter: 'Renter 1', status: 'pending' },
    { id: 2, observatory: 'Observatory 2', renter: 'Renter 2', status: 'approved' },
    { id: 3, observatory: 'Observatory 3', renter: 'Renter 3', status: 'pending' },
];

const MyObservatories = () => {
    const [page, setPage] = React.useState(0);
    const [rowsPerPage, setRowsPerPage] = React.useState(10);
    const navigate = useNavigate();
    const user = useActiveUser();
    const dispatch = useDispatch();
    
    // Get received bookings from Redux store
    const receivedBookings = useSelector(state => state.bookings.receivedBookings) || [];

    const handleChangePage = (event, newPage) => {
        setPage(newPage);
    };

    const handleChangeRowsPerPage = (event) => {
        setRowsPerPage(parseInt(event.target.value, 10));
        setPage(0);
    };

    const { palette } = useTheme();

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

    const handleViewDetail = (booking) => {
        navigate(`/community/bookings/${nameConvertorForURL(booking.renter.username)}-${booking._id}`);
    };

    const fetchReceivedBookings = async () => {
        if (!user?.username || !user?.token) return;
        
        try {
            const { data } = await axios.get(`/api/observatories/receivedbookings?username=${user.username}&token=${user.token}`);
            
            // Update Redux store with received bookings
            dispatch(bookingAction.setReceivedBookings(data.bookings));
        } catch (error) {
            console.error("Error fetching received bookings:", error);
        }
    };

    useEffect(() => {
        fetchReceivedBookings();
    }, []);

    return (
        <TableContainer component={Paper} sx={{ margin: 2 }}>
            <Table aria-label="my observatories table">
                <TableHead>
                    <TableRow>
                        <TableCell sx={{ color: palette.white[900] }}>Observatory</TableCell>
                        <TableCell sx={{ color: palette.white[900] }}>Renter</TableCell>
                        <TableCell sx={{ color: palette.white[900] }}>Status</TableCell>
                        <TableCell align="center" sx={{ color: palette.white[900] }}>Actions</TableCell>
                    </TableRow>
                </TableHead>
                <TableBody>
                    {receivedBookings
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
                                <TableCell sx={{ color: palette.white[900] }}>{row.renter?.username}</TableCell>
                                <TableCell>
                                    <Chip
                                        label={row.status.charAt(0).toUpperCase() + row.status.slice(1)}
                                        color={getStatusColor(row.status)}
                                        size="small"
                                    />
                                </TableCell>
                                <TableCell align="center">
                                    <IconButton 
                                        sx={{ color: palette.white[900] }}
                                        onClick={() => handleViewDetail(row)}
                                    >
                                        <VisibilityIcon />
                                    </IconButton>
                                </TableCell>
                            </TableRow>
                    ))}
                </TableBody>
            </Table>
            <TablePagination
                component="div"
                count={receivedBookings.length}
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

export default MyObservatories;
