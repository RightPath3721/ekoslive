import { Box, Checkbox, Typography } from "@mui/material";
import { get, isEqual } from "lodash";
import React, { memo, useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { schedulerActions } from "@redux/actions";
import { selectProfiles, selectSchedulerSettings } from "@redux/selectors";
import { styles } from "../../shared/styles";
import Dropdown from "../../Components/Dropdown";
import NumericControl from "../../Components/NumericControl";
import s from "@common/shared/i18n/i18n";
import Scheduler from "./Scheduler";

const Settings = {
	fitsEdit: "fitsEdit",
	schedulerTrackStep: "schedulerTrackStep",
	schedulerFocusStep: "schedulerFocusStep",
	schedulerAlignStep: "schedulerAlignStep",
	schedulerGuideStep: "schedulerGuideStep",
	schedulerProfileCombo: "schedulerProfileCombo",
	positionAngleSpin: "positionAngleSpin",
};

const SchedulerText = ({ title }) =>
{
	return (
		<Typography sx={{ color: "white", width: "max-content" }}>
			{title}
		</Typography>
	);
};

const SchedulerCheckbox = ({ checked, onChange, title }) =>
{
	return (
		<Box sx={[styles.row, { gap: "10px" }]}>
			<Checkbox
				style={{ color: "white", padding: 0 }}
				checked={checked}
				onChange={onChange}
			/>
			<SchedulerText title={title} />
		</Box>
	);
};

const GeneralSettings = ({ jobIndex }) =>
{
	const dispatch = useDispatch();
	/**
	 * Use Selectors.
	 */
	const profiles = useSelector(selectProfiles);
	const schedulerSettings = useSelector(selectSchedulerSettings, isEqual);

	const [state, setState] = useState({
		schedulerTrackStep: true,
		schedulerFocusStep: true,
		schedulerAlignStep: true,
		schedulerGuideStep: true,
		schedulerProfileCombo: "",
		positionAngleSpin: -181,
	});

	const {
		schedulerProfileCombo,
		schedulerTrackStep,
		schedulerFocusStep,
		schedulerAlignStep,
		schedulerGuideStep,
		positionAngleSpin,
	} = state;

	// Whenever the settings change, get the settings from ekos
	useEffect(() =>
	{
		dispatch(schedulerActions.getAllSettings());
	}, [
		schedulerProfileCombo,
		schedulerGuideStep,
		schedulerFocusStep,
		schedulerTrackStep,
		schedulerAlignStep,
		positionAngleSpin,
	]);

	useEffect(() =>
	{
		setState({
			...state,
			schedulerTrackStep: get(
				schedulerSettings,
				Settings.schedulerTrackStep,
				false,
			),
			schedulerFocusStep: get(
				schedulerSettings,
				Settings.schedulerFocusStep,
				false,
			),
			schedulerAlignStep: get(
				schedulerSettings,
				Settings.schedulerAlignStep,
				false,
			),
			schedulerGuideStep: get(
				schedulerSettings,
				Settings.schedulerGuideStep,
				false,
			),
			schedulerProfileCombo: get(
				schedulerSettings,
				Settings.schedulerProfileCombo,
				"",
			),
			positionAngleSpin: get(
				schedulerSettings,
				Settings.positionAngleSpin,
				-181,
			),
		});
	}, [schedulerSettings]);

	const setSettings = (key, value) =>
		dispatch(schedulerActions.setAllSettings({ [key]: value }));

	return (
		<>
			{jobIndex !== -1 && <Scheduler jobEdit={true} />}

			<Box sx={[LOCAL_STYLES.gridItem]}>
				<SchedulerText title={s.general.profile} />
				<Dropdown
					data={[{ name: "Default" }].concat(profiles).map((item) => ({
						label: item.name,
						value: item.name,
					}))}
					onChange={(e) =>
					{
						setState({
							...state,
							profile: e.label,
						});
						setSettings(Settings.schedulerProfileCombo, e.label);
					}}
					value={schedulerProfileCombo}
				/>
			</Box>
			{/* <Box sx={styles.row}>

			</Box> */}

			<Box
				sx={[
					LOCAL_STYLES.gridItem,
					{ gridTemplateColumns: "100px repeat(4, 80px)" },
				]}
			>
				<SchedulerText title={s.ekos.collapse_focus.steps} />
				<SchedulerCheckbox
					title={s.general.track}
					checked={schedulerTrackStep}
					onChange={(event) =>
					{
						setState({
							...state,
							schedulerTrackStep: event.target.checked,
						});
						setSettings(Settings.schedulerTrackStep, event.target.checked);
					}}
				/>

				<SchedulerCheckbox
					title={s.ekos.collapse_focus.heading}
					checked={schedulerFocusStep}
					onChange={(event) =>
					{
						setState({
							...state,
							schedulerFocusStep: !state.schedulerFocusStep,
						});
						setSettings(Settings.schedulerFocusStep, event.target.checked);
					}}
				/>
				<SchedulerCheckbox
					title={s.ekos.collapse_align.heading}
					checked={schedulerAlignStep}
					onChange={(event) =>
					{
						setState({
							...state,
							schedulerAlignStep: !state.schedulerAlignStep,
						});
						setSettings(Settings.schedulerAlignStep, event.target.checked);
					}}
				/>
				<SchedulerCheckbox
					title={s.connect.guide}
					checked={schedulerGuideStep}
					onChange={(event) =>
					{
						setState({
							...state,
							schedulerGuideStep: !state.schedulerGuideStep,
						});
						setSettings(Settings.schedulerGuideStep, event.target.checked);
					}}
				/>
			</Box>

			<Box sx={[LOCAL_STYLES.gridItem]}>
				<SchedulerText title={s.general.position_angle} />
				<NumericControl
					value={positionAngleSpin}
					initialValue={positionAngleSpin < -180 ? 0 : positionAngleSpin}
					customLimit={[-180, 180]}
					steps={[5, 5]}
					onChange={(value) =>
					{
						setState({
							...state,
							positionAngleSpin: value,
						});
						setSettings(Settings.positionAngleSpin, value);
					}}
				/>
			</Box>
		</>
	);
};

const LOCAL_STYLES = {
	gridItem: {
		width: "100%",
		display: "grid",
		gridTemplateColumns: "100px 143px",
		alignItems: "center",
		gap: "10px",
	},
};

export default memo(GeneralSettings);
