import * as React from "react";
import axios from "axios";
import List from "@mui/material/List";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import Button from "@mui/material/Button";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import Image from "mui-image";
import Alert from "@mui/material/Alert";
import Snackbar from "@mui/material/Snackbar";
import AlertDialog from "@components/AlertDialog";
import { ListItems } from "../helpers/common";
import { Palette } from "@common/shared/common/styles";
import { useSelector, useDispatch } from "react-redux";
import { useLocation } from "react-router-dom";
import {
	selectConnectionOnline,
	selectConnected,
	selectActiveKStarID,
	selectConnectedKStarInstances,
} from "@redux/selectors";
import {
	setupActions,
	wssMessageSocketActions,
	wssMediaSocketActions,
	ekosActions,
	captureActions,
} from "@redux/actions";
import useActiveUser from "@hooks/useActiveUser";
import useObservatories from "@hooks/useObservatories";
import Updates from "./Updates";
import { useObservatoryRole } from "@components/providers/ObservatoryRoleProvider";
import commands from "@commands";
import Badge from "@mui/material/Badge";
import { Avatar } from "@mui/material";
import { useNavigate } from "react-router-dom";

const Items = {
	PROFILE: "Profile",
	SETUP: "Setup",
	EKOS: "Ekos",
	VIEW: "View",
	SETTINGS: "Settings",
	STELLA: "Stella",
	ADMIN: "Admin",
};

const NestedList = ({ handleClick, activeSection, renter }) =>
{
	const dispatch = useDispatch();
	const navigate = useNavigate();
	const online = useSelector(selectConnectionOnline);
	const connected = useSelector(selectConnected);
	const user = useActiveUser();
	const [isAdmin, setIsAdmin] = React.useState(false);
	const activeKStarsID = useSelector(selectActiveKStarID);
	const connectedKStarsInstances = useSelector(selectConnectedKStarInstances);
	const observatoryRole = useObservatoryRole();
	const [remainingTime, setRemainingTime] = React.useState(null);
	const { observatories } = useObservatories();
	const [anchorEl, setAnchorEl] = React.useState(null);
	const open = Boolean(anchorEl);
	const [activeBooking, setActiveBooking] = React.useState(null);
	const [renterObservatory, setRenterObservatory] = React.useState(null);
	const location = useLocation();
	const captureDirectory = useSelector(
		(state) => state.setup.picturesDirectory,
	);

	// Alert state
	const [alertOpen, setAlertOpen] = React.useState(false);
	const [alertMessage, setAlertMessage] = React.useState("");
	const [alertSeverity, setAlertSeverity] = React.useState("warning");

	// Find current active observatory
	const currentObservatory = React.useMemo(() =>
	{
		if (!activeKStarsID || !observatories || observatories.length === 0)
			return null;
		return observatories.find((obs) => obs.machine_id === activeKStarsID);
	}, [activeKStarsID, observatories]);

	// State for active renter info (for owner view)
	const [activeRenter, setActiveRenter] = React.useState(null);
	const [renterRemainingTime, setRenterRemainingTime] = React.useState(null);

	// State for revoke access dialog
	const [showRevokeDialog, setShowRevokeDialog] = React.useState(false);

	const handleOpenMenu = (event) =>
	{
		setAnchorEl(event.currentTarget);
	};

	const handleCloseMenu = () =>
	{
		setAnchorEl(null);
	};

	const handleObservatorySelect = (observatory) =>
	{
		// First disconnect from current observatory
		dispatch(wssMessageSocketActions.disconnect());
		dispatch(wssMediaSocketActions.disconnect());

		// Connect to the new observatory
		dispatch(
			wssMessageSocketActions.connect(user, null, observatory.machine_id),
		);
		dispatch(wssMediaSocketActions.connect(user, null, observatory.machine_id));
		localStorage.setItem("currentUser", JSON.stringify(user));

		// Set the new observatory as active and connect to it
		if (
			observatory.machine_id &&
			connectedKStarsInstances?.some(
				(kstar) => kstar.machineID === observatory.machine_id,
			)
		)
		{
			dispatch(
				setupActions.setSetupParameterValue(
					"kstarsActiveID",
					observatory.machine_id,
				),
			);
			dispatch(
				wssMessageSocketActions.sendText(
					observatory.machine_id,
					commands.SET_ACTIVE_KSTARS_CONNECTION,
				),
			);
			dispatch(
				wssMediaSocketActions.sendText(
					observatory.machine_id,
					commands.SET_ACTIVE_KSTARS_CONNECTION,
				),
			);
		}

		handleCloseMenu();

		setTimeout(() =>
		{
			window.location.reload(true);
		}, 1000);
	};

	// Fetch observatory data from URL when in renter mode
	React.useEffect(() =>
	{
		if (renter)
		{
			const searchParams = new URLSearchParams(location.search);
			const observatoryName = searchParams.get("observatory");
			const machineId = searchParams.get("machine_id");

			if (machineId)
			{
				// If we have a machine_id, we can set it as the active KStars ID
				// dispatch(
				// 	setupActions.setSetupParameterValue(
				// 		"kstarsActiveID",
				// 		machineId
				// 	)
				// );

				// If we have user credentials, fetch the observatory details
				if (user && user.token)
				{
					const fetchObservatoryDetails = async () =>
					{
						try
						{
							// First try to find the observatory in the active bookings
							const { data: bookingsData } = await axios.get(
								`/api/observatories/mybookings?username=${user.username}&token=${user.token}`,
							);

							if (bookingsData.bookings && bookingsData.bookings.length > 0)
							{
								const observatoryBooking = bookingsData.bookings.find(
									(booking) =>
										booking.observatory &&
										booking.observatory.machine_id === machineId,
								);

								if (observatoryBooking && observatoryBooking.observatory)
								{
									setRenterObservatory(observatoryBooking.observatory);
									return;
								}
							}

							// If not found in bookings, try to fetch directly by machine_id
							const { data } = await axios.get(
								`/api/observatories/by-machine-id/${machineId}?username=${user.username}&token=${user.token}`,
							);
							if (data && data.observatory)
							{
								setRenterObservatory(data.observatory);
							}
						}
						catch (error)
						{
							console.error("Error fetching observatory details:", error);
						}
					};

					fetchObservatoryDetails();
				}
			}
		}
	}, [renter, location.search, user, dispatch]);

	// Fetch active booking data when in renter mode
	React.useEffect(() =>
	{
		if (renter && user)
		{
			const fetchActiveBooking = async () =>
			{
				try
				{
					const { data } = await axios.get(
						`/api/observatories/mybookings?username=${user.username}&token=${user.token}`,
					);

					if (data.bookings && data.bookings.length > 0)
					{
						// Find the currently active booking
						const now = new Date();
						const activeBooking = data.bookings.find((booking) =>
						{
							if (!booking.dates || booking.dates.length === 0) return false;

							return booking.dates.some((dateEntry) =>
							{
								const startTimeStr =
									dateEntry.negotiatedStartTime || dateEntry.bookedStartTime;
								const endTimeStr =
									dateEntry.negotiatedEndTime || dateEntry.bookedEndTime;

								const startTime = new Date(startTimeStr);
								const endTime = new Date(endTimeStr);

								return now >= startTime && now <= endTime;
							});
						});

						if (activeBooking)
						{
							setActiveBooking(activeBooking);

							// Find the active date entry
							const activeDate = activeBooking.dates.find((dateEntry) =>
							{
								const startTimeStr =
									dateEntry.negotiatedStartTime || dateEntry.bookedStartTime;
								const endTimeStr =
									dateEntry.negotiatedEndTime || dateEntry.bookedEndTime;

								const startTime = new Date(startTimeStr);
								const endTime = new Date(endTimeStr);

								return now >= startTime && now <= endTime;
							});

							if (activeDate)
							{
								const endTimeStr =
									activeDate.negotiatedEndTime || activeDate.bookedEndTime;
								const endTime = new Date(endTimeStr);

								// Calculate initial remaining time in seconds
								const diffInSeconds = Math.floor((endTime - now) / 1000);
								setRemainingTime(diffInSeconds > 0 ? diffInSeconds : 0);
							}
						}
					}
				}
				catch (error)
				{
					console.error("Error fetching active booking:", error);
				}
			};

			fetchActiveBooking();
		}
	}, [renter, user]);

	// Function to handle closing the alert
	const handleAlertClose = () =>
	{
		setAlertOpen(false);
	};

	// Function to show expiry warning notifications
	const showExpiryWarning = (minutes) =>
	{
		// Set alert message and severity
		setAlertMessage(`Your session will expire in ${minutes} minutes`);
		setAlertSeverity(minutes <= 5 ? "error" : "warning");
		setAlertOpen(true);
	};

	// Function to open revoke access dialog
	const handleOpenRevokeDialog = (e) =>
	{
		e.stopPropagation(); // Prevent event bubbling
		setShowRevokeDialog(true);
	};

	// Function to close revoke access dialog
	const handleCloseRevokeDialog = () =>
	{
		setShowRevokeDialog(false);
	};

	// Function to handle revoking access for a renter
	const handleRevokeAccess = async () =>
	{
		try
		{
			// Call API to revoke access
			const response = await axios.post(
				`/api/observatories/revoke-access`,
				{
					observatoryId: currentObservatory._id,
					username: activeRenter.username,
					machineId: currentObservatory.machine_id,
				},
				{
					params: {
						username: user.username,
						token: user.token,
					},
				},
			);

			// Close the dialog
			setShowRevokeDialog(false);

			if (response.data.success)
			{
				// Show success notification
				setAlertMessage(`Access for ${activeRenter.username} has been revoked`);
				setAlertSeverity("success");
				setAlertOpen(true);

				// Reset active renter state
				setActiveRenter(null);
				setRenterRemainingTime(null);
			}
			else
			{
				// Show error notification
				setAlertMessage(`Failed to revoke access: ${response.data.message}`);
				setAlertSeverity("error");
				setAlertOpen(true);
			}
		}
		catch (error)
		{
			console.error("Error revoking access:", error);
			setAlertMessage(`Error revoking access: ${error.message}`);
			setAlertSeverity("error");
			setAlertOpen(true);
			setShowRevokeDialog(false);
		}
	};

	// Timer logic - decrease remaining time every second and show warnings
	React.useEffect(() =>
	{
		if (renter && remainingTime !== null)
		{
			const timer = setInterval(() =>
			{
				setRemainingTime((prevTime) =>
				{
					if (prevTime > 0)
					{
						// Check for notification thresholds
						if (prevTime === 30 * 60)
						{
							// 30 minutes
							showExpiryWarning(30);
						}
						else if (prevTime === 15 * 60)
						{
							// 15 minutes
							showExpiryWarning(15);
						}
						else if (prevTime === 5 * 60)
						{
							// 5 minutes
							showExpiryWarning(5);
						}
						else if (prevTime === 1)
						{
							// 1 second left
							// Show final expiry notification
							setAlertMessage(
								"Your session has expired. You will be logged out.",
							);
							setAlertSeverity("error");
							setAlertOpen(true);
							dispatch(
								captureActions.setAllSettings({
									fileDirectoryT: captureDirectory,
								}),
							);
							dispatch(
								ekosActions.invokeMethod(
									"SchedulerProcess",
									"runShutdownProcedure",
								),
							);
						}
						return prevTime - 1;
					}
					return 0;
				});
			}, 1000); // Update every second

			return () => clearInterval(timer);
		}
	}, [renter, remainingTime]);

	// Handle session expiry
	React.useEffect(() =>
	{
		// If time has reached zero, redirect to bookings page after a short delay
		if (renter && remainingTime === 0)
		{
			const redirectTimer = setTimeout(() =>
			{
				window.location.href = "/community/bookings";
			}, 5000); // 5 second delay to allow the user to see the notification

			return () => clearTimeout(redirectTimer);
		}
	}, [renter, remainingTime]);

	// Fetch active renter information for owner view
	React.useEffect(() =>
	{
		if (!renter && currentObservatory && user && user.token)
		{
			const fetchActiveRenter = async () =>
			{
				try
				{
					// Get the observatory details with accessList
					const { data } = await axios.get(
						`/api/observatories/${currentObservatory._id}?username=${user.username}&token=${user.token}`,
					);

					if (data && data.observatory && data.observatory.accessList)
					{
						// Find any active renter in the accessList
						const now = new Date();
						const activeRenterEntry = data.observatory.accessList.find(
							(access) =>
								access.role === "renter" &&
								access.rentalStart &&
								access.rentalEnd &&
								now >= new Date(access.rentalStart) &&
								now <= new Date(access.rentalEnd),
						);

						if (activeRenterEntry)
						{
							setActiveRenter(activeRenterEntry);

							// Calculate remaining time
							const endTime = new Date(activeRenterEntry.rentalEnd);
							const diffInSeconds = Math.floor((endTime - now) / 1000);
							setRenterRemainingTime(diffInSeconds > 0 ? diffInSeconds : 0);

							// Update remaining time every second
							const timer = setInterval(() =>
							{
								setRenterRemainingTime((prevTime) =>
									prevTime > 0 ? prevTime - 1 : 0,
								);
							}, 1000);

							return () => clearInterval(timer);
						}
						else
						{
							setActiveRenter(null);
							setRenterRemainingTime(null);
						}
					}
				}
				catch (error)
				{
					console.error("Error fetching active renter information:", error);
				}
			};

			fetchActiveRenter();
		}
	}, [renter, currentObservatory, user]);

	React.useEffect(() =>
	{
		(async () =>
		{
			try
			{
				if (!user) return null;

				const { data } = await axios.get(
					`/api/stella/feedback?username=${encodeURIComponent(user.username)}&token=${user.token}`,
				);
				if (data.result)
				{
					setIsAdmin(true);
				}
			}
			catch
			{
				setIsAdmin(false);
			}
		})();
	}, []);

	return (
		<List
			sx={{
				width: "100%",
				maxWidth: 200,
				backgroundColor: "#1d1d1d",
				justifyContent: "space-between",
				display: "flex",
				flexDirection: "column",
			}}
			component="nav"
			aria-labelledby="nested-list-subheader"
		>
			<Box sx={{}}>
				{/* Alert for session expiry warnings */}
				<Snackbar
					open={alertOpen}
					autoHideDuration={6000}
					onClose={handleAlertClose}
					anchorOrigin={{ vertical: "top", horizontal: "center" }}
				>
					<Alert
						onClose={handleAlertClose}
						severity={alertSeverity}
						sx={{
							width: "100%",
							color:
								alertSeverity === "warning" || alertSeverity === "success"
									? Palette.black
									: Palette.white,
						}}
					>
						{alertMessage}
					</Alert>
				</Snackbar>

				{renter && (
					<ListItemButton
						id="go-back-booking"
						sx={{
							marginBottom: "10px",
							color: Palette.orange,
							backgroundColor: "transparent",
							"&:hover": {
								backgroundColor: "rgba(33, 150, 243, 0.08)",
							},
						}}
						onClick={() =>
						{
							// Navigate to bookings page
							window.location.href = "/community/bookings";
						}}
					>
						<ListItemIcon sx={{ color: Palette.white }}>
							<Box
								sx={{
									borderRadius: "20px",
									backgroundColor: "transparent",
									border: `1px solid ${Palette.orange}`,
									width: "35px",
									height: "35px",
									display: "inline-grid",
									placeItems: "center",
								}}
							>
								<ArrowBackIcon />
							</Box>
						</ListItemIcon>
						<ListItemText style={{ color: Palette.white }} primary="Go Back" />
					</ListItemButton>
				)}

				{ListItems.map((oneType) =>
				{
					if (oneType.isAdminRoute && !isAdmin) return null;
					if (oneType.title === Items.SETUP && observatoryRole === "spectator")
						return null;
					if (oneType.title === Items.SETTINGS && renter) return null;

					return (
						<ListItemButton
							id={oneType.title}
							disabled={
								!connected && !activeKStarsID
									? oneType.title === Items.VIEW ||
										oneType.title === Items.PROFILE ||
										oneType.title === Items.SETUP ||
										oneType.title === Items.ADMIN
										? false
										: true
									: false
							}
							sx={{
								backgroundColor:
									oneType.title === activeSection ? Palette.orange : "",
								"&:hover": {
									backgroundColor:
										oneType.title === activeSection ? Palette.orange : "",
								},
							}}
							onClick={() =>
							{
								handleClick(oneType.title);
							}}
							key={oneType.title}
						>
							<ListItemIcon sx={{ color: "white" }}>
								<Box
									sx={{
										border:
											oneType.title === Items.SETUP
												? online
													? `2px solid ${Palette.green}`
													: `2px solid ${Palette.red}`
												: "none",
										borderRadius: "20px",
										backgroundColor: "#FFFFFF33",
										width: "35px",
										height: "35px",
										display: "inline-grid",
										placeItems: "center",
									}}
								>
									{oneType.icon}
								</Box>
							</ListItemIcon>
							<ListItemText
								style={{ color: "white" }}
								primary={
									oneType.subtitle ? (
										<Typography
											component="span"
											sx={{ display: "inline-flex" }}
										>
											{oneType.title}
											<sup style={{ fontSize: "10px" }}>{oneType.subtitle}</sup>
										</Typography>
									) : (
										oneType.title
									)
								}
							/>
						</ListItemButton>
					);
				})}

				{/* Spacer to push observatory selector to bottom */}
				<Box sx={{ flexGrow: 1 }} />

				{/* Observatory Selector - Show for regular users with observatories or for renters with renterObservatory */}
				{((observatories && observatories.length > 0 && !renter) ||
					(renter && (renterObservatory || currentObservatory))) && (
					<Box sx={{ mt: 4, mb: 2 }}>
						{/* Current Observatory Display */}
						<Box
							sx={{
								display: "flex",
								flexDirection: "column",
								alignItems: "center",
								justifyContent: "center",
								cursor: renter ? "default" : "pointer",
								position: "relative",
							}}
							onClick={renter ? undefined : handleOpenMenu}
						>
							{/* Observatory Image with Badge */}
							<Badge
								overlap="circular"
								anchorOrigin={{ vertical: "top", horizontal: "left" }}
								badgeContent={
									<Box
										sx={{
											width: 16,
											height: 16,
											borderRadius: "50%",
											backgroundColor: renter
												? "#4CAF50" // Always green for renter mode
												: currentObservatory &&
													  connectedKStarsInstances?.some(
															(kstar) =>
																kstar.machineID ===
																currentObservatory.machine_id,
													  )
													? "#4CAF50"
													: "#F44336",
											border: "2px solid #1d1d1d",
										}}
									/>
								}
							>
								<Box
									sx={{
										width: 70,
										height: 70,
										borderRadius: "50%",
										overflow: "hidden",
										position: "relative",
										border: `2px solid ${Palette.orange}`,
										mb: 1,
									}}
								>
									<Image
										src={
											renter && renterObservatory?.photos?.[0]
												? renterObservatory.photos[0] ||
													"/public/observatory_img_placeholder.webp"
												: currentObservatory?.photos?.[0] ||
													"/public/observatory_img_placeholder.webp"
										}
										width={70}
										height={70}
										duration={0}
										alt={
											renter && renterObservatory?.name
												? renterObservatory.name
												: currentObservatory?.name || "Observatory"
										}
									/>
								</Box>
							</Badge>

							{/* Observatory Name with dropdown indicator */}
							<Typography
								variant="body2"
								sx={{
									color: "white",
									textAlign: "center",
									display: "flex",
									alignItems: "center",
									gap: 0.5,
								}}
							>
								{renter && renterObservatory?.name
									? renterObservatory.name
									: currentObservatory?.name || "Observatory"}
								{!renter && <ExpandMoreIcon fontSize="small" />}
							</Typography>

							{/* Renter Badge for Owner - Show when a renter is using the observatory */}
							{!renter && currentObservatory && activeRenter && (
								<Box
									sx={{
										display: "flex",
										flexDirection: "column",
										alignItems: "center",
										gap: 1,
										mt: 4,
									}}
								>
									{/* User Avatar*/}
									<Box
										sx={{
											width: 70,
											height: 70,
											borderRadius: "50%",
											overflow: "hidden",
											position: "relative",
											border: `2px solid ${Palette.orange}`,
											mb: 1,
										}}
										onClick={(e) =>
										{
											e.stopPropagation();
											navigate(`/community/${activeRenter.username}`);
										}}
									>
										<Image
											src={
												activeRenter.avatar ||
												"/public/profile_default_image.webp"
											}
											width={70}
											height={70}
											duration={0}
											alt={activeRenter.username}
										/>
										{/* {activeRenter.avatar ? (
												<Image
													src={activeRenter.avatar || "/public/profile_default_image.webp"}
													width={70}
													height={70}
													duration={0}
													alt={activeRenter.username}
												/>
											) : (
												<Avatar 
													sx={{
														width: '100%',
														height: '100%',
														fontSize: '2rem',
														bgcolor: Palette.orange
													}}
												>
													{activeRenter.username.charAt(0).toUpperCase()}
												</Avatar>
											)} */}
									</Box>

									{/* Username */}
									<Typography
										variant="body2"
										sx={{
											color: "white",
											fontWeight: "bold",
										}}
									>
										{activeRenter.username}
									</Typography>

									{/* Revoke Access Button */}
									<Button
										variant="contained"
										size="small"
										sx={{
											mt: 1,
											backgroundColor: "#d32f2f",
											color: "white",
											borderRadius: "4px",
											fontSize: "0.75rem",
											padding: "4px 8px",
											"&:hover": {
												backgroundColor: "#b71c1c",
											},
										}}
										onClick={handleOpenRevokeDialog}
									>
										Revoke Access
									</Button>
								</Box>
							)}

							{/* Remaining Time Display for Renter */}
							{renter && remainingTime !== null && (
								<Typography
									variant="body2"
									sx={{
										color:
											remainingTime <= 300
												? "#FF0000" // Red for <= 5 minutes (5 min)
												: remainingTime <= 900
													? "#FF8C00" // Orange for <= 15 minutes (15 min)
													: remainingTime <= 1800
														? "#FFC107" // Amber for <= 30 minutes (30 min)
														: Palette.orange, // Default color
										textAlign: "center",
										mt: 0.5,
										fontWeight: "bold",
									}}
								>
									{`${Math.floor(remainingTime / 3600)
										.toString()
										.padStart(2, "0")}:${Math.floor((remainingTime % 3600) / 60)
										.toString()
										.padStart(2, "0")}`}
								</Typography>
							)}

							{/* Remaining Time Display for Owner (when a renter is using their observatory) */}
							{!renter && activeRenter && renterRemainingTime !== null && (
								<Typography
									variant="body2"
									sx={{
										color:
											renterRemainingTime <= 300
												? "#FF0000" // Red for <= 5 minutes (5 min)
												: renterRemainingTime <= 900
													? "#FF8C00" // Orange for <= 15 minutes (15 min)
													: renterRemainingTime <= 1800
														? "#FFC107" // Amber for <= 30 minutes (30 min)
														: Palette.orange, // Default color
										textAlign: "center",
										mt: 0.5,
										fontWeight: "bold",
									}}
								>
									{`${Math.floor(renterRemainingTime / 3600)
										.toString()
										.padStart(2, "0")}:${Math.floor(
										(renterRemainingTime % 3600) / 60,
									)
										.toString()
										.padStart(2, "0")}`}
								</Typography>
							)}
						</Box>

						{/* Time Extension Button */}
						{/* <Box 
						sx={{ 
							display: "flex", 
							justifyContent: "center", 
							mt: 1 
						}}
					>
						<Button
							variant="contained"
							sx={{
								backgroundColor: Palette.orange,
								color: "white",
								borderRadius: "4px",
								fontSize: "0.75rem",
								padding: "4px 8px",
								"&:hover": {
									backgroundColor: Palette.orange,
								}
							}}
						>
							Time Extension
						</Button>
					</Box> */}

						{/* Observatory Dropdown Menu - Only show for non-renter mode */}
						{!renter && (
							<Menu
								anchorEl={anchorEl}
								open={open}
								onClose={handleCloseMenu}
								MenuListProps={{
									"aria-labelledby": "observatory-selector",
								}}
								PaperProps={{
									style: {
										maxHeight: 300,
										width: 200,
										backgroundColor: "#333333",
										color: "white",
									},
								}}
								anchorOrigin={{
									vertical: "top",
									horizontal: "center",
								}}
								transformOrigin={{
									vertical: "bottom",
									horizontal: "center",
								}}
							>
								{observatories.map((observatory) =>
								{
									const isConnected = connectedKStarsInstances?.some(
										(kstar) => kstar.machineID === observatory.machine_id,
									);

									return (
										<MenuItem
											key={observatory._id}
											onClick={() => handleObservatorySelect(observatory)}
											selected={activeKStarsID === observatory.machine_id}
											disabled={!isConnected}
											sx={{
												backgroundColor:
													activeKStarsID === observatory.machine_id
														? "rgba(255, 255, 255, 0.1)"
														: "transparent",
												opacity: isConnected ? 1 : 0.5,
												"&:hover": {
													backgroundColor: isConnected
														? "rgba(255, 255, 255, 0.2)"
														: "transparent",
												},
											}}
										>
											<Box
												sx={{
													display: "flex",
													alignItems: "center",
													gap: 1,
													width: "100%",
												}}
											>
												{/* Status Badge */}
												<Badge
													variant="dot"
													color={isConnected ? "success" : "error"}
													sx={{
														"& .MuiBadge-badge": {
															width: 12,
															height: 12,
															borderRadius: "50%",
														},
													}}
												/>

												{/* Observatory Name */}
												<Typography variant="body2" noWrap>
													{observatory.name}
												</Typography>
											</Box>
										</MenuItem>
									);
								})}
							</Menu>
						)}
					</Box>
				)}

				{/* Revoke Access Confirmation Dialog */}
				<AlertDialog
					show={showRevokeDialog}
					close={handleCloseRevokeDialog}
					handleDelete={handleRevokeAccess}
					title="Revoke Access"
					description={`Are you sure you want to revoke access for ${activeRenter?.username}? This will immediately terminate their session.`}
					yes={true}
					type="warning"
				/>
			</Box>

			{/* Updates component at the bottom */}
			<Box sx={{ mt: 2 }}>
				<Updates />
			</Box>
		</List>
	);
};

export default NestedList;
