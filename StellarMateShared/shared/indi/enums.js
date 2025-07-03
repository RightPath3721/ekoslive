import s from "../i18n/i18n";

export const IPPerm = {
	IP_RO: 0,
	IP_WO: 1,
	IP_RW: 2,
};

export const IPState = {
	IPS_IDLE: 0,
	IPS_OK: 1,
	IPS_BUSY: 2,
	IPS_ALERT: 3,
};

export const ISState = {
	ISS_OFF: 0,
	ISS_ON: 1,
};

export const ISRule = {
	ISR_1OFMANY: 0,
	ISR_ATMOST1: 1,
	ISR_NMANY: 2,
};

export const deviceType = {
	MOUNT: 0,
	CAMERA: 1,
	GUIDER: 2,
	FOCUSER: 3,
	FILTER: 4,
	DOME: 5,
	GPS: 6,
	WEATHER: 7,
	AO: 8,
	DUSTCAP: 9,
	LIGHTBOX: 10,
	DETECTOR: 11,
	ROTATOR: 12,
	SPECTROGRAPH: 13,
	CORRELATOR: 14,
	AUX: 15,
};

export const Communication = {
	Idle: 0,
	Pending: 1,
	Success: 2,
	Error: 3,
};

export const flatSource = {
	MANUAL: 0,
	DUST_COVER_BUILT_IN_FLAT_LIGHT: 1,
	DUST_COVER_EXTERNAL_FLAT_LIGHT: 4,
	WALL: 2,
};

export const FlatDuration = {
	MANUAL: 0,
	ADU: 1,
};

export const autoDetect = {
	IDLE: 0,
	RUNNING: 1,
	SELECTION: 2,
};

export const numericControls = {
	EXPOSURE: 0,
	TEMPERATURE: 1,
	GAIN: 2,
	OFFSET: 3,
	ACCURACY: 4,
	FOCUS_STEPS: 5,
};

export const jobStartup = {
	ASAP: 0,
	CULMINATION_OFFSET: 1,
	ON: 2,
};

export const pierSide = {
	WEST: 0,
	EAST: 1,
};

export const jobCompletion = {
	COMPLETION: 0,
	REPEAT_FOR_RUNS: 1,
	REPEAT_UNTIL_TERMINATED: 2,
	REPEAT_UNTIL_DATE: 3,
};

export const jobShutdown = {
	NONE: 0,
	QUEUE: 1,
	IMMEDIATE: 2,
};

export const planType = {
	PRO_PLAN: "1",
	DEFAULT: "2",
	ULTIMATE: "3",
	PRO_MONTHLY: "4",
	ULTIMATE_MONTHLY: "5",
};

export const defaultVersion = {
	kstars: "3.6.0",
	python: "3.10.0",
	stellarmate: "1.8.0",
};

export const trainModules = {
	PrimaryOpticalTrain: 0,
	CaptureOpticalTrain: 1,
	FocusOpticalTrain: 2,
	MountOpticalTrain: 3,
	GuideOpticalTrain: 4,
	AlignOpticalTrain: 5,
	DarkLibraryOpticalTrain: 6,
};

export const tourGuideZones = {
	DevicesList: 1,
	DeviceManagement: 2,
	ProfileManager: 3,
	PortSelector: 4,
	OpticalTrains: 5,
	WeatherBar: 6,
	CloudReport: 7,
	Next: 7.1,

	Focus: 8,
	FocusAdvisor: 8.1,
	FocusSteps: 8.2,
	FocusSize: 8.3,
	FocusExposure: 8.4,
	FocusDrag: 8.5,
	Align: 9,

	PAA: 9.1,
	LoadSlew: 9.2,
	AlignDrag: 9.3,
	AlignStatus: 9.4,

	BasicPAA: 9.5,
	PAAHeading: 9.6,
	BasicToggle: 9.7,
	PAAControls: 9.8,
	PAAMessage: 9.9,

	Guide: 10,
	GuideCapture: 10.1,
	GuideStatus: 10.2,
	GuideDrag: 10.3,
	Capture: 11,
	Mount: 12,
	Observatory: 13,
	Scheduler: 14,
	Indi: 15,
	QuickControls: 16,

	TargetsInfo: 17,
	SearchBar: 18,
	DateTime: 19,
	Filters: 20,
	ObjectInfo: 21,
	FOV: 22,
	Solve: 23,

	BasicTargets: 23.1,
	TargetOverlay: 23.2,
	TargetsObject: 23.3,
	TargetsFOV: 23.4,
	TargetsAction: 23.5,
	TargetsSearch: 23.6,

	Preview: 24,
	Framing: 25,
	Live_video: 26,
	Stop: 27,
	Live_stack: 28,
	QC_settings: 29,

	StellaInfo: 30,
	StellaExamples: 31,
	StellaChat: 32,
	StellaInput: 33,
	StellaControls: 34,

	BasicFocus: 34.1,
	BasicFocusSettings: 34.2,
	BasicFocusGraph: 34.3,
	BasicFocusImage: 34.4,

	BasicGuide: 34.5,
	BasicGuideSettings: 34.6,
	BasicGuideGraph: 34.7,
	BasicGuideImage: 34.8,

	BasicCapture: 34.9,
	BasicCaptueSettings: 35,
	BasicCaptureSequence: 35.1,
	BasicCaptureStart: 35.2,

	BasicSummary: 35.3,
	BasicHistogram: 35.4,
};

export const tourGuideScreens = {
	ProfileManager: 1,
	Ekos: 2,
	Align: 2.1,
	Guide: 2.2,
	Focus: 2.3,
	Targets: 3,
	QuickControls: 4,
	Stella: 5,
	BasicPAA: 6,
	BasicTargets: 7,
	BasicFocus: 8,
	BasicGuide: 9,
	BasicCapture: 10,
	BasicSummary: 11,
};

export const CalibrationPreActions = {
	ACTION_NONE: 1 << 0,
	ACTION_WALL: 1 << 1,
	ACTION_PARK_MOUNT: 1 << 2,
	ACTION_PARK_DOME: 1 << 3,
};

export const Severity = {
	DEBUG: 0,
	INFO: 1,
	WARNING: 2,
	CRITICAL: 3,
};

export const Source = {
	General: 0,
	INDI: 1,
	Capture: 2,
	Focus: 3,
	Align: 4,
	Mount: 5,
	Guide: 6,
	Observatory: 7,
	Scheduler: 8,
};

export const MetaType = {
	Invalid: 0,
	Bool: 1,
	Int: 2,
	UInt: 3,
	LongLong: 4,
	ULongLong: 5,
	Double: 6,
	Char: 7,
	Map: 8,
	List: 9,
	String: 10,
	StringList: 11,
	ByteArray: 12,
	BitArray: 13,
	Date: 14,
	Time: 15,
	DateTime: 16,
	Url: 17,
	Locale: 18,
	Rect: 19,
	RectF: 20,
	Size: 21,
	SizeF: 22,
	Line: 23,
	LineF: 24,
	Point: 25,
	PointF: 26,
	RegExp: 27,
	RegularExpression: 28,
	Hash: 29,
};

export const Verbose = {
	verbose: 0,
	regular: 1,
	disable: 2,
};

export const directionTypes = {
	North: 0,
	East: 1,
	South: 2,
	West: 3,
	All: 4,
};

export const objectTypes = {
	Stars: 0,
	Planets: 2,
	"Open Clusters": 3,
	"Globular Clusters": 4,
	"Gaseous Nebulae": 5,
	"Planetary Nebulae": 6,
	Galaxies: 8,
	Comets: 9,
	Asteroids: 10,
	Supernovae: 20,
};

export const SchedulerStates = {
	SCHEDULER_IDLE: 0,
	SCHEDULER_STARTUP: 1,
	SCHEDULER_RUNNING: 2,
	SCHEDULER_PAUSED: 3,
	SCHEDULER_SHUTDOWN: 4,
	SCHEDULER_ABORTED: 5,
	SCHEDULER_LOADING: 6,
};

export const DragSettings = {
	CURVE: 0,
	FITS: 1,
	QSETTINGS: 3,
};

export const ModuleSettings = {
	TRAIN: 0,
	FOCUS: 1,
	ALIGN: 2,
	GUIDE: 3,
};

export const ModuleNames = {
	focus: "focus",
	align: "align",
	guide: "guide",
	scheduler: "scheduler",
	capture: "capture",
};

/**
 * These keys are used in state.ekos.currentModule
 * F: Focus
 * G: Guide
 * A: Align
 * C: Capture
 * S Scheduler
 *
 * Require key and it's index so we can set the active tab in Mobile App Ekos Logs Drawer
 */
export const LOGS = [
	{ key: "F", index: 0, name: "Focus" },
	{ key: "G", index: 1, name: "Guide" },
	{ key: "A", index: 2, name: "Align" },
	{ key: "C", index: 3, name: "Capture" },
	{ key: "S", index: 4, name: "Scheduler" },
	{ key: "O", index: 5, name: "Observatory" },
	{ key: "I", index: 6, name: "INDI" },
	{ key: "M", index: 7, name: "Mount" },
	{ key: "L", index: 8, name: "Logs" },
	{ key: "SM", index: 7, name: "Summary" },
];

export const DEVICE_TYPE = {
	MOUNT: "mount",
	CAMERA: "camera",
	FOCUSER: "focuser",
	LIGHTBOX: "lightbox",
	ROTATOR: "rotator",
	GUIDER: "guider",
	FILTER_WHEEL: "filterwheel",
	DUSTCAP: "dustcap",
};

export const Routes = {
	SETUP: "Setup",
	EKOS: "Ekos",
	SKY: "Sky",
	TARGETS: "Targets",
	STELLA: "Stella",
	DEVICE: "Device",
	VIEW: "View",
	POWER: "Power",
	SANDBOX: "Sandbox",
	SETTINGS: "Settings",
};

export const ParkOptions = {
	PARK_CURRENT: "PARK_CURRENT",
};

export const TooltipType = {
	WIFI: "WIFI",
	Format: "Format",
	Suffix: "Suffix",
	PAA: "PAA",
	REMOTE: "REMOTE",
	StellaTargets: "StellaTargets",
	StellaView: "StellaView",
};

// Type of frames
export const frameTypes = [
	{
		text: "type_light",
		value: 0,
		label: "Light",
	},
	{
		text: "type_bias",
		value: 1,
		label: "Bias",
	},
	{
		text: "type_dark",
		value: 2,
		label: "Dark",
	},
	{
		text: "type_flat",
		value: 3,
		label: "Flat",
	},
];

// Binnings
export const Bins = [
	{ text: "1x1", value: 1 },
	{ text: "2x2", value: 2 },
	{ text: "4x4", value: 4 },
];

/**
 * Array used in Dropdown for Profile Advanced Settings
 */
export const ProfileGuidingArray = [
	{ text: "Internal", value: 0 },
	{ text: "PHD2", value: 1 },
];

export const ProfileGuiding = {
	INTERNAL: "Internal",
	PHD2: "PHD2",
};

export const ProfileMode = {
	LOCAL: "local",
	REMOTE: "remote",
};

export const SchedulerJobStatus = {
	IDLE: 0,
	EVALUATION: 1,
	SCHEDULED: 2,
	RUNNING: 3,
	ERROR: 4,
	ABORTED: 5,
	INVALID: 6,
	COMPLETED: 7,
};

export const AdvisorStages = {
	UPDATE_PARAMETERS: 1,
	FIND_STARS: 2,
	COARSE_ADJUSTMENT: 3,
	FINE_ADJUSTMENT: 4,
};

// Profile manager's Tour guide title and description
export const ProfileManager = [
	{
		title: s.tourGuide.title_devices_list,
		description: s.tourGuide.description_devices_list,
		value: 1,
	},
	{
		title: s.tourGuide.title_device_actions,
		description: s.tourGuide.description_device_actions,
		value: 2,
	},
	{
		title: s.tourGuide.title_profiles,
		description: s.tourGuide.description_profiles,
		value: 3,
	},
	{
		title: s.tourGuide.title_port_selector,
		description: s.tourGuide.description_port_selector,
		value: 4,
	},
	{
		title: s.tourGuide.title_trains,
		description: s.tourGuide.description_trains,
		value: 5,
	},
	{
		title: s.tourGuide.title_weather_bar,
		description: s.tourGuide.description_weather_bar,
		value: 6,
	},
	{
		title: s.tourGuide.title_cloud_report,
		description: s.tourGuide.description_cloud_report,
		value: 7,
	},
	{
		title: s.tourGuide.title_next,
		description: s.tourGuide.description_next,
		value: 7.1,
	},
];

// Ekos's Tour guide title and description
export const Ekos = [
	{
		title: s.tourGuide.title_focus,
		description: s.tourGuide.description_focus,
		value: 8,
	},
	{
		title: s.tourGuide.title_align,
		description: s.tourGuide.description_align,
		value: 9,
	},
	{
		title: s.tourGuide.title_guide,
		description: s.tourGuide.description_guide,
		value: 10,
	},
	{
		title: s.tourGuide.title_capture,
		description: s.tourGuide.description_capture,
		value: 11,
	},
	{
		title: s.tourGuide.title_mount,
		description: s.tourGuide.description_mount,
		value: 12,
	},
	{
		title: s.tourGuide.title_observatory,
		description: s.tourGuide.description_observatory,
		value: 13,
	},
	{
		title: s.tourGuide.title_scheduler,
		description: s.tourGuide.description_scheduler,
		value: 14,
	},
	{
		title: s.tourGuide.title_indi,
		description: s.tourGuide.description_indi,
		value: 15,
	},
	{
		title: s.tourGuide.title_quick_controls,
		description: s.tourGuide.description_quick_controls,
		value: 16,
	},
];

// Align Tour guide
export const Align = [
	{
		title: s.ekos.collapse_polar.heading,
		description: s.tourGuide.description_align_paa,
		value: 9.1,
	},
	{
		title: s.ekos.collapse_align.load,
		description: s.tourGuide.description_align_load,
		value: 9.2,
	},
	{
		title: `${s.ekos.collapse_align.heading} ${s.general.controls}`,
		description: s.tourGuide.description_align_controls,
		value: 9.3,
	},
	{
		title: `${s.ekos.collapse_align.heading} ${s.general.status}`,
		description: s.tourGuide.description_align_solution,
		value: 9.4,
	},
];

// Ekos's Basic Tour guide title and description
export const BasicPAA = [
	{
		title: s.tourGuide.title_basic_paa,
		description: s.tourGuide.description_basic_paa,
		value: 9.5,
	},
	{
		title: s.tourGuide.title_basic_controls,
		description: s.tourGuide.description_basic_controls,
		value: 9.6,
	},
	{
		title: s.tourGuide.title_toggle_mode,
		description: s.tourGuide.description_toggle_mode,
		value: 9.7,
	},
	{
		title: s.tourGuide.title_paa_controls,
		description: s.tourGuide.description_paa_controls,
		value: 9.8,
	},
	{
		title: s.tourGuide.title_paa_message,
		description: s.tourGuide.description_paa_message,
		value: 9.9,
	},
];

// Focus Tour guide
export const Focus = [
	{
		title: s.tourGuide.title_focus_initial,
		description: s.tourGuide.description_focus_initial,
		value: 8.1,
	},
	{
		title: s.tourGuide.title_focus_steps,
		description: s.tourGuide.description_focus_steps,
		value: 8.2,
	},
	{
		title: s.tourGuide.title_focus_size,
		description: s.tourGuide.description_focus_size,
		value: 8.3,
	},
	{
		title: `${s.ekos.collapse_focus.heading} ${s.general.exposure}`,
		description: s.tourGuide.description_focus_exposure,
		value: 8.4,
	},
	{
		title: `${s.ekos.collapse_focus.heading} ${s.general.controls}`,
		description: s.tourGuide.description_focus_controls,
		value: 8.5,
	},
];

// Guide Tour guide
export const Guide = [
	{
		title: `${s.tourGuide.title_guide} ${s.ekos.collapse_camera.heading}`,
		description: s.tourGuide.description_guide_camera,
		value: 10.1,
	},
	{
		title: `${s.tourGuide.title_guide} ${s.general.status}`,
		description: s.tourGuide.description_guide_status,
		value: 10.2,
	},
	{
		title: `${s.tourGuide.title_guide} ${s.general.controls}`,
		description: s.tourGuide.description_guide_controls,
		value: 10.3,
	},
];

// Quick Controls Tour guide
export const QuickControls = [
	{
		title: s.tourGuide.title_preview,
		description: s.tourGuide.description_preview,
		value: 24,
	},
	{
		title: s.tourGuide.title_framing,
		description: s.tourGuide.description_framing,
		value: 25,
	},
	{
		title: s.tourGuide.title_live_video,
		description: s.tourGuide.description_live_video,
		value: 26,
	},
	{
		title: s.tourGuide.title_stop,
		description: s.tourGuide.description_stop,
		value: 27,
	},
	{
		title: s.tourGuide.title_live_stacking,
		description: s.tourGuide.description_live_stacking,
		value: 28,
	},
	{
		title: s.tourGuide.title_quick_settings,
		description: s.tourGuide.description_quick_settings,
		value: 29,
	},
];

// Target's title and description
export const Targets = [
	{
		title: s.tourGuide.title_targets_info,
		description: s.tourGuide.description_targets_info,
		value: 17,
	},
	{
		title: s.tourGuide.title_search_bar,
		description: s.tourGuide.description_search_bar,
		value: 18,
	},
	{
		title: s.tourGuide.title_time_controls,
		description: s.tourGuide.description_time_controls,
		value: 19,
	},
	{
		title: s.tourGuide.title_target_controls,
		description: s.tourGuide.description_target_controls,
		value: 20,
	},
	{
		title: s.tourGuide.title_object_info,
		description: s.tourGuide.description_object_info,
		value: 21,
	},
	{
		title: s.tourGuide.title_fov,
		description: s.tourGuide.description_fov,
		value: 22,
	},
	{
		title: s.tourGuide.title_target_action,
		description: s.tourGuide.description_target_action,
		value: 23,
	},
];

//Basic targets tour guide title and description
export const BasicTargets = [
	{
		title: s.tourGuide.title_targets_mode,
		description: s.tourGuide.description_targets_mode,
		value: 23.1,
	},
	{
		title: s.tourGuide.title_overlay_type,
		description: s.tourGuide.description_overlay_type,
		value: 23.2,
	},
	{
		title: s.tourGuide.title_object_info,
		description: s.tourGuide.description_object_info,
		value: 23.3,
	},
	{
		title: s.tourGuide.title_fov,
		description: s.tourGuide.description_targets_fov,
		value: 23.4,
	},
	{
		title: s.tourGuide.title_target_chart,
		description: s.tourGuide.description_target_chart,
		value: 23.5,
	},
];

// Basic Focus Tour guide title and description
export const BasicFocus = [
	{
		title: s.tourGuide.title_basic_focus,
		description: s.tourGuide.description_basic_focus,
		value: 34.1,
	},
	{
		title: s.tourGuide.title_focus_settings,
		description: s.tourGuide.description_focus_settings,
		value: 34.2,
	},
	{
		title: s.tourGuide.title_focus_graph,
		description: s.tourGuide.description_focus_graph,
		value: 34.3,
	},
	{
		title: s.tourGuide.title_focus_image,
		description: s.tourGuide.description_focus_image,
		value: 34.4,
	},
];

// Basic Guide Tour guide title and description
export const BasicGuide = [
	{
		title: s.tourGuide.title_basic_guide,
		description: s.tourGuide.description_basic_guide,
		value: 34.5,
	},
	{
		title: s.tourGuide.title_guide_controls,
		description: s.tourGuide.description_basic_guide_controls,
		value: 34.6,
	},
	{
		title: s.tourGuide.title_guide_chart,
		description: s.tourGuide.description_guide_chart,
		value: 34.7,
	},
	{
		title: s.tourGuide.title_guide_image,
		description: s.tourGuide.description_guide_image,
		value: 34.8,
	},
];

// Basic Capture Tour guide title and description
export const BasicCapture = [
	{
		title: s.tourGuide.title_basic_capture,
		description: s.tourGuide.description_basic_capture,
		value: 34.9,
	},
	{
		title: s.tourGuide.title_capture_controls,
		description: s.tourGuide.description_capture_controls,
		value: 35,
	},
	{
		title: s.tourGuide.title_manage_sequences,
		description: s.tourGuide.description_manage_sequences,
		value: 35.1,
	},
	{
		title: s.tourGuide.title_capture_actions,
		description: s.tourGuide.description_capture_actions,
		value: 35.2,
	},
];

// Basic Summary Tour guide title and description
export const BasicSummary = [
	{
		title: s.tourGuide.title_summary,
		description: s.tourGuide.description_summary,
		value: 35.3,
	},
	{
		title: s.tourGuide.title_histogram,
		description: s.tourGuide.description_histogram,
		value: 35.4,
	},
];

// Stella Tour guide
export const Stella = [
	{
		title: s.general.introduction,
		description: s.tourGuide.description_stella_intro,
		value: 30,
	},
	{
		title: s.general.examples,
		description: s.tourGuide.description_stella_example,
		value: 31,
	},
	{
		title: s.general.chat,
		description: s.tourGuide.description_stella_chat,
		value: 32,
	},
	{
		title: s.tourGuide.title_stella_prompt,
		description: s.tourGuide.description_stella_input,
		value: 33,
	},
	{
		title: s.general.controls,
		description: s.tourGuide.description_stella_other_function,
		value: 34,
	},
];

export const ekosFileManager = {
	EXISTS: "exists",
	CREATE: "create",
	LIST: "list",
	REMOVE: "remove",
};

/**
 * For Sync APIs
 */
export const Sync = {
	PRESET: "preset",
	ACHIEVEMENT: "achievements",
	FOV: "fov",
	TARGETS: "targets",
};

/**
 * For Scheduler UI
 */
export const Scheduler = {
	NAME: "nameEdit",
	SEQUENCE: "sequenceEdit",
	RA: "raBox",
	DE: "decBox",
	FITS: "fitsEdit",
};
