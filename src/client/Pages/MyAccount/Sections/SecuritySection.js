import React, { useState, useEffect } from "react";
import { 
  Box, 
  Typography, 
  Button, 
  Grid, 
  TextField, 
  FormHelperText, 
  Snackbar,
  Alert,
  CircularProgress,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Collapse
} from "@mui/material";
import { styled } from "@mui/material/styles";
import KeyIcon from "@mui/icons-material/VpnKey";
import LockResetIcon from "@mui/icons-material/LockReset";
import SecurityIcon from "@mui/icons-material/Security";
import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import s from "@common/shared/i18n/i18n";
import axios from "axios";
import useActiveUser from "@hooks/useActiveUser";

const DarkTextField = styled(TextField)(({ theme }) => ({
  '& .MuiOutlinedInput-root': {
    '& fieldset': {
      borderColor: 'rgba(255, 255, 255, 0.23)',
    },
    '&:hover fieldset': {
      borderColor: 'rgba(255, 255, 255, 0.35)',
    },
    '&.Mui-focused fieldset': {
      borderColor: theme.palette.primary.main,
    },
    '& input': {
      color: theme.palette.common.white,
    }
  },
  '& .MuiInputLabel-root': {
    color: 'rgba(255, 255, 255, 0.7)',
    '&.Mui-focused': {
      color: theme.palette.primary.main,
    },
  },
  '& .Mui-error .MuiOutlinedInput-notchedOutline': {
    borderColor: theme.palette.error.main,
  },
  '& .Mui-error.MuiInputLabel-root': {
    color: theme.palette.error.main,
  }
}));

const PasswordRequirement = ({ satisfied, text }) => (
  <ListItem dense sx={{ p: 0.5 }}>
    <ListItemIcon sx={{ minWidth: 30 }}>
      {satisfied ? (
        <CheckIcon sx={{ color: 'success.main', fontSize: 18 }} />
      ) : (
        <CloseIcon sx={{ color: 'error.main', fontSize: 18 }} />
      )}
    </ListItemIcon>
    <ListItemText 
      primary={text} 
      primaryTypographyProps={{ 
        variant: 'caption', 
        color: satisfied ? 'success.main' : 'white'
      }}
    />
  </ListItem>
);

const SecuritySection = () => {
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  });
  const [passwordMatch, setPasswordMatch] = useState(true);
  const [passwordTouched, setPasswordTouched] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState({ open: false, message: "", severity: "success" });
  const user = useActiveUser();

  // Password validation requirements
  const [passwordRequirements, setPasswordRequirements] = useState({
    minLength: false,
    hasUppercase: false,
    hasLowercase: false,
    hasNumber: false,
    hasSpecialChar: false
  });

  // Handle input changes
  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData(prev => ({
      ...prev,
      [name]: value
    }));

    // If confirm password field was modified, set it as touched
    if (name === 'confirmPassword') {
      setPasswordTouched(true);
    }

    // Check new password against requirements
    if (name === 'newPassword') {
      validatePassword(value);
    }
  };

  // Validate password against requirements
  const validatePassword = (password) => {
    setPasswordRequirements({
      minLength: password.length >= 8,
      hasUppercase: /[A-Z]/.test(password),
      hasLowercase: /[a-z]/.test(password),
      hasNumber: /\d/.test(password),
      hasSpecialChar: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)
    });
  };

  // Check if password meets all requirements
  const passwordMeetsRequirements = Object.values(passwordRequirements).every(Boolean);

  // Check if passwords match whenever new password or confirm password changes
  useEffect(() => {
    if (passwordData.newPassword && passwordData.confirmPassword) {
      setPasswordMatch(passwordData.newPassword === passwordData.confirmPassword);
    } else {
      // If either field is empty, don't show error
      setPasswordMatch(true);
    }
  }, [passwordData.newPassword, passwordData.confirmPassword]);

  // Reset form when closing
  const handleCancel = () => {
    setPasswordData({
      currentPassword: "",
      newPassword: "",
      confirmPassword: ""
    });
    setPasswordTouched(false);
    setPasswordRequirements({
      minLength: false,
      hasUppercase: false,
      hasLowercase: false,
      hasNumber: false,
      hasSpecialChar: false
    });
    setIsChangingPassword(false);
  };

  // Handle password update
  const handleUpdatePassword = async () => {
    if (!isFormValid) return;
    
    setIsSubmitting(true);
    
    try {
      // Call the change-password endpoint with the required data
      const response = await axios.post('/api/change-password', {
        email: user.email,
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword
      });
      
      // Show success message
      setFeedback({
        open: true,
        message: "Password updated successfully",
        severity: "success"
      });
      
      // Close the password change form
      handleCancel();
    } catch (error) {
      console.error('Password change error:', error);
      
      // Show error message
      let errorMessage = "Failed to update password";
      if (error.response && error.response.data && error.response.data.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      setFeedback({
        open: true,
        message: errorMessage,
        severity: "error"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle close of feedback snackbar
  const handleCloseFeedback = () => {
    setFeedback(prev => ({ ...prev, open: false }));
  };

  // Check if form is valid for submission
  const isFormValid = passwordData.currentPassword && 
                      passwordData.newPassword && 
                      passwordData.confirmPassword && 
                      passwordMatch &&
                      passwordMeetsRequirements;

  return (
    <Box>
      <Typography variant="h5" component="h2" sx={{ mb: 4, color: "white" }}>
        Security & Login
      </Typography>

      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
          <LockResetIcon sx={{ mr: 2, color: 'rgba(255, 255, 255, 0.7)' }} />
          <Typography variant="h6" sx={{ color: "white" }}>
            Password
          </Typography>
        </Box>
        
        {!isChangingPassword ? (
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", ml: 6 }}>
            <Button 
              variant="outlined" 
              onClick={() => setIsChangingPassword(true)}
              sx={{ color: "white", borderColor: "rgba(255, 255, 255, 0.23)" }}
            >
              Change Password
            </Button>
          </Box>
        ) : (
          <Box sx={{ ml: 6 }}>
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <DarkTextField
                  fullWidth
                  label="Current Password"
                  type="password"
                  name="currentPassword"
                  value={passwordData.currentPassword}
                  onChange={handlePasswordChange}
                  disabled={isSubmitting}
                />
              </Grid>
              <Grid item xs={12}>
                <DarkTextField
                  fullWidth
                  label="New Password"
                  type="password"
                  name="newPassword"
                  value={passwordData.newPassword}
                  onChange={handlePasswordChange}
                  disabled={isSubmitting}
                  error={passwordData.newPassword.length > 0 && !passwordMeetsRequirements}
                  helperText={
                    passwordData.newPassword.length > 0 && passwordMeetsRequirements ? (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: 'success.main' }}>
                        <CheckCircleOutlineIcon fontSize="small" />
                        <Typography variant="caption">Password meets all requirements</Typography>
                      </Box>
                    ) : null
                  }
                />
                
                {/* Password requirements checklist - shown only when the password doesn't meet all requirements */}
                <Collapse in={passwordData.newPassword.length > 0 && !passwordMeetsRequirements}>
                  <Box sx={{ mt: 1, ml: 1, bgcolor: 'rgba(0, 0, 0, 0.1)', borderRadius: 1, p: 1 }}>
                    <List dense disablePadding>
                      <PasswordRequirement 
                        satisfied={passwordRequirements.minLength}
                        text="At least 8 characters long"
                      />
                      <PasswordRequirement 
                        satisfied={passwordRequirements.hasUppercase}
                        text="Contains uppercase letter (A-Z)"
                      />
                      <PasswordRequirement 
                        satisfied={passwordRequirements.hasLowercase}
                        text="Contains lowercase letter (a-z)"
                      />
                      <PasswordRequirement 
                        satisfied={passwordRequirements.hasNumber}
                        text="Contains a number (0-9)"
                      />
                      <PasswordRequirement 
                        satisfied={passwordRequirements.hasSpecialChar}
                        text="Contains a special character (!@#$...)"
                      />
                    </List>
                  </Box>
                </Collapse>
              </Grid>
              <Grid item xs={12}>
                <DarkTextField
                  fullWidth
                  label="Confirm New Password"
                  type="password"
                  name="confirmPassword"
                  value={passwordData.confirmPassword}
                  onChange={handlePasswordChange}
                  error={passwordTouched && !passwordMatch}
                  onBlur={() => setPasswordTouched(true)}
                  disabled={isSubmitting}
                />
                {passwordTouched && !passwordMatch && (
                  <FormHelperText 
                    error 
                    sx={{ 
                      ml: 1.5, 
                      mt: 0.5, 
                      color: 'error.main', 
                      fontSize: '0.75rem' 
                    }}
                  >
                    Passwords do not match
                  </FormHelperText>
                )}
              </Grid>
            </Grid>
            <Box sx={{ mt: 2, display: "flex", gap: 2 }}>
              <Button 
                variant="outlined" 
                onClick={handleCancel}
                sx={{ color: "white", borderColor: "rgba(255, 255, 255, 0.23)" }}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button 
                variant="contained"
                disabled={!isFormValid || isSubmitting}
                onClick={handleUpdatePassword}
                startIcon={isSubmitting ? <CircularProgress size={20} color="inherit" /> : null}
              >
                {isSubmitting ? "Updating..." : "Update Password"}
              </Button>
            </Box>
          </Box>
        )}
      </Box>

      {/* <Box sx={{ mb: 4 }}>
        <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
          <SecurityIcon sx={{ mr: 2, color: 'rgba(255, 255, 255, 0.7)' }} />
          <Typography variant="h6" sx={{ color: "white" }}>
            Two-Factor Authentication
          </Typography>
        </Box>
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", ml: 6 }}>
          <Typography variant="body1" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
            Protect your account with an additional security layer
          </Typography>
          <Button 
            variant="outlined"
            sx={{ color: "white", borderColor: "rgba(255, 255, 255, 0.23)" }}
          >
            Enable 2FA
          </Button>
        </Box>
      </Box> */}

      {/* Feedback Snackbar */}
      <Snackbar
        open={feedback.open}
        autoHideDuration={3000}
        onClose={handleCloseFeedback}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert 
          onClose={handleCloseFeedback} 
          severity={feedback.severity}
          variant="filled"
          sx={{ width: '100%', color: 'white' }}
        >
          {feedback.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default SecuritySection;
