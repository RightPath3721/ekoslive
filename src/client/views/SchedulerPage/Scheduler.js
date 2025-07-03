import React, { memo, useEffect, useState } from "react";
import dayjs from "dayjs";
import { Box, Input, Typography, IconButton, Tooltip } from "@mui/material";
import SettingsIcon from "@mui/icons-material/Settings";
import ZoomOutMapIcon from "@mui/icons-material/ZoomOutMap";
import SnippetFolderIcon from "@mui/icons-material/SnippetFolder";
import SearchIcon from "@mui/icons-material/Search";
import AddIcon from "@mui/icons-material/Add";
import { get, isEmpty, isEqual } from "lodash";
import { useDispatch, useSelector } from "react-redux";
import { captureActions, ekosActions, schedulerActions } from "@redux/actions";
import {
	selectSchedulerSettings,
	selectSelectedTarget,
	selectConnected,
	selectConnectionOnline,
	selectSchedulerStatus,
	selectTrainDeviceName,
	selectJobs,
} from "@redux/selectors";
import s from "@common/shared/i18n/i18n";
import { removeWhiteSpace, toDMS, toHMS } from "@common/shared/common/common";
import { styles } from "../../shared/styles";
import {
	DEVICE_TYPE,
	ekosFileManager,
	SchedulerStates,
	trainModules,
} from "@indi/enums";
import GotoSync from "../MountPage/GotoORSync";
import MosaicPlanner from "./MosaicPlanner";
import Settings from "./Settings";
import DirectoryBrowser from "../../Components/DirectoryBrowser";
import PlaylistAddIcon from "@mui/icons-material/PlaylistAdd";
import Presets from "../CapturePage/Preset";
import Jobs from "./Jobs";
import { Palette } from "@common/shared/common/styles";
import StartButton from "@components/StartButton";

const ENUMS = {
	name: "nameEdit",
	sequence: "sequenceEdit",
	ra: "raBox",
	de: "decBox",
	fits: "fitsEdit",
};

const SchedulerText = ({ title, style = {} }) =>
{
	return <Typography sx={{ color: "white", ...style }}>{title}</Typography>;
};

const Scheduler = ({ settings: isSettings, jobEdit = false }) =>
{
	const dispatch = useDispatch();
	const online = useSelector(selectConnectionOnline);
	const kstarsConnected = useSelector(selectConnected);

	const schedulerStatus = useSelector(selectSchedulerStatus);
	const schedulerSettings = useSelector(selectSchedulerSettings);
	const selectedTarget = useSelector(selectSelectedTarget, isEqual);
	const previewPreset = useSelector((state) => state.presets.previewPreset);
	const overallStatus = useSelector(
		(state) => state.status.overallStatus.status,
	);
	const defaultDir = useSelector((state) =>
		get(state.ekos.files, "default", ""),
	);
	const isDirExist = useSelector((state) =>
		get(state.ekos.files, "exists.result", ""),
	);

	const activeCameraName = useSelector((state) =>
		selectTrainDeviceName(state, {
			trainType: trainModules.CaptureOpticalTrain,
			deviceType: DEVICE_TYPE.CAMERA,
		}),
	);
	const sequences = useSelector(selectJobs);
	const [state, setState] = useState({
		isRunning: false,
		directoryBrowser: false,
		directory: defaultDir,
		showMosaicModal: false,
		schedulerJobIndex: -1,
		showSchedulerSettings: false,
		isRunning: false,
	});
	const [showPreset, setShowPreset] = useState(false);
	const [filetype, setFiletype] = useState("*");
	const [goto, setGoto] = useState(false);
	const [settings, setSettings] = useState({
		target: "",
		ra0: 0,
		de0: 0,
		sequence: "",
	});

	const { showMosaicModal, isRunning, directory, directoryBrowser } = state;

	const { target, ra0, de0, sequence } = settings;

	const getSchedulerSettings = () =>
		dispatch(schedulerActions.getAllSettings());

	useEffect(() =>
	{
		setSettings({
			...settings,
			target: get(schedulerSettings, ENUMS.name, ""),
			ra0: get(schedulerSettings, ENUMS.ra, 0),
			de0: get(schedulerSettings, ENUMS.de, 0),
			sequence: get(schedulerSettings, ENUMS.sequence, ""),
		});
	}, [schedulerSettings, overallStatus]);

	useEffect(() =>
	{
		const newToggled =
			schedulerStatus !== SchedulerStates.SCHEDULER_IDLE &&
			schedulerStatus !== SchedulerStates.SCHEDULER_ABORTED;
		setState({
			...state,
			isRunning: newToggled,
		});
	}, [schedulerStatus, overallStatus]);

	/* If selected target is updated, update scheduler state */
	useEffect(() =>
	{
		if (kstarsConnected && !isEmpty(selectedTarget))
		{
			const name = get(selectedTarget, "name", "");
			const ra = toHMS(get(selectedTarget, "ra0", 0) * 15);
			const de = toDMS(get(selectedTarget, "de0", 0));
			setSettings((prevSettings) => ({
				...prevSettings,
				target: name,
				ra0: ra,
				de0: de,
			}));
			dispatch(
				schedulerActions.setAllSettings({
					[ENUMS.name]: name,
					[ENUMS.ra]: ra,
					[ENUMS.de]: de,
				}),
			);
		}
	}, [selectedTarget, kstarsConnected]);

	// get settings when scheduler is toggled
	useEffect(() =>
	{
		if (kstarsConnected)
		{
			getSchedulerSettings();
			dispatch(schedulerActions.getJobs());
		}
	}, [kstarsConnected]);

	//Sets the path for different text Input i.e for sequence and Fits fields
	const handleFileSelection = (path) =>
	{
		if (filetype === "esq") setSequence(path);
		else if (filetype === "fits")
		{
			setSettings((prevSettings) => ({
				...prevSettings,
				fits: path,
			}));
			dispatch(schedulerActions.setAllSettings({ [ENUMS.fits]: path }));
		}
	};

	const setSequence = (path) =>
	{
		setSettings({
			...settings,
			sequence: path,
		});
		dispatch(schedulerActions.setAllSettings({ [ENUMS.sequence]: path }));
	};

	// saves the current sequence as a file in homeDir/cameraName/filename
	const onSaveSequence = async () =>
	{
		try
		{
			const filename = "tmp" + "_" + dayjs().valueOf();
			const cameraName = removeWhiteSpace(activeCameraName);
			const directory = defaultDir + "/sequences/" + cameraName;
			const filepath = directory + "/" + filename + ".esq";
			dispatch(
				ekosActions.fileDirectoryOperation({
					path: directory,
					operation: ekosFileManager.EXISTS,
				}),
			);

			// If the directory already exist then do not create it again
			if (!isDirExist)
			{
				dispatch(
					ekosActions.fileDirectoryOperation({
						path: directory,
						operation: ekosFileManager.CREATE,
					}),
				);
			}
			dispatch(captureActions.saveSequenceFile(filepath));

			// Clear sequences
			dispatch(captureActions.clearSequences());

			// Add sequence
			setSequence(filepath);

			// close the preset editor
			setShowPreset(false);
		}
		catch (error)
		{
			console.log("onSaveSequence", error);
		}
	};

	if (showMosaicModal)
	{
		return (
			<MosaicPlanner
				open={showMosaicModal}
				onClose={() => setState({ ...state, showMosaicModal: false })}
			/>
		);
	}
	return (
		<Box
			sx={{
				borderWidth: "2px",
				borderColor: "white",
				padding: "20px",
			}}
		>
			{directoryBrowser && (
				<DirectoryBrowser
					show={directoryBrowser}
					toggle={() =>
						setState((prevState) => ({ ...prevState, directoryBrowser: false }))
					}
					dir={directory}
					fileExtension="esq"
					selection={handleFileSelection}
					isFile={true}
				/>
			)}
			{isSettings || get(state, "showSchedulerSettings", false) ? (
				<Settings
					jobIndex={get(state, "schedulerJobIndex", -1)}
					setState={() =>
						{
						if (get(state, "schedulerJobIndex", -1) !== -1)
							dispatch(ekosActions.invokeMethod("Scheduler", "addJob"));
						setState({
							...state,
							showSchedulerSettings: false,
							schedulerJobIndex: -1,
						});
					}}
				/>
			) : showPreset ? (
				<Presets
					preset={previewPreset}
					toggleEdit={false}
					onSaveSequence={() => onSaveSequence()}
					onClose={() =>
						{
						// Also clear the Added Sequences if user cancel it
						dispatch(captureActions.clearSequences());
						setShowPreset(false);
					}}
					isScheduler
				/>
			) : (
				<Box sx={[styles.row, { display: "flex", flex: 2 }]}>
					<Box sx={{ flex: 1 }}>
						<Box sx={[LOCAL_STYLES.gridItem]}>
							<SchedulerText
								style={{ width: "75px" }}
								title={s.general.target}
							/>
							<Input
								sx={[
									styles.text,
									LOCAL_STYLES.common,
									{
										width: "200px",
									},
								]}
								disableUnderline
								placeholder="M 31"
								value={target}
								onChange={(e) =>
									{
									setSettings({ ...settings, target: e.target.value });
								}}
								onBlur={(e) =>
									{
									dispatch(
										schedulerActions.setAllSettings({
											[ENUMS.name]: e.target.value,
										}),
									);
								}}
							/>
							<IconButton
								onClick={() => setGoto(true)}
								sx={[LOCAL_STYLES.imageButton]}
							>
								<SearchIcon sx={{ color: "#CECECE", fontSize: 20 }} />
							</IconButton>

							{!jobEdit && (
								<IconButton
									sx={[LOCAL_STYLES.imageButton]}
									onClick={() =>
										{
										setState({
											...state,
											showSchedulerSettings: true,
										});
									}}
								>
									<SettingsIcon sx={[LOCAL_STYLES.icon]} />
								</IconButton>
							)}
							{!jobEdit && (
								<IconButton
									onClick={() =>
										setState({
											...state,
											showMosaicModal: true,
										})
									}
									sx={[LOCAL_STYLES.imageButton]}
								>
									<ZoomOutMapIcon sx={LOCAL_STYLES.icon} />
								</IconButton>
							)}
						</Box>

						<Box sx={[LOCAL_STYLES.gridItem]}>
							<SchedulerText
								style={{ width: "75px" }}
								title={s.ekos.scheduler.j2000}
							/>
							<Box sx={[styles.row, { gap: "4px", alignItems: "center" }]}>
								<SchedulerText title={s.ekos.mount_status_bar.ra} />
								<Input
									sx={[
										styles.text,
										LOCAL_STYLES.common,
										{
											width: "140px",
										},
									]}
									disableUnderline
									placeholder="hh mm .."
									value={ra0}
									onChange={(e) =>
										{
										setSettings({ ...settings, ra0: e.target.value });
									}}
									onBlur={(e) =>
										{
										dispatch(
											schedulerActions.setAllSettings({
												[ENUMS.ra]: e.target.value,
											}),
										);
									}}
								/>
							</Box>
							<Box sx={[styles.row, { gap: "4px", alignItems: "center" }]}>
								<SchedulerText title={s.ekos.collapse_guide.dec} />
								<Input
									sx={[
										styles.text,
										LOCAL_STYLES.common,
										{
											width: "135px",
										},
									]}
									disableUnderline
									placeholder="dd mm .."
									value={de0}
									onChange={(e) =>
										{
										setSettings({ ...settings, de0: e.target.value });
									}}
									onBlur={(e) =>
										{
										dispatch(
											schedulerActions.setAllSettings({
												[ENUMS.de]: e.target.value,
											}),
										);
									}}
								/>
							</Box>
						</Box>

						<Box sx={[LOCAL_STYLES.gridItem]}>
							<SchedulerText title={s.ekos.collapse_sequence.sequence} />
							<Tooltip title={sequence || "none"}>
								<Input
									contentEditable={false}
									disableUnderline
									sx={[
										styles.text,
										{
											border: "1px solid grey",
											borderRadius: "4px",
											padding: "6px",
											textAlign: "center",
											width: "200px",
											overflowX: "auto", // Enable horizontal scrolling
											whiteSpace: "nowrap", // Prevent wrapping of text
										},
									]}
									value={sequence || "None"}
								/>
							</Tooltip>
							<Box sx={[LOCAL_STYLES.buttonBox]}>
								<IconButton
									sx={[LOCAL_STYLES.imageButton]}
									onClick={async () =>
										{
										setFiletype("esq");
										setState((prevState) => ({
											...prevState,
											directoryBrowser: true,
											directory: defaultDir,
										}));
									}}
								>
									<SnippetFolderIcon sx={[LOCAL_STYLES.icon]} />
								</IconButton>
								<IconButton
									sx={[LOCAL_STYLES.imageButton]}
									// disable add job if any job is running
									disabled={isRunning}
									onClick={() =>
										{
										dispatch(schedulerActions.addJobs());
									}}
								>
									<AddIcon sx={[LOCAL_STYLES.icon]} />
								</IconButton>
								{online && (
									<IconButton
										sx={[LOCAL_STYLES.imageButton]}
										// disable add job if any job is running
										onClick={() =>
											{
											setShowPreset(true);
										}}
									>
										<PlaylistAddIcon sx={[LOCAL_STYLES.icon]} />
									</IconButton>
								)}
							</Box>
						</Box>
						{!jobEdit && (
							<Box
								sx={{
									border: `1px solid ${Palette.grey22}`,
									width: "50%",
									marginTop: "15px",
									padding: "15px",
								}}
							>
								<Typography>{s.ekos.scheduler.start_jobs}</Typography>

								<Box sx={{ marginTop: "15px" }}>
									<StartButton
										inProgress={isRunning}
										start={() => dispatch(schedulerActions.toggleScheduler())}
										stop={() => dispatch(schedulerActions.toggleScheduler())}
										disabled={isEmpty(sequences)}
									/>
								</Box>
							</Box>
						)}
					</Box>

					{!jobEdit && (
						<Box sx={{ flex: 1 / 2 }}>
							<Jobs
								jobIndex={state.schedulerJobIndex}
								setSchedulerSetings={(index) =>
									{
									setState({
										...state,
										schedulerJobIndex: index,
										showSchedulerSettings: true,
									});
								}}
							/>
						</Box>
					)}
				</Box>
			)}
			{goto && (
				<GotoSync
					isScheduler
					open={goto}
					setSettings={(ra, de, name) =>
						setSettings({
							...settings,
							ra: ra,
							dec: de,
							target: name,
						})
					}
					close={() => setGoto(false)}
				/>
			)}
		</Box>
	);
};

const LOCAL_STYLES = {
	imageButton: {
		width: "40px",
		height: "40px",
		minWidth: "auto",
		padding: 0,
		backgroundColor: "#FFFCFA1A",
		borderRadius: "4px",
	},
	gridItem: {
		width: "100%",
		display: "flex",
		alignItems: "center",
		justifyContent: "flex-start",
		gap: "10px",
		marginTop: "10px",
	},
	common: {
		border: "1px solid grey",
		borderRadius: "4px",
		padding: "6px",
		width: "120px",
		textAlign: "center",
	},
	buttonBox: {
		display: "flex",
		flexDirection: "row",
		gap: "10px",
		justifyContent: "center",
	},
	icon: {
		color: "#CECECE",
		fontSize: 20,
	},
};

export default memo(Scheduler);
