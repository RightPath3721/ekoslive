import React, { useState, useEffect, memo } from "react";
import { captureException } from "@sentry/browser";
import axios from "axios";
import { toast } from "react-toastify";
import Dialog from "@mui/material/Dialog";
import Box from "@mui/material/Box";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import s from "@common/shared/i18n/i18n";
import CloseButton from "@components/CloseButton";
import { Palette } from "@common/shared/common/styles";
import { ekosliveServer } from "@client/config";
import FormLabelTextField from "@components/FormLabelTextField";
import MultiSelect from "@components/MultiSelect";
import useActiveUser from "@hooks/useActiveUser";
import FormDropzone from "@components/FormDropzone";
import Moderation from '@components/Moderation';
import { SubmissionStatus } from "@utils/status";
import { Can } from "@components/providers/AclProvider";

const ManufacturerModal = ({
	open,
	handleClose,
	editData = null,
	equipmentType = null,
	setManufacturer = null,
	setManufacturers = null,
	reportData,
	handleOpenDeleteModal,
	handleOpenBanModal
}) =>
{
	const user = useActiveUser();
	const [dialogValue, setDialogValue] = useState({
		name: "",
		url: "",
		logo: "",
	});

	const [submissionStatus, setSubmissionStatus] = useState(SubmissionStatus[1]);
	const [tags, setTags] = useState([]);
	const [note, setNote] = useState("");
	const [selectedEquipmentTypes, setSelectedEquipmentTypes] = useState([]);
	const [equipmentTypes, setEquipmentTypes] = useState([]);
	const [image, setImage] = useState();

	const handleChange = (event) =>
	{
		const {
			target: { value },
		} = event;
		setSelectedEquipmentTypes(
			// On autofill we get a stringified value.
			typeof value === "string" ? value.split(",") : value,
		);
	};

	useEffect(() =>
	{
		setDialogValue({
			name: editData ? editData.name : "",
			logo: "",
			url: editData ? editData.url : "",
		});
		if(editData && editData.moderation_report) {
			setSubmissionStatus(editData?.moderation_report.status);
			setTags(editData?.moderation_report.tags);
			setNote(editData?.moderation_report.note);
		}
	}, [editData]);

	/**
	 * Handles the form submission to create a new manufacturer.
	 *
	 * @param {object} event - The event object triggering the form submission.
	 * @returns {Promise<void>}} A Promise that resolves when the submission is complete.
	 * @async
	 */
	const handleSubmit = async (event) =>
	{
		event.preventDefault();

		if (!user) return;

		try
		{
			const manufacturerData = new FormData();
			manufacturerData.append("name", dialogValue.name);
			manufacturerData.append("submissionStatus", submissionStatus);
			manufacturerData.append("tags", tags);
			manufacturerData.append("note", note);
			if (image)
			{
				manufacturerData.append("logo", image);
			}
			if (dialogValue.url)
			{
				manufacturerData.append("url", dialogValue.url);
			}
			if (selectedEquipmentTypes && Array.isArray(selectedEquipmentTypes)) {
				selectedEquipmentTypes.forEach((item) =>
				{
					manufacturerData.append("equipment_types[]", item._id);
				});
			}
			if (editData?._id)
			{
				const result = await ekosliveServer.patch(
					`/api/equipments/manufacturers/${editData._id}?username=${encodeURIComponent(user.username)}&token=${user.token}`,
					manufacturerData,
				);
				if (setManufacturer)
				{
					setManufacturer(result.data.manufacturer);
				}
				else if (setManufacturers)
				{
					const updateManufacturer = (
						prevManufacturers,
						updatedManufacturer,
					) =>
					{
						return prevManufacturers.map((manufacturer) =>
							manufacturer._id === updatedManufacturer._id
								? updatedManufacturer
								: manufacturer,
						);
					};
					setManufacturers((prevManufacturers) =>
						updateManufacturer(prevManufacturers, result.data.manufacturer),
					);
				}
			}
			else
			{
				const result = await ekosliveServer.post(
					`/api/equipments/manufacturers?username=${encodeURIComponent(user.username)}&token=${user.token}`,
					manufacturerData,
				);
				if (!result.data?.hasOwnProperty("message"))
				{
					setManufacturers((prevManufacturers) => [
						result.data.manufacturer,
						...prevManufacturers,
					]);
				}
			}
			handleClose();
		}
		catch (error)
		{
			if (typeof error?.response?.data?.error === "string")
			{
				toast.error(error.response.data.error);
			}
			captureException(error, {
				addAttachment: event.currentTarget,
			});
		}
	};

	useEffect(() =>
	{
		if (equipmentType || editData)
		{
			(async () =>
			{
				try
				{
					const { data } = await axios.get("/api/equipments/equipment-types");
					setEquipmentTypes(data.equipmentTypes);
					if (editData)
					{
						const selectedEquipmentTypes = data.equipmentTypes.filter((item) =>
							editData.equipment_types.includes(item._id),
						);
						setSelectedEquipmentTypes(
							selectedEquipmentTypes.length > 0 ? selectedEquipmentTypes : [],
						);
					}
					else
					{
						const selectedEquipmentType = data.equipmentTypes.find(
							(item) => item._id == equipmentType,
						);
						setSelectedEquipmentTypes(
							selectedEquipmentType ? [selectedEquipmentType] : [],
						);
					}
				}
				catch (error)
				{
					captureException(error);
				}
			})();
		}
	}, [equipmentType, editData]);

	return (
		<Dialog open={open} onClose={handleClose}>
			<Box sx={{ display: "flex", gap: "10px" }}>
				<form
					onSubmit={handleSubmit}
					style={{
						display: "flex",
						flexDirection: "column",
						gap: "12px",
						backgroundColor: "#111111",
						width: "600px",
						position: "relative",
					}}
					id="manufacturer-form"
				>
					<DialogTitle sx={{ color: "white", textAlign: "center" }}>
						{s.connect.observatory.manufacturer}
					</DialogTitle>
					<DialogContent>
						<MultiSelect
							label={s.general.product_range}
							value={selectedEquipmentTypes}
							options={equipmentTypes}
							handleChange={handleChange}
							renderValue={(selected) =>
								selected.map((value) => value.name).join(", ")
							}
						/>

						<FormLabelTextField
							label={s.general.name}
							width="100%"
							value={dialogValue.name}
							onChange={(event) =>
								setDialogValue({
									...dialogValue,
									name: event.target.value,
								})
							}
							required
						/>

						<Typography sx={{ marginBlock: "12px" }}>
							{s.general.logo}
						</Typography>

						<FormDropzone
							name="preview_img"
							acceptedFiles={{
								"image/jpeg": [".jpg", ".jpeg"],
								"image/png": [".png"],
								"image/webp": [".webp"],
							}}
							setFile={setImage}
							type="logo"
						/>

						<FormLabelTextField
							label="Url"
							width="100%"
							value={dialogValue.url}
							onChange={(event) =>
								setDialogValue({
									...dialogValue,
									url: event.target.value,
								})
							}
						/>
					</DialogContent>
					<DialogActions
						sx={{
							diplay: "flex",
							padding: "0 24px 20px",
							justifyContent: "center",
						}}
					>
						<Box sx={{display: "flex", flexDirection: "column", width: "100%", gap: "10px"}}>
							<Box sx={{display: "flex", flexDirection: "row", width: "100%", gap: "10px"}}>
								<Button
									variant="contained"
									sx={{ backgroundColor: Palette.orange, width: "50%" }}
									form="manufacturer-form"
									type="submit"
								>
									{s.general.save}
								</Button>
								<Button
									variant="outlined"
									sx={{ width: "50%" }}
									onClick={handleClose}
								>
									{s.general.cancel}
								</Button>
							</Box>
							<Can action="update" subject="ModeratingStatus">
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
							</Can>
						</Box>
					</DialogActions>

					<CloseButton right="10px" top="10px" onChange={handleClose} />
				</form>
			</Box>
		</Dialog>
	);
};

export default memo(ManufacturerModal);
