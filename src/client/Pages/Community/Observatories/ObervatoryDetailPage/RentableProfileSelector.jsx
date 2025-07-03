import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { captureException } from '@sentry/browser';
import { 
    Box, 
    Typography, 
    FormControl, 
    InputLabel, 
    Select, 
    MenuItem, 
    Button,
    Alert,
    CircularProgress
} from '@mui/material';
import useActiveUser from '@hooks/useActiveUser';
import { useObservatoryPageContext } from './ObservatoryPageContext';

const RentableProfileSelector = () => {
    const user = useActiveUser();
    const { observatory, setObservatory } = useObservatoryPageContext();
    const [syncedProfiles, setSyncedProfiles] = useState([]);
    const [selectedProfileId, setSelectedProfileId] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(false);

    // Fetch synced profiles
    useEffect(() => {
        if (!observatory || !user) return;
        
        const fetchProfiles = async () => {
            setLoading(true);
            try {
                const { data } = await axios.get(`/api/equipments/${observatory._id}`, {
                    params: {
                        username: user.username,
                        token: user.token
                    }
                });
                
                // Filter only synced profiles
                const synced = data.profiles.filter(profile => profile.isSynced);
                setSyncedProfiles(synced);
                
                // Set selected profile (either from observatory or first synced profile)
                setSelectedProfileId(observatory.rentable_profile_id || (synced.length > 0 ? synced[0]._id : ''));
                
                setLoading(false);
            } catch (error) {
                captureException(error);
                setError('Failed to load profiles');
                setLoading(false);
            }
        };
        
        fetchProfiles();
    }, [observatory, user]);

    const handleProfileChange = async (event) => {
        const newProfileId = event.target.value;
        setSelectedProfileId(newProfileId);
        
        if (!newProfileId || !observatory || !user) return;
        
        try {
            const { data } = await axios.patch(
                `/api/observatories/${observatory._id}/rentable-profile`,
                { profileId: newProfileId },
                {
                    params: {
                        username: user.username,
                        token: user.token
                    }
                }
            );
            
            setObservatory(data.observatory);
            setSuccess(true);
            
            // Clear success message after 3 seconds
            setTimeout(() => setSuccess(false), 3000);
        } catch (error) {
            captureException(error);
            setError(error.response?.data?.error || 'Failed to update rentable profile');
            
            // Clear error message after 3 seconds
            setTimeout(() => setError(null), 3000);
        }
    };

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', my: 3 }}>
                <CircularProgress />
            </Box>
        );
    }

    if (syncedProfiles.length === 0) {
        return (
            <Alert severity="info" sx={{ mt: 3 }}>
                No synced profiles available. Please sync at least one profile to use for rentals.
            </Alert>
        );
    }

    return (
        <Box sx={{ mt: 3 }}>
            <Typography variant="h6" gutterBottom>
                Rentable Profile Selection
            </Typography>
            
            {error && (
                <Alert severity="error" sx={{ mb: 2 }}>
                    {error}
                </Alert>
            )}
            
            {success && (
                <Alert severity="success" sx={{ mb: 2 }}>
                    Rentable profile updated successfully!
                </Alert>
            )}
            
            <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel id="rentable-profile-label">Rentable Profile</InputLabel>
                <Select
                    labelId="rentable-profile-label"
                    value={selectedProfileId}
                    onChange={handleProfileChange}
                    label="Rentable Profile"
                >
                    {syncedProfiles.map(profile => (
                        <MenuItem key={profile._id} value={profile._id}>
                            {profile.name}
                        </MenuItem>
                    ))}
                </Select>
            </FormControl>
        </Box>
    );
};

export default RentableProfileSelector;
