import React, { useCallback, useEffect, useState } from "react";
import { toast } from "react-toastify";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Switch from "@mui/material/Switch";
import FormControlLabel from "@mui/material/FormControlLabel";
import { Palette } from "@common/shared/common/styles";
import FormTextField from "@components/FormTextField";
import { useActiveObservatory } from "./ObservatoryContext";
import useObservatoryAPI from "@hooks/useObservatoryAPI";
import FormDropzone from "@components/FormDropzone";
import AlertDialog from "@components/AlertDialog";
import s from "@common/shared/i18n/i18n";
import Map from "@components/Map";

const ObservatoryForm = ({ close, setObservatories }) =>
{
	const { observatoryId } = useActiveObservatory();
	const { observatory, postObservatoryData, deleteObservatory } =
		useObservatoryAPI(observatoryId);
	const [formData, setFormData] = useState({
		name: "",
		visibility: false,
		bortle_scale: 1,
		notes: "",
		location: null,
	});
	const [observatoryImage, setObservatoryImage] = useState();
	const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
	const [isMapOpen, setIsMapOpen] = useState(false);

	useEffect(() =>
	{
		if (!observatory) return;
		setFormData(observatory);
	}, [observatory]);

	const handleSubmit = async (e) =>
	{
		e.preventDefault();

		try
		{
			const formData = new FormData(e.currentTarget);
			const observatoryData = new FormData();
			if (observatoryImage?.size > 0)
				observatoryData.append("preview", observatoryImage);
			if (observatoryImage?.size > 2097152)
			{
				toast.error(s.general.file_too_large);
				return;
			}
			observatoryData.append("name", formData.get("name"));
			observatoryData.append("visibility", !!formData.get("visibility"));
			observatoryData.append("bortle_scale", formData.get("bortle_scale"));
			observatoryData.append("notes", formData.get("notes"));

			const updatedObservatory = await postObservatoryData(
				observatoryData,
				observatoryId ? "patch" : "post",
			);
			if (typeof updatedObservatory === "string")
			{
				toast.error(updatedObservatory);
				return;
			}
			observatoryId
				? setObservatories((prevObservatories) =>
						prevObservatories.map((observatory) => ({
							...observatory,
							...(observatory._id === updatedObservatory._id
								? updatedObservatory
								: {}),
						})),
					)
				: setObservatories((prevObservatories) => [
						...prevObservatories,
						updatedObservatory,
					]);
			close();
		}
		catch (error)
		{
			console.error(error);
		}
	};

	const handleChange = (e) =>
	{
		const { name, value } = e.target;
		setFormData((prevData) => ({ ...prevData, [name]: value }));
	};

	const handleDelete = useCallback(async () =>
	{
		const res = await deleteObservatory(observatory._id);
		if (res) return toast.error(res);
		setObservatories((observatories) =>
			observatories.filter((item) => item._id !== observatory._id),
		);
		toast.success(s.connect.observatory_delete_submit);
		close();
	}, [setObservatories, deleteObservatory, toast, observatory]);

	const updateBortleScale = useCallback(
		(borteScale) =>
		{
			setFormData((prevData) => ({ ...prevData, bortle_scale: borteScale }));
		},
		[setFormData],
	);

	return (
		<Box
			sx={[
				{
					display: "flex",
					flexDirection: "column",
					gap: "14px",
					padding: "24px 12px",
					backgroundColor: "#111111",
					width: "400px",
				},
			]}
			onSubmit={handleSubmit}
			component="form"
		>
			<FormTextField
				value={formData.name}
				onChange={handleChange}
				id="name"
				label={s.connect.observatory.observatory_name}
				name="name"
				required
			/>

			<FormTextField
				value={formData.bortle_scale}
				onChange={handleChange}
				id="bortle_scale"
				label={s.connect.observatory.bortle_scale}
				name="bortle_scale"
				type="number"
				inputProps={{ max: 9, min: 1, step: 0.1 }}
				required
			/>

			<FormDropzone
				name="preview_img"
				acceptedFiles={{
					"image/jpeg": [".jpg", ".jpeg"],
					"image/png": [".png"],
					"image/webp": [".webp"],
				}}
				multiImage={true}
				setFile={setObservatoryImage}
			/>

			<FormTextField
				id="notes"
				label={s.tooltip.placeholder_notes}
				name="notes"
				value={formData.notes}
				onChange={handleChange}
			/>

			<FormControlLabel
				control={
					<Switch
						value={formData.visibility}
						onChange={(e) =>
							setFormData((prevData) => ({
								...prevData,
								visibility: e.target.checked,
							}))
						}
						aria-label="observatory visibility switch"
						color="warning"
						name="visibility"
						id="visibility"
						sx={{ ".MuiSwitch-track": { backgroundColor: "orange" } }}
					/>
				}
				label={formData.visibility ? s.general.public : s.general.private}
				sx={{ color: "white" }}
			/>

			<Button onClick={() => setIsMapOpen(true)}>Select Location</Button>

			<Box
				sx={{
					display: "flex",
					justifyContent: "space-between",
					alignItems: "center",
					gap: "20px",
				}}
			>
				<Button
					type="submit"
					fullWidth
					variant="contained"
					sx={{ backgroundColor: Palette.orange }}
				>
					{s.general.confirm}
				</Button>
				{observatoryId && (
					<Button
						type="button"
						fullWidth
						variant="contained"
						sx={{ backgroundColor: Palette.red }}
						onClick={() => setIsDeleteDialogOpen(true)}
					>
						{s.general.delete}
					</Button>
				)}
			</Box>

			<AlertDialog
				close={() => setIsDeleteDialogOpen(false)}
				show={isDeleteDialogOpen}
				handleDelete={handleDelete}
				description={s.connect.observatory.observatory_delete_submit}
				title={s.connect.observatory.observatory_delete_title}
			/>

			<Map
				confirmPosition={(location) =>
				{
					setFormData((prevData) => ({ ...prevData, location }));
					setIsMapOpen(false);
				}}
				open={isMapOpen}
				defaultPosition={formData.location}
				setBortleScale={updateBortleScale}
			/>
		</Box>
	);
};

export default ObservatoryForm;
