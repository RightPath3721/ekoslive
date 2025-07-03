import React, { useCallback, useEffect, useState } from "react";
import axios from "axios";
import { captureException } from "@sentry/browser";
import { Button, useTheme } from "@mui/material";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import s from "@common/shared/i18n/i18n";
import TabLoader from "@components/TabLoader";
import useActiveUser from "@hooks/useActiveUser";
import Map from "@components/Map";
import { convertCoordToDms } from "@utils/convertCoordToDms";
import FormLabelTextField from "@components/FormLabelTextField";
import FormMultiDropzone from "@components/FormMultiDropzone";

const ObservatoryEditForm = ({
	observatory,
	toggleEdit,
	updatedLocation,
	setUpdatedLocation,
	setObservatoryImg,
	observatoryImg,
}) =>
{
	const user = useActiveUser();
	const { palette } = useTheme();
	const [location, setLocation] = useState(null);
	const [isLocationPickerOpen, setIsLocationPickerOpen] = useState(false);

	useEffect(() =>
	{
		if (!user) return;

		(async () =>
		{
			try
			{
				const { data } = await axios.get(`/api/observatories/locations`, {
					params: {
						observatories: [observatory?._id],
						username: user.username,
						token: user.token,
					},
				});
				if (data[0]?.location)
				{
					setLocation(data[0]?.location);
				}
			}
			catch (error)
			{
				captureException(error);
			}
		})();
	}, [observatory, user]);

	const toggleLocationPicker = useCallback(
		() => setIsLocationPickerOpen((p) => !p),
		[setIsLocationPickerOpen],
	);

	const submitLocation = useCallback(
		(position) =>
		{
			setUpdatedLocation(position);
			toggleLocationPicker();
		},
		[setUpdatedLocation, toggleLocationPicker],
	);

	if (!observatory) return <TabLoader />;

	return (
		<>
			<Box>
				<FormMultiDropzone
					file={observatoryImg}
					imagePickerType="observatory_preview"
					setFile={setObservatoryImg}
					label="Add Images"
				/>

				<FormLabelTextField
					label={s.general.owner}
					width="100%"
					defaultValue={observatory?.owner || ""}
					name="owner"
				/>
				{location?.country && (
					<Typography
						sx={{
							display: "flex",
							justifyContent: "space-between",
							alignItems: "center",
						}}
					>
						<Typography variant="subtitle1" component="span" fontSize="1rem">
							{s.general.country}
						</Typography>
						<Typography
							variant="subtitle1"
							component="span"
							fontSize="1rem"
							sx={{ color: palette.grey.main }}
						>
							{updatedLocation?.country ?? location.country}
						</Typography>
					</Typography>
				)}
				{(location?.region || updatedLocation?.region) && (
					<Typography
						sx={{
							display: "flex",
							justifyContent: "space-between",
							alignItems: "center",
						}}
					>
						<Typography variant="subtitle1" component="span" fontSize="1rem">
							{s.general.region}
						</Typography>
						<Typography
							variant="subtitle1"
							component="span"
							fontSize="1rem"
							sx={{ color: palette.grey.main }}
						>
							{updatedLocation?.region ?? location?.region}
						</Typography>
					</Typography>
				)}
				{(location || updatedLocation) && (
					<>
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
								{convertCoordToDms(updatedLocation?.lat ?? location.lat)}
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
								{convertCoordToDms(updatedLocation?.lat ?? location.lng)}
							</Typography>
						</Typography>
					</>
				)}
				
				<Box
					display="flex"
					alignItems="center"
					justifyContent="space-between"
					mt={2.5}
					gap="1rem"
				>
					<Button
						fullWidth
						type="button"
						onClick={toggleEdit}
						variant="outlined"
					>
						{s.general.cancel}
					</Button>
					<Button fullWidth type="submit" variant="contained">
						{s.general.submit}
					</Button>
				</Box>
			</Box>
			<Map
				confirmPosition={submitLocation}
				open={isLocationPickerOpen}
				initialLocationData={location}
			/>
		</>
	);
};

export default ObservatoryEditForm;
