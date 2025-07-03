import { Box, IconButton, Typography } from "@mui/material";
import { get, inRange, isEmpty } from "lodash";
import React, { useCallback, useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { captureActions, opticalTrainActions } from "@redux/actions";
import {
	numericControls,
	trainModules,
	DEVICE_TYPE,
	frameTypes,
} from "@indi/enums";
import Reactor from "@indi/events";
import Dropdown from "../../Components/Dropdown";
import s from "@common/shared/i18n/i18n";
import NumericControl from "../../Components/NumericControl";
import { styles } from "../../shared/styles";
import Icon from "../../Components/Icon";
import {
	selectPreviewPreset,
	selectTrainDevice,
	selectTrains,
	selectTrainName,
} from "@redux/selectors";
import { generateUUID } from "../../helpers/common";
import { Palette } from "@common/shared/common/styles";

const CameraDropdown = ({ value, title, onChange, data }) =>
{
	return (
		<Box
			sx={{
				display: "flex",
				justifyContent: "center",
				alignItems: "center",
				gap: "4px",
				flexDirection: "column",
			}}
		>
			<Typography sx={{ color: Palette.white }}>{title}</Typography>
			<Dropdown value={value} onChange={onChange} options={data} />
		</Box>
	);
};

const CameraNumericalInput = ({
	title,
	device,
	value,
	type,
	onChange,
	onDoubleClick,
	steps,
}) =>
{
	return (
		<Box
			sx={{
				display: "flex",
				justifyContent: "center",
				alignItems: "center",
				gap: "4px",
				flexDirection: "column",
			}}
		>
			<Typography
				onDoubleClick={onDoubleClick ? onDoubleClick : null}
				sx={{ color: "white", cursor: onDoubleClick ? "pointer" : "default" }}
			>
				{title}
			</Typography>
			<NumericControl
				device={device}
				type={type}
				initialValue={value}
				onChange={onChange}
				size={2}
				steps={steps}
			/>
		</Box>
	);
};

const Bin = [
	{ label: "1x1", value: 1 },
	{ label: "2x2", value: 2 },
	{ label: "4x4", value: 4 },
];

const CameraSettings = () =>
{
	const dispatch = useDispatch();
	const previewPreset = useSelector(selectPreviewPreset);
	const activeCamera = useSelector((state) =>
		selectTrainDevice(state, {
			trainType: trainModules.CaptureOpticalTrain,
			deviceType: DEVICE_TYPE.CAMERA,
		}),
	);
	const allTrains = useSelector(selectTrains);
	const activeTrain = useSelector((state) =>
		selectTrainName(state, { trainType: trainModules.CaptureOpticalTrain }),
	);
	const uuid = generateUUID();

	// Filter Wheel
	const activeFilterWheel = useSelector((state) =>
		selectTrainDevice(state, {
			trainType: trainModules.CaptureOpticalTrain,
			deviceType: DEVICE_TYPE.FILTER_WHEEL,
		}),
	);
	const [isoControl, setISOControl] = useState({ limit: [], range: [] });
	const [currentTemperature, setCurrentTemperature] = useState("T. (NA)");
	const [currentGain, setCurrentGain] = useState("Gain (NA)");
	const [currentOffset, setCurrentOffset] = useState("Offset (NA)");
	const [currentISO, setCurrentISO] = useState("ISO (NA)");
	const [filters, setFilters] = useState([]);
	const [moreSettings, setMoreSettings] = useState(false);

	const [activeSettings, setActiveSettings] = useState({
		frameType: get(previewPreset, "frameType", "Light"),
		bin: get(previewPreset, "bin", "1x1"),
		exp: get(previewPreset, "exp", 0),
		filter: get(previewPreset, "filter", "--"),
		temperature: get(previewPreset, "temperature", "--"),
		gain: get(previewPreset, "gain", "--"),
		offset: get(previewPreset, "offset", "--"),
		iso: get(previewPreset, "iso", "--"),
		captureFormat: get(previewPreset, "captureFormat", "Mono"),
		dark: false,
		new: true,
	});

	/*
	 * Run on train change.
	 */
	useEffect(() =>
	{
		// Get filter settings
		dispatch(captureActions.getFilterSettings());

		// If it is initial render, we IGNORE
		if (activeSettings.new)
			setActiveSettings({ ...activeSettings, new: false });
		// If train is *actually* changed, we reset
		else
		{
			// If train is changed, we need to reset some active settings to default values as not to interfere with current values.
			setActiveSettings({
				...activeSettings,
				filter: "--",
				temperature: "--",
				gain: "--",
				offset: "--",
				iso: "--",
				captureFormat: "--",
			});
			dispatch(
				captureActions.updatePreviewPreset("all", {
					...activeSettings,
					filter: "--",
					temperature: "--",
					gain: "--",
					offset: "--",
					iso: "--",
					captureFormat: "--",
				}),
			);
		}
	}, [activeTrain]);

	/**
	 * Update temperature from the given property.
	 * @param device
	 * @param property
	 */
	const updateTemperature = (device, property) =>
	{
		// Make sure the temperature is for our active camera
		if (device.name === property.device)
			setCurrentTemperature(`T. (${property.numbers[0].value?.toFixed(1)}°C)`);
	};

	/**
	 * Update gain from the given property.
	 * @param device
	 * @param property
	 */
	const updateGain = (device, property) =>
	{
		// Make sure the temperature is for our active camera
		if (device.name === property.device)
		{
			const gainValue = device.getGain();
			if (!isNaN(gainValue))
				setCurrentGain(`${s.general.gain} (${gainValue?.toFixed(0)})`);
		}
	};

	/**
	 * Update offset from the given property.
	 * @param device
	 * @param property
	 */
	const updateOffset = (device, property) =>
	{
		// Make sure the temperature is for our active camera
		if (device.name === property.device)
		{
			const offsetValue = device.getOffset();
			if (!isNaN(offsetValue))
				setCurrentOffset(`${s.general.offset} (${offsetValue.toFixed(0)})`);
		}
	};

	/**
	 * Update offset from the given property.
	 * @param device
	 * @param property
	 */
	const updateDSLRISO = (device, property) =>
	{
		// Make sure the temperature is for our active camera
		if (device.name === property.device)
		{
			const currentISOText = device.getISO();
			const currentISOIndex = device.getISOIndex();
			if (currentISOIndex !== activeSettings.iso)
				setActiveSettings({ ...activeSettings, iso: currentISOIndex });
			if (currentISOText !== null)
				setCurrentISO(`${s.general.iso} (${currentISOText})`);
		}
	};

	/**
	 * Update capture format from the given property.
	 * @param device
	 * @param property
	 */
	const updateCaptureFormat = (device, property) =>
	{
		// Make sure the temperature is for our active camera
		if (device.name === property.device)
		{
			const currentCaptureFormat = device.getCaptureFormat();
			if (
				currentCaptureFormat &&
				currentCaptureFormat !== activeSettings.captureFormat
			)
				setActiveSettings({
					...activeSettings,
					captureFormat: currentCaptureFormat,
				});
		}
	};

	/**
	 * Watch for property updates registered in the addEventListener.
	 * @type {(function(*=): void)|*}
	 */
	const onPropertyUpdate = useCallback((device, property) =>
	{
		if (property.name === "CCD_TEMPERATURE")
			updateTemperature(device, property);
		else if (property.name === "CCD_CONTROLS")
		{
			updateGain(device, property);
			updateOffset(device, property);
		}
		else if (property.name === "CCD_GAIN") updateGain(device, property);
		else if (property.name === "CCD_OFFSET") updateOffset(device, property);
		else if (property.name === "CCD_ISO") updateDSLRISO(device, property);
		else if (property.name === "CCD_CAPTURE_FORMAT")
			updateCaptureFormat(device, property);
	});

	const resetOffsetOnDoubleTap = () =>
	{
		setActiveSettings((prevSettings) => ({ ...prevSettings, offset: "--" }));
		dispatch(captureActions.updatePreviewPreset("offset", "--"));
	};

	const resetGainOnDoubleTap = () =>
	{
		setActiveSettings((prevSettings) => ({ ...prevSettings, gain: "--" }));
		dispatch(captureActions.updatePreviewPreset("gain", "--"));
	};

	const resetTemperatureOnDoubleTap = () =>
	{
		setActiveSettings((prevSettings) => ({
			...prevSettings,
			temperature: "--",
		}));
		dispatch(captureActions.updatePreviewPreset("temperature", "--"));
	};

	useEffect(() =>
	{
		if (isEmpty(activeCamera)) return;

		// Watch property updates
		Reactor.addEventListener(
			"propertyUpdate",
			onPropertyUpdate,
			activeCamera,
			uuid,
		);

		setISOControl({ range: activeCamera.getRangeList("CCD_ISO") });

		if (activeCamera.hasTemperature())
		{
			const temperatureValue = activeCamera.getTemperature();
			// Make sure it's not NaN and value make sense
			if (!isNaN(temperatureValue) && inRange(temperatureValue, -100, 100))
			{
				setCurrentTemperature(`T. (${temperatureValue.toFixed(1)}°C)`);
			}
		}

		if (activeCamera.hasGain())
		{
			const gainValue = activeCamera.getGain();
			if (!isNaN(gainValue) && gainValue >= 0)
				setCurrentGain(`${s.general.gain} (${gainValue.toFixed(0)})`);
		}

		if (activeCamera.hasOffset())
		{
			const offsetValue = activeCamera.getOffset();
			if (!isNaN(offsetValue) && offsetValue >= 0)
				setCurrentOffset(`${s.general.offset} (${offsetValue.toFixed(0)})`);
		}

		if (activeCamera.isDSLR())
		{
			const currentISOText = activeCamera.getISO();
			const currentISOIndex = activeCamera.getISOIndex();
			if (currentISOIndex !== activeSettings.iso)
				setActiveSettings({ ...activeSettings, iso: currentISOIndex });
			if (currentISOText !== null)
				setCurrentISO(`${s.general.iso} (${currentISOText})`);

			setActiveSettings({
				...activeSettings,
				captureFormat: activeCamera.getCaptureFormat(),
			});
		}

		return () =>
		{
			Reactor.removeEventListener("propertyUpdate", uuid);
		};
	}, [activeCamera]);

	useEffect(() =>
	{
		if (isEmpty(activeFilterWheel)) return;

		const availableFilters = activeFilterWheel.availableFilters();
		if (isEmpty(availableFilters)) return;

		setFilters([
			{
				text: "--",
				value: "--",
			},
			...availableFilters.map((item) => ({
				label: item.text,
				value: item.text,
			})),
		]);
	}, [activeFilterWheel]);

	return (
		<Box
			sx={[
				styles.center,
				{
					display: "grid",
					gridTemplateColumns: "1fr",
					padding: "20px",
					backgroundColor: "rgba(0,0,0,0.8)",
				},
			]}
		>
			{moreSettings && (
				<Box sx={{ display: "flex", justifyContent: "flex-end", gap: "12px" }}>
					{!isEmpty(activeFilterWheel) &&
						!isEmpty(activeFilterWheel.availableFilters()) && (
							<CameraDropdown
								title={s.general.filter}
								data={filters}
								value={activeSettings.filter || "--"}
								onChange={(e) =>
								{
									setActiveSettings({ ...activeSettings, filter: e.label });
									dispatch(
										captureActions.updatePreviewPreset("filter", e.label),
									);
								}}
							/>
						)}

					<CameraDropdown
						title={s.general.train}
						data={allTrains}
						value={activeTrain}
						onChange={(_, data) =>
						{
							const payload = {
								name: data,
								module: "capture",
							};
							dispatch(opticalTrainActions.setTrain(payload));
							dispatch(opticalTrainActions.getAllTrains());
						}}
					/>

					{!isEmpty(isoControl?.range) > 0 && (
						<CameraDropdown
							title={currentISO}
							data={isoControl.range.map((item, index) => ({
								text: item,
								value: index,
							}))}
							value={isoControl.range[activeSettings.iso]}
							onChange={(value) =>
							{
								setActiveSettings({ ...activeSettings, iso: value });
								dispatch(captureActions.updatePreviewPreset("iso", value));
							}}
						/>
					)}

					{activeCamera && activeCamera.hasGain() && (
						<CameraNumericalInput
							title={currentGain}
							device={activeCamera}
							type={numericControls.GAIN}
							value={get(previewPreset, "gain", activeSettings.gain)}
							onChange={(value) =>
							{
								setActiveSettings({ ...activeSettings, gain: value });
								dispatch(captureActions.updatePreviewPreset("gain", value));
							}}
							onDoubleClick={resetGainOnDoubleTap}
							steps={[10, 10]}
						/>
					)}

					{activeCamera && activeCamera.hasOffset() && (
						<CameraNumericalInput
							title={currentOffset}
							device={activeCamera}
							type={numericControls.OFFSET}
							value={get(previewPreset, "offset", activeSettings.offset)}
							onChange={(value) =>
							{
								setActiveSettings({ ...activeSettings, offset: value });
								dispatch(captureActions.updatePreviewPreset("offset", value));
							}}
							onDoubleClick={resetOffsetOnDoubleTap}
						/>
					)}
				</Box>
			)}
			<Box sx={[styles.row, { gap: "12px", alignItems: "center" }]}>
				<IconButton onClick={() => setMoreSettings(!moreSettings)}>
					<Icon
						name={!moreSettings ? "status-arrowup" : "status-arrowdown"}
						color={Palette.white}
					/>
				</IconButton>

				<CameraDropdown
					title={s.general.type}
					data={frameTypes.map(({ text, value, label }) => ({
						text: s.ekos.collapse_camera[text],
						value,
						label,
					}))}
					value={
						s.ekos.collapse_camera[
							frameTypes[get(previewPreset, "frameType", 0)]?.text
						]
					}
					onChange={(e) =>
					{
						const type = e.value;
						dispatch(captureActions.updatePreviewPreset("frameType", type));
						setActiveSettings({ ...activeSettings, frameType: e.label });
					}}
				/>

				<CameraDropdown
					title={s.general.binning}
					data={Bin}
					value={
						Bin.find((oneBin) =>
						{
							return oneBin.value === get(previewPreset, "bin", 1);
						}).label
					}
					onChange={(data) =>
					{
						const type = data.value;
						setActiveSettings({ ...activeSettings, bin: type });
						dispatch(captureActions.updatePreviewPreset("bin", type));
					}}
				/>

				<CameraNumericalInput
					title={s.general.exposure}
					device={activeCamera}
					type={numericControls.EXPOSURE}
					value={get(previewPreset, "exp", activeSettings.exp)}
					onChange={(value) =>
					{
						setActiveSettings({ ...activeSettings, exp: value });
						dispatch(captureActions.updatePreviewPreset("exp", value));
					}}
				/>

				{activeCamera && activeCamera?.canCool() && (
					<CameraNumericalInput
						title={currentTemperature}
						device={activeCamera}
						type={numericControls.TEMPERATURE}
						value={get(
							previewPreset,
							"temperature",
							activeSettings.temperature,
						)}
						onChange={(value) =>
						{
							setActiveSettings({ ...activeSettings, temperature: value });
							// If target temperature is above zero and it is above current temperature
							// then set it to "--" so that Ekos does not force temperature setting on
							dispatch(
								captureActions.updatePreviewPreset(
									"temperature",
									value > 0 && value > activeCamera.getTemperature()
										? "--"
										: value,
								),
							);
							// Also update temperature immediately if not "--" (because "--" sets the temperature to 0 for some reason)
							if (!isNaN(value))
								dispatch(
									captureActions.setProperty(
										activeCamera?.name,
										"CCD_TEMPERATURE",
										"CCD_TEMPERATURE_VALUE",
										value,
									),
								);
						}}
						onDoubleClick={resetTemperatureOnDoubleTap}
					/>
				)}
			</Box>
		</Box>
	);
};

export default CameraSettings;
