import React, { useCallback, useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { wssMessageSocketActions, wssMediaSocketActions } from "@redux/actions";
import axios from "axios";
import { captureException } from "@sentry/browser";
import Box from "@mui/material/Box";
import Switch from "@mui/material/Switch";
import Button from "@mui/material/Button";
import { useTheme } from "@mui/material";
import { useObservatoryPageContext } from "./ObservatoryPageContext";
import Typography from "@mui/material/Typography";
import s from "@common/shared/i18n/i18n";
import EditPencilIcon from "@client/icons/EditPencilIcon";
import { styles } from "@client/shared/styles";
import ObservatoryEditForm from "./ObservatoryEditForm";
import ObservatoryInfo from "./ObservatoryInfo";
import ObservatoryNameInput from "./ObservatoryNameInput";
import useActiveUser from "@hooks/useActiveUser";
import PublicIndicator from "./PublicIndicator";
import ObservatoryPreviewImage from "./ObservatoryPreviewImage";
import AlertDialog from "@components/AlertDialog";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import SettingsIcon from "@client/icons/SettingsIcon";
import FilterSettingsIcon from "@client/icons/FilterSettingsIcon";
import CampaignIcon from "@mui/icons-material/Campaign";
import InfoIcon from "@mui/icons-material/Info";
import IconButton from "@mui/material/IconButton";
import {
	selectConnectedKStarInstances
} from "@redux/selectors";

const ObservatoryPreview = ({
	onBookingToggle,
	showBooking,
	onSettingToggle,
	showSetting,
	onAnnouncementToggle,
	showAnnouncements,
	onGuidelinesToggle
}) =>
{
	const user = useActiveUser();
	const dispatch = useDispatch();
	const { palette } = useTheme();
	const { observatory, observatoryPermissions, setObservatory } = useObservatoryPageContext();
	const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
	const [imageIndexToDelete, setImageIndexToDelete] = useState(null);
	const [currentImageIndex, setCurrentImageIndex] = useState(0);
	const [hasAnnouncements, setHasAnnouncements] = useState(false);

	const connectedKStarsInstances = useSelector(selectConnectedKStarInstances);
	const [linkedInstance, setLinkedInstance] = useState(null);

	useEffect(() => {
		if (observatory?.machine_id) {
			const linkedInstance = connectedKStarsInstances.find(
				(KStars) => KStars.machineID === observatory.machine_id,
			);
			setLinkedInstance(linkedInstance);	
		}
	}, [observatory, connectedKStarsInstances]);

	useEffect(() => {
		if (linkedInstance && user) {
			// First disconnect from current observatory
			dispatch(wssMessageSocketActions.disconnect());
			dispatch(wssMediaSocketActions.disconnect());

			// Connect to the new observatory
			dispatch(
				wssMessageSocketActions.connect(user, null, linkedInstance.machineID),
			);
			dispatch(wssMediaSocketActions.connect(user, null, linkedInstance.machineID));
			localStorage.setItem("currentUser", JSON.stringify(user));
		}
	}, [linkedInstance, user]);

	// Check if the observatory has announcements
	useEffect(() => {
		if (observatory?._id) {
			const checkAnnouncements = async () => {
				try {
					const { data } = await axios.get(`/api/observatories/${observatory._id}/announcements`);
					setHasAnnouncements(data.announcements && data.announcements.length > 0);
				} catch (error) {
					console.error("Error checking announcements:", error);
				}
			};
			
			checkAnnouncements();
		}
	}, [observatory?._id]);

	const handleDeleteImage = useCallback(async () =>
	{
		if (imageIndexToDelete === null || !observatory || !user) return;

		try
		{
			setIsDeleteDialogOpen(false);
			const deletedPhotoIndex = observatory.photos[imageIndexToDelete]
				.split("/")
				.pop()
				.split("?")[0];

			const { data } = await axios.delete(
				`/api/observatories/image/${observatory?._id}/${deletedPhotoIndex}`,
				{
					params: {
						username: user?.username,
						token: user?.token,
					},
				},
			);
			setObservatory(data.observatory);
			setImageIndexToDelete(null);
		}
		catch (error)
		{
			captureException(error);
		}
	}, [observatory, user, imageIndexToDelete, setObservatory]);

	const onDeleteImage = useCallback((index, currentIndex) =>
	{
		setImageIndexToDelete(index);
		setCurrentImageIndex(currentIndex);
		setIsDeleteDialogOpen(true);
	}, []);

	return (
		<Box>
			<Box sx={{ position: "relative" }}>
				{observatoryPermissions?.isOwner ? (
					!showSetting ? (
						<IconButton
							id="search_advanced"
							sx={{
								position: "absolute",
								top: "1rem",	
								left: "1rem",
									zIndex: 1,
								backgroundColor: 'rgba(0,0,0,0.5)',
								"&:hover": {
									backgroundColor: 'rgba(0,0,0,0.7)',
								},
							}}
							onClick={() => onSettingToggle(!showSetting)}
						>
							<FilterSettingsIcon height={24} width={24} color={ palette.white[900] } />
						</IconButton>
					) : (
						<Button
							variant="contained"
							color="primary"
							startIcon={<CalendarTodayIcon />}
							onClick={() => onSettingToggle(!showSetting)}
							sx={{
								position: "absolute",
								top: "1rem",
								left: "1rem",
								zIndex: 1,
								backgroundColor: palette.primary.main,
								"&:hover": {
									backgroundColor: palette.grey.main,
								},
							}}
						>
							{"View Equipment"}
						</Button>
					)	
				) : (
					observatory?.rentable && 
						<Button
							variant="contained"
							color="primary"
							startIcon={<CalendarTodayIcon />}
							onClick={() => onBookingToggle(!showBooking)}
							sx={{
								position: "absolute",
								top: "1rem",
								left: "1rem",
								zIndex: 1,
								backgroundColor: palette.primary.main,
								"&:hover": {
									backgroundColor: palette.grey.main,
								},
							}}
						>
							{showBooking ? "View Equipment" : "Book Me"}
						</Button>
					
				)}
				
				{/* Guidelines Icon - Show for rentable observatories */}
				{(observatory?.rentable && !observatoryPermissions?.isOwner) && (
					<IconButton
						sx={{
							position: "absolute",
							top: "1rem",
							right: hasAnnouncements && !observatoryPermissions?.isOwner ? "4rem" : "1rem",
							zIndex: 1,
							backgroundColor: 'rgba(0,0,0,0.5)',
							"&:hover": {
								backgroundColor: 'rgba(0,0,0,0.7)',
							},
						}}
						onClick={() => onGuidelinesToggle(true)}
						title="View Usage Guidelines"
					>
						<InfoIcon sx={{ color: palette.white[900] }} />
					</IconButton>
				)}
				
				{/* Announcement Icon */}
				{(hasAnnouncements && !observatoryPermissions?.isOwner) && (
					<IconButton
						sx={{
							position: "absolute",
							top: "1rem",
							right: "1rem",
							zIndex: 1,
							backgroundColor: 'rgba(0,0,0,0.5)',
							"&:hover": {
								backgroundColor: 'rgba(0,0,0,0.7)',
							},
						}}
						onClick={() => onAnnouncementToggle(!showAnnouncements)}
						title="View Announcements"
					>
						<CampaignIcon sx={{ color: palette.white[900] }} />
					</IconButton>
				)}

				<ObservatoryPreviewImage
					observatory={observatory}
					onDeleteImage={onDeleteImage}
					canEdit={observatoryPermissions.canEdit}
				/>
			</Box>

			<Box
				sx={{
					display: "flex",
					flexDirection: "column",
					padding: { xxs: ".75rem", sm: "1rem", lg: "1.25rem" },
					backgroundColor: palette.common.black,
					border: `1px solid ${palette.grey.main}0F`,
					borderRadius: "15px",
					gap: "1.25rem",
				}}
				marginTop="1.5rem"
			>
				<Typography variant="h1">{observatory?.name}</Typography>
				<ObservatoryInfo
					observatory={observatory}
					isOwner={observatoryPermissions.isOwner}
				/>
				{observatoryPermissions.canEdit && (
					<Box display="flex" justifyContent="space-between" alignItems="center">
						<PublicIndicator isPublic={observatory?.visibility} />
					</Box>
				)}
			</Box>

			<AlertDialog
				show={isDeleteDialogOpen}
				handleDelete={handleDeleteImage}
				close={() => {
					setIsDeleteDialogOpen(false);
					setImageIndexToDelete(null);
				}}
				title="Delete Image"
				description="Are you sure you want to delete this image?"
			/>
		</Box>
	);
};

export default ObservatoryPreview;
