import React, { useState, useEffect } from "react";
import { 
  Box, 
  Typography, 
  Paper, 
  Chip, 
  Grid, 
  Button, 
  Divider, 
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Alert,
  Tabs,
  Tab,
  CircularProgress
} from "@mui/material";
import { styled } from "@mui/material/styles";
import { useNavigate } from "react-router-dom";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CloseIcon from "@mui/icons-material/Close";
import dayjs from "dayjs";
import { toast } from "react-toastify";
import useActiveUser from "@hooks/useActiveUser";
import { getCurrentSubscription } from "@utils/getCurrentSubscription";
import { planType } from "@indi/enums";
import subscriptionService from "@services/subscriptionService";
import paypalService from "@services/paypalService";
import { Palette } from "@common/shared/common/styles";
import s from "@common/shared/i18n/i18n";
import PricingTable from "@components/shared/PricingTable/PricingTable";
import TableSwitch from "@components/shared/PricingTable/TableSwitch";

// Styled components
const DarkPaper = styled(Paper)(({ theme }) => ({
  backgroundColor: "#262a38", // Slightly lighter dark background
  color: theme.palette.common.white,
  boxShadow: "none",
  borderRadius: 8
}));

const StyledDivider = styled(Divider)(() => ({
  backgroundColor: 'rgba(255, 255, 255, 0.12)',
}));

const StyledTableCell = styled(TableCell)(({ theme }) => ({
  color: theme.palette.common.white,
  borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
  padding: '16px',
}));

const StyledTableHeaderCell = styled(TableCell)(({ theme }) => ({
  color: theme.palette.common.white,
  backgroundColor: 'rgba(255, 255, 255, 0.05)',
  fontWeight: 600,
  borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
}));

// Section management
const sections = {
  OVERVIEW: 0,
  PLANS: 1
};

const SubscriptionSection = () => {
  const user = useActiveUser();
  const navigate = useNavigate();
  const [currentSection, setCurrentSection] = useState(sections.OVERVIEW);
  const [currentSubscription, setCurrentSubscription] = useState("Basic");
  const [expirationDate, setExpirationDate] = useState("");
  const [subscriptionPlans, setSubscriptionPlans] = useState([]);
  const [loading, setLoading] = useState(false);
  const [upgradeLoading, setUpgradeLoading] = useState(false);
  const [isYearView, setIsYearView] = useState(false);

  // Initialize with user data
  useEffect(() => {
    if (user) {
      setCurrentSubscription(getCurrentSubscription(user.plan_id));
      setExpirationDate(user.to_date ? dayjs(user.to_date).format("YYYY.MM.DD") : "-");
    }
  }, [user]);

  // Fetch subscription plans
  useEffect(() => {
    const fetchSubscriptionPlans = async () => {
      try {
        setLoading(true);
        const response = await subscriptionService.getActivePlans();
        setSubscriptionPlans(response.plans.map(plan => ({ 
          id: plan.id, 
          title: plan.name,
          description: plan.description,
          price: plan.price
        })));
      } catch (error) {
        console.error("Error fetching subscription plans:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchSubscriptionPlans();
  }, []);

  // Pricing table data
  const pricingTableData = {
    headers: ["", "EkosLive Basic", "EkosLive Pro", "EkosLive Ultimate"],
    body: {
      "Online Access": [true, true, true],
      "Cloud Storage": ["500 MB", "10 GB", "1000 GB"],
      "Observatory Lease": [false, true, true],
      "Spectators": [false, true, true],
      "Push Notifications": [false, true, true],
      "Stella AI(prompts/month)": ["10", "100", "Unlimited"],
      "Price": ["Free", "$5.99/mo", "$11.50/mo"],
    }
  };

  // Handle subscription upgrade
  const handleUpgrade = async (planId) => {
    if (!user) {
      toast.error("Please login to upgrade your subscription");
      return;
    }

    try {
      setUpgradeLoading(true);

      // If user already has a subscription, use upgradeCurrentPlan
      if (user.subscription_id) {
        const link = await paypalService.upgradeCurrentPlan(user, user.subscription_id, planId);
        window.location.href = link;
      } else {
        // Otherwise create a new subscription
        const link = await paypalService.createSubscription(user, planId);
        window.location.href = link;
      }
    } catch (error) {
      toast.error(error.message || "Failed to upgrade subscription");
    } finally {
      setUpgradeLoading(false);
    }
  };

  // Section rendering
  const renderOverview = () => (
    <>
      <DarkPaper sx={{ p: 3, mb: 4 }}>
        <Box sx={{ display: "flex", flexDirection: {xs: 'column', sm: 'row'}, justifyContent: "space-between", alignItems: {xs: 'flex-start', sm: 'center'}, gap: {xs: 2, sm: 0} }}>
          <Box>
            <Typography variant="h6" sx={{ color: "white" }}>Current Plan</Typography>
            <Box sx={{ display: "flex", alignItems: "center", mt: 1 }}>
              <Chip 
                label={currentSubscription}
                sx={{ 
                  mr: 2, 
                  fontWeight: "bold",
                  backgroundColor: Palette.orange,
                  color: "white",
                  px: 1,
                }} 
              />
              <Typography variant="body2" sx={{ color: "rgba(255, 255, 255, 0.7)" }}>
                Expires: {expirationDate}
              </Typography>
            </Box>
          </Box>
          <Button 
            variant="contained"
            onClick={() => setCurrentSection(sections.PLANS)}
            sx={{ 
              color: "white",
              backgroundColor: Palette.orange,
              "&:hover": {
                backgroundColor: "#e55c00",
              }
            }}
          >
            View Available Plans
          </Button>
        </Box>
      </DarkPaper>

      <Typography variant="h6" sx={{ mb: 2, color: "white" }}>
        Plan Summary
      </Typography>
      <StyledDivider sx={{ mb: 3 }} />

      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={6}>
          <DarkPaper sx={{ p: 3, height: '100%' }}>
            <Typography variant="h6" sx={{ mb: 2, color: "white" }}>
              {s.general.details}
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="body2" sx={{ color: "rgba(255, 255, 255, 0.7)" }}>
                  Plan:
                </Typography>
                <Typography variant="body2" sx={{ color: "white", fontWeight: 500 }}>
                  EkosLive {currentSubscription}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="body2" sx={{ color: "rgba(255, 255, 255, 0.7)" }}>
                  {s.general.status}:
                </Typography>
                <Chip 
                  label="Active" 
                  size="small"
                  sx={{ 
                    backgroundColor: Palette.orange,
                    color: "white",
                    height: '22px',
                  }} 
                />
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="body2" sx={{ color: "rgba(255, 255, 255, 0.7)" }}>
                  Billing Period:
                </Typography>
                <Typography variant="body2" sx={{ color: "white", fontWeight: 500 }}>
                  {isYearView ? "Yearly" : "Monthly"}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="body2" sx={{ color: "rgba(255, 255, 255, 0.7)" }}>
                  Next Billing Date:
                </Typography>
                <Typography variant="body2" sx={{ color: "white", fontWeight: 500 }}>
                  {expirationDate}
                </Typography>
              </Box>
            </Box>
          </DarkPaper>
        </Grid>
        <Grid item xs={12} md={6}>
          <DarkPaper sx={{ p: 3, height: '100%', display: 'flex', flexDirection: 'column' }}>
            <Typography variant="h6" sx={{ mb: 2, color: "white" }}>
              Upgrade Options
            </Typography>
            <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
              {currentSubscription !== "Ultimate" ? (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, alignItems: 'center' }}>
                  <Typography variant="body2" sx={{ color: "rgba(255, 255, 255, 0.9)", textAlign: 'center' }}>
                    Upgrade to a higher plan to unlock more features
                  </Typography>
                  <Button 
                    variant="contained"
                    onClick={() => setCurrentSection(sections.PLANS)}
                    sx={{ 
                      color: "white",
                      backgroundColor: Palette.orange,
                      "&:hover": {
                        backgroundColor: "#e55c00",
                      }
                    }}
                  >
                    Upgrade Now
                  </Button>
                </Box>
              ) : (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, alignItems: 'center' }}>
                  <Alert 
                    icon={<CheckCircleIcon fontSize="inherit" />} 
                    severity="success"
                    sx={{ 
                      backgroundColor: 'rgba(0, 210, 84, 0.1)', 
                      color: Palette.white,
                      '& .MuiAlert-icon': {
                        color: Palette.success
                      }
                    }}
                  >
                    You are on our highest tier plan
                  </Alert>
                  <Typography variant="body2" sx={{ color: "rgba(255, 255, 255, 0.9)", textAlign: 'center' }}>
                    You have access to all premium features
                  </Typography>
                </Box>
              )}
            </Box>
          </DarkPaper>
        </Grid>
      </Grid>
    </>
  );

  const renderUpgradePlans = () => (
    <>
      <Box sx={{ mb: 4, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
        <Typography variant="h5" component="h2" sx={{ color: "white", textAlign: 'center' }}>
          Choose Plan
        </Typography>
        <TableSwitch value={isYearView} setValue={setIsYearView} />
        <Box sx={{ width: '100%', mt: 2 }}>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
              <CircularProgress sx={{ color: Palette.orange }} />
            </Box>
          ) : (
            <Box sx={{ 
              display: 'flex', 
              flexDirection: 'row', 
              justifyContent: 'space-between',
              flexWrap: 'nowrap',
              overflowX: 'auto',
              gap: 2,
              pb: 2 // Add padding to show scrollbar if needed
            }}>
              <PricingTable isYearView={isYearView} horizontalLayout={true} />
            </Box>
          )}
        </Box>
        <Button 
          variant="outlined" 
          onClick={() => setCurrentSection(sections.OVERVIEW)}
          sx={{ 
            color: "white",
            borderColor: "rgba(255, 255, 255, 0.23)",
            "&:hover": {
              borderColor: Palette.orange,
            },
            mt: 2
          }}
        >
          Back to Overview
        </Button>
      </Box>
    </>
  );

  const renderPlansTable = () => (
    <>
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h5" component="h2" sx={{ color: "white" }}>
          Available Plans
        </Typography>
        <Button 
          variant="outlined" 
          onClick={() => setCurrentSection(sections.OVERVIEW)}
          sx={{ 
            color: "white",
            borderColor: "rgba(255, 255, 255, 0.23)",
            "&:hover": {
              borderColor: Palette.orange,
            }
          }}
        >
          Back to Overview
        </Button>
      </Box>

      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'center' }}>
        <TableSwitch value={isYearView} setValue={setIsYearView} />
      </Box>

      <Box sx={{ display: 'flex', justifyContent: 'center', mb: 4 }}>
        <Box sx={{ display: 'flex', flexDirection: 'row', gap: 3, overflowX: 'auto', pb: 2 }}>
          {pricingTableData.headers.slice(1).map((planName, planIndex) => (
            <DarkPaper 
              key={planIndex} 
              sx={{ 
                p: 3, 
                minWidth: 250, 
                display: 'flex', 
                flexDirection: 'column',
                borderTop: planName.includes("Pro") ? `4px solid ${Palette.orange}` : null,
                position: 'relative'
              }}
            >
              {planName.includes("Pro") && (
                <Chip
                  label="Popular"
                  sx={{
                    position: 'absolute',
                    top: -12,
                    right: 20,
                    backgroundColor: Palette.orange,
                    color: "white",
                    fontWeight: 'bold'
                  }}
                />
              )}
              <Typography variant="h6" sx={{ mb: 2, textAlign: 'center', color: "white" }}>
                {planName}
              </Typography>
              
              <Typography variant="h4" sx={{ mb: 3, textAlign: 'center', color: "white", fontWeight: 'bold' }}>
                {pricingTableData.body.Price[planIndex]}
              </Typography>
              
              <StyledDivider sx={{ mb: 2 }} />
              
              <Box sx={{ flexGrow: 1 }}>
                {Object.entries(pricingTableData.body).slice(0, -1).map(([feature, values], featureIndex) => (
                  <Box 
                    key={featureIndex} 
                    sx={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'space-between',
                      mb: 1.5
                    }}
                  >
                    <Typography variant="body2" sx={{ color: "rgba(255, 255, 255, 0.7)", mr: 2 }}>
                      {feature}:
                    </Typography>
                    {typeof values[planIndex] === "boolean" ? (
                      values[planIndex] ? (
                        <CheckCircleIcon sx={{ color: Palette.orange }} />
                      ) : (
                        <CloseIcon sx={{ color: 'rgba(255, 255, 255, 0.3)' }} />
                      )
                    ) : (
                      <Typography variant="body2" sx={{ color: "white", fontWeight: 500 }}>
                        {values[planIndex]}
                      </Typography>
                    )}
                  </Box>
                ))}
              </Box>
              
              <Box sx={{ mt: 3, display: 'flex', justifyContent: 'center' }}>
                {planIndex === 0 ? (
                  <Button 
                    variant="outlined"
                    disabled={currentSubscription === "Basic"}
                    fullWidth
                    sx={{ 
                      color: "white",
                      borderColor: "rgba(255, 255, 255, 0.23)",
                      "&:hover": {
                        borderColor: Palette.orange,
                      },
                      "&.Mui-disabled": {
                        color: "rgba(255, 255, 255, 0.3)",
                        borderColor: "rgba(255, 255, 255, 0.1)",
                      }
                    }}
                  >
                    Current Plan
                  </Button>
                ) : planIndex === 1 ? (
                  <Button 
                    variant="contained"
                    disabled={upgradeLoading || currentSubscription === "Pro"}
                    fullWidth
                    onClick={() => {
                      const proPlans = subscriptionPlans.filter(plan => 
                        plan.title.includes("Pro") && 
                        (isYearView ? plan.description.toLowerCase().includes("annual") : !plan.description.toLowerCase().includes("annual"))
                      );
                      if (proPlans.length > 0) {
                        handleUpgrade(proPlans[0].id);
                      } else {
                        toast.error("Pro plan not found");
                      }
                    }}
                    sx={{ 
                      color: "white",
                      backgroundColor: Palette.orange,
                      "&:hover": {
                        backgroundColor: "#e55c00",
                      },
                      "&.Mui-disabled": {
                        backgroundColor: "rgba(255, 102, 0, 0.3)",
                        color: "rgba(255, 255, 255, 0.5)",
                      }
                    }}
                  >
                    {upgradeLoading ? <CircularProgress size={24} sx={{ color: "white" }} /> : currentSubscription === "Pro" ? "Current Plan" : "Upgrade"}
                  </Button>
                ) : (
                  <Button 
                    variant="contained"
                    disabled={upgradeLoading || currentSubscription === "Ultimate"}
                    fullWidth
                    onClick={() => {
                      const ultimatePlans = subscriptionPlans.filter(plan => 
                        plan.title.includes("Ultimate") && 
                        (isYearView ? plan.description.toLowerCase().includes("annual") : !plan.description.toLowerCase().includes("annual"))
                      );
                      if (ultimatePlans.length > 0) {
                        handleUpgrade(ultimatePlans[0].id);
                      } else {
                        toast.error("Ultimate plan not found");
                      }
                    }}
                    sx={{ 
                      color: "white",
                      backgroundColor: Palette.orange,
                      "&:hover": {
                        backgroundColor: "#e55c00",
                      },
                      "&.Mui-disabled": {
                        backgroundColor: "rgba(255, 102, 0, 0.3)",
                        color: "rgba(255, 255, 255, 0.5)",
                      }
                    }}
                  >
                    {upgradeLoading ? <CircularProgress size={24} sx={{ color: "white" }} /> : currentSubscription === "Ultimate" ? "Current Plan" : "Upgrade"}
                  </Button>
                )}
              </Box>
            </DarkPaper>
          ))}
        </Box>
      </Box>
    </>
  );

  const renderContent = () => {
    switch (currentSection) {
      case sections.PLANS:
        return renderUpgradePlans();
      case sections.OVERVIEW:
      default:
        return renderOverview();
    }
  };

  return (
    <Box>
      <Box sx={{ borderBottom: 1, borderColor: 'rgba(255, 255, 255, 0.12)', mb: 3 }}>
        <Tabs 
          value={currentSection} 
          onChange={(e, newValue) => setCurrentSection(newValue)}
          sx={{
            '& .MuiTab-root': {
              color: 'rgba(255, 255, 255, 0.7)',
              '&.Mui-selected': {
                color: Palette.orange,
              }
            },
            '& .MuiTabs-indicator': {
              backgroundColor: Palette.orange,
            }
          }}
        >
          <Tab label="Subscription Overview" />
          <Tab label="Available Plans" />
        </Tabs>
      </Box>

      {renderContent()}
    </Box>
  );
};

export default SubscriptionSection;
