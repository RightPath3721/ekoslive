import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";
import EditIcon from "@mui/icons-material/Edit";
import InsertDriveFileRoundedIcon from "@mui/icons-material/InsertDriveFileRounded";
import DeleteIcon from "@mui/icons-material/Delete";
import AddIcon from "@mui/icons-material/Add";
import LibraryBooksIcon from "@mui/icons-material/LibraryBooks";
import AutoFixHighIcon from "@mui/icons-material/AutoFixHigh";
import SettingsIcon from "@mui/icons-material/Settings";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import StopQcIcon from "@client/icons/quick_controls/StopIcon";
import { useObservatoryRole } from "@components/providers/ObservatoryRoleProvider";
import get from "lodash/get";
import isEmpty from "lodash/isEmpty";
import React, { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
	captureActions,
	ekosActions,
	opticalTrainActions,
} from "@redux/actions";
import Dropdown from "@components/Dropdown";
import NumericControl from "@components/NumericControl";
import Settings from "./Settings";
import s from "@common/shared/i18n/i18n";
import {
	trainModules,
	Bins,
	frameTypes,
	DEVICE_TYPE,
	MetaType,
	Sync,
} from "@indi/enums";
import {
	selectTrains,
	selectTrainName,
	selectCameraNames,
	selectCapturePresets,
	selectCurrentPreset,
	selectPreviewPreset,
	selectCaptureSettings,
	selectFileSettings,
	selectTargetCalibrationSettings,
	selectSelectedProfile,
	selectTrainDevice,
	selectCaptureStatus,
	selectSequences,
	selectUser,
} from "@redux/selectors";
import FileSettings from "./FileSettings";
import Presets from "./Preset";
import useModalState from "@hooks/useModalState";
import ScreenRotationIcon from "@mui/icons-material/ScreenRotation";
import RotatorControl from "./RotatorControl";
import { isEqual } from "lodash";
import Sequence from "./Sequence";
import { styles } from "@client/shared/styles";
import DarkLibrarySetup from "./DarkLibrary/DarkLibrarySetup";
import OpticalTrains from "@components/OpticalTrains";
import ScopeLens from "../Setup/ScopeLens";
import SyncSettings from "@common/shared/utils/sync";
import config from "@client/config";
import { Can } from "@components/providers/AclProvider";
import StartButton from "@components/StartButton";
import { Palette } from "@common/shared/common/styles";
import SeqTimers from "./SeqTimers";

const LOCAL_STYLES = {
	btn: {
		width: "220px",
		height: "40px",
		marginLeft: "62px",
	},
	grid: {
		width: "100%",
		display: "grid",
		gridTemplateColumns: "1fr",
		rowGap: "12px",
		justifyItems: "center",
		position: "relative",
	},
	image: {
		width: "100%",
		height: "100%",
		maxWidth: "100%",
		marginLeft: "auto",
		marginRight: "auto",
		cursor: "pointer",
	},
	gridItem: {
		display: "grid",
		gridTemplateColumns: "50px 220px auto auto auto",
		justifyContent: "flex-start",
		alignItems: "center",
		width: "100%",
		marginTop: "10px",
		gap: ".75rem",
	},
	buttonBox: {
		display: "flex",
		flexDirection: "row",
		gap: ".875rem",
		justifyContent: "center",
	},
	imageButton: { width: "40px", height: "40px", minWidth: "auto", padding: 0 },
	icon: { color: "#CECECE", fontSize: "25px" },
	iconStyle: {
		backgroundColor: "#FFFCFA1A",
		borderRadius: "4px",
	},
};

const KEYS = {
	captureCountN: "captureCountN",
};

const Capture = ({ toggleSettings, toggleOpticalTrain }) =>
{
	const dispatch = useDispatch();
	const allTrains = useSelector(selectTrains);
	const activeTrain = useSelector((state) =>
		selectTrainName(state, { trainType: trainModules.CaptureOpticalTrain }),
	);
	const activeProfile = useSelector(selectSelectedProfile);
	const cameraNames = useSelector(selectCameraNames);

	const capturePresets = useSelector(selectCapturePresets, isEqual);
	const currentPreset = useSelector(selectCurrentPreset);
	const previewPreset = useSelector(selectPreviewPreset);
	const activeRotator = useSelector((state) =>
		selectTrainDevice(state, {
			trainType: trainModules.CaptureOpticalTrain,
			deviceType: DEVICE_TYPE.ROTATOR,
		}),
	);
	const isSyncAllowed = useSelector((state) => state.wsMessage.connected);
	const user = useSelector(selectUser);

	const captureSettings = useSelector(selectCaptureSettings);
	const targetCalibrationSettings = useSelector(
		selectTargetCalibrationSettings,
	);
	const fileSettings = useSelector(selectFileSettings);
	const status = useSelector(selectCaptureStatus);
	const sequences = useSelector(selectSequences);

	const [count, setCount] = useState(
		get(captureSettings, KEYS.captureCountN, 0),
	);
	const [isEdit, setIsEdit] = useState(false);
	const [state, setState] = useState({
		captureSequenceIndex: -1,
		editCaptureSequence: false,
		showDarkLibrary: false,
		showLensScope: false,
		showTrains: false,
		showSettings: false,
		showFileSettings: false,
	});
	const [showPreset, togglePreset] = useModalState();
	const [showRotator, toggleRotator] = useModalState();
	const observatoryRole = useObservatoryRole();

	const {
		showLensScope,
		showTrains,
		showSettings,
		showDarkLibrary,
		showFileSettings,
	} = state;

	const isCapturing =
		status !== "Idle" && status !== "Aborted" && status !== "Complete";
	const isSettingTemperature = status === "Setting Temperature";
	const isIdle = !isCapturing && !isSettingTemperature;
	const presetData = useMemo(() =>
	{
		// only gets the presets that have the current Cameras in the currently running profile
		let presets = [{ label: "Default", value: "Default" }];
		if (!isEmpty(capturePresets) && !isEmpty(activeTrain))
		{
			capturePresets.map((onePreset) =>
			{
				if (
					onePreset.train === activeTrain &&
					onePreset.profile === activeProfile &&
					get(onePreset, "deletedAt", undefined) === undefined
				)
					presets.push({
						label: onePreset.name,
						value: onePreset.name,
					});
			});
		}

		if (
			presets.find((object) => object.label === currentPreset) === undefined
		)
		{
			dispatch(captureActions.saveCurrentCapturePreset("Default"));
		}
		return presets;
	}, [activeProfile, activeTrain, capturePresets, currentPreset, dispatch]);

	const handleChange = (preset) =>
	{
		if (preset?.name)
		{
			dispatch(captureActions.saveCurrentCapturePreset(preset.name));
		}
		else
		{
			dispatch(captureActions.saveCurrentCapturePreset("Default"));
		}
	};

	/**
	 * Set settings for Count
	 * @param {*} key captureCountN
	 * @param {*} value 3
	 */
	const updateCaptureCount = (value) =>
	{
		setCount(value);
		dispatch(captureActions.setAllSettings({ [KEYS.captureCountN]: value }));
	};

	/**
	 * On add a sequence
	 * Configuration object for an astrophotography session.
	 * @typedef {object} preset
	 * @param {preset} preset - Preset configuration.
	 * @property {string} [FilterPosCombo] - The position of the filter wheel for the current filter.
	 * @property {string} [altBox] - The altitude box for the telescope.
	 * @property {string} [azBox] - The azimuth box for the telescope.
	 * @property {number} cameraTemperatureN - The temperature of the camera in degrees Celsius.
	 * @property {boolean} cameraTemperatureS - Whether the camera temperature is stabilized.
	 * @property {number} captureBinHN - The horizontal binning factor for image capture.
	 * @property {number} captureBinVN - The vertical binning factor for image capture.
	 * @property {number} captureCalibrationADUTolerance - The ADU tolerance for calibration.
	 * @property {number} captureCalibrationADUValue - The ADU value for calibration.
	 * @property {boolean} captureCalibrationDurationManual - Whether calibration duration is set manually.
	 * @property {boolean} captureCalibrationParkDome - Whether to park the dome during calibration.
	 * @property {boolean} captureCalibrationParkMount - Whether to park the mount during calibration.
	 * @property {boolean} captureCalibrationSkyFlats - Whether to capture sky flats during calibration.
	 * @property {boolean} captureCalibrationUseADU - Whether to use ADU for calibration.
	 * @property {boolean} captureCalibrationWall - Whether to use a wall for calibration.
	 * @property {number} captureCountN - The number of images to capture.
	 * @property {number} captureDelayN - The delay between captures in seconds.
	 * @property {string} captureEncodingS - The image encoding format (e.g., FITS).
	 * @property {number} captureExposureN - The exposure time in seconds.
	 * @property {string} captureFormatS - The image format (e.g., Mono, RGB).
	 * @property {number} captureFrameHN - The height of the captured frame in pixels.
	 * @property {number} captureFrameWN - The width of the captured frame in pixels.
	 * @property {number} captureFrameXN - The starting X coordinate of the captured frame.
	 * @property {number} captureFrameYN - The starting Y coordinate of the captured frame.
	 * @property {number} captureGainN - The camera gain setting.
	 * @property {string} captureISOS - The camera ISO setting.
	 * @property {number} captureOffsetN - The camera offset setting.
	 * @property {string} captureTypeS - The type of capture (e.g., Light, Dark, Flat).
	 * @property {boolean} darkB - Whether to capture dark frames.
	 * @property {boolean} enforceAutofocusHFR - Whether to enforce autofocus based on high-frequency response.
	 * @property {boolean} enforceAutofocusOnTemperature - Whether to enforce autofocus based on temperature changes.
	 * @property {boolean} enforceGuideDeviation - Whether to enforce a guide deviation limit.
	 * @property {boolean} enforceRefocusEveryN - Whether to refocus every N images.
	 * @property {boolean} enforceStartGuiderDrift - Whether to enforce a starting guider drift.
	 * @property {string} fileDirectoryT - The directory where captured images are saved.
	 * @property {string} fileRemoteDirT - The directory for remote image storage.
	 * @property {string} fileUploadModeS - The mode for uploading images (e.g., Locally, Remotely).
	 * @property {number} formatSuffixN - The format suffix for image filenames.
	 * @property {number} guideDeviation - The target guide deviation.
	 * @property {number} guideDeviationReps - The number of guide deviation repetitions.
	 * @property {number} guideDitherPerJobFrequency - The frequency of dithering within a job.
	 * @property {string} hFRCheckAlgorithm - The algorithm for checking high-frequency response.
	 * @property {number} hFRDeviation - The high-frequency response deviation.
	 * @property {number} hFRThresholdPercentage - The high-frequency response threshold percentage.
	 * @property {number} inSequenceCheckFrames - The number of frames to check in sequence.
	 * @property {number} maxFocusTemperatureDelta - The maximum allowed temperature delta for refocusing.
	 * @property {string} opticalTrainCombo - The optical train combination.
	 * @property {string} placeholderFormatT - The placeholder format for image filenames.
	 * @property {string} postCaptureScript - The script to run after each capture.
	 * @property {string} postJobScript - The script to run after a job completes.
	 * @property {string} preCaptureScript - The script to run before each capture.
	 * @property {string} preJobScript - The script to run before a job starts.
	 * @property {boolean} refocusAfterMeridianFlip - Whether to refocus after a meridian flip.
	 * @property {number} refocusEveryN - Refocus every N images.
	 * @property {number} startGuideDeviation - The starting guide deviation.
	 * @property {string} targetNameT - The name of the target being imaged.
	 * @property {number} frameType - The frame type.
	 * @property {number} bin - The binning factor.
	 * @property {number} exp - The exposure time (alternative notation).
	 * @property {number} captureFormat - The image format (alternative notation).
	 * @property {number} transferFormat - The transfer format.
	 * @property {number} temperature - The camera temperature (alternative notation).
	 * @property {number} gain - The camera gain (alternative notation).
	 * @property {number} offset - The camera offset (alternative notation).
	 * @property {number} ditherPerJobFrequency - The frequency of dithering within a job (alternative notation).
	 * @property {string} name - The preset name.
	 * @property {string} filter - The filter name.
	 */
	const onAddSequence = (preset) =>
	{
		let finalPreset = preset;

		// if preset isEmpty for whatever reason or it has only name, send default captureSettings
		if (
			isEmpty(preset) ||
			Object.keys(preset ?? {}).every((key) => key === "name")
		)
		{
			finalPreset = { ...captureSettings, name: "Default" };
		}

		// Get frame type as a text i.e Light
		const frame = frameTypes.filter(
			(data) => data.value === get(finalPreset, "frameType", 0),
		);

		// Get Active bin as text i.e "1x1"
		let bin = Bins.filter((data) => data.value === get(finalPreset, "bin", 1));
		bin = get(bin[0], "text", "1x1");
		bin = bin.split("x");

		// Bin has seperated values so split and get the values for H and V
		let payload = {
			captureTypeS: get(frame[0], "label", "Light"),
			captureBinHN: bin[0],
			captureBinVN: bin[1],
			captureExposureN: get(finalPreset, "exp", 1),
			cameraTemperatureN: get(finalPreset, "temperature", "--"),
			captureCountN: get(finalPreset, "count", 1),
			// Force temperature cooling if the temperature is not "--"
			cameraTemperatureS: get(finalPreset, "temperature", "--") != "--",
			captureGainN: get(finalPreset, "gain", "--"),
			captureOffsetN: get(finalPreset, "offset", "--"),
			FilterPosCombo: get(finalPreset, "filter", "--"),
			captureFormatS: get(finalPreset, "captureFormat", "--"),
			darkB: get(finalPreset, "dark", false),
			guideDitherPerJobFrequency: get(finalPreset, "ditherPerJobFrequency", 1),
			captureISOS: get(finalPreset, "iso", "--"),
			captureEncodingS: get(finalPreset, "transferFormat", "--"),
			captureCountN: count,
		};
		dispatch(captureActions.setAllSettings(payload));
		dispatch(captureActions.addSequence());
	};

	/**
	 * Capture a sequence
	 */
	const captureSequence = () =>
	{
		if (isIdle)
		{
			if (isEmpty(sequences))
			{
				const preset = capturePresets.find(
					(item) => item.name === currentPreset,
				);
				onAddSequence(preset, "fileSettings", targetCalibrationSettings);
			}

			dispatch(captureActions.start());
		}
		else if (isCapturing || isSettingTemperature)
		{
			dispatch(captureActions.stop());
		}
	};

	const deletePreset = (name) =>
	{
		// set the current preset to Default
		dispatch(captureActions.saveCurrentCapturePreset("Default"));
		let preset = {};
		for (const onePreset of capturePresets)
		{
			if (onePreset.name === name)
			{
				preset = { ...onePreset, deletedAt: +new Date() };
			}

			dispatch(captureActions.updateCapturePreset(preset));
		}
	};

	/**
	 * Edit a sequence
	 * @param {*} index Index number of the sequence
	 */
	const editSequence = (index) =>
	{
		dispatch(
			ekosActions.invokeMethod("Camera", "modifyJob", [
				{ type: MetaType.Int, value: index },
			]),
		);
	};

	useEffect(() =>
	{
		dispatch(opticalTrainActions.getAllTrains());
	}, []);

	const useEffectAsync = (effect, inputs) =>
	{
		useEffect(() =>
		{
			effect();
		}, inputs);
	};

	useEffectAsync(async () =>
	{
		if (!isEmpty(capturePresets) && isSyncAllowed)
		{
			await SyncSettings({
				type: Sync.PRESET,
				data: capturePresets,
				updaterAction: (array) =>
					dispatch(captureActions.saveCapturePresets(array)),
				username: get(user, "username", null),
				token: get(user, "token", null),
				URL: config.EKOSLIVE_URL,
			});
		}
	}, [capturePresets]);

	if (showPreset || get(state, "editCaptureSequence", false))
	{
		return (
			<Presets
				preset={
					capturePresets.find((item) => item.name === currentPreset) ??
					(cameraNames.includes(previewPreset.camera)
						? previewPreset
						: captureSettings)
				}
				onClose={() =>
				{
					setState({
						...state,
						editCaptureSequence: false,
						captureSequenceIndex: -1,
					});
					togglePreset();
				}}
				sequenceEdit={get(state, "editCaptureSequence", false)}
				toggleEdit={isEdit}
				index={get(state, "captureSequenceIndex", -1)}
			/>
		);
	}
	return (
		<Box sx={{ padding: "20px" }}>
			{showSettings ? (
				<Settings onClose={() => setState({ ...state, showSettings: false })} />
			) : showFileSettings ? (
				<FileSettings
					onClose={() => setState({ ...state, showFileSettings: false })}
				/>
			) : showRotator ? (
				<RotatorControl />
			) : showDarkLibrary ? (
				<DarkLibrarySetup
					onClose={() => setState({ ...state, showDarkLibrary: false })}
					toggleTrains={() => setState({ ...state, showTrains: true })}
				/>
			) : (
				<Box sx={[styles.row, { display: "flex", flex: 2 }]}>
					<Box sx={{ flex: 1 }}>
						<Box sx={[LOCAL_STYLES.gridItem]}>
							<Typography>{s.general.train}</Typography>
							<Dropdown
								onChange={(e) =>
									{
									const payload = {
										name: e.label,
										module: "capture",
									};
									dispatch(opticalTrainActions.setTrain(payload));
									dispatch(opticalTrainActions.getAllTrains());
									dispatch(opticalTrainActions.getSelectedTrains());
								}}
								width="100%"
								options={allTrains}
								value={activeTrain}
							/>

							<IconButton
								onClick={toggleOpticalTrain}
								sx={[
									LOCAL_STYLES.imageButton,
									{ backgroundColor: "#FFFCFA1A", borderRadius: "4px" },
								]}
							>
								<EditIcon sx={{ color: "#CECECE", fontSize: 25 }} />
							</IconButton>

							<Can
								action="owner"
								subject="Observatory"
								object={{ userRole: observatoryRole }}
							>
								<IconButton
									onClick={() => setState({ ...state, showFileSettings: true })}
									sx={[LOCAL_STYLES.imageButton, LOCAL_STYLES.iconStyle]}
								>
									<InsertDriveFileRoundedIcon sx={LOCAL_STYLES.icon} />
								</IconButton>
							</Can>

							{!isEmpty(activeRotator) && (
								<IconButton
									onClick={() => toggleRotator()}
									sx={[LOCAL_STYLES.imageButton, LOCAL_STYLES.iconStyle]}
								>
									<ScreenRotationIcon sx={LOCAL_STYLES.icon} />
								</IconButton>
							)}
						</Box>

						<Box sx={[LOCAL_STYLES.gridItem]}>
							<Typography>{s.general.preset}</Typography>
							<Dropdown
								onChange={(e) =>
									{
									// we searched for the selected preset in the alignPresets redux state array
									// and we store it in target
									let target = capturePresets.find((item) =>
										{
										return item.name === e.label;
									});
									// if the value is Default then just update settings in ekos to alignSettings,
									// else use the target preset
									if (e.label === "Default") handleChange(captureSettings);
									else handleChange(target);
									dispatch(captureActions.saveCurrentCapturePreset(e.label));
								}}
								width="100%"
								options={presetData}
								value={currentPreset}
							/>
							<IconButton
								onClick={() =>
									{
									setIsEdit(false);
									toggleSettings();
									togglePreset();
								}}
								sx={[
									LOCAL_STYLES.imageButton,
									{ backgroundColor: "#FFFCFA1A", borderRadius: "4px" },
								]}
							>
								<AddIcon sx={LOCAL_STYLES.icon} />
							</IconButton>
							<IconButton
								onClick={() =>
									{
									setIsEdit(true);
									togglePreset();
								}}
								sx={[
									LOCAL_STYLES.imageButton,
									{ backgroundColor: "#FFFCFA1A", borderRadius: "4px" },
								]}
								disabled={currentPreset === "Default"}
							>
								<EditIcon sx={LOCAL_STYLES.icon} />
							</IconButton>
							<IconButton
								disabled={isEmpty(currentPreset) || currentPreset === "Default"}
								onClick={() =>
									{
									deletePreset(currentPreset);
								}}
								sx={[
									LOCAL_STYLES.imageButton,
									{ backgroundColor: "#FFFCFA1A", borderRadius: "4px" },
								]}
							>
								<DeleteIcon sx={LOCAL_STYLES.icon} />
							</IconButton>
						</Box>

						<Box sx={[LOCAL_STYLES.gridItem]}>
							<Typography>{s.general.count}</Typography>
							<NumericControl
								initialValue={count}
								steps={[1, 1]}
								customLimit={[1, 100000]}
								onChange={(val) => updateCaptureCount(val)}
								width="100%"
							/>
							<IconButton
								onClick={() =>
									setState({
										...state,
										showDarkLibrary: !state.showDarkLibrary,
									})
								}
								sx={[
									LOCAL_STYLES.imageButton,
									{ backgroundColor: "#FFFCFA1A", borderRadius: "4px" },
								]}
							>
								<LibraryBooksIcon sx={LOCAL_STYLES.icon} />
							</IconButton>

							<IconButton
								onClick={() =>
									{
									dispatch(captureActions.generateDarkFlats());
								}}
								sx={[
									LOCAL_STYLES.imageButton,
									{ backgroundColor: "#FFFCFA1A", borderRadius: "4px" },
								]}
							>
								<AutoFixHighIcon sx={LOCAL_STYLES.icon} />
							</IconButton>

							<IconButton
								onClick={() =>
									{
									setState({ ...state, showSettings: true });
								}}
								sx={[
									LOCAL_STYLES.imageButton,
									{ backgroundColor: "#FFFCFA1A", borderRadius: "4px" },
								]}
							>
								<SettingsIcon sx={LOCAL_STYLES.icon} />
							</IconButton>
						</Box>

						<Box
							sx={[
								LOCAL_STYLES.gridItem,
								{
									display: "flex",
									flex: 1,
									flexDirection: "row",
								},
							]}
						>
							<Button
								sx={LOCAL_STYLES.btn}
								variant="contained"
								onClick={() =>
									{
									let preset = capturePresets.find((item) =>
										{
										return item.name === currentPreset;
									});
									onAddSequence(
										preset,
										fileSettings,
										targetCalibrationSettings,
									);
								}}
							>
								{s.ekos.collapse_camera.btn_add_to_sequence}
							</Button>
						</Box>

						<Box
							sx={{
								border: `1px solid ${Palette.grey22}`,
								width: "50%",
								marginTop: "15px",
								padding: "15px",
							}}
						>
							<Typography>{s.ekos.scheduler.start_jobs}</Typography>

							<Box sx={[styles.row, { marginTop: "15px" }]}>
								<StartButton
									inProgress={!isIdle}
									start={captureSequence}
									stop={captureSequence}
								/>

								<SeqTimers
									isCapturing={isCapturing}
									isSettingTemperature={isSettingTemperature}
								/>
							</Box>
						</Box>
					</Box>
					<Box sx={{ flex: 1 / 2 }}>
						<Sequence
							setPreset={(index) =>
								{
								editSequence(index);
								setState({
									...state,
									editCaptureSequence: true,
									captureSequenceIndex: index,
								});
							}}
						/>
					</Box>
				</Box>
			)}
			{showTrains && !showLensScope && (
				<OpticalTrains
					toggleScopeLens={() => setState({ ...state, showLensScope: false })}
					close={() => setState({ ...state, showTrains: false })}
				/>
			)}

			{showLensScope && (
				<ScopeLens
					toggleScopeLens={() =>
					{
						setState({ ...state, showLensScope: true });
					}}
					close={() => setState({ ...state, showLensScope: false })}
				/>
			)}
		</Box>
	);
};

export default Capture;
