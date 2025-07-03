import React, { useCallback, useState, useEffect } from "react";
import axios from "axios";
import { captureException } from "@sentry/browser";
import DeleteIcon from "@mui/icons-material/DeleteForever";
import CloseIcon from "@mui/icons-material/Close";
import SyncIcon from "@mui/icons-material/Sync";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import UpdateIcon from "@mui/icons-material/Update";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import IconButton from "@mui/material/IconButton";
import TabsView from "@components/TabsView";
import AddEquipmentProfileForm from "../../Profile/Observatory/AddEquipmentProfileForm";
import PlusIcon from "@client/icons/PlusIcon";
import useActiveUser from "@hooks/useActiveUser";
import { styles } from "@client/shared/styles";
import useModalState from "@hooks/useModalState";
import AlertDialog from "@components/AlertDialog";
import { Palette } from "@common/shared/common/styles";
import SyncProfileDialog from "./SyncProfileDialog";
import { useDispatch, useSelector } from "react-redux";
import { profileActions } from "@redux/actions";
import { selectProfiles } from "@redux/selectors";
import s from "@common/shared/i18n/i18n";
import WarningIcon from '@mui/icons-material/Warning';

const EmptyProfilesMessage = () =>
{
	return (
		<Typography variant="body2">
			{s.connect.observatory.no_profiles_found}
		</Typography>
	);
};

const EquipmentProfileSelector = ({
	equipmentProfiles,
	selectedProfile,
	setSelectedProfile,
	observatoryId,
	setEquipmentProfiles,
	isOwner,
}) =>
{
	const user = useActiveUser();
	const [isAdding, setIsAdding] = useState(false);
	const [showDeleteAlert, toggleDeleteAlert] = useModalState(false);
	const [deletedEquipmentProfileId, setDeletedEquipmentProfileId] = useState(null);
	const [syncDialogOpen, setSyncDialogOpen] = useState(false);
	const [selectedPhysicalProfile, setSelectedPhysicalProfile] = useState(null);
	const dispatch = useDispatch();
	const profiles = useSelector(selectProfiles);
	const [syncStatus, setSyncStatus] = useState({});
	const [profilesEquipment, setProfilesEquipment] = useState({});
	const [loading, setLoading] = useState(false);

	// Fetch equipment for all profiles
	useEffect(() => {
		if (equipmentProfiles?.length > 0 && user) {
			const fetchAllProfilesEquipment = async () => {
				setLoading(true);
				const equipmentData = {};
				
				// Fetch equipment for each profile
				for (const profile of equipmentProfiles) {
					try {
						const response = await axios.get(`/api/equipments?profileId=${profile._id}`, {
							params: {
								username: user.username,
								token: user.token
							}
						});
						
						if (response.data && response.data.equipmentList) {
							equipmentData[profile._id] = response.data.equipmentList;
						}
					} catch (error) {
						captureException(error);
						console.error(`Error fetching equipment for profile ${profile._id}:`, error);
					}
				}
				
				setProfilesEquipment(equipmentData);
				setLoading(false);
			};
			
			fetchAllProfilesEquipment();
		}
	}, [equipmentProfiles, user]);

	// Check sync status for all profiles
	useEffect(() => {
		if (Object.keys(profilesEquipment).length > 0 && profiles?.length > 0) {
			const newSyncStatus = {};
			
			// Check each profile against KStar profiles
			Object.keys(profilesEquipment).forEach(profileId => {
				const equipmentList = profilesEquipment[profileId];
				const physicalProfile = equipmentProfiles.find(p => p._id === profileId);
				
				if (!equipmentList || !physicalProfile) return;
				
				// If the profile is already marked as synced in the database, use that status
				if (physicalProfile.isSynced) {
					newSyncStatus[profileId] = 'synchronized';
					return;
				}
				
				// Group equipment by type
				const equipmentByType = {};
				equipmentList.forEach(equipment => {
					const typeName = equipment.equipment_type?.name || "Unknown";
					if (!equipmentByType[typeName]) {
						equipmentByType[typeName] = [];
					}
					equipmentByType[typeName].push(equipment);
				});
				
				// Find matching profiles
				const { exactMatches, nameOnlyDiffs } = findMatchingProfiles(equipmentByType, physicalProfile);
				
				if (exactMatches.includes(physicalProfile.name)) {
					newSyncStatus[profileId] = 'synchronized';
				} else if (nameOnlyDiffs.length > 0) {
					newSyncStatus[profileId] = 'name-diff';
				} else if (exactMatches.length > 0) {
					newSyncStatus[profileId] = 'equipment-match';
				} else {
					newSyncStatus[profileId] = 'not-synchronized';
				}
			});
			
			setSyncStatus(newSyncStatus);
		}
	}, [profilesEquipment, profiles, equipmentProfiles]);
	
	// Function to find matching profiles based on equipment INDI drivers
	const findMatchingProfiles = (equipmentByType, physicalProfile) => {
		if (!profiles || !equipmentByType) return { matches: [], exactMatches: [], nameOnlyDiffs: [] };
		
		const matches = [];
		const exactMatches = [];
		const nameOnlyDiffs = [];
		
		profiles.forEach(profile => {
			let isMatch = true;
			let allFieldsMatch = true;
			let hasEquipment = false;
			
			// Check each equipment type against profile
			Object.keys(equipmentByType).forEach(typeName => {
				const kstarsField = mapEquipmentTypeToKStarsField(typeName);
				if (!kstarsField || kstarsField === "unknown") return;
				
				hasEquipment = true;
				const equipment = equipmentByType[typeName][0];
				const indiDrivers = Array.isArray(equipment.optional_fields?.indi_driver) 
					? equipment.optional_fields.indi_driver 
					: [equipment.optional_fields?.indi_driver || "Unknown"];
				
				// Check if profile's device is in the indi_driver array
				if (profile[kstarsField] && !indiDrivers.includes(profile[kstarsField])) {
					isMatch = false;
					allFieldsMatch = false;
				}
			});
			
			// Check if all KStars profile fields match the equipment
			if (isMatch && hasEquipment) {
				
				matches.push(profile.name);
				
				// If all fields match exactly, it's an exact match
				if (allFieldsMatch) {
					exactMatches.push(profile.name);
					
					// If only the name is different, add to nameOnlyDiffs
					if (profile.name !== physicalProfile?.name) {
						nameOnlyDiffs.push(profile.name);
					}
				}
			}
		});
		
		return { matches, exactMatches, nameOnlyDiffs };
	};
	
	// Map equipment type to KStars profile field
	const mapEquipmentTypeToKStarsField = (equipmentType) => {
		const typeNameMapping = {
			"Mount": "mount",
			"Telescope / Lense": "telescope",
			"Camera": "ccd",
			"Focuser": "focuser",
			"Filter Wheel": "filter",
			"Dome": "dome",
			"Adaptive Optic": "ao",
			"Weather Station": "weather",
			"Rotator": "aux1",
			"Dust Cap": "aux2",
			"Light Box": "aux3",
			"Auxiliary": "aux4",
			"Guider": "guider"
		};
		
		return typeNameMapping[equipmentType] || "unknown";
	};

	const handleValueChange = useCallback(
		(_, value) =>
		{
			if (value !== null)
			{
				setSelectedProfile(value);
			}
		},
		[setSelectedProfile],
	);

	const addFormSubmit = useCallback(
		async (e) =>
		{
			e.preventDefault();

			if (!user) return;
			
			const formData = new FormData(e.currentTarget);
			try
			{
				const equipmentProfileData = {
					observatory_id: observatoryId,
					profile: { name: formData.get("name") },
				};
				const { data } = await axios.post(
					`/api/equipments?username=${encodeURIComponent(user.username)}&token=${user.token}`,
					equipmentProfileData,
				);
				setEquipmentProfiles((prevProfiles) => [
					data.equipmentProfile,
					...prevProfiles,
				]);
				setIsAdding(false);
			}
			catch (error)
			{
				captureException(error);
			}
		},
		[observatoryId, setEquipmentProfiles, user],
	);

	const handleDeleteProfile = useCallback(async () =>
	{
		if (!user) return;
		try
		{
			await axios.delete(
				`/api/equipments/delete-equipment-profile/${deletedEquipmentProfileId}`,
				{
					params: {
						observatoryId: observatoryId,
						username: user.username,
						token: user.token,
					},
				},
			);
			setEquipmentProfiles((prevProfiles) =>
			{
				const filteredProfiles = prevProfiles.filter(
					(profile) => profile._id !== deletedEquipmentProfileId,
				);
				setSelectedProfile((prevProfile) =>
				{
					if (deletedEquipmentProfileId === prevProfile)
					{
						return filteredProfiles[0]?._id ?? "";
					}

					return prevProfile;
				});

				return filteredProfiles;
			});
			toggleDeleteAlert();
		}
		catch (error)
		{
			captureException(error);
		}
	}, [
		observatoryId,
		setEquipmentProfiles,
		user,
		deletedEquipmentProfileId,
		toggleDeleteAlert,
	]);

	const handleSyncProfile = (profile) => {
		setSelectedPhysicalProfile(profile);
		setSyncDialogOpen(true);
	};
	
	const handleSyncConfirm = async (physicalProfile, kstarsProfile) => {
		try {
			// Update the physical profile with sync status and possibly name
			const updateData = { 
				isSynced: true,
				name: physicalProfile.name
			};
			
			// If the name needs to be updated, include it
			if (physicalProfile.name !== kstarsProfile.name) {
				updateData.name = kstarsProfile.name;
			}
			
			await axios.patch(
				`/api/equipments/equipment-profile/${physicalProfile._id}`,
				{
					observatoryID: observatoryId,
					data: updateData
				},
				{
					params: {
						username: encodeURIComponent(user.username),
						token: user.token
					}
				}
			);
			
			// Update the local state to reflect the change
			setEquipmentProfiles(prevProfiles => 
				prevProfiles.map(p => 
					p._id === physicalProfile._id 
						? { ...p, ...updateData } 
						: p
				)
			);

			dispatch(profileActions.updateProfile(kstarsProfile));
			
			// Update sync status
			setSyncStatus(prev => ({
				...prev,
				[physicalProfile._id]: 'synchronized'
			}));
		} catch (error) {
			captureException(error);
		}
	};
	
	const handleCreateNewKStarsProfile = async (equipmentMapping) => {
		try {
			// Check if a profile with this name already exists
			const existingProfile = profiles.find((item) => item.name === equipmentMapping.name);
			
			// If the profile exists, update it while preserving fields not in the mapping
			if (existingProfile) {
				
				dispatch(profileActions.updateProfile(equipmentMapping));
			} else {
				// If it's a new profile, just add it
				dispatch(profileActions.addProfile(equipmentMapping));
			}
			
			// Update sync status for the profile that was used to create the KStars profile
			if (selectedPhysicalProfile) {
				// Update the physical profile to mark it as synced
				await axios.patch(
					`/api/equipments/equipment-profile/${selectedPhysicalProfile._id}`,
					{
						observatoryID: observatoryId,
						data: { isSynced: true }
					},
					{
						params: {
							username: encodeURIComponent(user.username),
							token: user.token
						}
					}
				);
				
				// Update the local state to reflect the change
				setEquipmentProfiles(prevProfiles => 
					prevProfiles.map(p => 
						p._id === selectedPhysicalProfile._id 
							? { ...p, isSynced: true } 
							: p
					)
				);
				
				setSyncStatus(prev => ({
					...prev,
					[selectedPhysicalProfile._id]: 'synchronized'
				}));
			}
		} catch (error) {
			captureException(error);
		}
	};

	const DeleteIconComponent = (profileId) =>
	{
		return (
			<IconButton
				component="span"
				role="button"
				onClick={(e) =>
				{
					e.stopPropagation();
					setDeletedEquipmentProfileId(profileId);
					toggleDeleteAlert();
				}}
				sx={{
					width: "24px",
					height: "24px",
					marginLeft: "4px",
					borderRadius: ".25rem",
					padding: ".625rem",
				}}
			>
				<DeleteIcon sx={{ color: Palette.white }} fontSize=".75rem" />
			</IconButton>
		);
	};
	
	const SyncIconComponent = (profile) => {
		const status = syncStatus[profile._id];
		
		let icon = <WarningIcon sx={{ color: Palette.white }} fontSize=".75rem" />;
		let tooltip = "Equipment needs to be synced with KStars profile";
		
		return ( !profile.isSynced &&
			<IconButton
				component="span"
				role="button"
				onClick={(e) => {
					e.stopPropagation();
					handleSyncProfile(profile);
				}}
				sx={{
					width: "24px",
					height: "24px",
					marginRight: "4px",
					borderRadius: ".25rem",
					padding: ".625rem"
				}}
				title={tooltip}
			>
				{icon}
			</IconButton>
		);
	};

	return (
		<>
			<Box
				sx={[
					styles.center,
					{
						color: "white",
						justifyContent: "flex-start",
						gap: ".5rem",
						maxWidth: "800px",
					},
				]}
			>
				{isOwner &&
					(isAdding ? (
						<Box sx={{ 
							width: "600px", 
							display: "flex", 
							flexDirection: "row", 
							marginBottom: "1rem",
							position: "relative"
						}}>
							<AddEquipmentProfileForm 
								onSubmit={addFormSubmit} 
								onCancel={() => setIsAdding(false)} 
							/>
						</Box>
					) : (
						<Button
							sx={[styles.center, { gap: ".25rem" }]}
							variant="text"
							onClick={() => setIsAdding(true)}
						>
							<PlusIcon height={16} width={16} />
							<Typography color="inherit" variant="body2" component="span">
								Add Profile
							</Typography>
						</Button>
					))}
				{equipmentProfiles?.length > 0 && !isAdding ? (
					<TabsView
						handleChange={handleValueChange}
						tabValue={selectedProfile}
						tabs={equipmentProfiles?.map((profile) => ({
							label: profile.name,
							value: profile._id,
							actions: isOwner ? (
								<Box sx={{ display: 'flex', alignItems: 'center' }}>
									{SyncIconComponent(profile)}
									{DeleteIconComponent(profile._id)}
								</Box>
							) : null
						}))}
						isScrollable
					/>
				) : (
					isAdding ? null : <EmptyProfilesMessage />
				)}
			</Box>

			<AlertDialog
				handleDelete={handleDeleteProfile}
				show={showDeleteAlert}
				close={toggleDeleteAlert}
				title="Confirmation"
				description="Are you sure you want to delete this profile?"
			/>
			
			<SyncProfileDialog
				open={syncDialogOpen}
				onClose={() => setSyncDialogOpen(false)}
				physicalProfile={selectedPhysicalProfile}
				onSync={handleSyncConfirm}
				onCreateNew={handleCreateNewKStarsProfile}
				observatoryId={observatoryId}
			/>
		</>
	);
};

export default EquipmentProfileSelector;
