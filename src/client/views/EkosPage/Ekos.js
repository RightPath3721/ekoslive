import { Box, Button, Grid, Typography } from "@mui/material";
import { isEmpty } from "lodash";
import React, { Suspense, cloneElement, useEffect, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { styles } from "../../shared/styles";
import OpticalTrains from "../../Components/OpticalTrains";
import RotatorControl from "../../Components/RotatorControl";
import MountQuickControls from "../MountPage/MountQuickControls";
import ScopeLens from "../Setup/ScopeLens";
import MainImage from "./MainImage";
import Statusbar from "./Statusbar";
import LeftDPad from "../../Components/SideDPad/LeftDPad";
import RightDPad from "../../Components/SideDPad/RightDPad";
import {
	guideActions,
	focusActions,
	alignActions,
	mountActions,
	opticalTrainActions,
	captureActions,
	schedulerActions,
	ekosActions,
} from "@redux/actions";
import { deviceActions } from "@redux/actions/devices.web.actions";
import Summary from "./Summary";
import CameraQcIcon from "@client/icons/modules/CameraQcIcon";
import CaptureModuleIcon from "@client/icons/modules/CaptureModuleIcon";
import IndiModuleIcon from "@client/icons/modules/IndiModuleIcon";
import MountModuleIcon from "@client/icons/modules/MountModuleIcon";
import MountQcIcon from "@client/icons/modules/MountQcIcon";
import ObservatoryIcon from "@client/icons/ObservatoryIcon";
import RotatorQcIcon from "@client/icons/modules/RotatorQcIcon";
import SchedulerModuleIcon from "@client/icons/modules/SchedulerModuleIcon";
import {
	selectMetadata,
	selectSocketsConnected,
	selectConnectionOnline,
	selectTrainDevice,
	selectCamerasCount,
	selectMountsCount,
	selectDomesCount,
	selectCapsCount,
	selectTrainDeviceName,
} from "@redux/selectors";
import { trainModules, DEVICE_TYPE } from "@indi/enums";
import EkosModal from "../../Components/EkosModal";
import ToolTips from "./ToolTips";
import s from "@common/shared/i18n/i18n";
import Histogram from "../../Components/Histogram";
import OverallStatus from "./OverallStatus";
import EkosModalLoader from "../../Components/EkosModalLoader";
import tourGuide from "@components/global/tourGuide";
import Polar from "../AlignPage/Polar";
import Settings from "../FocusPage/Settings";
import AlignSettings from "../AlignPage/Settings";
import GuideSettings from "../GuidePage/Settings";
import Advisor from "../FocusPage/Advisor";
import ManualPulse from "../GuidePage/ManualPulse";

const CameraQuickControls = React.lazy(
	() => import("../CapturePage/CameraQuickControls"),
);
const LiveStacking = React.lazy(() => import("../CapturePage/LiveStacking"));
const CameraSettings = React.lazy(
	() => import("../CapturePage/QucikCameraSettings"),
);
const RecordingSettings = React.lazy(
	() => import("../CapturePage/RecordingSettings"),
);

const modules = [
	{
		icon: <CaptureModuleIcon />,
		title: "Capture",
		component: React.lazy(() => import("../CapturePage/Capture")),
		status: false,
	},
	{
		icon: <MountModuleIcon />,
		title: "Mount",
		component: React.lazy(() => import("../MountPage/Mount")),
		status: false,
	},
	{
		icon: <ObservatoryIcon />,
		title: "Observatory",
		component: React.lazy(() => import("./Observatory")),
		status: false,
	},
	{
		icon: <SchedulerModuleIcon />,
		title: "Scheduler",
		component: React.lazy(() => import("../SchedulerPage/Scheduler")),
		status: false,
	},
	{
		icon: <IndiModuleIcon />,
		title: "INDI",
		component: React.lazy(() => import("../INDIControlPanel/INDIControlPanel")),
		status: false,
	},
];

const tourGuideSteps = [
	{
		selector: "#Focus",
		content: s.tourGuide.description_focus,
	},
	{
		selector: "#Align",
		content: s.tourGuide.description_align,
	},
	{
		selector: "#Guide",
		content: s.tourGuide.description_guide,
	},
	{
		selector: "#Capture",
		content: s.tourGuide.description_capture,
	},
	{
		selector: "#Mount",
		content: s.tourGuide.description_mount,
	},
	{
		selector: "#Observatory",
		content: s.tourGuide.description_observatory,
	},
	{
		selector: "#Scheduler",
		content: s.tourGuide.description_scheduler,
	},
	{
		selector: "#INDI",
		content: s.tourGuide.description_indi,
	},
	{
		selector: "#quickSetting",
		content: s.tourGuide.description_quick_controls,
	},
];

/**
 *
 * @param {*} name - Device name.
 * @returns {boolean} - True if device name is valid (not empty and not --).
 */
const isValidDeviceName = (name) =>
{
	return !isEmpty(name) && name !== "--";
};

const Ekos = ({ active }) =>
{
	const dispatch = useDispatch();

	const metadata = useSelector(selectMetadata);

	const cameraCount = useSelector(selectCamerasCount);

	const mountsCount = useSelector(selectMountsCount);
	const domeCount = useSelector(selectDomesCount);
	const capsCount = useSelector(selectCapsCount);

	const activeMountName = useSelector((state) =>
		selectTrainDeviceName(state, {
			trainType: trainModules.CaptureOpticalTrain,
			deviceType: DEVICE_TYPE.MOUNT,
		}),
	);
	const activeRotator = useSelector((state) =>
		selectTrainDevice(state, {
			trainType: trainModules.CaptureOpticalTrain,
			deviceType: DEVICE_TYPE.ROTATOR,
		}),
	);
	const socketsConnected = useSelector(selectSocketsConnected);
	// Ekos profile is running
	const ekosProfileRunnig = useSelector(selectConnectionOnline);

	const [state, setState] = useState({
		showRecordingSettings: false,
		showLiveStacking: false,
		showCameraSettings: false,
		activeSettings: 0,
		activeCanvasSettings: "",
		showTrains: false,
		showLensScope: false,
		showOverlay: false,
		showPAA: false,
		showAdvisor: false,
		showSummary: false,
		showSchedulerSettings: false,
		schedulerJobIndex: -1,
		captureSequenceIndex: -1,
		editCaptureSequence: false,
		showTargetGOTO: false,
		showManualPulse: false,
	});
	const [showHistogram, setShowHistogram] = useState(false);
	const [showSettings, setShowSettings] = useState(false);
	const [showFileSettings, setShowFileSettings] = useState(false);
	const [activeModal, setActiveModal] = useState(null);
	const [activeCanvas, setActiveCanvas] = useState(null);
	const [selectedDeviceName, setSelectedDeviceName] = useState("");
	const [selectedGroupName, setSelectedGroupName] = useState("");

	// keeps track of active groups for each device on indi module
	const [activeGroups, setActiveGroups] = useState({});

	const {
		showRecordingSettings,
		showOverlay,
		showTrains,
		showLensScope,
		showLiveStacking,
		activeSettings,
		showCameraSettings,
		showSummary,
		showTargetGOTO,
		showPAA,
		activeCanvasSettings,
		showAdvisor,
	} = state;

	const toggleOpticalTrains = () =>
	{
		setState({ ...state, showTrains: !showTrains });
	};
	const toggleFileSettings = () =>
	{
		setShowFileSettings(!showFileSettings);
	};

	const toggleLensScope = () =>
	{
		setState({ ...state, showLensScope: !showLensScope });
	};

	const QuickSettings = [
		{
			icon: <MountQcIcon width={8} height={16} />,
			title: "Mount",
			status: false,
			component: <MountQuickControls />,
		},
		{
			icon: <CameraQcIcon width={25} height={20} />,
			title: "Camera",
			status: false,
			component: (
				<CameraQuickControls
					toggleCameraSettings={() =>
						setState({ ...state, showCameraSettings: !showCameraSettings })
					}
				/>
			),
		},
		{
			icon: <RotatorQcIcon width={20} height={18} />,
			title: "Rotator",
			status: false,
			component: <RotatorControl />,
		},
	];

	const useEffectAsync = (effect, inputs) =>
	{
		useEffect(() =>
		{
			effect();
		}, inputs);
	};

	useEffectAsync(async () =>
	{
		if (socketsConnected && ekosProfileRunnig)
		{
			dispatch(deviceActions.getDevices());

			// Only get trains when we are online
			dispatch(opticalTrainActions.getAllTrains());
			dispatch(opticalTrainActions.getSelectedTrains());

			// // Get all Module settings
			dispatch(guideActions.getAllSettings());
			dispatch(focusActions.getAllSettings());
			dispatch(alignActions.getAllSettings());
			dispatch(mountActions.getAllSettings());
			dispatch(schedulerActions.getAllSettings());
			dispatch(captureActions.getAllSettings());
			dispatch(ekosActions.getDefaultFilePath({ type: 1 }));
		}
	}, [socketsConnected, ekosProfileRunnig]);

	if (!active) return null;

	return (
		<Grid
			container
			sx={{ backgroundColor: "#0f0e0e", height: "calc(100vh - 88px)" }}
		>
			<OverallStatus />

			<Grid xs={12} item sx={{ position: "relative" }}>
				<Box
					sx={{
						borderRadius: "8px",
						position: "relative",
						margin: "12px",
					}}
				>
					<Grid
						container
						style={{
							display: "flex",
							flexDirection: "row",
							gap: "20px",
							padding: "8px 12px",
							justifyContent: "space-between",
						}}
					>
						<Box sx={styles.row}>
							{modules.map((oneModule) =>
							{
								const isActiveModule = activeModal?.key === oneModule.title;
								let isDisplayed = true;
								switch (oneModule.title) {
									case "Capture":
										isDisplayed = cameraCount > 0;
										break;
									case "Mount":
										isDisplayed = mountsCount > 0;
										break;
									case "Observatory":
										isDisplayed = domeCount > 0 || capsCount > 0;
										break;
									case "INDI":
										isDisplayed = cameraCount > 0 || mountsCount > 0;
										break;

									default:
										break;
								}
								if (!isDisplayed) return null;

								return (
									<Button
										id={oneModule.title}
										sx={[styles.row, { gap: "6px" }]}
										disabled={!isEmpty(activeCanvasSettings)}
										onClick={() =>
										{
											if (isActiveModule)
											{
												setActiveModal(null);
												setShowSettings(false);
												return;
											}
											const Component = oneModule.component;
											setActiveModal(<Component key={oneModule.title} />);
											setShowSettings(false);
										}}
										key={oneModule.title}
									>
										<Box
											component="span"
											sx={[
												LOCAL_STYLES.moduleButtonBox,
												{
													backgroundColor: isActiveModule
														? "#FF660026"
														: "#FFFCFA1F",
												},
											]}
										>
											{cloneElement(oneModule.icon, {
												width: 25,
												height: 25,
												color: isActiveModule ? "#FF6600" : "#FFFCFA",
											})}
										</Box>
										<Typography
											component="span"
											sx={{
												textTransform: "none",
												color: isActiveModule ? "#FF6600" : "white",
											}}
										>
											{oneModule.title}
										</Typography>
									</Button>
								);
							})}
						</Box>

						{/* <Grid xs={4}> */}
						<Box sx={styles.row}>
							{QuickSettings.map((settings) =>
							{
								let isDisplayed = true;
								switch (settings.title) {
									case "Mount":
										isDisplayed = isValidDeviceName(activeMountName);
										break;
									case "Camera":
										isDisplayed = cameraCount > 0;
										break;
									case "Rotator":
										isDisplayed =
											!isEmpty(activeRotator) && settings.title === "Rotator";
										break;
									default:
										isDisplayed = false;
										break;
								}
								if (!isDisplayed)
								{
									return null;
								}
								else
									return (
										<Button
											onClick={() =>
											{
												if (activeSettings === settings.title)
													setState({ ...state, activeSettings: "" });
												else
													setState({
														...state,
														activeSettings: settings.title,
													});
											}}
											size="38"
											sx={{
												padding: 0,
												minWidth: "auto",
												width: "38px",
												height: "38px",
												marginRight: "10px",
												borderRadius: "4px",
												backgroundColor:
													activeSettings === settings.title
														? "#FF66001F"
														: "#FFFCFA1F",
											}}
											key={settings.title}
										>
											{cloneElement(settings.icon, {
												color:
													activeSettings === settings.title
														? "#FF6600"
														: "#FFFCFA",
											})}
										</Button>
									);
							})}
						</Box>
						{/* </Grid> */}
					</Grid>
					<Box sx={{ backgroundColor: "rgba(0,0,0,0.6)" }}>
						<MainImage
							showTargetGOTO={showTargetGOTO}
							showOverlay={showOverlay}
						/>

						{showSummary && <Summary />}
						{activeSettings === QuickSettings[0].title && (
							<>
								<Box sx={[LOCAL_STYLES.ldPadContainer, styles.center]}>
									<LeftDPad />
								</Box>
								<Box sx={[LOCAL_STYLES.rdPadContainer, styles.center]}>
									<RightDPad />
								</Box>
							</>
						)}
						{QuickSettings.map((settings) =>
						{
							if (activeSettings === settings.title)
								return (
									<Box
										sx={
											settings.title === "Camera"
												? {
														position: "absolute",
														top: "50%",
														bottom: 0,
														right: 0,
														transform: "translateX(-50%)",
														display: "flex",
														justifyContent: "center",
														alignItems: "center",
														height: "100px",
														width: "max-content",
													}
												: LOCAL_STYLES.bottomControls
										}
										key={settings.title}
									>
										{settings.component}
									</Box>
								);
							else return null;
						})}
					</Box>

					{activeModal &&
						!showSettings &&
						!showTrains &&
						!showLensScope &&
						!showPAA &&
						!showAdvisor && (
							<Box sx={LOCAL_STYLES.container}>
								{showSettings && !showTrains && !showLensScope ? (
									cloneElement(activeModal, {
										settings: showSettings,
										toggleSettings: setShowSettings,
										toggle: toggleOpticalTrains,
									})
								) : (
									<Suspense
										sx={{ backgroundColor: "red" }}
										fallback={<EkosModalLoader />}
									>
										{cloneElement(activeModal, {
											settings: showSettings,
											ekosState: state,
											setEkosState: setState,
											toggleSettings: setShowSettings,
											toggleOpticalTrain: toggleOpticalTrains,
											toggleFileSettings: toggleFileSettings,
											toggled: activeModal?.key === "INDI",
											selectedDeviceName,
											setSelectedDeviceName,
											selectedGroupName,
											setSelectedGroupName,
											activeGroups,
											setActiveGroups,
										})}
									</Suspense>
								)}
							</Box>
						)}

					<Histogram
						toggleHistogram={() => setShowHistogram(false)}
						toggled={showHistogram}
					/>
				</Box>
				{!activeModal &&
					!showPAA &&
					!showAdvisor &&
					isEmpty(activeCanvasSettings) && (
						<ToolTips
							setShowInfo={() =>
								setState({ ...state, showSummary: !showSummary })
							}
							setShowOverlay={() =>
								setState({ ...state, showOverlay: !showOverlay })
							}
							showTargetGOTO={showTargetGOTO}
							setShowTargetGOTO={() =>
								setState({ ...state, showTargetGOTO: !showTargetGOTO })
							}
							showInfo={showSummary}
							metadata={metadata}
							showOverlay={showOverlay}
							activeModule={activeCanvas}
							setShowHistogram={() => setShowHistogram(true)}
							setActiveModule={(module) =>
							{
								if (module.key === activeCanvas?.key)
								{
									setShowSettings(false);
									setActiveCanvas(null);
									return;
								}
								setActiveCanvas(module);
								setShowSettings(false);
							}}
						/>
					)}

				{activeCanvas &&
					!showPAA &&
					!showAdvisor &&
					!activeModal &&
					isEmpty(activeCanvasSettings) && (
						<EkosModal showXIcon={true}>
							{cloneElement(activeCanvas, {
								setShowPAA: () => setState({ ...state, showPAA: true }),
								setShowAdvisor: () =>
									setState({ ...state, showAdvisor: !showAdvisor }),
								toggleSettings: (name) =>
									setState({ ...state, activeCanvasSettings: name }),
								toggleOpticalTrain: toggleOpticalTrains,
							})}
						</EkosModal>
					)}

				{!isEmpty(activeCanvasSettings) && (
					<Box
						sx={[
							LOCAL_STYLES.container,
							{
								overflow: "scroll",
								height: "100%",
								padding: "15px",
							},
						]}
					>
						{activeCanvasSettings === "Focus" ? (
							<Settings
								onClose={() => setState({ ...state, activeCanvasSettings: "" })}
							/>
						) : activeCanvasSettings === "Align" ? (
							<AlignSettings
								onClose={() => setState({ ...state, activeCanvasSettings: "" })}
							/>
						) : activeCanvasSettings === "Pulse" ? (
							<ManualPulse
								onClose={() => setState({ ...state, activeCanvasSettings: "" })}
							/>
						) : (
							<GuideSettings
								onClose={() => setState({ ...state, activeCanvasSettings: "" })}
							/>
						)}
					</Box>
				)}

				{showPAA && (
					<Box
						sx={{
							position: "absolute",
							backgroundColor: "rgba(0,0,0,0.6)",
							top: "55px",
							height: "39rem",
							width: "100%",
							left: "-15px",
						}}
					>
						<Polar onClose={() => setState({ ...state, showPAA: false })} />
					</Box>
				)}
				{showAdvisor && (
					<Box
						sx={{
							position: "absolute",
							backgroundColor: "rgba(0,0,0,0.6)",
							top: "55px",
							height: "39rem",
							width: "100%",
							left: "-15px",
						}}
					>
						<Advisor
							onClose={() => setState({ ...state, showAdvisor: false })}
						/>
					</Box>
				)}
				{showFileSettings && !showSettings && (
					<EkosModal
						initialValue={{
							x: "30vh",
							y: "30vh",
						}}
						onClose={() => setShowFileSettings(false)}
						outsideClick={false}
					>
						{cloneElement(activeModal, {
							fileSettingsPopup: showFileSettings,
							toggleSettings: setShowFileSettings,
							toggleOpticalTrain: toggleOpticalTrains,
						})}
					</EkosModal>
				)}

				{showTrains && !showLensScope && (
					<OpticalTrains
						toggleScopeLens={toggleLensScope}
						close={toggleOpticalTrains}
					/>
				)}

				{showLensScope && (
					<ScopeLens
						toggleScopeLens={toggleLensScope}
						close={toggleOpticalTrains}
					/>
				)}

				{showRecordingSettings && <RecordingSettings />}

				{showLiveStacking && <LiveStacking />}

				{showCameraSettings && (
					<Box sx={[LOCAL_STYLES.bottomControls, { bottom: "2rem" }]}>
						<CameraSettings />
					</Box>
				)}
			</Grid>
			<Statusbar />
		</Grid>
	);
};

const LOCAL_STYLES = {
	ldPadContainer: {
		position: "absolute",
		left: "1%",
		top: "40%",
		zIndex: 2,
		flexDirection: "column",
	},
	rdPadContainer: {
		position: "absolute",
		right: "1%",
		top: "40%",
		zIndex: 2,
		flexDirection: "column",
	},
	moduleSettingsContainer: {
		position: "absolute",
		zIndex: 10,
		width: "fit-content",
		display: "grid",
		placeItems: "center",
		marginInline: "16px",
		border: "1px solid #FFFCFA24",
		borderRadius: "6px",
		padding: "6px 12px 12px 12px",
	},
	moduleButtonBox: {
		padding: "4px",
		borderRadius: "4px",
		width: "30px",
		height: "30px",
		display: "inline-grid",
		placeItems: "center",
	},
	bottomControls: {
		position: "absolute",
		bottom: 0,
		left: "50%",
		transform: "translateX(-50%)",
		display: "flex",
		justifyContent: "center",
		alignItems: "center",
		height: "100px",
		width: "max-content",
	},
	container: {
		position: "absolute",
		backgroundColor: "rgba(0,0,0,0.6)",
		top: "55px",
		height: "39rem",
		width: "100%",
		left: "-15px",
	},
};

export default tourGuide(Ekos, {
	steps: tourGuideSteps,
	key: "ekos",
});
