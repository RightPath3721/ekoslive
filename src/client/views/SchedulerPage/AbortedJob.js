import React, { useState } from "react";
import { get } from "lodash";
import { useDispatch, useSelector } from "react-redux";
import RadioButton from "../../Components/RadioButton";
import { Box } from "@mui/material";
import { schedulerActions } from "@redux/actions";
import { selectSchedulerSettings } from "@redux/selectors";
import s from "@common/shared/i18n/i18n";

const Settings = {
	errorHandlingDontRestartButton: "errorHandlingDontRestartButton",
	errorHandlingRestartQueueButton: "errorHandlingRestartQueueButton",
	errorHandlingRestartImmediatelyButton:
		"errorHandlingRestartImmediatelyButton",
	errorHandlingRescheduleErrorsCB: "errorHandlingRescheduleErrorsCB",
	errorHandlingStrategyDelay: "errorHandlingStrategyDelay",
};

const AbortedJob = () =>
{
	const dispatch = useDispatch();
	const schedulerSettings = useSelector(selectSchedulerSettings);

	const [state, setState] = useState({
		noneCheck: get(
			schedulerSettings,
			Settings.errorHandlingDontRestartButton,
			false,
		),
		queueCheck: get(
			schedulerSettings,
			Settings.errorHandlingRestartQueueButton,
			false,
		),
		immediateCheck: get(
			schedulerSettings,
			Settings.errorHandlingRestartImmediatelyButton,
			false,
		),
		rescheduleError: get(
			schedulerSettings,
			Settings.errorHandlingRescheduleErrorsCB,
			false,
		),
	});

	const { noneCheck, queueCheck, immediateCheck, rescheduleError } = state;

	const setSettings = (key, value) =>
	{
		dispatch(schedulerActions.setAllSettings({ [key]: value }));
	};

	return (
		<Box>
			<RadioButton
				data={[
					{
						label: s.ekos.scheduler.none,
						handleChange: () =>
						{
							setState({
								...state,
								noneCheck: !noneCheck,
								queueCheck: false,
								immediateCheck: false,
							});
							setSettings(Settings.errorHandlingDontRestartButton, !noneCheck);
						},
						value: noneCheck,
					},
					{
						label: s.ekos.scheduler.queue,
						handleChange: () =>
						{
							setState({
								...state,
								noneCheck: false,
								queueCheck: !queueCheck,
								immediateCheck: false,
							});
							setSettings(
								Settings.errorHandlingRestartQueueButton,
								!queueCheck,
							);
						},
						value: queueCheck,
					},
					{
						label: s.ekos.scheduler.immediate,
						handleChange: () =>
						{
							setState({
								...state,
								noneCheck: false,
								queueCheck: false,
								immediateCheck: !immediateCheck,
							});
							setSettings(
								Settings.errorHandlingRestartImmediatelyButton,
								!immediateCheck,
							);
						},
						value: immediateCheck,
					},
					{
						label: s.ekos.scheduler.rescheduleErrors,
						handleChange: () =>
						{
							setState({ ...state, rescheduleErrorTime: !rescheduleError });
							setSettings(
								Settings.errorHandlingRestartImmediatelyButton,
								!rescheduleError,
							);
						},
						value: rescheduleError,
					},
				]}
				styles={{ flexDirectiion: "row", gap: "16px", alignItems: "center" }}
			/>
		</Box>
	);
};

export default AbortedJob;
