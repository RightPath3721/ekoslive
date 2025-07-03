import { Box, IconButton, Typography } from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import { get, isEmpty, merge } from "lodash";
import React, { useEffect, useState } from "react";
import { shallowEqual, useDispatch, useSelector } from "react-redux";
import { focusActions, opticalTrainActions } from "@redux/actions";
import s from "@common/shared/i18n/i18n";
import {
	numericControls,
	trainModules,
	DEVICE_TYPE,
	deviceType,
} from "@indi/enums";
import CustomizedSwitch from "../../Components/CustomSwitch";
import NumericControl from "../../Components/NumericControl";
import Dropdown from "../../Components/Dropdown";
import {
	selectTrains,
	selectTrainName,
	selectFocusSettings,
	selectTrainDevice,
} from "@redux/selectors";

const LOCAL_STYLES = {
	presetItem: {
		display: "flex",
		justifyContent: "space-between",
		alignItems: "center",
		gap: "16px",
	},
	imageButton: { width: "40px", height: "40px", minWidth: "auto", padding: 0 },
};

const binningOptions = [
	{
		label: "1x1",
		value: "1x1",
	},
	{
		label: "2x2",
		value: "2x2",
	},
	{
		label: "4x4",
		value: "4x4",
	},
];

const Preset = ({
	preset = null,
	toggleEdit = null,
	toggleOpticalTrain,
	filter,
	setFilter,
}) =>
{
	const dispatch = useDispatch();

	const allTrains = useSelector(selectTrains);
	const activeFilterWheel = useSelector((state) =>
		selectTrainDevice(state, {
			trainType: trainModules.CaptureOpticalTrain,
			deviceType: DEVICE_TYPE.FILTER_WHEEL,
		}),
	);
	const focusSettings = useSelector(selectFocusSettings);
	const activeTrain = useSelector((state) =>
		selectTrainName(state, { trainType: trainModules.FocusOpticalTrain }),
	);

	const connected = useSelector(
		(state) => state.ekos.connection.connected && state.ekos.connection.online,
	);
	const devices = useSelector((state) => state.indi.devices, shallowEqual);

	const activeCamera = useSelector((state) =>
		selectTrainDevice(state, {
			trainType: trainModules.FocusOpticalTrain,
			deviceType: DEVICE_TYPE.CAMERA,
		}),
	);
	const activeFocuser = useSelector((state) =>
		selectTrainDevice(state, {
			trainType: trainModules.FocusOpticalTrain,
			deviceType: DEVICE_TYPE.FOCUSER,
		}),
	);
	const [activeSettings, setActiveSettings] = useState({
		name: "",
		exp: 1,
		bin: 1,
		iso: 0,
		gain: "--",
		camera: "",
		fw: "--",
		filter: "--",
		dark: false,
		focuser: "",
		defaultFocusTemperatureSource: get(
			focusSettings,
			"defaultFocusTemperatureSource",
			"--",
		),
	});
	const [temperatureSources, setTemperatureSources] = useState([]);

	const [filtersList, setFiltersList] = useState([]);

	const [binning, setBinning] = useState(
		isEmpty(focusSettings) ? "1x1" : focusSettings.focusBinning,
	);
	const [gain, setGain] = useState(
		isEmpty(focusSettings) ? 0 : focusSettings.focusGain,
	);

	/**
	 * Check for temperature sources
	 * @returns
	 */
	const getTemperatureSources = () =>
	{
		let sources = [];
		if (isEmpty(devices)) return;

		for (const oneDevice of devices)
		{
			const name = get(oneDevice, "name", "");
			switch (oneDevice.type) {
				case deviceType.CAMERA:
					if (activeCamera?.canCool())
						sources.push({ label: name, value: name });
					break;
				case deviceType.FOCUSER:
					if (activeFocuser?.canCool())
						sources.push({ label: name, value: name });
					break;
				case deviceType.WEATHER:
					if (oneDevice?.hasWeatherParameters())
						sources.push({ label: name, value: name });
					break;
			}
		}
		const uniqueSources = Array.from(
			new Map(sources.map((item) => [JSON.stringify(item), item])).values(),
		);
		setTemperatureSources(uniqueSources);
	};

	useEffect(() =>
	{
		const combinedObject = merge(activeSettings, focusSettings, preset);
		setActiveSettings({
			...combinedObject,
			name: toggleEdit ? preset.name : "",
		});
	}, [focusSettings, preset]);

	useEffect(() =>
	{
		let payload = {
			focusBinning: binning,
			focusGain: gain,
		};
		dispatch(focusActions.setAllSettings(payload));
	}, [binning, gain]);
	/*
	 * Runs once the component mounts (componentDidMount)
	 */
	useEffect(() =>
	{
		getTemperatureSources();
		dispatch(focusActions.getAllSettings());
	}, []);

	/*
	 * Set Filters List from the active filter wheel if available
	 */
	useEffect(() =>
	{
		if (connected && !isEmpty(activeFilterWheel))
		{
			const filters = activeFilterWheel.availableFilters();
			if (filters)
				setFiltersList(
					filters.map((item) => ({ label: item.text, value: item.text })),
				);
		}
	}, [connected, activeFilterWheel?.name]);
	return (
		<>
			<Box sx={[LOCAL_STYLES.presetItem]}>
				<Typography sx={{ color: "white" }}>{s.general.train}</Typography>
				<Dropdown
					onChange={(e) =>
					{
						const payload = {
							name: e.label,
							module: "focus",
						};
						dispatch(opticalTrainActions.setTrain(payload));
						dispatch(opticalTrainActions.getAllTrains());
						dispatch(opticalTrainActions.getSelectedTrains());
					}}
					options={allTrains}
					value={activeTrain}
				/>
				<IconButton
					onClick={() => toggleOpticalTrain()}
					sx={[
						LOCAL_STYLES.imageButton,
						{ backgroundColor: "#FFFCFA1A", borderRadius: "4px" },
					]}
				>
					<EditIcon sx={{ color: "#CECECE", fontSize: 25 }} />
				</IconButton>
			</Box>
			<Box sx={[LOCAL_STYLES.presetItem]}>
				<Typography sx={{ color: "white" }}>TS.</Typography>
				<Dropdown
					onChange={(data) =>
					{
						setActiveSettings({
							...activeSettings,
							defaultFocusTemperatureSource: data.value,
						});
						dispatch(
							focusActions.setAllSettings({
								defaultFocusTemperatureSource: data.value,
							}),
						);
					}}
					options={temperatureSources}
					value={activeSettings.defaultFocusTemperatureSource}
					width="185px"
				/>
			</Box>
			<Box sx={[LOCAL_STYLES.presetItem]}>
				<Typography sx={{ color: "white" }}>{s.general.filter}</Typography>
				<Dropdown
					disabled={isEmpty(activeFilterWheel)}
					options={filtersList}
					value={isEmpty(activeFilterWheel) ? "--" : filter}
					onChange={(e) =>
					{
						setFilter(e.label);
					}}
					background="#1D1D1D"
					placeholder={s.general.select_option}
					width="100%"
				/>
			</Box>
			<Box sx={[LOCAL_STYLES.presetItem]}>
				<Typography sx={{ color: "white" }}>
					{s.ekos.collapse_focus.steps}
				</Typography>
				<CustomizedSwitch
					roundCorner={true}
					options={binningOptions}
					onChange={(value) =>
					{
						setBinning(value);
					}}
					value={binning}
				/>
			</Box>
			{get(activeCamera, "hasGain", false) && (
				<Box sx={[LOCAL_STYLES.presetItem]}>
					<Typography sx={{ color: "white" }}>{s.general.gain}</Typography>
					<NumericControl
						device={activeCamera}
						type={numericControls.GAIN}
						onChange={(e) =>
						{
							setGain(e);
						}}
						initialValue={gain}
					/>
				</Box>
			)}
		</>
	);
};

export default Preset;
