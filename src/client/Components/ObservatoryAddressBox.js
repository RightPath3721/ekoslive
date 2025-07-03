import React, { useEffect, useState } from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import FormControlLabel from "@mui/material/FormControlLabel";
import Input from "@mui/material/Input";
import Switch from "@mui/material/Switch";
import Button from "@mui/material/Button";
import { LOCATION_ACCURACY } from "@client/helpers/common";
import s from "@common/shared/i18n/i18n";
import { Palette } from "@common/shared/common/styles";
import {
	convertCoordToDms,
	convertDmsToCoords,
} from "@utils/convertCoordToDms";
import useThrottle from "@hooks/useThrottle";

const ObservatoryAddressBox = ({
	locationData,
	setLocationData,
	onSubmit,
	setSelectedPosition,
	isPublicLocation,
	setPublicLocation,
}) =>
{
	const [latitudeDms, setLatitudeDms] = useState("41°24'12.2\"N");
	const [longitudeDms, setLongitudeDms] = useState("2°10'26.5\"E");

	const onCoordsChange = (e) =>
	{
		setSelectedPosition((prevPosition) =>
		{
			const value = e.target.value;
			const key = e.target.name;

			if (!value || !key) return prevPosition;

			const convertedValue = convertDmsToCoords(value);

			return {
				...prevPosition,
				[key]: convertedValue,
			};
		});
	};

	const updateCoordsValues = useThrottle((selectedPosition) =>
	{
		setLatitudeDms(convertCoordToDms(selectedPosition.lat));
		setLongitudeDms(convertCoordToDms(selectedPosition.lng));
	}, 1000);

	useEffect(() =>
	{
		if (!locationData) return;

		updateCoordsValues(locationData);
	}, [locationData]);

	return (
		<Box
			sx={{
				width: "100%",
				display: "grid",
				gridTemplateColumns: "1fr",
				rowGap: ".5rem",
			}}
		>
			<Typography>Confirm your address</Typography>
			{Object.entries(locationData).map(([key, value]) =>
			{
				if (key === "accuracy") return null;

				if (key === "lat" || key === "lng")
				{
					return (
						<Box
							sx={{
								display: "flex",
								justifyContent: "space-between",
								alignItems: "center",
							}}
							key={key}
						>
							<Typography>
								{key === "lat" ? "Latitude" : "Longitude"}
							</Typography>
							<Input
								key={key}
								name={key}
								value={key === "lat" ? latitudeDms : longitudeDms}
								max={key === "lat" ? 90 : 180}
								min={key === "lat" ? -90 : -180}
								onChange={onCoordsChange}
								sx={{ color: Palette.white }}
							/>
						</Box>
					);
				}

				return (
					<Typography
						sx={{
							display: "inline-flex",
							justifyContent: "space-between",
							alignItems: "center",
						}}
						key={key}
					>
						<Typography sx={{ textTransform: "capitalize" }} component="span">
							{key}
						</Typography>
						<Typography
							sx={{
								whiteSpace: "nowrap",
								textOverflow: "ellipsis",
								maxWidth: "70%",
								overflow: "hidden",
							}}
							component="span"
						>
							{value}
						</Typography>
					</Typography>
				);
			})}

			<FormControlLabel
				control={
					<Switch
						value={locationData.accuracy === LOCATION_ACCURACY.FINE}
						onChange={(e) =>
							setLocationData((prevData) => ({
								...prevData,
								accuracy: e.target.checked
									? LOCATION_ACCURACY.FINE
									: LOCATION_ACCURACY.COARSE,
							}))
						}
						aria-label="location accuracy switch"
						color="warning"
						name="accuracy"
						sx={{ ".MuiSwitch-track": { backgroundColor: "orange" } }}
					/>
				}
				label={
					locationData.accuracy === LOCATION_ACCURACY.COARSE ? "Coarse" : "Fine"
				}
				sx={{ color: "white" }}
			/>

			{/* <FormControlLabel
				control={
					<Switch
						checked={isPublicLocation}
						onChange={() => setPublicLocation(!isPublicLocation)}
						aria-label="location visibility switch"
						color="warning"
						name="isPublicLocation"
						id="isPublicLocation"
						sx={{ ".MuiSwitch-track": { backgroundColor: "orange" } }}
					/>
				}
				label={isPublicLocation ? "Public" : "Private"}
				sx={{ color: "white" }}
			/> */}

			<Button variant="contained" onClick={onSubmit}>
				{s.general.submit}
			</Button>
		</Box>
	);
};

export default ObservatoryAddressBox;
