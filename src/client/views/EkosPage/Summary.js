import React, { memo, useCallback, useEffect, useState } from "react";
import { get, isEmpty, isEqual } from "lodash";
import { useSelector } from "react-redux";
import { Box, Typography } from "@mui/material";
import s from "@common/shared/i18n/i18n";
import { styles } from "../../shared/styles";
import { Palette } from "@common/shared/common/styles";
import { trainModules, DEVICE_TYPE } from "@indi/enums";
import Reactor from "@indi/events";
import {
	selectIsAlignSolved,
	selectTrainDevice,
	selectFocusStatus,
	selectGuideStatus,
	selectMeridianFlipText,
	selectCaptureStatus,
	selectExposureDuration,
	selectExposureRemaining,
	selectOvp,
	selectOvl,
	selectSeqt,
	selectOvt,
	selectCaptureSettings,
	checkNewCaptureSettings,
} from "@redux/selectors";
import CircularStatic from "../../Components/CircularProgress";
import Graph from "../GuidePage/Graph";
import GraphBox from "@components/GraphBox";

const frameType = [
	{ key: 0, value: s.ekos.collapse_camera.type_light },
	{ key: 1, value: s.ekos.collapse_camera.type_bias },
	{ key: 2, value: s.ekos.collapse_camera.type_dark },
	{ key: 3, value: s.ekos.collapse_camera.type_flat },
];

const binning = [
	{ key: 1, value: "1x1" },
	{ key: 2, value: "2x2" },
	{ key: 4, value: "4x4" },
];

const Filter = ({ filter }) => (
	<Box
		sx={[
			LOCAL_STYLES.borderTop,
			styles.row,
			{ width: "200px", justifyContent: "space-between" },
		]}
	>
		<Typography
			sx={[LOCAL_STYLES.text, LOCAL_STYLES.font, { padding: "12px" }]}
		>
			{s.general.filter}
		</Typography>
		<Typography
			sx={[
				LOCAL_STYLES.text,
				LOCAL_STYLES.secondGridText,
				LOCAL_STYLES.borderLeft,
				{ paddingBlock: "12px" },
			]}
		>
			{filter}
		</Typography>
	</Box>
);

const Binning = ({ binKey }) => (
	<Box sx={[styles.row, { width: "200px", justifyContent: "space-between" }]}>
		<Typography
			sx={[LOCAL_STYLES.text, LOCAL_STYLES.font, { padding: "12px" }]}
		>
			{s.general.binning}
		</Typography>
		<Typography
			sx={[
				LOCAL_STYLES.text,
				LOCAL_STYLES.secondGridText,
				LOCAL_STYLES.borderLeft,
				{ paddingBlock: "12px" },
			]}
		>
			{binning.map((bin) => (binKey === bin.key ? bin.value : null))}
		</Typography>
	</Box>
);

const Gain = ({ gain }) => (
	<Box sx={[styles.row, { width: "200px", justifyContent: "space-between" }]}>
		<Typography
			sx={[LOCAL_STYLES.text, LOCAL_STYLES.font, { padding: "12px" }]}
		>
			{s.general.gain}
		</Typography>
		<Typography
			sx={[
				LOCAL_STYLES.text,
				LOCAL_STYLES.secondGridText,
				LOCAL_STYLES.borderLeft,
				{ paddingBlock: "12px" },
			]}
		>
			{gain}
		</Typography>
	</Box>
);

const ISO = ({ value }) => (
	<Box sx={[styles.row, { width: "200px", justifyContent: "space-between" }]}>
		<Typography
			sx={[LOCAL_STYLES.text, LOCAL_STYLES.font, { padding: "12px" }]}
		>
			{s.general.iso}
		</Typography>
		<Typography
			sx={[
				LOCAL_STYLES.text,
				LOCAL_STYLES.secondGridText,
				LOCAL_STYLES.borderLeft,
				{ paddingBlock: "12px" },
			]}
		>
			{value}
		</Typography>
	</Box>
);

const Format = ({ format }) => (
	<Box
		sx={[
			LOCAL_STYLES.borderTop,
			styles.row,
			{ width: "200px", justifyContent: "space-between" },
		]}
	>
		<Typography
			sx={[LOCAL_STYLES.text, LOCAL_STYLES.font, { padding: "12px" }]}
		>
			{s.general.format}
		</Typography>
		<Typography
			sx={[
				LOCAL_STYLES.text,
				LOCAL_STYLES.secondGridText,
				LOCAL_STYLES.borderLeft,
				{ paddingBlock: "12px" },
			]}
		>
			{format}
		</Typography>
	</Box>
);

const graphLegend = [
	{
		title: "DE",
		color: "rgb(0, 204, 255)",
	},
	{
		title: "RA",
		color: "rgb(204, 255, 0)",
	},
	{
		title: "RMS",
		color: "rgb(255, 0, 0)",
	},
];
const ShowInfoSheet = () =>
{
	const focusStatus = useSelector(selectFocusStatus, isEqual);
	const guide = useSelector(selectGuideStatus, isEqual);
	const meridian = useSelector(selectMeridianFlipText, isEqual);

	const isNewCaptureSettingsSupported = useSelector(checkNewCaptureSettings);
	const captureStatus = useSelector(selectCaptureStatus);
	const captureExpr = useSelector(selectExposureDuration);
	const captureExpv = useSelector(selectExposureRemaining);
	// Overall progress %
	const ovp = useSelector(selectOvp);
	// Overall label
	const ovl = useSelector(selectOvl);
	const solution = useSelector((state) => state.status.align.solution, isEqual);
	const solutionFound = useSelector(selectIsAlignSolved, isEqual);
	const activeFilterWheel = useSelector((state) =>
		selectTrainDevice(state, {
			trainType: trainModules.CaptureOpticalTrain,
			deviceType: DEVICE_TYPE.FILTER_WHEEL,
		}),
	);
	const activeCamera = useSelector((state) =>
		selectTrainDevice(state, {
			trainType: trainModules.CaptureOpticalTrain,
			deviceType: DEVICE_TYPE.CAMERA,
		}),
	);
	const seqt = useSelector(selectSeqt);
	const ovt = useSelector(selectOvt);

	const [capturedCount, setCapturedCount] = useState(0);
	const [totalCount, setTotalCount] = useState(0);

	const alignAccuracyThreshold = useSelector((state) =>
		get(state.ekos.alignSettings, "alignAccuracyThreshold", 30),
	);

	const [isoControl, setISOControl] = useState({ limit: [], range: [] });
	const [activeFilterName, setActiveFilterName] = useState("");
	const filterwheelUUID = "filtersummary";

	// // Show even when aborted so that users may know what happened before guide was aborted for whatever reason.
	const isGuideInformationShown =
		guide.status === "Guiding" ||
		guide.status === "Suspended" ||
		guide.status === "Aborted" ||
		guide.status === "Reacquiring" ||
		guide.status === "Dithering successful" ||
		guide.status === "Dithering";

	const captureSettings = useSelector(selectCaptureSettings, isEqual);
	const formats = !isEmpty(activeCamera)
		? activeCamera.getCaptureFormats()
		: "N/A";

	const isCapturing =
		captureStatus !== "Idle" &&
		captureStatus !== "Aborted" &&
		captureStatus !== "Complete";

	/**
	 * Returns color string based on errors.
	 * @param {*} error - Error is passed to this function. And based on the error, it returns the color string.
	 * @returns
	 */
	const getAlignSolutionColorCode = (error = 0) =>
	{
		if (error < alignAccuracyThreshold) return Palette.green;
		else if (error < alignAccuracyThreshold * 1.5) return Palette.yellow;
		else return Palette.red;
	};

	/**
	 * Update FilterWheel Name
	 * @param {*} device
	 * @param {*} property INDI Driver Property
	 */
	const updateFilterWheelName = (device, property) =>
	{
		// We need to update the state. So, just use the name from activeFilterWheel
		if (device.name === property.device)
		{
			const filters = activeFilterWheel.availableFilters();
			const index = property.numbers[0].value;
			if (filters && index > 0 && index <= filters.length)
				setActiveFilterName(filters[index - 1].text);
		}
	};

	/**
	 * Watch for FilterWheel property updates
	 */
	const onFilterWheelPropertyUpdate = useCallback((device, property) =>
	{
		// Must use timeout since we can not update any state value in a callback
		if (property.name === "FILTER_SLOT")
			setTimeout(updateFilterWheelName, 10, device, property);
		else if (property.name === "FILTER_NAME")
		{
			const filter = device.activeFilter();
			setActiveFilterName(get(filter, "targetText", "--"));
		}
	});

	useEffect(() =>
	{
		let match;
		if ((match = ovl.toString().match(/(\d+)\/(\d+)/)) !== null)
		{
			// We need this because Ekos does not send us last update (i.e. we don't get 30/30 images
			if (captureStatus === "Complete") setCapturedCount(parseInt(match[2]));
			else setCapturedCount(parseInt(match[1]));
			setTotalCount(parseInt(match[2]));
		}
	}, [ovl, captureStatus]);

	useEffect(() =>
	{
		if (!isEmpty(activeCamera))
		{
			if (activeCamera.getRangeList("CCD_ISO"))
				setISOControl({ range: activeCamera.getRangeList("CCD_ISO") });

			if (activeFilterWheel)
			{
				setActiveFilterName(
					get(activeFilterWheel.activeFilter(), "text", "N/A"),
				);
				Reactor.addEventListener(
					"propertyUpdate",
					onFilterWheelPropertyUpdate,
					activeFilterWheel,
					filterwheelUUID,
				);
			}
			return () =>
			{
				Reactor.removeEventListener("propertyUpdate", filterwheelUUID);
			};
		}
	}, [activeCamera, activeFilterWheel]);

	if (
		isEmpty(captureSettings) &&
		!solutionFound &&
		focusStatus.status === "Idle" &&
		!isGuideInformationShown
	)
	{
		return (
			<Box sx={[LOCAL_STYLES.container]}>
				<Typography sx={[LOCAL_STYLES.empty, { padding: "12px" }]}>
					{s.ekos.summary.empty}
				</Typography>
			</Box>
		);
	}

	return (
		<Box sx={LOCAL_STYLES.container}>
			<Box
				sx={[
					styles.row,
					LOCAL_STYLES.border,
					styles.row,
					{ padding: "12px", justifyContent: "space-between" },
				]}
			>
				<Box
					sx={[
						LOCAL_STYLES.borderRight,
						styles.row,
						{ gap: "12px", paddingRight: "32px", paddingLeft: "12px" },
					]}
				>
					<Typography sx={[LOCAL_STYLES.text, LOCAL_STYLES.font]}>
						ΔDEV
					</Typography>
					<Typography
						sx={[
							LOCAL_STYLES.text,
							{
								color: solutionFound
									? getAlignSolutionColorCode(get(solution, "targetDiff", 0))
									: "white",
							},
						]}
					>
						{`${
							solutionFound
								? `${get(solution, "targetDiff", 0).toFixed(1)}${
										s.ekos.solution_bar.arcsec
									}`
								: s.ekos.summary.inactive
						}`}
					</Typography>
				</Box>
				<Box
					sx={[
						LOCAL_STYLES.borderRight,
						styles.row,
						{ gap: "12px", paddingRight: "32px", paddingLeft: "12px" },
					]}
				>
					<Typography sx={[LOCAL_STYLES.text, LOCAL_STYLES.font]}>
						PA
					</Typography>
					<Typography sx={[LOCAL_STYLES.text]}>
						{`${`${get(solution, "PA", 0).toFixed(1)}°`}`}
					</Typography>
				</Box>
				<Box
					sx={[
						styles.row,
						{ gap: "12px", paddingRight: "32px", paddingLeft: "12px" },
					]}
				>
					<Typography sx={[LOCAL_STYLES.text, LOCAL_STYLES.font]}>
						{s.ekos.solution_bar.fov}
					</Typography>
					<Typography sx={[LOCAL_STYLES.text]}>
						{`${`${get(solution, "fov", "N/A")}`}`}
					</Typography>
				</Box>
			</Box>
			{isGuideInformationShown && (
				<Box sx={[LOCAL_STYLES.border, styles.row, { padding: "5px" }]}>
					<Box sx={{ justifyContent: "center" }}>
						<Typography
							sx={[
								LOCAL_STYLES.text,
								LOCAL_STYLES.font,
								{
									fontSize: "22px",
									color: guide.status === "Aborted" ? Palette.red : "white",
								},
							]}
						>
							Δ{s.ekos.collapse_guide.total_rms_plot}{" "}
						</Typography>
						<Typography
							sx={[
								LOCAL_STYLES.text,
								{
									fontSize: "28px",
								},
							]}
						>
							{Math.sqrt(
								Math.pow(guide.rarms, 2) + Math.pow(guide.derms, 2),
							).toFixed(1)}
							"
						</Typography>
					</Box>
					<GraphBox legend={graphLegend}>
						<Graph />
					</GraphBox>
				</Box>
			)}

			{!isEmpty(captureSettings) && (
				<Box
					sx={[
						LOCAL_STYLES.border,
						styles.row,
						{ paddingLeft: "12px", paddingTop: "10px", paddingBottom: "10px" },
					]}
				>
					<Box sx={[LOCAL_STYLES.borderRight]}>
						<Box sx={[LOCAL_STYLES.secondGrid]}>
							<Typography
								sx={[LOCAL_STYLES.text, LOCAL_STYLES.font, { padding: "12px" }]}
							>
								{s.general.exposure}
							</Typography>
							<Typography
								sx={[
									LOCAL_STYLES.text,
									LOCAL_STYLES.secondGridText,
									LOCAL_STYLES.borderLeft,
									{ color: captureExpv > 0 ? Palette.yellow : Palette.white70 },
									{ paddingBlock: "12px" },
								]}
							>
								{captureExpv > 0
									? `${captureExpv.toFixed()}`
									: `${captureExpr.toFixed()}`}
							</Typography>
						</Box>
						<Box sx={[LOCAL_STYLES.borderTop, LOCAL_STYLES.secondGrid]}>
							<Typography
								sx={[LOCAL_STYLES.text, LOCAL_STYLES.font, { padding: "12px" }]}
							>
								{s.general.frame}
							</Typography>
							<Typography
								sx={[
									LOCAL_STYLES.text,
									LOCAL_STYLES.secondGridText,
									LOCAL_STYLES.borderLeft,
									{ paddingBlock: "12px" },
								]}
							>
								{isNewCaptureSettingsSupported
									? get(captureSettings, "captureTypeS", "N/A")
									: captureSettings.frameType === -1
										? frameType[0].value
										: frameType.map((frame) =>
												frame.key === captureSettings.frameType
													? frame.value
													: null,
											)}
							</Typography>
						</Box>
					</Box>
					<Box
						sx={[
							LOCAL_STYLES.borderRight,
							LOCAL_STYLES.secondGrid,
							{ flexDirection: "column" },
						]}
					>
						{!isEmpty(activeCamera) && activeCamera?.hasGain() ? (
							<Gain
								gain={
									isNewCaptureSettingsSupported
										? get(captureSettings, "captureGainN", 0)
										: captureSettings.gain
								}
							/>
						) : !isEmpty(activeCamera) &&
						  !isEmpty(activeCamera?.getRangeList("CCD_ISO")) ? (
							<ISO
								value={
									isNewCaptureSettingsSupported
										? get(captureSettings, "captureISOS", "100")
										: isoControl.range[get(captureSettings, "iso", 0)]
								}
							/>
						) : (
							<Binning binKey={captureSettings.bin} />
						)}
						{isEmpty(activeFilterWheel) &&
						isEmpty(activeFilterWheel?.availableFilters()) ? (
							<Format
								formats={
									!isEmpty(activeCamera)
										? activeCamera.getCaptureFormats()
										: "N/A"
								}
								captureFormat={
									isNewCaptureSettingsSupported
										? get(captureSettings, "captureFormatS", "N/A")
										: formats[captureSettings.captureFormat]
								}
							/>
						) : (
							<Filter filter={activeFilterName} />
						)}
					</Box>
					<Box
						sx={{
							display: "flex",
							flex: 1,
							flexDirection: "column",
							justifyContent: "center",
							alignSelf: "center",
							padding: "12px",
						}}
					>
						<Box
							sx={[
								styles.row,
								{
									justifyContent: "center",
								},
							]}
						>
							<CircularStatic
								isSummary
								progress={
									isCapturing
										? `${ovp.toFixed()}%`
										: captureStatus === "Complete"
											? "100%"
											: "NA"
								}
								value={
									isCapturing ? ovp : captureStatus === "Complete" ? 100 : 0
								}
							/>
							{isCapturing && (
								<Box sx={{ marginLeft: "24px" }}>
									<Typography sx={[styles.text, { marginRight: "24px" }]}>
										{seqt}
									</Typography>
									<Typography sx={styles.text}>{ovt}</Typography>
								</Box>
							)}
						</Box>
						{totalCount > 0 && (
							<Box
								sx={{
									display: "flex",
									justifyContent: "center",
									marginTop: "10px",
								}}
							>
								<Typography
									sx={{
										fontSize: "12px",
										fontWeight: "bold",
										color: Palette.white70,
									}}
								>
									{s.darkLibrary.create_darks.total_images}: ({capturedCount}/
									{totalCount})
								</Typography>
							</Box>
						)}
					</Box>
				</Box>
			)}

			<Box sx={[LOCAL_STYLES.border, styles.row, { padding: "12px" }]}>
				<Box
					sx={[
						LOCAL_STYLES.borderRight,
						styles.row,
						{ gap: "12px", paddingRight: "32px", paddingLeft: "12px" },
					]}
				>
					<Typography sx={[LOCAL_STYLES.text, LOCAL_STYLES.font]}>
						Δ{s.ekos.collapse_focus.hfr}{" "}
					</Typography>
					<Typography
						sx={[
							LOCAL_STYLES.text,
							{
								color: focusStatus === "Aborted" ? Palette.red : "white",
							},
						]}
					>
						{`${
							focusStatus.status !== "Idle" && focusStatus.hfr !== 0
								? focusStatus.hfr.toFixed(1)
								: s.ekos.summary.inactive
						}`}
					</Typography>
				</Box>

				{!isEmpty(meridian) && (
					<Box sx={[styles.row, { justifyContent: "center" }]}>
						<Typography sx={[LOCAL_STYLES.text, { paddingInline: "12px" }]}>
							{meridian}
						</Typography>
					</Box>
				)}
			</Box>
		</Box>
	);
};

const LOCAL_STYLES = {
	container: {
		backgroundColor: "rgba(0,0,0,0.5)",
		position: "absolute",
		top: "5rem",
		left: "60px",
		width: "fit-content",
		right: 0,
	},
	YScale: {
		position: "absolute",
		top: 50,
		left: 100,
		marginBottom: "30px",
		bottom: 0,
	},
	border: {
		borderBottom: `1px solid ${Palette.grey66}`,
	},
	borderTop: {
		borderTop: `1px solid ${Palette.grey66}`,
	},
	grid: {
		flexDirection: "column",
	},
	font: { fontWeight: "bold", color: Palette.white },
	secondGridText: {
		width: "80px",
		textAlign: "center",
	},
	borderRight: {
		borderRight: `1px solid ${Palette.grey66}`,
	},
	borderLeft: {
		borderLeft: `1px solid ${Palette.grey66}`,
	},
	text: {
		color: Palette.white70,
		fontSize: "18px",
	},
	empty: { alignSelf: "center", color: "white", padding: "12px" },
	XScale: {
		position: "absolute",
	},
	overlayGraph: {},
	graph: {
		border: `1px solid #ffffff33`,
	},
	secondGrid: {
		display: "flex",
		justifyContent: "space-between",
		width: "200px",
	},
};
export default memo(ShowInfoSheet);
