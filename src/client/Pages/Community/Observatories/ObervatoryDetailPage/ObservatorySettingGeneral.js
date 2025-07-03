import React, { useCallback, useEffect, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { wssMessageSocketActions, wssMediaSocketActions } from "@redux/actions";
import axios from "axios";
import { captureException } from "@sentry/browser";
import { Button, useTheme, Dialog, DialogTitle, DialogContent, DialogActions, IconButton, Alert, Tooltip } from "@mui/material";
import LinkOffIcon from "@mui/icons-material/LinkOff";
import WarningIcon from "@mui/icons-material/Warning";
import DeleteIcon from "@mui/icons-material/Delete";
import {
	selectConnectedKStarInstances,
	selectActiveKStarID,
} from "@redux/selectors";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Switch from "@mui/material/Switch";
import s from "@common/shared/i18n/i18n";
import TabLoader from "@components/TabLoader";
import useActiveUser from "@hooks/useActiveUser";
import Map from "@components/Map";
import { convertCoordToDms } from "@utils/convertCoordToDms";
import FormLabelTextField from "@components/FormLabelTextField";
import FormMultiDropzone from "@components/FormMultiDropzone";
import { useObservatoryPageContext } from "./ObservatoryPageContext";
import Markdown from "react-markdown";
import ObservatoryLinkModal from "../../../../views/Setup/EkosInstanceSelector/ObservatoryLinkModal";
import { Palette } from "@common/shared/common/styles";
import AlertDialog from "@components/AlertDialog";

const ObservatorySettingGeneral = () => {
	const user = useActiveUser();
	const dispatch = useDispatch();
	const { palette } = useTheme();
	const { observatory, setObservatory } = useObservatoryPageContext();
	const [location, setLocation] = useState(null);
	const [isLocationPickerOpen, setIsLocationPickerOpen] = useState(false);
	const [updatedLocation, setUpdatedLocation] = useState(null);
	const [updatedVisibility, setUpdatedVisibility] = useState(null);
	const [observatoryImg, setObservatoryImg] = useState();
	const [isRentable, setIsRentable] = useState(observatory?.rentable || false);
	const [openRentableDialog, setOpenRentableDialog] = useState(false);
	const [openRentableWarningDialog, setOpenRentableWarningDialog] = useState(false);
	const [isLinkMenuOpen, setIsLinkMenuOpen] = useState(false);
	const [isLoading, setIsLoading] = useState(false);
	const connectedKStarsInstances = useSelector(selectConnectedKStarInstances);
	const activeKStarID = useSelector(selectActiveKStarID);
	const isConnectedToKStar = connectedKStarsInstances?.some(
		(kstar) => kstar.machineID === observatory?.machine_id
	);
	const [showDeleteDialog, setShowDeleteDialog] = useState(false);
	const [isDeleting, setIsDeleting] = useState(false);
	const [showLocationAlert, setShowLocationAlert] = useState(false);

	useEffect(() => {
		if (!user) return;

		(async () => {
			try {
				const { data } = await axios.get(`/api/observatories/locations`, {
					params: {
						observatories: [observatory?._id],
						username: user.username,
						token: user.token,
					},
				});
				if (data[0]?.location) {
					setLocation(data[0]?.location);
				}
			} catch (error) {
				captureException(error);
			}
		})();
	}, [observatory, user]);

	const toggleLocationPicker = useCallback(
		() => setIsLocationPickerOpen((p) => !p),
		[setIsLocationPickerOpen],
	);

	const submitLocation = useCallback(
		(position) => {
			setUpdatedLocation(position);
			toggleLocationPicker();
		},
		[setUpdatedLocation, toggleLocationPicker],
	);

	const toggleVisibility = useCallback(
		(e) => {
			setUpdatedVisibility(e.target.checked);
		},
		[setUpdatedVisibility],
	);

	const resetForm = useCallback(() => {
		setUpdatedVisibility(null);
		setObservatoryImg(null);
		const form = document.querySelector('form');
		if (form) {
			form.reset();
		}
	}, []);

	const closeLinkMenu = useCallback(
		() => setIsLinkMenuOpen(false),
		[setIsLinkMenuOpen],
	);

	const handleLinkClick = useCallback(
		() => setIsLinkMenuOpen(true),
		[setIsLinkMenuOpen],
	);

	const handleUnlinkClick = useCallback(
		async () => {
			if (!observatory || !user) return;
			
			setIsLoading(true);
			try {
				const observatoryData = new FormData();
				observatoryData.append("machine_id", "");
				
				const { data } = await axios.patch(
					`/api/observatories/${observatory?._id}`,
					observatoryData,
					{
						params: {
							username: user?.username,
							token: user?.token,
						},
					},
				);
				setObservatory(data.observatory);
			} catch (error) {
				captureException(error);
			} finally {
				setIsLoading(false);
			}
		},
		[observatory, user, setObservatory],
	);

	const updateObservatory = useCallback(
		async (machine_id) => {
			if (!observatory || !user) return;
			
			setIsLoading(true);
			try {
				// First disconnect from current observatory
				dispatch(wssMessageSocketActions.disconnect());
				dispatch(wssMediaSocketActions.disconnect());

				// Connect to the new observatory
				dispatch(
					wssMessageSocketActions.connect(user, null, machine_id),
				);
				dispatch(wssMediaSocketActions.connect(user, null, machine_id));
				localStorage.setItem("currentUser", JSON.stringify(user));

				const observatoryData = new FormData();
				observatoryData.append("machine_id", machine_id);
				
				const { data } = await axios.patch(
					`/api/observatories/${observatory?._id}`,
					observatoryData,
					{
						params: {
							username: user?.username,
							token: user?.token,
						},
					},
				);
				setObservatory(data.observatory);
				setIsLinkMenuOpen(false);
			} catch (error) {
				captureException(error);
			} finally {
				setIsLoading(false);
			}
		},
		[observatory, user, setObservatory, setIsLinkMenuOpen],
	);

	const handleSubmit = useCallback(
		async (e) => {
			e.preventDefault();

			if (!observatory || !user) return;

			const formData = new FormData(e.currentTarget);
			const observatoryData = new FormData();
			const updatedObservatoryName = formData.get("name");
			const updatedOwner = formData.get("owner");
			
			if (updatedObservatoryName) {
				observatoryData.append("name", updatedObservatoryName);
			}
			if (updatedOwner) {
				observatoryData.append("owner", updatedOwner);
			}
			if (typeof updatedVisibility === "boolean") {
				observatoryData.append("visibility", updatedVisibility);
			}
			if (updatedLocation && updatedLocation.lat && updatedLocation.lng) {
				const locationData = {
					lat: updatedLocation.lat,
					lng: updatedLocation.lng,
					country: updatedLocation.country || location?.country,
					...(updatedLocation.region && { region: updatedLocation.region }),
				};
				observatoryData.append("location", JSON.stringify(locationData));
			}
			if (observatoryImg)
			{
				observatoryImg.map((item) =>
				{
					observatoryData.append("images", item);
				});
			}

			try {
				const { data } = await axios.patch(
					`/api/observatories/${observatory?._id}`,
					observatoryData,
					{
						params: {
							username: user?.username,
							token: user?.token,
						},
					},
				);
				setObservatory(data.observatory);
				
				// Update the local location state to reflect the new values
				if (data.observatory.location) {
					setLocation(data.observatory.location);
				}
				
				// Only reset form fields, not the location display
				setUpdatedVisibility(null);
				setObservatoryImg(null);
				const form = document.querySelector('form');
				if (form) {
					form.reset();
				}
			} catch (error) {
				captureException(error);
			}
		},
		[observatory, observatoryImg, updatedLocation, updatedVisibility, user, setObservatory, location],
	);

	const handleRentableToggle = useCallback((e) => {
		if (!location || (!location.lat && !location.lng)) {
			setShowLocationAlert(true);
			return;
		}
		
		if (e.target.checked) {
			setOpenRentableWarningDialog(true);
		} else {
			updateRentableStatus(false);
		}
	}, [location]);

	const handleConfirmWarning = useCallback(() => {
		setOpenRentableWarningDialog(false);
		setOpenRentableDialog(true);
	}, []);

	const handleConfirmRentable = useCallback(async () => {
		await updateRentableStatus(true);
		setOpenRentableDialog(false);
	}, []);

	const updateRentableStatus = async (status) => {
		if (!observatory || !user) return;

		try {
			// If enabling rentable, we need to find the first synced profile to set as default
			let updateData = { rentable: status };
			
			if (status === true) {
				// Fetch equipment profiles to find synced ones
				try {
					const { data } = await axios.get(`/api/equipments`, {
						params: {
							observatoryId: observatory._id,
							username: user.username,
							token: user.token
						}
					});
					
					// Find the first synced profile
					const syncedProfiles = data.equipmentProfiles.filter(profile => profile.isSynced);
					if (syncedProfiles.length > 0) {
						updateData.rentable_profile_id = syncedProfiles[0]._id;
					}
				} catch (error) {
					console.error('Error fetching profiles:', error);
				}
			}
			
			// Update the observatory with rentable status and possibly default profile
			const { data } = await axios.patch(
				`/api/observatories/${observatory?._id}`,
				updateData,
				{
					params: {
						username: user?.username,
						token: user?.token,
					},
				}
			);
			setIsRentable(data.observatory.rentable);
			setObservatory(data.observatory);
		} catch (error) {
			captureException(error);
		}
	};

	const handleDeleteObservatory = useCallback(async () => {
		if (!observatory || !user) return;
		
		setIsDeleting(true);
		try {
			await axios.delete(`/api/observatories/${observatory?._id}`, {
				params: {
					username: user?.username,
					token: user?.token,
				},
			});
			
			// Redirect to observatories list page after deletion
			window.location.href = "/community/profile/observatories";
		} catch (error) {
			captureException(error);
		} finally {
			setIsDeleting(false);
			setShowDeleteDialog(false);
		}
	}, [observatory, user]);

	const dismissLocationAlert = () => {
		setShowLocationAlert(false);
	};

	const hasLocation = location && (location.lat || location.lng);

	if (!observatory) return <TabLoader />;

	return (
		<Box component="form" onSubmit={handleSubmit}>
			<Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
				<Typography variant="h6">Observatory Settings</Typography>
				<Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
					<Button
						variant="outlined"
						onClick={handleLinkClick}
						disabled={isLoading}
						startIcon={!observatory?.machine_id && <WarningIcon />}
						sx={{
							backgroundColor: observatory?.machine_id ? 'transparent' : Palette.darkRed,
							borderColor: observatory?.machine_id ? Palette.darkGreen : Palette.darkRed,
							color: observatory?.machine_id ? Palette.darkGreen : Palette.white,
							'&:hover': {
								backgroundColor: observatory?.machine_id ? 'rgba(17, 170, 17, 0.04)' : 'rgba(138, 20, 20, 0.8)',
								borderColor: observatory?.machine_id ? Palette.darkGreen : Palette.darkRed,
							}
						}}
					>
						{observatory?.machine_id ? observatory?.name : "No Observatory"}
					</Button>
				</Box>
			</Box>

			<FormLabelTextField
				label={s.general.name}
				width="100%"
				defaultValue={observatory?.name || ""}
				name="name"
			/>

			<FormLabelTextField
				label={s.general.owner}
				width="100%"
				defaultValue={observatory?.owner || ""}
				name="owner"
			/>

			<FormMultiDropzone
				file={observatoryImg}
				imagePickerType="observatory_preview"
				setFile={setObservatoryImg}
				label="Add Images"
			/>

			{/* Location Information */}
			<Typography variant="subtitle1" sx={{ mt: 2, mb: 1 }}>
				Location Information
			</Typography>
			<Typography
				sx={{
					display: "flex",
					justifyContent: "space-between",
					alignItems: "center",
				}}
			>
				<Typography variant="subtitle1" component="span" fontSize="1rem">
					{s.general.latitude}
				</Typography>
				<Typography
					variant="subtitle1"
					fontSize="1rem"
					component="span"
					sx={{ color: palette.orange[500] }}
					role="button"
					onClick={toggleLocationPicker}
				>
					{convertCoordToDms(updatedLocation?.lat ?? location?.lat)}
				</Typography>
			</Typography>
			<Typography
				sx={{
					display: "flex",
					justifyContent: "space-between",
					alignItems: "center",
				}}
			>
				<Typography variant="subtitle1" component="span" fontSize="1rem">
					{s.general.longitude}
				</Typography>
				<Typography
					variant="subtitle1"
					fontSize="1rem"
					component="span"
					sx={{ color: palette.orange[500] }}
					role="button"
					onClick={toggleLocationPicker}
				>
					{convertCoordToDms(updatedLocation?.lng ?? location?.lng)}
				</Typography>
			</Typography>
			<Button
				variant="outlined"
				onClick={toggleLocationPicker}
				sx={{ mt: 1 }}
			>
				{"Update Location"}
			</Button>

			{showLocationAlert && (
				<Alert 
					severity="warning" 
					sx={{ mt: 2, mb: 2 }}
					onClose={dismissLocationAlert}
				>
					Please set an observatory location before enabling rentable status. Location information is required for rental services.
				</Alert>
			)}

			<Box sx={{ display: "flex", alignItems: "center", gap: ".75rem", mt: 2 }}>
				<Switch
					onChange={toggleVisibility}
					checked={updatedVisibility ?? observatory?.visibility}
					name="visibility"
					id="visibility"
				/>
				<Typography variant="subtitle2" component="span">
					{s.social.public_directory}
				</Typography>
			</Box>

			<Box sx={{ display: "flex", alignItems: "center", gap: ".75rem", mt: 2 }}>
				<Tooltip 
					title={!hasLocation ? "Location information is required for rental services" : ""}
					placement="top"
				>
					<Box>
						<Switch
							onChange={handleRentableToggle}
							checked={isRentable}
							name="rentable"
							id="rentable"
							disabled={!hasLocation && !isRentable}
						/>
					</Box>
				</Tooltip>
				<Typography 
					variant="subtitle2" 
					component="span"
				>
					Rentable <span style={{ 
						backgroundColor: palette.warning.main, 
						color: palette.white[900], 
						padding: '0px 4px', 
						borderRadius: '4px', 
						fontSize: '0.7rem', 
						fontWeight: 'bold',
						verticalAlign: 'top'
					}}>BETA</span>
					{!hasLocation && isRentable && (
						<Typography 
							variant="caption" 
							color="warning.main" 
							component="span" 
							sx={{ ml: 1, display: 'block' }}
						>
							Location information required
						</Typography>
					)}
				</Typography>
			</Box>

			<Box display="flex" alignItems="center" justifyContent="flex-end" gap={2} mt={2.5}>
				<Button 
					variant="contained" 
					color="error" 
					startIcon={<DeleteIcon />}
					onClick={() => setShowDeleteDialog(true)}
					disabled={isDeleting}
				>
					{s.general.delete}
				</Button>
				
				<Button type="submit" variant="contained">
					{s.general.save}
				</Button>
			</Box>

			<Map
				confirmPosition={submitLocation}
				open={isLocationPickerOpen}
				initialLocationData={location}
			/>

			<ObservatoryLinkModal
				close={closeLinkMenu}
				open={isLinkMenuOpen}
				submit={updateObservatory}
				initialValue={observatory?.machine_id}
				isLoading={isLoading}
			/>

			<Dialog
				open={openRentableWarningDialog}
				onClose={() => setOpenRentableWarningDialog(false)}
				maxWidth="md"
				fullWidth
			>
				<DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
					<WarningIcon color="warning" />
					WARNING: EkosLive Rental Services (Beta)
				</DialogTitle>
				<DialogContent>
					<Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold' }}>
						DISCLAIMER OF LIABILITY AND ASSUMPTION OF RISK
					</Typography>
					<Typography sx={{ mb: 2 }}>
						BY USING EKOSLIVE RENTAL SERVICES (BETA), YOU ACKNOWLEDGE AND AGREE TO THE FOLLOWING TERMS:
					</Typography>
					<Typography sx={{ mb: 2 }}>
						EkosLive and Ikarus Technologies (hereinafter "the Providers") provide this beta service on an "AS IS" and "AS AVAILABLE" basis, without any warranties or guarantees of any kind, whether express or implied.
					</Typography>
					<Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 'bold' }}>
						ASSUMPTION OF RISK:
					</Typography>
					<Typography sx={{ mb: 2 }}>
						You expressly understand and agree that allowing third parties to remotely access your observatory equipment through this service is done ENTIRELY AT YOUR OWN RISK. The Providers shall not be liable, under any circumstances or legal theories, for any direct, indirect, incidental, special, consequential, or exemplary damages arising from or related to such access, including but not limited to:
					</Typography>
					<ul style={{ color: palette.white[900] }}>
						<li>Damage to observatory equipment, telescopes, cameras, mounts, computers, or other hardware</li>
						<li>Misuse of equipment resulting in mechanical failures</li>
						<li>Data loss or corruption</li>
						<li>Property damage of any kind</li>
						<li>Financial losses of any nature</li>
					</ul>
					<Typography variant="subtitle1" sx={{ mt: 2, mb: 1, fontWeight: 'bold' }}>
						BETA STATUS:
					</Typography>
					<Typography sx={{ mb: 2 }}>
						You expressly acknowledge that this service is in BETA phase for testing purposes only. The system may contain errors, bugs, or other limitations that could potentially result in equipment malfunction or damage. The Providers make no representations that the service will meet your requirements or expectations.
					</Typography>
					<Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 'bold' }}>
						FEEDBACK:
					</Typography>
					<Typography sx={{ mb: 2 }}>
						While your feedback is appreciated to improve the system, provision of such feedback does not alter or diminish the terms of this disclaimer.
					</Typography>
					<Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 'bold' }}>
						INDEMNIFICATION:
					</Typography>
					<Typography sx={{ mb: 2 }}>
						You agree to indemnify, defend, and hold harmless the Providers from and against any claims, liabilities, damages, losses, costs, expenses, or fees (including reasonable attorneys' fees) that arise from or relate to your use or misuse of the service.
					</Typography>
					<Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 'bold' }}>
						NO WAIVER:
					</Typography>
					<Typography sx={{ mb: 2 }}>
						The failure of the Providers to exercise or enforce any right or provision of this disclaimer shall not constitute a waiver of such right or provision.
					</Typography>
					<Typography sx={{ mt: 3, fontWeight: 'bold' }}>
						By proceeding to use the EkosLive Rental Services (Beta), you acknowledge that you have read, understood, and agree to be bound by all of the terms and conditions stated herein.
					</Typography>
				</DialogContent>
				<DialogActions>
					<Button onClick={() => {
						setOpenRentableWarningDialog(false);
						setIsRentable(false);
					}}>
						Decline
					</Button>
					<Button onClick={handleConfirmWarning} variant="contained" color="warning">
						Accept
					</Button>
				</DialogActions>
			</Dialog>

			<Dialog 
				open={openRentableDialog} 
				onClose={() => setOpenRentableDialog(false)}
				maxWidth="md"
				fullWidth
			>
				<DialogTitle>EKOSLIVE OBSERVATORY RENTAL SERVICE AGREEMENT</DialogTitle>
				<DialogContent>
					<Markdown 
						className="rental-agreement" 
						components={{
							p: ({children}) => (
								<Typography sx={{ 
									color: 'white',
									mb: 2  // adds margin bottom
								}}>
									{children}
								</Typography>
							),
							h1: ({children}) => (
								<Typography variant="h1" sx={{ 
									color: 'white',
									mb: 3,  // larger margin for headers
									mt: 2 
								}}>
									{children}
								</Typography>
							),
							h2: ({children}) => (
								<Typography variant="h2" sx={{ 
									color: 'white',
									mb: 2.5,
									mt: 3 
								}}>
									{children}
								</Typography>
							),
							h3: ({children}) => (
								<Typography variant="h3" sx={{ 
									color: 'white',
									mb: 2,
									mt: 2 
								}}>
									{children}
								</Typography>
							),
							li: ({children}) => (
								<Typography component="li" sx={{ 
									color: 'white',
									mb: 1  // smaller margin for list items
								}}>
									{children}
								</Typography>
							),
						}}
					>
						{`
This Observatory Rental Service Agreement ("Agreement") is entered into between the Observatory Owner ("Provider") and EkosLive ("Platform"), effective upon confirmation.

## 1. DEFINITIONS
### 1.1. "Equipment" refers to all astronomical equipment, telescopes, cameras, mounts, computers, and associated hardware made available for rental.
### 1.2. "Rental Period" means the duration for which the Equipment is booked by a Renter.
### 1.3. "Service" refers to the remote observatory rental service facilitated through the Platform.
### 1.4. "Renter" refers to any individual or entity booking the Equipment through the Platform.

## 2. PROVIDER RESPONSIBILITIES
### 2.1. Equipment Maintenance and Operation
* Provider shall maintain all Equipment in professional working condition
* Provider must perform regular calibration and maintenance
* Provider must maintain detailed maintenance logs
* All software must be kept updated and properly licensed

### 2.2. Technical Requirements
* Minimum internet connection speed of 10Mbps upload/download
* Backup power systems must be operational
* Weather monitoring systems must be properly configured
* Remote shutdown capabilities must be implemented

## 3. SERVICE AVAILABILITY
### 3.1. Uptime Guarantee
* Provider commits to 90% uptime during clear weather conditions
* Scheduled maintenance must be announced 72 hours in advance
* Emergency maintenance must be communicated immediately

### 3.2. Weather Policy
* Provider must implement automated weather monitoring
* Equipment must automatically park in unsafe conditions
* Renters must be notified of weather-related closures

## 4. FINANCIAL TERMS
### 4.1. Revenue Share
* Platform fee: 15% of gross rental revenue
* Payment processing fee: 2.9% + $0.30 per transaction
* Payments processed within 14 business days

### 4.2. Pricing Structure
* Provider may set hourly, nightly, or project-based rates
* Minimum booking duration: 1 hour
* Maximum advance booking: 90 days

## 5. LIABILITY AND INSURANCE
### 5.1. Required Coverage
* Minimum $100,000 equipment insurance
* General liability insurance: $1,000,000
* Proof of insurance must be provided annually

### 5.2. Damage Resolution
* Provider must document equipment condition regularly
* Damage claims must be submitted within 24 hours
* Platform arbitrates all damage disputes

## 6. DATA AND PRIVACY
### 6.1. Data Collection
* Usage metrics will be collected and analyzed
* Weather data will be stored and shared
* Equipment performance data will be monitored

### 6.2. Image Rights
* Renters retain full rights to captured images
* Provider may not use renter's images without permission
* Platform may use images for promotional purposes with credit

## 7. TERMINATION
### 7.1. Provider may terminate this agreement with 30 days notice
### 7.2. Platform may terminate immediately for:
* Repeated service failures
* Policy violations
* Equipment safety concerns
### 7.3. Existing bookings must be honored during termination period

## 8. DISPUTE RESOLUTION
### 8.1. All disputes shall first attempt resolution through Platform mediation
### 8.2. Unresolved disputes subject to binding arbitration
### 8.3. Governing law: State of Delaware, United States

## 9. FORCE MAJEURE
### 9.1. Neither party shall be liable for failures due to:
* Natural disasters
* Power grid failures
* Internet infrastructure issues
* Government actions
* Other circumstances beyond reasonable control

## 10. AMENDMENTS
### 10.1. Platform may modify terms with 30 days notice
### 10.2. Provider may reject modifications by terminating service
### 10.3. Continued service provision constitutes acceptance

By clicking "Confirm," Provider acknowledges reading, understanding, and agreeing to all terms and conditions outlined in this Agreement. This Agreement is legally binding and may be updated periodically with notice.`}
					</Markdown>

                    <Box display="flex" justifyContent="flex-end" gap={2}>
                        <Button onClick={() => setOpenRentableDialog(false)}>Decline</Button>
                        <Button onClick={handleConfirmRentable} variant="contained" color="primary">
                            Confirm
                        </Button>
                    </Box>
				</DialogContent>
			</Dialog>

			{/* Delete Confirmation using AlertDialog */}
			<AlertDialog
				show={showDeleteDialog}
				close={() => setShowDeleteDialog(false)}
				handleDelete={handleDeleteObservatory}
				title="Delete Observatory"
				description="Are you sure you want to delete this observatory? This action cannot be undone."
				type="warning"
			/>
		</Box>
	);
};

export default ObservatorySettingGeneral;
