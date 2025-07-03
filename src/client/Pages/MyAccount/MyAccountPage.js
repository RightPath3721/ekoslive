import React, { useState } from "react";
import { 
  Box, 
  Container, 
  Typography, 
  List, 
  ListItemButton, 
  ListItemIcon, 
  ListItemText,
  Paper,
  Avatar,
  Grid,
  Divider,
  useMediaQuery,
  useTheme,
  IconButton,
  Drawer,
  AppBar,
  Toolbar
} from "@mui/material";
import { styled } from "@mui/material/styles";
import PersonIcon from "@mui/icons-material/Person";
import CardMembershipIcon from "@mui/icons-material/CardMembership";
import SecurityIcon from "@mui/icons-material/Security";
import LanguageIcon from "@mui/icons-material/Language";
import NotificationsIcon from "@mui/icons-material/Notifications";
import MenuIcon from "@mui/icons-material/Menu";
import ProfileSection from "./Sections/ProfileSection";
import SubscriptionSection from "./Sections/SubscriptionSection";
import SecuritySection from "./Sections/SecuritySection";
import LanguageSection from "./Sections/LanguageSection";
import NotificationsSection from "./Sections/NotificationsSection";
import useActiveUser from "@hooks/useActiveUser";
import s from "@common/shared/i18n/i18n";
import { Palette } from "@common/shared/common/styles";

const NavItem = styled(ListItemButton)(({ theme, active }) => ({
  borderRadius: '8px',
  marginBottom: '4px',
  padding: '10px 16px',
  backgroundColor: active ? 'rgba(255, 102, 0, 0.1)' : 'transparent',
  '&:hover': {
    backgroundColor: active ? 'rgba(255, 102, 0, 0.15)' : 'rgba(255, 255, 255, 0.05)',
  },
  '& .MuiListItemIcon-root': {
    minWidth: '40px',
    color: active ? '#FF6600' : 'rgba(255, 255, 255, 0.7)',
  },
  '& .MuiListItemText-primary': {
    fontWeight: active ? 600 : 400,
    color: active ? '#FF6600' : 'white',
  },
  transition: 'all 0.2s ease',
}));

const MyAccountPage = () => {
  const theme = useTheme();
  const user = useActiveUser();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [activeSection, setActiveSection] = useState("profile");
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);

  const handleMobileDrawerToggle = () => {
    setMobileDrawerOpen(!mobileDrawerOpen);
  };

  const handleSectionChange = (section) => {
    setActiveSection(section);
    if (isMobile) {
      setMobileDrawerOpen(false);
    }
  };

  const navItems = [
    { id: "profile", icon: <PersonIcon />, label: s.menu.profile || "Profile" },
    { id: "subscription", icon: <CardMembershipIcon />, label: s.menu.subscription || "Subscription" },
    { id: "security", icon: <SecurityIcon />, label: s.menu.security || "Security" },
    { id: "language", icon: <LanguageIcon />, label: s.menu.language || "Language" },
    // { id: "notifications", icon: <NotificationsIcon />, label: s.menu.notifications || "Notifications" },
  ];

  const renderSection = () => {
    switch (activeSection) {
      case "profile":
        return <ProfileSection />;
      case "subscription":
        return <SubscriptionSection />;
      case "security":
        return <SecuritySection />;
      case "language":
        return <LanguageSection />;
      // case "notifications":
      //   return <NotificationsSection />;
      default:
        return <ProfileSection />;
    }
  };

  // Navigation content for mobile drawer
  const mobileNavigationContent = (
    <>
      <Box sx={{ p: 3, pb: 2 }}>
        <Typography variant="h6" sx={{ 
          fontSize: '1.1rem', 
          fontWeight: 600, 
          color: 'white', 
          mb: 1 
        }}>
          My Account
        </Typography>
        <Typography variant="body2" sx={{ 
          color: 'rgba(255, 255, 255, 0.6)', 
          mb: 3,
          fontSize: '0.85rem' 
        }}>
          Manage your account settings
        </Typography>
      </Box>

      <List component="nav" sx={{ px: 2 }}>
        {navItems.map((item) => (
          <NavItem
            key={item.id}
            active={activeSection === item.id}
            onClick={() => handleSectionChange(item.id)}
          >
            <ListItemIcon>{item.icon}</ListItemIcon>
            <ListItemText primary={item.label} />
          </NavItem>
        ))}
      </List>
    </>
  );

  return (
    <Box sx={{ 
      bgcolor: "#121212",
      minHeight: "100vh",
      pb: 6
    }}>
      {/* Mobile app bar */}
      {isMobile && (
        <AppBar 
          position="fixed" 
          sx={{ 
            bgcolor: '#1D1D1D',
            boxShadow: 'none',
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)'
          }}
        >
          <Toolbar>
            <IconButton
              color="inherit"
              aria-label="open drawer"
              edge="start"
              onClick={handleMobileDrawerToggle}
              sx={{ mr: 2 }}
            >
              <MenuIcon />
            </IconButton>
            <Typography variant="h6" noWrap component="div" sx={{ fontWeight: 500 }}>
              {navItems.find(item => item.id === activeSection)?.label}
            </Typography>
          </Toolbar>
        </AppBar>
      )}

      {/* Mobile drawer */}
      <Drawer
        variant="temporary"
        open={mobileDrawerOpen}
        onClose={handleMobileDrawerToggle}
        ModalProps={{
          keepMounted: true, // Better open performance on mobile.
        }}
        sx={{
          '& .MuiDrawer-paper': { 
            boxSizing: 'border-box', 
            width: 270,
            bgcolor: '#1D1D1D',
          },
        }}
      >
        {mobileNavigationContent}
      </Drawer>

      {/* Main content */}
      <Box sx={{ pt: { xs: 8, md: 4 }, px: 8 }}>
        {/* Header */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" component="h1" sx={{ 
            fontWeight: 600, 
            color: "white", 
            mb: 1 
          }}>
            My Account
          </Typography>
          <Typography variant="body1" sx={{ 
            color: "rgba(255, 255, 255, 0.7)"
          }}>
            Manage your EkosLive account settings and preferences
          </Typography>
        </Box>

        {/* Desktop layout with grid */}
        <Grid container spacing={3}>
          {/* Left navigation column - only visible on desktop */}
          <Grid item md={2} sx={{ display: { xs: 'none', md: 'block' } }}>
            <Paper 
              sx={{ 
                bgcolor: '#1D1D1D',
                border: '1px solid rgba(255, 255, 255, 0.05)',
                borderRadius: 2,
                position: 'sticky',
                top: 24
              }}
            >
              {/* User info section */}
              {/* <Box sx={{ 
                p: 2,
                display: 'flex', 
                alignItems: 'center', 
                borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
              }}>
                <Avatar 
                  src={user?.avatar} 
                  alt={user?.username || "User"} 
                  sx={{ 
                    width: 40, 
                    height: 40,
                    mr: 1.5,
                    bgcolor: '#FF6600'
                  }}
                >
                  {user?.username?.charAt(0)?.toUpperCase() || "U"}
                </Avatar>
                <Box sx={{ overflow: 'hidden' }}>
                  <Typography sx={{ color: 'white', fontWeight: 500, fontSize: '0.9rem' }}>
                    {user?.username || "username"}
                  </Typography>
                  <Typography 
                    variant="body2" 
                    sx={{ 
                      color: 'rgba(255, 255, 255, 0.6)', 
                      fontSize: '0.75rem',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    {user?.email || "user@example.com"}
                  </Typography>
                </Box>
              </Box> */}

              {/* Navigation list */}
              <List component="nav" sx={{ p: 1.5 }}>
                {navItems.map((item) => (
                  <NavItem
                    key={item.id}
                    active={activeSection === item.id}
                    onClick={() => handleSectionChange(item.id)}
                  >
                    <ListItemIcon>{item.icon}</ListItemIcon>
                    <ListItemText primary={item.label} />
                  </NavItem>
                ))}
              </List>
            </Paper>
          </Grid>

          {/* Main content column */}
          <Grid item xs={12} md={10}>
            <Paper 
              elevation={0} 
              sx={{ 
                bgcolor: '#1D1D1D',
                border: '1px solid rgba(255, 255, 255, 0.05)',
                borderRadius: 2,
                overflow: 'hidden'
              }}
            >
              {/* Section header */}
              <Box 
                sx={{ 
                  p: 3, 
                  borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
                  display: { xs: 'none', md: 'block' }
                }}
              >
                <Typography variant="h5" sx={{ fontWeight: 600, color: 'white' }}>
                  {navItems.find(item => item.id === activeSection)?.label}
                </Typography>
                <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.6)', mt: 0.5 }}>
                  {activeSection === "profile" && "Manage your personal information and account details"}
                  {activeSection === "subscription" && "View and manage your subscription plan and billing information"}
                  {activeSection === "security" && "Configure your account security and login settings"}
                  {activeSection === "language" && "Choose your preferred language for the EkosLive interface"}
                  {activeSection === "notifications" && "Control how and when you receive notifications"}
                </Typography>
              </Box>

              {/* Section content */}
              <Box sx={{ p: { xs: 2, sm: 3 } }}>
                {renderSection()}
              </Box>
            </Paper>
          </Grid>
        </Grid>
      </Box>
    </Box>
  );
};

export default MyAccountPage;
