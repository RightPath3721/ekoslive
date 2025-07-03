import { Checkbox, Typography, Box } from "@mui/material";
import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { get } from "lodash";
import { captureActions, optionActions } from "@redux/actions";
import s from "@common/shared/i18n/i18n";
import NumericControl from "../../Components/NumericControl";
import { selectCaptureSettings, selectOptionValue } from "@redux/selectors";

const KEYS = {
	captureDelayN: "captureDelayN",
};

const Options = {
	MaxTemperatureDiff: "maxTemperatureDiff",
	GuidingSettle: "guidingSettle",
	ManualCoverTimeout: "manualCoverTimeout",

	AlwaysResetSequenceWhenStarting: "alwaysResetSequenceWhenStarting",
	ResetMountModelAfterMeridian: "resetMountModelAfterMeridian",
	ForcedFlip: "forcedFlip",
	UseSummaryPreview: "useSummaryPreview",

	ForceDSLRPresets: "forceDSLRPresets",
	useDSLRImageViewer: "useDSLRImageViewer",
	CaptureOperationsTimeout: "captureOperationsTimeout",
};

const CaptureText = ({ title }) =>
{
	return <Typography sx={{ color: "white" }}>{title}</Typography>;
};

const GeneralSettings = () =>
{
	const dispatch = useDispatch();

	const captureSettings = useSelector(selectCaptureSettings);
	const maxTemperatureDiff = useSelector((state) =>
		selectOptionValue(state, Options.MaxTemperatureDiff),
	);
	const guidingSettle = useSelector((state) =>
		selectOptionValue(state, Options.GuidingSettle),
	);
	const manualCoverTimeout = useSelector((state) =>
		selectOptionValue(state, Options.ManualCoverTimeout),
	);

	const alwaysResetSequenceWhenStarting = useSelector((state) =>
		selectOptionValue(state, Options.AlwaysResetSequenceWhenStarting),
	);
	const resetMountModelAfterMeridian = useSelector((state) =>
		selectOptionValue(state, Options.ResetMountModelAfterMeridian),
	);
	const forcedFlip = useSelector((state) =>
		selectOptionValue(state, Options.ForcedFlip),
	);
	const captureOperationsTimeout = useSelector((state) =>
		selectOptionValue(state, Options.CaptureOperationsTimeout),
	);
	const useSummaryPreview = useSelector((state) =>
		selectOptionValue(state, Options.UseSummaryPreview),
	);

	const [delay, setDelay] = useState(get(captureSettings, "captureDelayN", 0));

	const miscellaneous = [
		{
			text: s.ekos.collapse_camera.capture_settings.temperature,
			description: s.ekos.collapse_camera.capture_settings.temperature_tooltip,
			value: get(maxTemperatureDiff, "value", 0.1),
			key: Options.MaxTemperatureDiff,
			min: 0.1,
			max: 5.0,
			increment: 0.1,
			decrement: 0.1,
		},
		{
			text: s.ekos.collapse_camera.capture_settings.guiding,
			description: s.ekos.collapse_camera.capture_settings.guiding_tooltip,
			value: get(guidingSettle, "value", 2),
			key: Options.GuidingSettle,
			min: 0.0,
			max: 99.99,
			increment: 1,
			decrement: 1,
		},
		{
			text: s.ekos.collapse_camera.capture_settings.dialog,
			description: s.ekos.collapse_camera.capture_settings.dialog_tooltip,
			value: get(manualCoverTimeout, "value", 10),
			key: Options.ManualCoverTimeout,
			min: 0,
			max: 600,
			increment: 10,
			decrement: 10,
		},
		{
			text: s.ekos.collapse_camera.capture_settings.operations_timeout,
			description:
				s.ekos.collapse_camera.capture_settings.operations_timeout_tooltip,
			value: get(captureOperationsTimeout, "value", false),
			key: Options.CaptureOperationsTimeout,
			min: 5,
			max: 900,
			increment: 1,
			decrement: 1,
		},
	];

	const miscellaneousBox = [
		{
			text: s.ekos.collapse_camera.capture_settings.reset_sequence,
			description:
				s.ekos.collapse_camera.capture_settings.reset_sequence_tooltip,
			value: get(alwaysResetSequenceWhenStarting, "value", false),
			key: Options.AlwaysResetSequenceWhenStarting,
		},
		{
			text: s.ekos.collapse_camera.capture_settings.reset_mount,
			description: s.ekos.collapse_camera.capture_settings.reset_mount_tooltip,
			value: get(resetMountModelAfterMeridian, "value", false),
			key: Options.ResetMountModelAfterMeridian,
		},
		{
			text: s.ekos.collapse_camera.capture_settings.use_flip,
			description: s.ekos.collapse_camera.capture_settings.use_flip_tooltip,
			value: get(forcedFlip, "value", false),
			key: Options.ForcedFlip,
		},
		{
			text: s.ekos.collapse_camera.capture_settings.summary_preview,
			description:
				s.ekos.collapse_camera.capture_settings.summary_preview_tooltip,
			value: get(useSummaryPreview, "value", false),
			key: Options.UseSummaryPreview,
		},
	];

	const setOption = (name, value) =>
	{
		dispatch(optionActions.setOptions([{ name, value }]));
		getOptions();
	};

	/**
	 * Set delay, use setDelay for old kstars and we need to send it onAddSequence
	 * @param {*} key
	 * @param {*} value
	 */
	const setSettings = (key, value) =>
	{
		setDelay(value);
		dispatch(captureActions.setAllSettings({ [key]: value }));
	};

	const getOptions = () =>
	{
		dispatch(
			optionActions.getOptions([
				{ name: Options.MaxTemperatureDiff },
				{ name: Options.GuidingSettle },
				{ name: Options.ManualCoverTimeout },

				{ name: Options.AlwaysResetSequenceWhenStarting },
				{ name: Options.ResetMountModelAfterMeridian },
				{ name: Options.ForcedFlip },
				{ name: Options.UseSummaryPreview },

				{ name: Options.ForceDSLRPresets },
				{ name: Options.useDSLRImageViewer },
				{ name: Options.CaptureOperationsTimeout },
			]),
		);
	};

	useEffect(() =>
	{
		getOptions();
	}, []);

	return (
		<Box
			sx={{
				display: "flex",
				flexDirection: "column",
				gap: "16px",
				paddingBlock: "6px",
			}}
		>
			<Box
				sx={[
					LOCAL_STYLES.gridInputItem,
					{
						margin: "0 auto",
						gridTemplateColumns: "auto 143px",
						columnGap: "16px",
					},
				]}
			>
				<CaptureText title={s.general.delay} />
				<NumericControl
					initialValue={delay}
					steps={[1, 1]}
					customLimit={[0, 3600]}
					onChange={(val) => setSettings(KEYS.captureDelayN, val)}
				/>
			</Box>

			<Typography sx={[LOCAL_STYLES.titleText]}>
				{s.ekos.collapse_camera.capture_settings.miscellaneous}
			</Typography>

			<Box
				sx={{
					display: "grid",
					gridTemplateColumns: "repeat(2, 1fr)",
					columnGap: "32px",
				}}
			>
				<Box sx={{ display: "flex", flexDirection: "column", gap: "16px" }}>
					{miscellaneous.map((data) =>
					{
						return (
							<Box sx={[LOCAL_STYLES.gridInputItem]} key={data.description}>
								<Typography sx={{ color: "white" }}>{data.text}</Typography>
								<NumericControl
									initialValue={data.value}
									onChange={(value) =>
									{
										setOption(data.key, value);
									}}
									customLimit={[data.min, data.max]}
									steps={[data.increment, data.decrement]}
								/>
							</Box>
						);
					})}
				</Box>

				<Box sx={{ display: "flex", flexDirection: "column", gap: "16px" }}>
					{miscellaneousBox.map((data) =>
					{
						return (
							<Box sx={[LOCAL_STYLES.gridCheckboxItem]} key={data.description}>
								<Checkbox
									style={{ color: "white", padding: 0 }}
									checked={data.value}
									onChange={() =>
									{
										setOption(data.key, !data.value);
									}}
								/>
								<Typography sx={{ color: "white", width: "max-content" }}>
									{data.text}
								</Typography>
							</Box>
						);
					})}
				</Box>
			</Box>
		</Box>
	);
};

const LOCAL_STYLES = {
	titleText: {
		margin: "0 auto",
		color: "white",
		width: "max-content",
		fontSize: "20px",
	},
	gridInputItem: {
		display: "grid",
		gridTemplateColumns: "200px 143px",
		alignItems: "center",
	},
	gridCheckboxItem: {
		display: "grid",
		gridTemplateColumns: "40px auto",
		alignItems: "center",
	},
};

export default GeneralSettings;
