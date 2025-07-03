import React, { useCallback, useEffect, useState } from "react";
import { toast } from "react-toastify";
import { Typography } from "@mui/material";
import Box from "@mui/material/Box";
import FormControlLabel from "@mui/material/FormControlLabel";
import Switch from "@mui/material/Switch";
import FormTextField from "@components/FormTextField";
import FormMultiDropzone from "@components/FormMultiDropzone";
import useObservatoryAPI from "@hooks/useObservatoryAPI";
import Map from "./Map";
import { useSocialWizardContext } from "../SocialWizardContext";
import FormLabelTextField from "@components/FormLabelTextField";
import checkUserTextInput from "@utils/checkUserTextInput";
import { LOCATION_ACCURACY } from "@client/helpers/common";
import s from "@common/shared/i18n/i18n";

const ObservatoryTab = ({ next }) =>
{
	const { profile } = useSocialWizardContext();
	const [formData, setFormData] = useState({
		name: "",
		visibility: false,
		bortle_scale: 1,
		location: null,
		isPublicLocation: true,
		owner: "",
	});
	const [inputErrors, setInputErrors] = useState({ name: "", owner: "" });
	const [additionalLocationInformation, setAdditionalLocationInformation] =
		useState({ accuracy: LOCATION_ACCURACY.FINE });

	const handleChange = (e) =>
	{
		const { name, value } = e.target;
		const validation = checkUserTextInput(value, 4, 25);

		setInputErrors((prevData) => ({
			...prevData,
			[name]: validation.message,
		}));
		setFormData((prevData) => ({ ...prevData, [name]: value }));
	};
	const { postObservatoryData } = useObservatoryAPI();
	const [observatoryImg, setObservatoryImg] = useState();

	const handleSubmit = async (e) =>
	{
		e.preventDefault();

		if (Object.values(inputErrors).filter((error) => error).length !== 0)
			return;

		try
		{
			const currentFormData = new FormData(e.currentTarget);
			const observatoryData = new FormData();

			observatoryData.append("name", currentFormData.get("name")?.trim());
			observatoryData.append(
				"visibility",
				formData.visibility
			);
			observatoryData.append(
				"bortle_scale",
				currentFormData.get("bortle_scale") ?? formData.bortle_scale,
			);
			observatoryData.append("owner", currentFormData.get("owner")?.trim());
			observatoryData.append("location", JSON.stringify(formData.location));
			observatoryData.append("isPublicLocation", true);
			if (observatoryImg)
			{
				observatoryImg.map(item => {
					observatoryData.append("images", item);
				})
			}

			const updatedObservatory = await postObservatoryData(
				observatoryData,
				"post",
			);
			if (typeof updatedObservatory === "string")
			{
				toast.error(updatedObservatory);
				return;
			}
			next();
		}
		catch (error)
		{
			toast.error(error.message);
		}
	};

	const updateBortleScale = useCallback(
		(borteScale) =>
		{
			setFormData((prevData) => ({ ...prevData, bortle_scale: borteScale }));
		},
		[setFormData],
	);

	const updateLocation = useCallback(
		(position) =>
		{
			setFormData((prevData) => ({ ...prevData, location: position }));
		},
		[setFormData],
	);

	useEffect(() =>
	{
		if (!profile) return;

		setFormData((prevData) => ({
			...prevData,
			owner: profile.full_name,
			name: `${profile.full_name.includes(" ") ? profile.full_name?.split(" ")[0] : profile.full_name}'s observatory`,
		}));
	}, [profile]);

	return (
		<Box
			sx={{
				display: "grid",
				gridTemplateColumns: "repeat(2, 1fr)",
				gap: "2rem",
				width: "70%",
			}}
		>
			<Box
				sx={{
					display: "flex",
					flexDirection: "column",
					gap: "1rem",
				}}
				component="form"
				onSubmit={handleSubmit}
				id="observatory-form"
			>
				<FormLabelTextField
					value={formData.name}
					onChange={handleChange}
					id="name"
					error={inputErrors.name}
					label="Observatory Name"
					name="name"
					width="100%"
				/>

				<FormLabelTextField
					value={formData.owner}
					onChange={handleChange}
					id="owner"
					error={inputErrors.owner}
					label="Owner"
					name="owner"
					width="100%"
				/>

				<Box
					sx={{
						display: "grid",
						flexDirection: "column",
						alignItems: "flex-start",
						gridTemplateRows: "auto 1fr",
						gap: ".5rem",
					}}
				>
					<Typography variant="body2">Upload observatory images</Typography>

					<FormMultiDropzone
						file={observatoryImg}
						imagePickerType="observatory_preview"
						setFile={setObservatoryImg}
					/>
				</Box>

				<FormLabelTextField
					value={`${additionalLocationInformation.country ?? "Select"} ${
						additionalLocationInformation.region ?? "Location"
					}`}
					id="location"
					label="Select location from map"
					name="location"
					width="100%"
					readOnly
				/>
				
				<FormControlLabel
					control={
						<Switch
							checked={formData.visibility}
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
					label={s.social.public_directory}
					sx={{ color: "white" }}
				/>

				<FormControlLabel
					control={
						<Switch
							checked={
								LOCATION_ACCURACY.FINE ===
								additionalLocationInformation.accuracy
							}
							onChange={() =>
								setAdditionalLocationInformation((prevData) => ({
									...prevData,
									accuracy:
										LOCATION_ACCURACY.FINE === prevData.accuracy
											? LOCATION_ACCURACY.COARSE
											: LOCATION_ACCURACY.FINE,
								}))
							}
							aria-label="location accuracy"
							color="warning"
							name="accuracy"
							id="accuracy"
							sx={{ ".MuiSwitch-track": { backgroundColor: "orange" } }}
						/>
					}
					label={
						LOCATION_ACCURACY.FINE === additionalLocationInformation.accuracy
							? s.social.fine_location
							: s.social.coarse_location
					}
					sx={{ color: "white" }}
				/>
			</Box>
			<Map
				confirmPosition={updateLocation}
				setBortleScale={updateBortleScale}
				additionalLocationInformation={additionalLocationInformation}
				setAdditionalLocationInformation={setAdditionalLocationInformation}
			/>
		</Box>
	);
};

export default ObservatoryTab;
