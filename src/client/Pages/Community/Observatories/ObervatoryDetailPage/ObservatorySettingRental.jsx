import React from 'react';
import { Box, Divider, Typography } from '@mui/material';
import ObservatorySettingCalendar from './ObservatorySettingCalendar';
import RentableProfileSelector from './RentableProfileSelector';

const ObservatorySettingRental = () => {
    return (
        <Box>
            {/* Rentable Profile Selection */}
            <RentableProfileSelector />
            
            <Divider sx={{ my: 3 }} />
            
            {/* Calendar Settings */}
            <Typography variant="h6" gutterBottom>
                Availability Calendar
            </Typography>
            <ObservatorySettingCalendar />
        </Box>
    );
};

export default ObservatorySettingRental;
