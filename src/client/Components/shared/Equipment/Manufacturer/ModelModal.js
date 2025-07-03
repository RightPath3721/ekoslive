import React, { useState, useEffect, memo } from "react";
import { useSelector } from "react-redux";
import { captureException } from "@sentry/browser";
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
import { selectUser } from "@redux/selectors";
import DynamicForm from "./DynamicForm";
import FormDropzone from "@components/FormDropzone";
import FormLabelTextField from "@components/FormLabelTextField";
import SaveIcon from '@mui/icons-material/Save';
import Moderation from '@components/Moderation';
import { SubmissionStatus } from "@utils/status";
import { Can } from "@components/providers/AclProvider";

const createInitialFormValues = (fields) =>
{
	return fields?.reduce((acc, field) =>
	{
		acc[field.key] =
			field.default || field.range?.min || (field.type === "Tags" ? [] : "");
		return acc;
	}, {});
};

const ModelModal = ({
	open,
	handleClose,
	equipmentType = null,
	manufacturer = null,
	editData = null,
	setEquipmentModel = null,
	setEquipmentModels = null,
	fields = null,
	reportData,
	handleOpenDeleteModal,
	handleOpenBanModal
}) =>
{
	const user = useSelector(selectUser);
	const [dialogValue, setDialogValue] = useState({
		label: "",
		url: "",
		logo: "",
	});

	const [dynamicFormValues, setDynamicFormValues] = useState();
	const [image, setImage] = useState();

	const [submissionStatus, setSubmissionStatus] = useState(SubmissionStatus[1]);
	const [tags, setTags] = useState([]);
	const [note, setNote] = useState("");

	useEffect(() =>
	{
		if (fields)
		{
			setDynamicFormValues(createInitialFormValues(fields));
		}
	}, [fields]);

	useEffect(() =>
	{
		if (editData && editData.moderation_report)
		{
			setDialogValue({
				label: editData.label,
				url: editData.url,
				logo: "",
			});
			setSubmissionStatus(editData.moderation_report.status);
			setTags(editData.moderation_report.tags);
			setNote(editData.moderation_report.note);
			setDynamicFormValues(editData.optional_fields);
		}
		else if (fields?.length > 0)
		{
			setDynamicFormValues(createInitialFormValues(fields));
		}
	}, [editData, fields]);

	/**
	 * Handles the form submission to create a new equipment model.
	 * @param {object} event - The event object triggering the form submission.
	 * @returns {Promise<void>} A Promise that resolves when the submission is complete.
	 * @async
	 */
	const handleSubmit = async (event) =>
	{
		event.preventDefault();

		if (!user) return null;

		try
		{
			const modelData = new FormData();
			modelData.append("label", dialogValue.label);
			modelData.append("submissionStatus", submissionStatus);
			modelData.append("tags", tags);
			modelData.append("note", note);
			modelData.append("logo", image);
			modelData.append("url", dialogValue.url);
			modelData.append(
				"equipment_type",
				equipmentType || editData?.equipment_type,
			);
			modelData.append(
				"manufacturer",
				manufacturer ||
					(editData?.manufacturer?._id
						? editData.manufacturer._id
						: editData.manufacturer),
			);
			modelData.append("optional_fields", JSON.stringify(dynamicFormValues));
			if (editData?._id)
			{
				const result = await ekosliveServer.patch(
					`/api/equipments/equipment-models/${editData._id}?username=${encodeURIComponent(user.username)}&token=${user.token}`,
					modelData,
				);
				if (setEquipmentModel)
				{
					setEquipmentModel(result.data.equipmentModel);
				}
				else if (setEquipmentModels)
				{
					const updateEquipmentModel = (
						prevEquipmentModels,
						updatedEquipmentModel,
					) =>
					{
						return prevEquipmentModels.map((equipmentModel) =>
							equipmentModel._id === updatedEquipmentModel._id
								? updatedEquipmentModel
								: equipmentModel,
						);
					};
					setEquipmentModels((prevEquipmentModels) =>
						updateEquipmentModel(
							prevEquipmentModels,
							result.data.equipmentModel,
						),
					);
				}
			}
			else
			{
				const result = await ekosliveServer.post(
					`/api/equipments/equipment-models?username=${encodeURIComponent(user.username)}&token=${user.token}`,
					modelData,
				);
				if (result.data.equipmentModel)
				{
					setEquipmentModels((preModels) => [
						result.data.equipmentModel,
						...preModels,
					]);
				}
			}
			handleClose();
		}
		catch (error)
		{
			if (
				error?.response?.status === 400 &&
				typeof error?.response?.data?.error === "string"
			)
			{
				toast.error(error.response.data.error);
			}
			else
			{
				captureException(error, { addAttachment: dialogValue });
			}
		}
	};

	return (
		<Dialog open={open} onClose={handleClose}>
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
				id="model-form"
			>
				<DialogTitle sx={{ color: "white", textAlign: "center" }}>
					{s.status.model}
				</DialogTitle>
				<DialogContent>
					<FormLabelTextField
						label={s.general.label}
						width="100%"
						value={dialogValue.label}
						onChange={(event) =>
							setDialogValue({
								...dialogValue,
								label: event.target.value,
							})
						}
						required
					/>
					<Typography sx={{ textTransform: "capitalize", mb: ".5rem" }}>
						{s.general.image}
					</Typography>

					<FormDropzone
						name="preview_img"
						acceptedFiles={{
							"image/jpeg": [".jpg", ".jpeg"],
							"image/png": [".png"],
							"image/webp": [".webp"],
						}}
						setFile={setImage}
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

					<DynamicForm
						fields={fields}
						setDynamicFormValues={setDynamicFormValues}
						dynamicFormValues={dynamicFormValues}
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
								startIcon={<SaveIcon />}
								sx={{ backgroundColor: Palette.orange, width: "50%" }}
								form="model-form"
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
		</Dialog>
	);
};

export default memo(ModelModal);
