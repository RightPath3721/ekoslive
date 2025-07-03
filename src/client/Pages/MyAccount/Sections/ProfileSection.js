import React, { useState, useEffect } from "react";
import { 
  Box, 
  Typography, 
  Grid, 
  Avatar, 
  Divider, 
  Paper, 
  TextField, 
  Button,
  IconButton,
  Snackbar,
  Alert 
} from "@mui/material";
import { styled } from "@mui/material/styles";
import EditIcon from "@mui/icons-material/Edit";
import SaveIcon from "@mui/icons-material/Save";
import CloseIcon from "@mui/icons-material/Close";
import axios from "axios";
import useActiveUser from "@hooks/useActiveUser";
import useProfile from "@hooks/community/useProfile";
import s from "@common/shared/i18n/i18n";
import { Palette } from "@common/shared/common/styles";

// Styled component for read-only profile info display
const ProfileInfoItem = styled(Box)(({ theme }) => ({
  marginBottom: theme.spacing(3),
}));

const InfoLabel = styled(Typography)(({ theme }) => ({
  color: 'rgba(255, 255, 255, 0.7)',
  fontSize: '0.875rem',
  marginBottom: theme.spacing(0.5),
}));

const InfoValue = styled(Typography)(({ theme }) => ({
  color: theme.palette.common.white,
  fontSize: '1rem',
  whiteSpace: 'pre-wrap',
  padding: theme.spacing(2),
  borderRadius: 4,
  backgroundColor: 'rgba(255, 255, 255, 0.05)'
}));

const StyledTextField = styled(TextField)(({ theme }) => ({
  '& .MuiOutlinedInput-root': {
    color: theme.palette.common.white,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    '& fieldset': {
      borderColor: 'rgba(255, 255, 255, 0.1)',
    },
    '&:hover fieldset': {
      borderColor: 'rgba(255, 255, 255, 0.2)',
    },
    '&.Mui-focused fieldset': {
      borderColor: theme.palette.orange,
    },
  },
  '& .MuiInputLabel-root': {
    color: 'rgba(255, 255, 255, 0.7)',
  },
}));

const ProfileSection = () => {
  const user = useActiveUser();
  const { getCurrentUserProfile } = useProfile();
  const [userProfile, setUserProfile] = useState(null);
  const [editingBio, setEditingBio] = useState(false);
  const [bioValue, setBioValue] = useState("");
  const [loading, setLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
  });

  // Fetch the user profile data
  const fetchProfile = async () => {
    if (user) {
      try {
        const profile = await getCurrentUserProfile();
        setUserProfile(profile);
        setBioValue(profile?.profile_description || "");
      } catch (error) {
        console.error('Error fetching user profile:', error);
      }
    }
  };

  useEffect(() => {
    fetchProfile();
  }, [user, getCurrentUserProfile]);

  // Save the updated bio
  const saveBio = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      // Create the data object with just the bio field
      const updatedData = {
        profile_description: bioValue,
        // Keep the existing values to avoid overwriting them
        full_name: userProfile?.full_name || user?.username,
        social_nickname: userProfile?.social_nickname || `@${user?.username}`
      };

      // Make the patch request
      const { data } = await axios.patch(
        `/api/social/?username=${encodeURIComponent(user.username)}&token=${user.token}`,
        updatedData
      );

      // Update the local state with the response
      setUserProfile(prev => ({
        ...prev,
        profile_description: bioValue
      }));
      
      setEditingBio(false);
      setSnackbar({
        open: true,
        message: 'Bio updated successfully',
        severity: 'success'
      });
    } catch (error) {
      console.error('Error updating bio:', error);
      setSnackbar({
        open: true,
        message: 'Failed to update bio. Please try again.',
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  // Cancel editing
  const cancelEditBio = () => {
    setBioValue(userProfile?.profile_description || "");
    setEditingBio(false);
  };

  // Handle the snackbar close
  const handleSnackbarClose = (event, reason) => {
    if (reason === 'clickaway') {
      return;
    }
    setSnackbar(prev => ({ ...prev, open: false }));
  };

  return (
    <Box>
      <Typography variant="h5" component="h2" sx={{ color: "white", mb: 4 }}>
        Profile Details
      </Typography>

      {/* Profile header with avatar */}
      <Box sx={{ 
        display: "flex", 
        flexDirection: { xs: 'column', sm: 'row' }, 
        alignItems: { xs: 'center', sm: 'flex-start' }, 
        mb: 4,
        pb: 3,
        borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
      }}>
        <Avatar
          sx={{ 
            width: 100, 
            height: 100, 
            mb: { xs: 2, sm: 0 },
            mr: { sm: 3 },
            bgcolor: '#FF6600' // Using orange as primary color
          }}
          src={userProfile?.avatar || "/public/profile_default_image.webp"}
          alt={user?.username || "User"}
        >
          {user?.username?.charAt(0)?.toUpperCase() || "U"}
        </Avatar>
        
        <Box>
          <Typography variant="h6" sx={{ color: "white", mb: 0.5 }}>
            {userProfile?.full_name || user?.username || "User"}
          </Typography>
          {userProfile?.social_nickname && (
            <Typography variant="body2" sx={{ color: "rgba(255, 255, 255, 0.7)" }}>
              {userProfile.social_nickname}
            </Typography>
          )}
        </Box>
      </Box>

      {/* Profile information in a grid */}
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <ProfileInfoItem>
            <InfoLabel>{s.connect.login_register.username}</InfoLabel>
            <InfoValue>{user?.username || "N/A"}</InfoValue>
          </ProfileInfoItem>
        </Grid>
        
        <Grid item xs={12} md={6}>
          <ProfileInfoItem>
            <InfoLabel>{s.connect.login_register.email}</InfoLabel>
            <InfoValue>{user?.email || "N/A"}</InfoValue>
          </ProfileInfoItem>
        </Grid>
        
        {(user?.firstName || user?.lastName) && (
          <>
            <Grid item xs={12} md={6}>
              <ProfileInfoItem>
                <InfoLabel>{s.connect.login_register.first_name}</InfoLabel>
                <InfoValue>{user?.firstName || "N/A"}</InfoValue>
              </ProfileInfoItem>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <ProfileInfoItem>
                <InfoLabel>{s.connect.login_register.last_name}</InfoLabel>
                <InfoValue>{user?.lastName || "N/A"}</InfoValue>
              </ProfileInfoItem>
            </Grid>
          </>
        )}

        {/* Bio section - with edit functionality */}
        <Grid item xs={12}>
          <ProfileInfoItem>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
              <InfoLabel>Bio</InfoLabel>
              {!editingBio ? (
                <IconButton 
                  size="small" 
                  onClick={() => setEditingBio(true)}
                  sx={{ color: Palette.orange }}
                >
                  <EditIcon fontSize="small" />
                </IconButton>
              ) : (
                <Box>
                  <IconButton 
                    size="small" 
                    onClick={saveBio}
                    disabled={loading}
                    sx={{ color: Palette.orange }}
                  >
                    <SaveIcon fontSize="small" />
                  </IconButton>
                  <IconButton 
                    size="small" 
                    onClick={cancelEditBio}
                    disabled={loading}
                    sx={{ color: 'rgba(255, 255, 255, 0.7)' }}
                  >
                    <CloseIcon fontSize="small" />
                  </IconButton>
                </Box>
              )}
            </Box>

            {editingBio ? (
              <StyledTextField
                fullWidth
                multiline
                rows={4}
                value={bioValue}
                onChange={(e) => setBioValue(e.target.value)}
                placeholder="Write something about yourself..."
                disabled={loading}
                InputProps={{
                  sx: { color: 'white' }
                }}
              />
            ) : (
              <InfoValue>
                {userProfile?.profile_description || "No bio information."}
              </InfoValue>
            )}
          </ProfileInfoItem>
        </Grid>
      </Grid>

      {/* Snackbar for feedback */}
      {/* <Snackbar 
        open={snackbar.open} 
        autoHideDuration={6000} 
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert 
          onClose={handleSnackbarClose} 
          severity={snackbar.severity} 
          sx={{ 
            width: '100%',
            backgroundColor: snackbar.severity === 'success' ? 'rgba(0, 210, 84, 0.1)' : 'rgba(255, 0, 0, 0.1)',
            color: snackbar.severity === 'success' ? Palette.success : Palette.error
          }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar> */}
    </Box>
  );
};

export default ProfileSection;
