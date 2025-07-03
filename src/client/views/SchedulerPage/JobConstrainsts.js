import { Checkbox, Typography } from "@mui/material";
import { Box } from "@mui/system";
import { get } from "lodash";
import React, { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { schedulerActions } from "@redux/actions";
import { selectSchedulerSettings } from "@redux/selectors";
import { styles } from "../../shared/styles";
import NumericControl from "../../Components/NumericControl";
import s from "@common/shared/i18n/i18n";

const Settings = {
	schedulerAltitude: "schedulerAltitude",
	schedulerAltitudeValue: "schedulerAltitudeValue",
	schedulerMoonSeparation: "schedulerMoonSeparation",
	schedulerMoonSeparationValue: "schedulerMoonSeparationValue",
	schedulerMoonAltitude: "schedulerMoonAltitude",
	schedulerMoonAltitudeMaxValue: "schedulerMoonAltitudeMaxValue",
	schedulerWeather: "schedulerWeather",
	schedulerTwilight: "schedulerTwilight",
	schedulerHorizon: "schedulerHorizon",
};

const SchedulerCheckbox = ({ checked, onChange, title }) =>
{
	return (
		<Box
			sx={[
				styles.row,
				{
					alignItems: "center",
					gap: "10px",
					justifyContent: "flex-start",
					width: "100%",
				},
			]}
		>
			<Checkbox
				style={{ color: "white", padding: 0 }}
				checked={checked}
				onChange={onChange}
			/>
			<Typography sx={[styles.text, { width: "max-content" }]}>
				{title}
			</Typography>
		</Box>
	);
};

const JobContraints = () =>
{
	const dispatch = useDispatch();
	const schedulerSettings = useSelector(selectSchedulerSettings);

	const [constraints, setConstraints] = useState({
		alt: get(schedulerSettings, Settings.schedulerAltitude, false),
		altValue: get(schedulerSettings, Settings.schedulerAltitudeValue, 0),
		moon: get(schedulerSettings, Settings.schedulerMoonSeparation, false),
		moonValue: get(schedulerSettings, Settings.schedulerMoonSeparationValue, 0),
		weather: get(schedulerSettings, Settings.schedulerWeather, false),
		twilight: get(schedulerSettings, Settings.schedulerTwilight, false),
		time: "",
		artifHorizon: get(schedulerSettings, Settings.schedulerHorizon, false),
		moonMax: get(schedulerSettings, Settings.schedulerMoonAltitude, false),
		moonMaxValue: get(
			schedulerSettings,
			Settings.schedulerMoonAltitudeMaxValue,
			0,
		),
	});
	const {
		alt,
		altValue,
		moon,
		moonValue,
		weather,
		twilight,
		artifHorizon,
		moonMax,
		moonMaxValue,
	} = constraints;

	const setSettings = (key, value) =>
	{
		dispatch(schedulerActions.setAllSettings({ [key]: value }));
	};

	return (
		<>
			<Box sx={[LOCAL_STYLES.gridNumeric]}>
				<SchedulerCheckbox
					title={s.ekos.scheduler.alt}
					checked={alt}
					onChange={(event) =>
					{
						setConstraints({
							...constraints,
							alt: !alt,
						});
						setSettings(Settings.schedulerAltitude, event.target.checked);
					}}
				/>
				<NumericControl
					initialValue={altValue}
					customLimit={[-15, 89.9]}
					steps={[1, 1]}
					onChange={(value) =>
					{
						setConstraints({
							...constraints,
							altValue: value,
						});
						setSettings(Settings.schedulerAltitudeValue, value);
					}}
				/>
			</Box>

			<Box sx={[LOCAL_STYLES.gridNumeric]}>
				<SchedulerCheckbox
					title={s.ekos.scheduler.moon}
					checked={moon}
					onChange={(event) =>
					{
						setConstraints({
							...constraints,
							moon: !moon,
						});
						setSettings(Settings.schedulerMoonSeparation, event.target.checked);
					}}
				/>
				<NumericControl
					initialValue={moonValue}
					customLimit={[0, 180]}
					steps={[10, 10]}
					onChange={(value) =>
					{
						setConstraints({
							...constraints,
							moonValue: value,
						});
						setSettings(Settings.schedulerMoonSeparationValue, value);
					}}
				/>
			</Box>

			<Box sx={[LOCAL_STYLES.gridNumeric]}>
				<SchedulerCheckbox
					title={s.ekos.scheduler.moon_max}
					checked={moonMax}
					onChange={(event) =>
					{
						setConstraints({
							...constraints,
							moonMax: !moonMax,
						});
						setSettings(Settings.schedulerMoonAltitude, event.target.checked);
					}}
				/>
				<NumericControl
					initialValue={moonMaxValue}
					customLimit={[0, 180]}
					steps={[10, 10]}
					onChange={(value) =>
					{
						setConstraints({
							...constraints,
							moonMaxValue: value,
						});
						setSettings(Settings.schedulerMoonAltitudeMaxValue, value);
					}}
				/>
			</Box>

			<SchedulerCheckbox
				title={s.connect.add_profile.weather}
				checked={weather}
				onChange={(event) =>
				{
					setConstraints({
						...constraints,
						weather: !weather,
					});
					setSettings(Settings.schedulerWeather, event.target.checked);
				}}
			/>

			<SchedulerCheckbox
				title={s.ekos.scheduler.twilight}
				checked={twilight}
				onChange={(event) =>
				{
					setConstraints({
						...constraints,
						twilight: !constraints.twilight,
					});
					setSettings(Settings.schedulerTwilight, event.target.checked);
				}}
			/>

			<SchedulerCheckbox
				title={s.ekos.scheduler.artifHorizon}
				checked={artifHorizon}
				onChange={(event) =>
				{
					setConstraints({
						...constraints,
						artifHorizon: !constraints.artifHorizon,
					});
					setSettings(Settings.schedulerHorizon, event.target.checked);
				}}
			/>
		</>
	);
};

const LOCAL_STYLES = {
	gridNumeric: {
		display: "grid",
		gridTemplateColumns: "110px 143px",
		alignItems: "center",
		gap: "10px",
	},
};

export default JobContraints;
