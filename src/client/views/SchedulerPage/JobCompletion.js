import { Box } from "@mui/material";
import { get } from "lodash";
import React, { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { schedulerActions } from "@redux/actions";
import { selectSchedulerSettings } from "@redux/selectors";
import { styles } from "../../shared/styles";
import DatePicker from "../../Components/DateDialog";
import NumericControl from "../../Components/NumericControl";
import RadioButton from "../../Components/RadioButton";
import s from "@common/shared/i18n/i18n";

const Settings = {
	schedulerCompleteSequences: "schedulerCompleteSequences",
	schedulerRepeatSequences: "schedulerRepeatSequences",
	schedulerExecutionSequencesLimit: "schedulerExecutionSequencesLimit",
	schedulerUntilTerminated: "schedulerUntilTerminated",
	schedulerUntil: "schedulerUntil",
	schedulerUntilValue: "schedulerUntilValue",
};

const JobCompletion = () =>
{
	const dispatch = useDispatch();

	const schedulerSettings = useSelector(selectSchedulerSettings);
	const [scheduledStartTime, setScheduledStartTime] = useState(new Date());
	const [state, setState] = useState({
		sequenceCheck: get(
			schedulerSettings,
			Settings.schedulerCompleteSequences,
			false,
		),
		repeatCheck: get(
			schedulerSettings,
			Settings.schedulerRepeatSequences,
			false,
		),
		repeatRuns: get(
			schedulerSettings,
			Settings.schedulerExecutionSequencesLimit,
			0,
		),
		loopCheck: get(schedulerSettings, Settings.schedulerUntilTerminated, false),
		timeCheck: get(schedulerSettings, Settings.schedulerUntil, false),
		timeValue: get(schedulerSettings, Settings.schedulerUntilValue, false),
	});
	const { sequenceCheck, repeatCheck, repeatRuns, loopCheck, timeCheck } =
		state;

	const setSettings = (key, value) =>
	{
		dispatch(schedulerActions.setAllSettings({ [key]: value }));
	};

	return (
		<>
			<RadioButton
				sx={styles.text}
				styles={{ width: "100%", justifyContent: "flex-start" }}
				disabled={sequenceCheck}
				checked={sequenceCheck}
				handleChange={(event) =>
				{
					setSettings(Settings.schedulerCompleteSequences, event.target.value);
					setState({
						...state,
						timeCheck: false,
						loopCheck: false,
						repeatCheck: false,
						sequenceCheck: !sequenceCheck,
					});
				}}
				title={s.ekos.scheduler.sequenceCompletion}
			/>

			<Box sx={[LOCAL_STYLES.gridItem]}>
				<RadioButton
					disabled={repeatCheck}
					checked={repeatCheck}
					handleChange={(event) =>
					{
						setState({
							...state,
							timeCheck: false,
							loopCheck: false,
							repeatCheck: !repeatCheck,
							sequenceCheck: false,
						});
						setSettings(
							Settings.schedulerRepeatSequences,
							event.target.checked,
						);
					}}
					title={s.ekos.scheduler.repeatFor}
				/>
				<NumericControl
					initialValue={repeatRuns}
					customLimit={[1, 1000]}
					steps={[1, 1]}
					onChange={(value) =>
					{
						setSettings(Settings.schedulerExecutionSequencesLimit, value);
						setState({ ...state, repeatRuns: value });
					}}
				/>
			</Box>

			<RadioButton
				disabled={loopCheck}
				checked={loopCheck}
				styles={{ width: "100%", justifyContent: "flex-start" }}
				handleChange={(event) =>
				{
					setState({
						...state,
						timeCheck: false,
						loopCheck: !loopCheck,
						repeatCheck: false,
						sequenceCheck: false,
					});
					setSettings(Settings.schedulerUntilTerminated, event.target.checked);
				}}
				title={s.ekos.scheduler.repeatUntilTerminated}
			/>

			<Box sx={[LOCAL_STYLES.gridItem]}>
				<RadioButton
					disabled={timeCheck}
					checked={timeCheck}
					onPress={() =>
					{
						setState({
							...state,
							timeCheck: !timeCheck,
							loopCheck: false,
							repeatCheck: false,
							sequenceCheck: false,
						});
						setSettings(Settings.schedulerUntil, !timeCheck);
					}}
					title={s.ekos.scheduler.repeatUntil}
				/>
				<DatePicker
					value={scheduledStartTime}
					mode="datetime"
					handleChange={(selectedtime) =>
					{
						// TODO FIX
						const currentTime = selectedtime || scheduledStartTime;
						setScheduledStartTime(currentTime);
					}}
				/>
			</Box>
		</>
	);
};

const LOCAL_STYLES = {
	gridItem: {
		width: "100%",
		display: "flex",
		justifyContent: "space-between",
		alignItems: "center",
		gap: "10px",
	},
};

export default JobCompletion;
