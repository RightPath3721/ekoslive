import React, { useEffect } from "react";
import { optionActions } from "@redux/actions";
import { useDispatch, useSelector } from "react-redux";
import { selectOptionValue } from "@redux/selectors";
import { get, isEmpty } from "lodash";
import { Box, Checkbox, Tooltip, Typography } from "@mui/material";
import { styles } from "@client/shared/styles";
import NumericControl from "@components/NumericControl";
import s from "@common/shared/i18n/i18n";

const Options = {
	LeadTime: "leadTime",
	PreDawnTime: "preDawnTime",
	PreemptiveShutdownTime: "preemptiveShutdownTime",
	PreemptiveShutdown: "preemptiveShutdown",
	SettingAltitudeCutoff: "settingAltitudeCutoff",
	DuskOffset: "duskOffset",
	DawnOffset: "dawnOffset",

	schedulerWeather: "schedulerWeather",
	schedulerWeatherGracePeriod: "schedulerWeatherGracePeriod",

	StopEkosAfterShutdown: "stopEkosAfterShutdown",
	ShutdownScriptTerminatesINDI: "shutdownScriptTerminatesINDI",
	RememberJobProgress: "rememberJobProgress",

	AlignCheckFrequency: "alignCheckFrequency",
	AlignCheckThreshold: "alignCheckThreshold",

	ResetMountModelOnAlignFail: "resetMountModelOnAlignFail",
	ResetMountModelBeforeJob: "resetMountModelBeforeJob",
	ForceAlignmentBeforeJob: "forceAlignmentBeforeJob",
	RealignAfterCalibrationFailure: "realignAfterCalibrationFailure",

	AlwaysExecuteStartupScript: "alwaysExecuteStartupScript",
	GreedyScheduling: "greedyScheduling",
};

const LocalCheckBox = ({ name, checked, onClick, isNumeric = false }) => (
	<Box sx={[styles.row, { marginBottom: isNumeric ? 0 : "16px" }]}>
		<Checkbox checked={checked} onClick={onClick} />
		{!isEmpty(name) && (
			<Typography sx={{ marginLeft: "16px" }}>{name}</Typography>
		)}
	</Box>
);
const LocalNumericInput = ({
	checkBox,
	type = "",
	width = "200px",
	boxValue,
	toggleBox,
	name,
	value,
	...props
}) => (
	<Box sx={[styles.row, { marginBottom: "16px" }]}>
		<Box sx={{ width: "50px" }}>
			{checkBox && (
				<LocalCheckBox
					isNumeric={true}
					checked={boxValue}
					onClick={toggleBox}
				/>
			)}
		</Box>
		<Typography sx={{ width: width }}>{name}</Typography>
		<NumericControl initialValue={value} {...props} />
		{!isEmpty(type) && (
			<Typography sx={{ marginLeft: "8px" }}>{type}</Typography>
		)}
	</Box>
);

const AdvancedSettings = () =>
{
	const dispatch = useDispatch();

	const kstarsConnected = useSelector(
		(state) => state.ekos.connection.connected,
	);

	const leadTime = useSelector((state) => selectOptionValue(state, "leadTime"));
	const preDawnTime = useSelector((state) =>
		selectOptionValue(state, "preDawnTime"),
	);
	const preemptiveShutdownTime = useSelector((state) =>
		selectOptionValue(state, "preemptiveShutdownTime"),
	);
	const isPreemptiveShutdown = useSelector((state) =>
		selectOptionValue(state, "preemptiveShutdown"),
	);
	const settingAltitudeCutoff = useSelector((state) =>
		selectOptionValue(state, "settingAltitudeCutoff"),
	);
	const duskOffset = useSelector((state) =>
		selectOptionValue(state, "duskOffset"),
	);
	const dawnOffset = useSelector((state) =>
		selectOptionValue(state, "dawnOffset"),
	);

	const schedulerWeather = useSelector((state) =>
		selectOptionValue(state, "schedulerWeather"),
	);
	const schedulerWeatherGracePeriod = useSelector((state) =>
		selectOptionValue(state, "schedulerWeatherGracePeriod"),
	);

	const stopEkosAfterShutdown = useSelector((state) =>
		selectOptionValue(state, Options.StopEkosAfterShutdown),
	);
	const shutdownScriptTerminatesINDI = useSelector((state) =>
		selectOptionValue(state, Options.ShutdownScriptTerminatesINDI),
	);
	const rememberJobProgress = useSelector((state) =>
		selectOptionValue(state, Options.RememberJobProgress),
	);

	const alignCheckFrequency = useSelector((state) =>
		selectOptionValue(state, Options.AlignCheckFrequency),
	);
	const alignCheckThreshold = useSelector((state) =>
		selectOptionValue(state, Options.AlignCheckThreshold),
	);

	const greedyScheduling = useSelector((state) =>
		selectOptionValue(state, Options.GreedyScheduling),
	);
	const alwaysExecuteScript = useSelector((state) =>
		selectOptionValue(state, Options.AlwaysExecuteStartupScript),
	);

	const resetMountModelOnAlignFail = useSelector((state) =>
		selectOptionValue(state, Options.ResetMountModelOnAlignFail),
	);
	const resetMountModelBeforeJob = useSelector((state) =>
		selectOptionValue(state, Options.ResetMountModelBeforeJob),
	);
	const forceAlignmentBeforeJob = useSelector((state) =>
		selectOptionValue(state, Options.ForceAlignmentBeforeJob),
	);
	const realignAfterCalibrationFailure = useSelector((state) =>
		selectOptionValue(state, Options.RealignAfterCalibrationFailure),
	);

	const setOption = (name, value) =>
	{
		dispatch(optionActions.setOptions([{ name: name, value: value }]));
		getOptions();
	};

	const getOptions = () =>
	{
		dispatch(
			optionActions.getOptions([
				{ name: Options.LeadTime },
				{ name: Options.PreDawnTime },
				{ name: Options.PreemptiveShutdownTime },
				{ name: Options.PreemptiveShutdown },
				{ name: Options.SettingAltitudeCutoff },
				{ name: Options.DuskOffset },
				{ name: Options.DawnOffset },
				{ name: Options.schedulerWeather },
				{ name: Options.schedulerWeatherGracePeriod },

				{ name: Options.StopEkosAfterShutdown },
				{ name: Options.ShutdownScriptTerminatesINDI },
				{ name: Options.RememberJobProgress },
				{ name: Options.AlwaysExecuteStartupScript },
				{ name: Options.GreedyScheduling },

				{ name: Options.AlignCheckFrequency },
				{ name: Options.AlignCheckThreshold },

				{ name: Options.ResetMountModelOnAlignFail },
				{ name: Options.ResetMountModelBeforeJob },
				{ name: Options.ForceAlignmentBeforeJob },
				{ name: Options.RealignAfterCalibrationFailure },
			]),
		);
	};

	const offsets = [
		{
			text: s.ekos.scheduler.scheduler_settings.lead_time,
			description: s.ekos.scheduler.scheduler_settings.lead_time_tooltip,
			value: get(leadTime, "value", false),
			key: Options.LeadTime,
			min: 0.0,
			max: 99.99,
			increment: 1,
			decrement: 1,
		},
		{
			text: s.ekos.scheduler.scheduler_settings.pre_dawn,
			description: s.ekos.scheduler.scheduler_settings.pre_dawn_tooltip,
			value: get(preDawnTime, "value", false),
			key: Options.PreDawnTime,
			min: 0.0,
			max: 99.99,
			increment: 1,
			decrement: 1,
		},
		{
			text: s.ekos.scheduler.scheduler_settings.pre_emptive,
			description: s.ekos.scheduler.scheduler_settings.pre_emptive_tooltip,
			value: get(preemptiveShutdownTime, "value", false),
			key: Options.PreemptiveShutdownTime,
			min: 0.0,
			max: 99.99,
			increment: 1,
			decrement: 1,
			checkBox: true,
			checkBoxKey: Options.PreemptiveShutdown,
			boxValue: get(isPreemptiveShutdown, "value", false),
		},
		{
			text: s.ekos.scheduler.scheduler_settings.weather_grace,
			description: s.ekos.scheduler.scheduler_settings.weather_grace_tooltip,
			value: get(schedulerWeatherGracePeriod, "value", false),
			key: Options.schedulerWeatherGracePeriod,
			min: 1,
			max: 120,
			increment: 1,
			decrement: 1,
			checkBox: true,
			checkBoxKey: Options.schedulerWeather,
			boxValue: get(schedulerWeather, "value", false),
		},
		{
			text: s.ekos.scheduler.scheduler_settings.setting_altitude,
			description: s.ekos.scheduler.scheduler_settings.setting_altitude_tooltip,
			value: get(settingAltitudeCutoff, "value", false),
			key: Options.SettingAltitudeCutoff,
			min: 0.0,
			max: 99.99,
			increment: 1,
			decrement: 1,
		},
		{
			text: s.ekos.scheduler.scheduler_settings.dust_offset,
			description: s.ekos.scheduler.scheduler_settings.dust_offset_tooltip,
			value: get(duskOffset, "value", false),
			key: Options.DuskOffset,
			min: -24.0,
			max: 24.0,
			increment: 0.5,
			decrement: 0.5,
		},
		{
			text: s.ekos.scheduler.scheduler_settings.dawn_offset,
			description: s.ekos.scheduler.scheduler_settings.dawn_offset_tooltip,
			value: get(dawnOffset, "value", false),
			key: Options.DawnOffset,
			min: -24.0,
			max: 24.0,
			increment: 0.5,
			decrement: 0.5,
		},
	];

	const cleaupJobs = [
		{
			text: s.ekos.scheduler.scheduler_settings.stop_ekos,
			description: s.ekos.scheduler.scheduler_settings.stop_ekos_tooltip,
			value: get(stopEkosAfterShutdown, "value", false),
			key: Options.StopEkosAfterShutdown,
		},
		{
			text: s.ekos.scheduler.scheduler_settings.shutdown_script,
			description: s.ekos.scheduler.scheduler_settings.shutdown_script_tooltip,
			value: get(shutdownScriptTerminatesINDI, "value", false),
			key: Options.ShutdownScriptTerminatesINDI,
		},
		{
			text: s.ekos.scheduler.scheduler_settings.execute_job,
			description: s.ekos.scheduler.scheduler_settings.execute_job_tooltip,
			value: get(alwaysExecuteScript, "value", false),
			key: Options.AlwaysExecuteStartupScript,
		},
		{
			text: s.ekos.scheduler.scheduler_settings.remember_job,
			description: s.ekos.scheduler.scheduler_settings.remember_job_tooltip,
			value: get(rememberJobProgress, "value", false),
			key: Options.RememberJobProgress,
		},
		{
			text: s.ekos.scheduler.scheduler_settings.greedy_schedule,
			description: s.ekos.scheduler.scheduler_settings.greedy_schedule_tooltip,
			value: get(greedyScheduling, "value", false),
			key: Options.GreedyScheduling,
		},
	];

	const reset = [
		{
			text: s.ekos.scheduler.scheduler_settings.reset_mount,
			description: s.ekos.scheduler.scheduler_settings.reset_mount_tooltip,
			value: get(resetMountModelOnAlignFail, "value", false),
			key: Options.ResetMountModelOnAlignFail,
		},
		{
			text: s.ekos.scheduler.scheduler_settings.reset_mount_before,
			description:
				s.ekos.scheduler.scheduler_settings.reset_mount_before_tooltip,
			value: get(resetMountModelBeforeJob, "value", false),
			key: Options.ResetMountModelBeforeJob,
		},
		{
			text: s.ekos.scheduler.scheduler_settings.force_realign,
			description: s.ekos.scheduler.scheduler_settings.force_realign_tooltip,
			value: get(forceAlignmentBeforeJob, "value", false),
			key: Options.ForceAlignmentBeforeJob,
		},
		{
			text: s.ekos.scheduler.scheduler_settings.restart_align,
			description: s.ekos.scheduler.scheduler_settings.restart_align_tooltip,
			value: get(realignAfterCalibrationFailure, "value", false),
			key: Options.RealignAfterCalibrationFailure,
		},
	];

	useEffect(() =>
	{
		if (kstarsConnected)
		{
			getOptions();
		}
	}, [kstarsConnected]);

	return (
		<Box
			sx={[
				{
					margin: "24px",
					height: "400px",
					overflow: "auto",
					width: "100%",
				},
			]}
		>
			<Box sx={[styles.row]}>
				<Box>
					<Typography>{s.ekos.scheduler.scheduler_settings.offsets}</Typography>
					{offsets.map((data, index) =>
					{
						return (
							<Box key={index} sx={styles.row}>
								<LocalNumericInput
									name={data.text}
									value={data.value}
									width={120}
									customLimit={[data.min, data.max]}
									steps={[data.increment, data.decrement]}
									numberType="float"
									boxValue={get(data, "boxValue", false)}
									toggleBox={() =>
									{
										if (get(data, "checkBox", false))
											setOption(data.checkBoxKey, !data.boxValue);
									}}
									onChange={(value) =>
									{
										setOption(data.key, value);
									}}
									checkBox={get(data, "checkBox", false)}
								/>
								<Box sx={{ padding: "8px" }}>
									<Tooltip
										data={{ title: data.text, description: data.description }}
									/>
								</Box>
							</Box>
						);
					})}
				</Box>
				<Box sx={{ marginLeft: "48px" }}>
					<Typography sx={{ marginBottom: "16px" }}>
						{s.ekos.scheduler.scheduler_settings.clean_jobs}
					</Typography>
					{cleaupJobs.map((data, i) =>
					{
						return (
							<Box key={i} sx={styles.row}>
								<LocalCheckBox
									name={data.text}
									checked={data.value}
									onClick={() =>
									{
										setOption(data.key, !data.value);
									}}
								/>
								<Box sx={{ marginLeft: "8px" }}>
									<Tooltip title={data.description} />
								</Box>
							</Box>
						);
					})}
				</Box>
			</Box>
			<Box>
				<Typography sx={styles.row}>
					{s.ekos.scheduler.scheduler_settings.alignment}
				</Typography>
				<Box sx={styles.row}>
					<LocalNumericInput
						name={s.ekos.scheduler.scheduler_settings.verify_image}
						onChange={(value) =>
						{
							setOption(Options.AlignCheckFrequency, value);
						}}
						customLimit={[0, 100]}
						steps={[1, 1]}
						width={120}
						value={get(alignCheckFrequency, "value", 0)}
						type="frames"
					/>
					<Box sx={{ padding: "8px" }}>
						<Tooltip
							data={{
								title: s.ekos.scheduler.scheduler_settings.verify_image,
								description:
									s.ekos.scheduler.scheduler_settings.verify_image_tooltip,
							}}
						/>
					</Box>
				</Box>
				<Box sx={{ flexDirection: "row" }}>
					<LocalNumericInput
						name={s.ekos.scheduler.scheduler_settings.reset_pipeline}
						onChange={(value) =>
						{
							setOption(Options.AlignCheckThreshold, value);
						}}
						steps={[60, 60]}
						width={120}
						customLimit={[0, 3600]}
						value={get(alignCheckThreshold, "value", 0)}
						type={s.ekos.scheduler.scheduler_settings.arcminutes}
					/>
					<Box sx={{ padding: "10px" }}>
						<Tooltip
							data={{
								title: s.ekos.scheduler.scheduler_settings.reset_pipeline,
								description:
									s.ekos.scheduler.scheduler_settings.reset_pipeline_tooltip,
							}}
						/>
					</Box>
				</Box>
				<Box sx={{ marginLeft: "48px" }}>
					{reset.map((data, i) =>
					{
						return (
							<Box key={i} sx={{ flexDirection: "row" }}>
								<LocalCheckBox
									name={data.text}
									checked={data.value}
									onClick={() =>
									{
										setOption(data.key, !data.value);
									}}
								/>
								<Box sx={{ marginLeft: "8px" }}>
									<Tooltip
										data={{ title: data.text, description: data.description }}
									/>
								</Box>
							</Box>
						);
					})}
				</Box>
			</Box>
		</Box>
	);
};

export default AdvancedSettings;
