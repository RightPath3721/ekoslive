import React, { useCallback, useEffect, useState } from "react";
import { Checkbox, Box, Typography } from "@mui/material";
import format from "date-fns/format";
import { get } from "lodash";
import { useDispatch, useSelector } from "react-redux";
import { indiActions, mountActions } from "@redux/actions";
import {
	selectAutoParkCountdown,
	selectPierSide,
	selectMountSettings,
	selectMeridianFlipText,
	selectTrainDevice,
} from "@redux/selectors";
import s from "@common/shared/i18n/i18n";
import { DEVICE_TYPE, trainModules } from "@indi/enums";
import { Palette } from "@common/shared/common/styles";
import CustomizedSwitch from "../../Components/CustomSwitch";
import NumericControl from "../../Components/NumericControl";
import DatePicker from "../../Components/DateDialog";
import QuickControls from "./QuickControls";
import AnimatedButton from "@components/Button";
import { useObservatoryRole } from "@components/providers/ObservatoryRoleProvider";
import { Can } from "@components/providers/AclProvider";

const PierSides = ["west_long", "east_long"];

const Switch = ({ options, onChange, value, title }) =>
{
	return (
		<Box sx={[LOCAL_STYLES.valueBox]}>
			{title && <MountText title={title} />}
			<CustomizedSwitch options={options} onChange={onChange} value={value} />
		</Box>
	);
};

const MountText = ({ title }) =>
{
	return (
		<Typography sx={{ color: "white", width: "130px" }}>{title}</Typography>
	);
};

const MountCheckbox = ({ checked, onChange, title }) =>
{
	return (
		<Box sx={[LOCAL_STYLES.valueBox, { justifyContent: "flex-start" }]}>
			<Checkbox
				style={{ color: "white", padding: 0 }}
				checked={checked}
				onChange={onChange}
			/>
			<MountText title={title} />
		</Box>
	);
};

const MountNumeric = ({
	type,
	onChange,
	editable,
	initialValue,
	device = {},
	title,
	steps,
	customLimit,
}) =>
{
	return (
		<Box sx={[LOCAL_STYLES.valueBox]}>
			<MountText title={title} />
			<NumericControl
				editable={editable}
				device={device}
				type={type}
				onChange={onChange}
				steps={steps}
				initialValue={initialValue}
				customLimit={customLimit}
			/>
		</Box>
	);
};

const Mount = ({ toggleOpticalTrain }) =>
{
	const dispatch = useDispatch();

	const autoParkCountdown = useSelector(selectAutoParkCountdown);
	const pierSide = useSelector(selectPierSide);
	const mountSettings = useSelector(selectMountSettings);
	const meridianFlipText = useSelector(selectMeridianFlipText);
	const mount = useSelector((state) =>
		selectTrainDevice(state, {
			trainType: trainModules.MountOpticalTrain,
			deviceType: DEVICE_TYPE.MOUNT,
		}),
	);
	const observatoryRole = useObservatoryRole();
	const [isAnimating, setIsAnimating] = useState(false);

	const [executeMeridianFlip, setExecuteMeridianFlip] = useState(
		get(mountSettings, "executeMeridianFlip", false),
	);
	const [meridianFlipOffsetDegrees, setMeridianFlipOffsetDegrees] = useState(
		get(mountSettings, "meridianFlipOffsetDegrees", 0),
	);
	const [enableAltitudeLimits, setEnableAltitudeLimits] = useState(
		get(mountSettings, "enableAltitudeLimits", false),
	);
	const [minimumAltLimit, setMinimumAltLimit] = useState(
		get(mountSettings, "minimumAltLimit", 0),
	);
	const [maximumAltLimit, setMaximumAltLimit] = useState(
		get(mountSettings, "maximumAltLimit", 0),
	);
	const [enableHaLimit, setEnableHaLimit] = useState(
		get(mountSettings, "enableHaLimit", false),
	);
	const [maximumHaLimit, setMaximumHaLimit] = useState(
		get(mountSettings, "maximumHaLimit", 0),
	);

	// setting initial autopark time to 00:00
	const [autoParkTime, setAutoParkTime] = useState(
		get(mountSettings, "autoParkTime", "00:00:00"),
	);

	const [parkEveryDay, setParkEveryDay] = useState(
		get(mountSettings, "parkEveryDay", false),
	);
	const [countdownActive, setCountdownActive] = useState(
		autoParkCountdown !== "00:00:00",
	);
	const [showDateTimePicker, setShowDateTimePicker] = useState(false);
	const [countdownInterval, setCountdownInterval] = useState();

	const [telescopeParkSubscribed, setTelescopeParkSubscribed] = useState(false);

	const [timer, setTimer] = useState(autoParkTime);

	const autoParkTimerUpdater = useCallback(() =>
	{
		setTimer((prevValue) =>
		{
			const date = new Date();
			const countDown = prevValue.split(":");
			date.setHours(+countDown[0], +countDown[1], +countDown[2] - 1);
			return format(date, "hh:mm:ss");
		});
	}, [timer, setTimer]);

	useEffect(() =>
	{
		if (countdownActive)
		{
			const hh_mm_ss = autoParkTime.split(":");
			const parkTime = new Date(
				new Date().setHours(hh_mm_ss[0], hh_mm_ss[1], hh_mm_ss[2]),
			);
			const timeDiff = new Date(parkTime - new Date()).toLocaleString("en-US", {
				timeZone: "GMT",
			});

			setTimer(format(new Date(timeDiff), "hh:mm:ss"));
			const interval = setInterval(autoParkTimerUpdater, 1000);
			setCountdownInterval(interval);
		}

		return () =>
		{
			clearInterval(countdownInterval);
		};
	}, []);

	useEffect(() =>
	{
		if (get(mount, "name", false) && telescopeParkSubscribed === false)
		{
			dispatch(
				indiActions.subscribeToProperty(mount?.name, "TELESCOPE_PARK", true),
			);
			setTelescopeParkSubscribed(true);
		}
	}, []);

	useEffect(() =>
	{
		const payload = {
			executeMeridianFlip: executeMeridianFlip,
			meridianFlipOffsetDegrees: meridianFlipOffsetDegrees,
			enableAltitudeLimits: enableAltitudeLimits,
			minimumAltLimit: minimumAltLimit,
			maximumAltLimit: maximumAltLimit,
			enableHaLimit: enableHaLimit,
			maximumHaLimit: maximumHaLimit,
			parkEveryDay: parkEveryDay,
			ParkTime: new Date(autoParkTime).toTimeString(),
		};

		dispatch(mountActions.setAllSettings(payload));
	}, [
		executeMeridianFlip,
		meridianFlipOffsetDegrees,
		enableAltitudeLimits,
		minimumAltLimit,
		maximumAltLimit,
		enableHaLimit,
		maximumHaLimit,
		parkEveryDay,
		autoParkTime,
	]);

	useEffect(() =>
	{
		if (isAnimating)
		{
			const timer = setTimeout(() =>
			{
				setIsAnimating(false); // Remove the animation after 5 seconds
			}, 5000);

			return () => clearTimeout(timer); // Cleanup the timer
		}
	}, [isAnimating]);

	return (
		<Box sx={[LOCAL_STYLES.containter]}>
			<Box>
				<Typography sx={[LOCAL_STYLES.boxTitle]}>
					{s.settings.heading}
				</Typography>
				<Box sx={[LOCAL_STYLES.settingsBox]}>
					<QuickControls toggleOpticalTrain={toggleOpticalTrain} />
				</Box>
			</Box>

			<Box>
				<Typography sx={[LOCAL_STYLES.boxTitle]}>
					{s.ekos.capture_limits.heading}
				</Typography>
				<Box sx={[LOCAL_STYLES.settingsBox]}>
					<MountNumeric
						title={s.ekos.collapse_mount.min_alt}
						editable={enableAltitudeLimits}
						initialValue={`${minimumAltLimit}`}
						customLimit={[-10, 90]}
						steps={[1, 1]}
						onChange={(value) =>
						{
							setMinimumAltLimit(value);
							const settings = {
								min: value,
								max: maximumAltLimit,
								enabled: enableAltitudeLimits,
							};
							dispatch(mountActions.setAltitudeLimits(settings));
						}}
					/>
					<MountNumeric
						title={s.ekos.collapse_mount.max_alt}
						initialValue={`${maximumAltLimit}`}
						customLimit={[0, 90]}
						steps={[1, 1]}
						onChange={(value) =>
						{
							setMaximumAltLimit(value);
							const settings = {
								min: minimumAltLimit,
								max: value,
								enabled: enableAltitudeLimits,
							};
							dispatch(mountActions.setAltitudeLimits(settings));
						}}
					/>
					<MountCheckbox
						title={s.ekos.collapse_mount.enable_alt_limits}
						checked={enableAltitudeLimits}
						onChange={() =>
						{
							const enabled = !enableAltitudeLimits;
							setEnableAltitudeLimits((prevState) => !prevState);
							const settings = {
								min: minimumAltLimit,
								max: maximumAltLimit,
								enabled: enabled,
							};
							dispatch(mountActions.setAltitudeLimits(settings));
						}}
					/>
					<MountNumeric
						title={s.ekos.collapse_mount.max_ha}
						editable={enableHaLimit}
						initialValue={`${maximumHaLimit}`}
						customLimit={[-2, 2]}
						steps={[0.1, 0.1]}
						onChange={(value) =>
						{
							setMaximumHaLimit(value);
							const settings = {
								value: value,
								enabled: enableHaLimit,
							};
							dispatch(mountActions.setHALimit(settings));
						}}
					/>
					<MountCheckbox
						title={s.ekos.collapse_mount.enable_ha_limits}
						checked={enableHaLimit}
						onChange={() =>
						{
							const enabled = !enableHaLimit;
							setEnableHaLimit((prevState) => !prevState);
							const settings = {
								value: maximumHaLimit,
								enabled: enabled,
							};
							dispatch(mountActions.setHALimit(settings));
						}}
					/>
				</Box>
			</Box>

			<Can
				action="owner"
				subject="Observatory"
				object={{ userRole: observatoryRole }}
			>
				<Box>
					<Box sx={{ width: "fit-content" }}>
						<Typography sx={[LOCAL_STYLES.boxTitle]}>
							{s.ekos.collapse_mount.auto_park}
						</Typography>
						{/* Autopark everyday toggle */}
						<Box sx={[LOCAL_STYLES.settingsBox]}>
							<MountCheckbox
								checked={parkEveryDay}
								onChange={() =>
								{
									setParkEveryDay(!parkEveryDay);
									dispatch(
										mountActions.setAllSettings({
											parkEveryDay: !parkEveryDay,
										}),
									);
								}}
								title={s.ekos.collapse_mount.auto_park_everyday}
							/>
							{/* Park At Time Selector */}
							<Box sx={{ display: "flex", gap: "10px" }}>
								<MountText title={s.ekos.collapse_mount.park_at} />
								{/* Park time selection/display */}
								<Box
									onClick={() =>
									{
										if (autoParkCountdown === "00:00:00")
										{
											setShowDateTimePicker(true);
										}
									}}
									sx={{
										color: "white",
										backgroundColor: Palette.grey44,
										borderRadius: "4px",
										textAlign: "center",
										paddingInline: "4px",
										display: "inline-grid",
										placeItems: "center",
									}}
								>
									{autoParkTime}
								</Box>
							</Box>
							{/* Auto Park Start / Stop */}
							<Switch
								onChange={(active) =>
								{
									setCountdownActive(active);
									dispatch(mountActions.setAutoPark({ toggled: active }));
									if (!active)
									{
										setTimer("00:00:00");
										clearInterval(countdownInterval);
										setAutoParkTime("00:00:00");
										return;
									}

									const hh_mm_ss = autoParkTime.split(":");
									const parkTime = new Date(
										new Date().setHours(hh_mm_ss[0], hh_mm_ss[1], hh_mm_ss[2]),
									);
									const timeDiff = new Date(
										parkTime - new Date(),
									).toLocaleString("en-US", { timeZone: "GMT" });

									setTimer(format(new Date(timeDiff), "hh:mm:ss"));
									const interval = setInterval(autoParkTimerUpdater, 1000);
									setCountdownInterval(interval);
								}}
								options={[
									{ label: s.general.start, value: true },
									{ label: s.general.stop, value: false },
								]}
								value={countdownActive}
							/>

							<Typography
								sx={{
									color: "white",
									width: "100%",
									textAlign: "center",
									border: `1px solid ${Palette.grey44}`,
									opacity: autoParkCountdown === "00:00:00" ? 0.6 : 1,
								}}
							>
								{timer}
							</Typography>
						</Box>
					</Box>

					<Box sx={{ width: "fit-content" }}>
						<Typography sx={[LOCAL_STYLES.boxTitle]}>
							{s.general.reset}
						</Typography>
						<AnimatedButton
							animate={true}
							icon="clean"
							onClick={() =>
							{
								dispatch(mount.clearCalibrationModel());
							}}
							text={s.ekos.collapse_mount.clear_model}
							sx={{
								position: "relative",
								backgroundColor: Palette.red,
								overflow: "hidden",
								marginTop: "15px",
							}}
						/>
					</Box>
				</Box>
			</Can>

			<Box sx={{ width: "fit-content" }}>
				<Typography sx={[LOCAL_STYLES.boxTitle]}>
					{s.ekos.collapse_mount.meridian_flip}
				</Typography>
				<Box sx={[LOCAL_STYLES.settingsBox]}>
					<MountText title={meridianFlipText} />
					<Box sx={[LOCAL_STYLES.valueBox]}>
						<MountCheckbox
							checked={executeMeridianFlip}
							onChange={() =>
							{
								const enabled = !executeMeridianFlip;
								setExecuteMeridianFlip((prevState) => !prevState);
								const settings = {
									enabled: enabled,
									value: meridianFlipOffsetDegrees,
								};
								dispatch(mountActions.setMeridianFlip(settings));
							}}
							title={s.ekos.collapse_mount.flip_if_ha}
						/>
						<NumericControl
							initialValue={`${meridianFlipOffsetDegrees}`}
							customLimit={[0, 120]}
							steps={[5, 5]}
							onChange={(value) =>
							{
								setMeridianFlipOffsetDegrees(value);
								const settings = {
									enabled: executeMeridianFlip,
									value: value,
								};
								dispatch(mountActions.setMeridianFlip(settings));
							}}
						/>
						<MountText title={s.ekos.collapse_mount.flip_if_ha_unit} />
					</Box>
					<MountText
						title={`${s.ekos.collapse_mount.pierside}: ${s.ekos.collapse_mount[PierSides[pierSide]]}`}
					/>
				</Box>
			</Box>

			{showDateTimePicker && (
				<DatePicker
					mode="time"
					value={autoParkTime}
					handleChange={(val) =>
					{
						const newTime = `${String(val.$H).padStart(2, "0")}:${String(val.$m).padStart(2, "0")}:${String(val.$s).padStart(2, "0")}`;
						setAutoParkTime(newTime);
						setShowDateTimePicker(false);
						dispatch(mountActions.setAllSettings({ autoParkTime: newTime }));
					}}
					open={showDateTimePicker}
				/>
			)}
		</Box>
	);
};

const LOCAL_STYLES = {
	containter: {
		display: "grid",
		gridTemplateColumns: "repeat(3, 1fr)",
		columnGap: "20px",
		rowGap: "16px",
		padding: "20px",
		overflow: "scroll",
		height: "100%",
	},
	settingsBox: {
		display: "flex",
		flexDirection: "column",
		gap: "16px",
		height: "fit-content",
		padding: "12px 8px",
		marginTop: "12px",
		border: `0.5px solid ${Palette.grey44}`,
		borderRadius: "15px",
		padding: "10px",
	},
	boxTitle: {
		fontSize: "20px",
		fontWeight: "700",
		color: Palette.orange,
		width: "max-content",
	},
	valueBox: {
		display: "flex",
		// justifyContent: "space-between",
		alignItems: "center",
		gap: "10px",
	},
};

export default Mount;
