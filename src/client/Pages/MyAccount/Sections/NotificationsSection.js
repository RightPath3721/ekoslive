import React, { useState } from "react";
import { Box, Typography, Switch, FormControlLabel, Button, Divider } from "@mui/material";
import { styled } from "@mui/material/styles";
import s from "@common/shared/i18n/i18n";
import { Palette } from "@common/shared/common/styles";

const StyledDivider = styled(Divider)(() => ({
  backgroundColor: 'rgba(255, 255, 255, 0.12)',
}));

const StyledSwitch = styled(Switch)(({ theme }) => ({
  '& .MuiSwitch-switchBase.Mui-checked': {
    color: Palette.green,
    '&:hover': {
      backgroundColor: 'rgba(46, 204, 113, 0.08)',
    },
  },
  '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
    backgroundColor: Palette.green,
  },
}));

const NotificationCategory = ({ title, description, checked, onChange }) => (
  <Box sx={{ mb: 3 }}>
    <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
      <Box>
        <Typography variant="h6" sx={{ color: "white" }}>
          {title}
        </Typography>
        <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
          {description}
        </Typography>
      </Box>
      <FormControlLabel
        control={
          <StyledSwitch 
            checked={checked} 
            onChange={(e) => onChange(e.target.checked)} 
          />
        }
        label=""
      />
    </Box>
  </Box>
);

const NotificationsSection = () => {
  const [notifications, setNotifications] = useState({
    system: true,
    maintenance: true,
    community: false,
    equipment: true,
    bookings: true,
    marketing: false,
  });
  
  const handleNotificationChange = (type, value) => {
    setNotifications(prev => ({
      ...prev,
      [type]: value,
    }));
  };
  
  const saveNotificationPreferences = () => {
    // Here you would call your API to save notification preferences
    console.log("Saving notification preferences:", notifications);
  };
  
  return (
    <Box>
      <Typography variant="h5" component="h2" sx={{ mb: 3, color: "white" }}>
        Notification Preferences
      </Typography>
      
      <Typography variant="body1" sx={{ mb: 3, color: 'rgba(255, 255, 255, 0.7)' }}>
        Manage which notifications you receive from EkosLive
      </Typography>
      
      <StyledDivider sx={{ mb: 3 }} />
      
      <NotificationCategory
        title="System Notifications"
        description="Important updates about the EkosLive system"
        checked={notifications.system}
        onChange={(value) => handleNotificationChange('system', value)}
      />
      
      <NotificationCategory
        title="Maintenance Alerts"
        description="Notifications about scheduled maintenance"
        checked={notifications.maintenance}
        onChange={(value) => handleNotificationChange('maintenance', value)}
      />
      
      <NotificationCategory
        title="Community Updates"
        description="News and updates from the EkosLive community"
        checked={notifications.community}
        onChange={(value) => handleNotificationChange('community', value)}
      />
      
      <NotificationCategory
        title="Equipment Alerts"
        description="Status changes and alerts about your connected equipment"
        checked={notifications.equipment}
        onChange={(value) => handleNotificationChange('equipment', value)}
      />
      
      <NotificationCategory
        title="Booking Notifications"
        description="Updates about observatory bookings and schedule changes"
        checked={notifications.bookings}
        onChange={(value) => handleNotificationChange('bookings', value)}
      />
      
      <NotificationCategory
        title="Marketing & Promotions"
        description="New features, special offers, and promotional content"
        checked={notifications.marketing}
        onChange={(value) => handleNotificationChange('marketing', value)}
      />
      
      <Box sx={{ mt: 4, display: "flex", justifyContent: "flex-end" }}>
        <Button variant="contained" onClick={saveNotificationPreferences}>
          Save Preferences
        </Button>
      </Box>
    </Box>
  );
};

export default NotificationsSection;
