import React, { useCallback, useState, useEffect } from "react";
import Modal from "@mui/material/Modal";
import Paper from "@mui/material/Paper";
import Button from "@mui/material/Button";
import Switch from "@mui/material/Switch";
import FormControlLabel from "@mui/material/FormControlLabel";
import { toast } from "react-toastify";
import { Palette } from "@common/shared/common/styles";
import FormTextField from "@components/FormTextField";
import useObservatoryAPI from "@hooks/useObservatoryAPI";
import CloseButton from "@components/CloseButton";
import { styles } from "../../../shared/styles";
import Map from "@components/Map";
import FormMultiDropzone from "@components/FormMultiDropzone";
import Moderation from "@components/Moderation";
import { SubmissionStatus } from "@utils/status";
import { Can } from "@components/providers/AclProvider";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import VisibilityIcon from "@mui/icons-material/Visibility";
import IconButton from "@mui/material/IconButton";
import CloseIcon from "@mui/icons-material/Close";

const AddObservatoryForm = ({
	close,
	setObservatories,
	open,
	editData,
	reportData,
	handleOpenDeleteModal,
	handleOpenBanModal,
}) =>
{
	const { postObservatoryData } = useObservatoryAPI(editData?._id);
	const [formData, setFormData] = useState({
		name: editData?.name || "",
		visibility: editData?.visibility || true,
		bortle_scale: editData?.bortle_scale || 1,
		notes: editData?.note || "",
		location: editData?.location || null,
		isPublicLocation: editData?.isPublicLocation ?? true,
		owner: editData?.owner || "",
	});
	const [isMapOpen, setIsMapOpen] = useState(false);
	const [observatoryImg, setObservatoryImg] = useState();
	const [submissionStatus, setSubmissionStatus] = useState(SubmissionStatus[1]);
	const [tags, setTags] = useState([]);
	const [note, setNote] = useState("");

	const handleSubmit = async (e) =>
	{
		e.preventDefault();

		try
		{
			const currentFormData = new FormData(e.currentTarget);
			const observatoryData = new FormData();

			observatoryData.append("name", currentFormData.get("name"));
			observatoryData.append("submissionStatus", submissionStatus);
			observatoryData.append("tags", tags);
			observatoryData.append("note", note);
			observatoryData.append(
				"visibility",
				formData.visibility
			);
			observatoryData.append(
				"bortle_scale",
				formData.bortle_scale || 1, // Use the value from formData state, default to 1 if not set
			);
			observatoryData.append("notes", currentFormData.get("notes"));
			observatoryData.append("owner", currentFormData.get("owner"));
			observatoryData.append("location", JSON.stringify(formData.location));
			observatoryData.append(
				"isPublicLocation",
				(currentFormData.get("isPublicLocation") ?? "on") === "on"
			);
			if (observatoryImg)
			{
				observatoryImg.map((item) =>
				{
					observatoryData.append("images", item);
				});
			}

			const method = editData ? "patch" : "post";

			const updatedObservatory = await postObservatoryData(
				observatoryData,
				method,
			);

			if (typeof updatedObservatory === "string")
			{
				toast.error(updatedObservatory);
				return;
			}
			if (updatedObservatory)
			{
				setObservatories((prevObservatories) =>
					editData
						? prevObservatories.map((obs) =>
								obs.id === updatedObservatory.id ? updatedObservatory : obs,
							)
						: [...prevObservatories, updatedObservatory],
				);
			}
			close();
		}
		catch (error)
		{
			toast.error(error.message);
		}
	};

	const handleChange = (e) =>
	{
		const { name, value } = e.target;
		setFormData((prevData) => ({ ...prevData, [name]: value }));
	};

	const updateBortleScale = useCallback(
		(borteScale) =>
		{
			setFormData((prevData) => ({ ...prevData, bortle_scale: borteScale }));
		},
		[setFormData],
	);

	useEffect(() =>
	{
		if (editData)
		{
			setFormData({
				name: editData.name,
				visibility: editData.visibility,
				bortle_scale: editData.bortle_scale,
				notes: editData.note,
				location: editData.location,
				isPublicLocation: editData.isPublicLocation ?? true,
				owner: editData.owner || "",
			});
			setSubmissionStatus(editData.moderation_report.status);
			setTags(editData.moderation_report.tags);
			setNote(editData.moderation_report.note);
		}
	}, [editData]);

	// Convert decimal degrees to sexagesimal format (degrees:minutes:seconds)
	const decimalToSexagesimal = (decimal, isLatitude) => {
		// Get the absolute value for calculation
		const absDecimal = Math.abs(decimal);
		
		// Calculate degrees, minutes, and seconds
		const degrees = Math.floor(absDecimal);
		const minutesDecimal = (absDecimal - degrees) * 60;
		const minutes = Math.floor(minutesDecimal);
		const secondsDecimal = (minutesDecimal - minutes) * 60;
		const seconds = Math.round(secondsDecimal);
		
		// Handle case where seconds round to 60
		let adjustedMinutes = minutes;
		let adjustedSeconds = seconds;
		if (seconds === 60) {
			adjustedSeconds = 0;
			adjustedMinutes = minutes + 1;
			// Handle case where minutes become 60
			if (adjustedMinutes === 60) {
				adjustedMinutes = 0;
				// degrees would be incremented here, but we'll keep it simple
			}
		}
		
		// Determine the sign/direction
		let prefix = "";
		if (isLatitude) {
			prefix = decimal >= 0 ? "+" : "-"; // + for North, - for South
		} else {
			prefix = decimal >= 0 ? "+" : "-"; // + for East, - for West
		}
		
		// Format as degrees:minutes:seconds with leading zeros
		return `${prefix}${degrees.toString().padStart(2, '0')}°${adjustedMinutes.toString().padStart(2, '0')}′${adjustedSeconds.toString().padStart(2, '0')}″`;
	};
	
	// Format coordinates for display
	const formatCoordinates = (location) => {
		if (!location) return null;
		
		const lat = decimalToSexagesimal(location.lat, true);
		const lng = decimalToSexagesimal(location.lng, false);
		return `${lat} ${lng}`;
	};

	return (
		<Modal open={open} onClose={close}>
			<Paper
				sx={[
					styles.centerAbsolute,
					{
						display: "flex",
						flexDirection: "column",
						backgroundColor: "#111111",
						width: "60vw",
						minHeight: "500px",
						maxHeight: "90vh",
						padding: "24px",
						borderRadius: "8px",
						boxShadow: "0 8px 24px rgba(0, 0, 0, 0.5)",
						overflow: "auto",
						position: "relative"
					},
				]}
				component="form"
				onSubmit={handleSubmit}
			>
				<IconButton 
					onClick={close}
					sx={{ 
						position: "absolute", 
						right: "12px", 
						top: "12px", 
						color: Palette.white 
					}}
				>
					<CloseIcon />
				</IconButton>
				
				<Box sx={{ mb: 3 }}>
					<Typography 
						variant="subtitle1" 
						component="label" 
						sx={{ 
							color: "white", 
							display: "block", 
							mb: 0.5,
							fontWeight: "bold"
						}}
					>
						Observatory Name <Box component="span" sx={{ color: Palette.orange }}>*</Box>
					</Typography>
					<FormTextField
						value={formData.name}
						onChange={handleChange}
						id="name"
						name="name"
						required
						fullWidth
						placeholder="Enter observatory name"
						InputProps={{
							sx: {
								backgroundColor: "rgba(0, 0, 0, 0.3)",
								borderRadius: "4px",
								"& .MuiOutlinedInput-notchedOutline": {
									borderColor: "transparent"
								},
								"&:hover .MuiOutlinedInput-notchedOutline": {
									borderColor: "rgba(255, 255, 255, 0.2)"
								},
								"&.Mui-focused .MuiOutlinedInput-notchedOutline": {
									borderColor: Palette.orange
								}
							}
						}}
						sx={{ mb: 3 }}
					/>
					
					{/* Bortle Scale field is commented out as requested */}
					{/* 
					<Typography 
						variant="subtitle1" 
						component="label" 
						sx={{ 
							color: "white", 
							display: "block", 
							mb: 0.5,
							fontWeight: "bold"
						}}
					>
						Bortle Scale
					</Typography>
					<FormTextField
						value={formData.bortle_scale}
						onChange={handleChange}
						id="bortle_scale"
						name="bortle_scale"
						type="number"
						inputProps={{ max: 20, min: 1, step: 0.1 }}
						fullWidth
						placeholder="Enter bortle scale"
						InputProps={{
							sx: {
							backgroundColor: "rgba(0, 0, 0, 0.3)",
								borderRadius: "4px",
								"& .MuiOutlinedInput-notchedOutline": {
									borderColor: "transparent"
								},
								"&:hover .MuiOutlinedInput-notchedOutline": {
									borderColor: "rgba(255, 255, 255, 0.2)"
								},
								"&.Mui-focused .MuiOutlinedInput-notchedOutline": {
									borderColor: Palette.orange
								}
							}
						}}
						sx={{ mb: 3 }}
					/>
					*/}
					
					<Typography 
						variant="subtitle1" 
						component="label" 
						sx={{ 
							color: "white", 
							display: "block", 
							mb: 0.5,
							fontWeight: "bold"
						}}
					>
						Owner <Box component="span" sx={{ color: Palette.orange }}>*</Box>
					</Typography>
					<FormTextField
						id="owner"
						name="owner"
						value={formData.owner}
						onChange={handleChange}
						fullWidth
						placeholder="Enter owner name"
						InputProps={{
							sx: {
								backgroundColor: "rgba(0, 0, 0, 0.3)",
								borderRadius: "4px",
								"& .MuiOutlinedInput-notchedOutline": {
									borderColor: "transparent"
								},
								"&:hover .MuiOutlinedInput-notchedOutline": {
									borderColor: "rgba(255, 255, 255, 0.2)"
								},
								"&.Mui-focused .MuiOutlinedInput-notchedOutline": {
									borderColor: Palette.orange
								}
							}
						}}
						sx={{ mb: 3 }}
					/>
					
					<Typography 
						variant="subtitle1" 
						component="label" 
						sx={{ 
							color: "white", 
							display: "block", 
							mb: 0.5,
							fontWeight: "bold"
						}}
					>
						Upload Observatory Images
					</Typography>
					<FormMultiDropzone
						file={observatoryImg}
						imagePickerType="observatory_preview"
						setFile={setObservatoryImg}
						label="Click to upload"
						sx={{ 
							mb: 3,
							backgroundColor: "rgba(0, 0, 0, 0.3)",
							borderRadius: "4px",
							border: "1px dashed rgba(255, 255, 255, 0.3)",
							"&:hover": {
								borderColor: "rgba(255, 255, 255, 0.5)"
							}
						}}
					/>
					
					<Typography 
						variant="subtitle1" 
						component="label" 
						sx={{ 
							color: "white", 
							display: "block", 
							mb: 0.5,
							fontWeight: "bold",
							mt: 2
						}}
					>
						Notes
					</Typography>
					<FormTextField
						id="notes"
						name="notes"
						value={formData.notes}
						onChange={handleChange}
						multiline
						rows={3}
						fullWidth
						placeholder="Enter notes"
						InputProps={{
							sx: {
								backgroundColor: "rgba(0, 0, 0, 0.3)",
								borderRadius: "4px",
								"& .MuiOutlinedInput-notchedOutline": {
									borderColor: "transparent"
								},
								"&:hover .MuiOutlinedInput-notchedOutline": {
									borderColor: "rgba(255, 255, 255, 0.2)"
								},
								"&.Mui-focused .MuiOutlinedInput-notchedOutline": {
									borderColor: Palette.orange
								}
							}
						}}
						sx={{ mb: 3 }}
					/>
					
					<Box sx={{ mb: 3, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
						<Typography 
							variant="subtitle1" 
							component="span" 
							sx={{ 
								color: "white",
								fontWeight: "bold",
								display: "flex",
								alignItems: "center"
							}}
						>
							Public Directory
							<Typography 
								variant="caption" 
								component="span" 
								sx={{ 
									color: "rgba(255,255,255,0.6)",
									ml: 1
								}}
							>
								(Your observatory will be visible to others)
							</Typography>
						</Typography>
						<Switch
							checked={formData.visibility}
							onChange={(e) =>
								setFormData((prevData) => ({
									...prevData,
									visibility: e.target.checked,
								}))
							}
							color="warning"
							name="visibility"
							id="visibility"
							sx={{ 
								".MuiSwitch-track": { backgroundColor: "rgba(255,255,255,0.2)" },
								".Mui-checked+.MuiSwitch-track": { backgroundColor: Palette.orange + " !important" }
							}}
						/>
					</Box>
					
					<Button 
						onClick={() => setIsMapOpen(true)}
						variant="outlined"
						startIcon={<LocationOnIcon sx={{ color: Palette.orange }} />}
						fullWidth
						sx={{ 
							mb: 2, 
							borderColor: "rgba(255,255,255,0.2)",
							color: "white",
							backgroundColor: "rgba(0, 0, 0, 0.3)",
							textTransform: "none",
							py: 1.5,
							"&:hover": {
								backgroundColor: "rgba(0, 0, 0, 0.5)",
								borderColor: "rgba(255,255,255,0.3)"
							}
						}}
					>
						{formData.location ? "Change Location" : "Select Location"}
					</Button>
					
					{formData.location && (
						<Box 
							sx={{ 
								display: "flex", 
								alignItems: "center", 
								p: 1.5, 
								mb: 2, 
								backgroundColor: "rgba(255, 165, 0, 0.1)",
								borderRadius: "4px",
								border: `1px solid ${Palette.orange}`
							}}
						>
							<LocationOnIcon sx={{ color: Palette.orange, mr: 1 }} />
							<Typography sx={{ color: "white", fontFamily: "monospace" }}>
								{formatCoordinates(formData.location)}
							</Typography>
							<Box 
								sx={{ 
									width: 8, 
									height: 8, 
									borderRadius: "50%", 
									backgroundColor: "#4CAF50", 
									ml: 1 
								}} 
							/>
						</Box>
					)}
				</Box>
				
				<Box sx={{ mt: "auto", display: "flex", justifyContent: "flex-end", gap: 2 }}>
					<Button
						onClick={close}
						variant="outlined"
						sx={{ 
							borderColor: "rgba(255,255,255,0.2)",
							color: "white",
							"&:hover": {
								backgroundColor: "rgba(255,255,255,0.05)",
								borderColor: "rgba(255,255,255,0.3)"
							}
						}}
					>
						Cancel
					</Button>
					
					<Button
						type="submit"
						variant="contained"
						sx={{ 
							backgroundColor: Palette.orange,
							color: "white",
							"&:hover": {
								backgroundColor: "#e69500"
							}
						}}
					>
						Confirm
					</Button>
				</Box>
				
				<Can action="update" subject="ModeratingStatus">
					<Box sx={{ mt: 3 }}>
						<Moderation
							submissionStatus={submissionStatus}
							setSubmissionStatus={setSubmissionStatus}
							tags={tags}
							setTags={setTags}
							note={note}
							setNote={setNote}
							reportData={reportData}
							handleOpenDeleteModal={handleOpenDeleteModal}
							handleOpenBanModal={handleOpenBanModal}
						/>
					</Box>
				</Can>

				<Map
					confirmPosition={(location) =>
					{
						setFormData((prevData) => ({ ...prevData, location }));
						setIsMapOpen(false);
						// Add toast notification for better feedback
						// toast.success("Location selected successfully!");
						
						// Note: Bortle scale is automatically updated via the setBortleScale prop
						// which calls updateBortleScale when the Map component detects the Bortle scale
						// for the selected location
					}}
					setPublicLocation={(isPublicLocation) =>
					{
						setFormData((prevData) => ({ ...prevData, isPublicLocation }));
					}}
					isPublicLocation={formData.isPublicLocation}
					open={isMapOpen}
					defaultPosition={formData.location}
					setBortleScale={updateBortleScale}
				/>
			</Paper>
		</Modal>
	);
};

export default AddObservatoryForm;
