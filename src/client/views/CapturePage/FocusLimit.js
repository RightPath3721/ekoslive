import { styles } from "@client/shared/styles";
import s from "@common/shared/i18n/i18n";
import Dropdown from "@components/Dropdown";
import NumericControl from "@components/NumericControl";
import { Box, Checkbox, Typography } from "@mui/material";
import { captureActions } from "@redux/actions";
import { get, isEmpty, isEqual } from "lodash";
import React, { memo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";

// Keys for new Capture Settings i.e Kstars 3.7.0 >=
const KEYS = {
	enforceRefocusEveryN: "enforceRefocusEveryN",
	refocusEveryN: "refocusEveryN",

	enforceAutofocusOnTemperature: "enforceAutofocusOnTemperature",
	maxFocusTemperatureDelta: "maxFocusTemperatureDelta",

	enforceAutofocusHFR: "enforceAutofocusHFR",
	hFRCheckAlgorithm: "hFRCheckAlgorithm",

	refocusAfterMeridianFlip: "refocusAfterMeridianFlip",
	hFRThresholdPercentage: "hFRThresholdPercentage",
	inSequenceCheckFrames: "inSequenceCheckFrames",

	hFRDeviation: "hFRDeviation",
};

const Algorithm = [
	{ label: "Last Autofocus", value: 0 },
	{ label: "Fixed", value: 1 },
	{ label: "Median Measure", value: 2 },
];

const CustomizedNumericInput = ({
	text,
	isNumericInput = true,
	isCheckBox = true,
	type,
	onChangeBox,
	checked = false,
	...props
}) =>
{
	return (
		<Box sx={[styles.row, { marginTop: "10px" }]}>
			<Box style={{ width: "50px" }}>
				{isCheckBox && <Checkbox checked={checked} onChange={onChangeBox} />}
			</Box>
			<Typography
				style={{ paddingLeft: "15px", paddingRight: "15px", width: "200px" }}
			>
				{text}
			</Typography>
			{isNumericInput && <NumericControl {...props} />}
			{!isEmpty(type) && (
				<Typography style={{ paddingLeft: "15px" }}>{type}</Typography>
			)}
		</Box>
	);
};

/**
 * Focus Limits
 * @returns Tab in Capture Settings
 */
const FocusLimits = () =>
{
	const dispatch = useDispatch();
	const captureSettings = useSelector(
		(state) => state.ekos.captureSettings,
		isEqual,
	);

	const SETTINGS = captureSettings;

	// Get values using new keys from the capture settings
	const NEW_STATE = {
		checkRefocus: get(SETTINGS, KEYS.enforceRefocusEveryN, false),
		refocusNValue: get(SETTINGS, KEYS.refocusEveryN, 0),
		focusDeltaTCheck: get(SETTINGS, KEYS.enforceAutofocusOnTemperature, false),
		focusDeltaTValue: get(SETTINGS, KEYS.maxFocusTemperatureDelta, 0),
		focusHFRCheck: get(SETTINGS, KEYS.enforceAutofocusHFR, false),
		hFRCheckAlgorithm: get(SETTINGS, KEYS.hFRCheckAlgorithm, ""),

		checkMeridian: get(SETTINGS, KEYS.refocusAfterMeridianFlip, false),
		inSequenceCheckFrames: get(SETTINGS, KEYS.inSequenceCheckFrames, 0),

		hFRThresholdPercentage: get(SETTINGS, KEYS.hFRThresholdPercentage, 0),
		focusHFRValue: get(SETTINGS, KEYS.hFRDeviation, 0),
	};

	const [state, setState] = useState(NEW_STATE);

	const {
		refocusNValue,
		focusDeltaTCheck,
		focusDeltaTValue,
		focusHFRCheck,
		checkMeridian,
		checkRefocus,
		focusHFRValue,
		hFRThresholdPercentage,
		inSequenceCheckFrames,
		hFRCheckAlgorithm,
	} = state;

	/**
	 * Set settings for new capture settings
	 * @param {*} key New key i.e hFRDeviation
	 * @param {*} value value 5
	 * @param {*} type key of the state
	 */
	const setSettings = (key, value) =>
	{
		dispatch(captureActions.setAllSettings({ [key]: value }));
	};

	return (
		<Box sx={[{ justifyContent: "center" }]}>
			<Box sx={[LOCAL_STYLES.collapseBodyContainer]}>
				<Box sx={[styles.row, LOCAL_STYLES.collapseFormGroup]}>
					<CustomizedNumericInput
						checked={checkRefocus}
						editable={checkRefocus}
						onChangeBox={() =>
						{
							setState({ ...state, checkRefocus: !checkRefocus });
							setSettings(KEYS.enforceRefocusEveryN, !checkRefocus);
						}}
						initialValue={refocusNValue}
						// minValue={1}
						// maxValue={999}
						// incrementStep={1}
						// decrementStep={1}
						customLimit={[1, 999]}
						steps={[1, 1]}
						totalWidth="150px"
						text={s.ekos.capture_limits.refocus_n}
						type={s.ekos.capture_limits.refocus_n_unit}
						onChange={(value) =>
						{
							setState({ ...state, refocusNValue: value });
							setSettings(KEYS.refocusEveryN, value);
						}}
					/>
				</Box>

				<Box sx={[styles.row, LOCAL_STYLES.collapseFormGroup]}>
					<CustomizedNumericInput
						checked={focusDeltaTCheck}
						editable={focusDeltaTCheck}
						onChangeBox={() =>
						{
							setState({ ...state, focusDeltaTCheck: !focusDeltaTCheck });
							setSettings(
								KEYS.enforceAutofocusOnTemperature,
								!focusDeltaTCheck,
							);
						}}
						initialValue={focusDeltaTValue}
						customLimit={[0.1, 10]}
						steps={[0.1, 0.1]}
						totalWidth="150px"
						text={s.ekos.capture_limits.focus_deltaT}
						type={s.ekos.capture_limits.focus_deltaT_unit}
						onChange={(value) =>
						{
							setState({ ...state, focusDeltaTValue: value });
							setSettings(KEYS.maxFocusTemperatureDelta, value);
						}}
					/>
				</Box>

				<Box sx={[styles.row, LOCAL_STYLES.collapseFormGroup]}>
					<CustomizedNumericInput
						checked={focusHFRCheck}
						onChangeBox={() =>
						{
							setState({ ...state, focusHFRCheck: !focusHFRCheck });
							setSettings(KEYS.enforceAutofocusHFR, !focusHFRCheck);
						}}
						isNumericInput={false}
						customLimit={[1, 30]}
						steps={[1, 1]}
						totalWidth="150px"
						text={s.ekos.capture_limits.refocus_on_hfr}
					/>
					<Dropdown
						options={Algorithm}
						value={hFRCheckAlgorithm}
						width="200px"
						onChange={(item) =>
						{
							let value = item.label;
							setSettings(KEYS.hFRCheckAlgorithm, value, "hFRCheckAlgorithm");
							setState({ ...state, hFRCheckAlgorithm: value });
						}}
					/>
				</Box>

				<Box sx={[styles.row, LOCAL_STYLES.collapseFormGroup]}>
					<CustomizedNumericInput
						checked={checkMeridian}
						isNumericInput={false}
						customLimit={[1, 30]}
						steps={[1, 1]}
						totalWidth="150px"
						text={s.ekos.capture_limits.refocus_meridian}
						onChangeBox={() =>
						{
							setSettings(KEYS.refocusAfterMeridianFlip, !checkMeridian);
							setState({ ...state, checkMeridian: !checkMeridian });
						}}
					/>
				</Box>
			</Box>
			<Box
				sx={[
					LOCAL_STYLES.collapseBodyContainer,
					{ marginLeft: 0, paddingLeft: 0 },
				]}
			>
				<Box sx={[styles.row, LOCAL_STYLES.collapseFormGroup]}>
					<CustomizedNumericInput
						isCheckBox={false}
						initialValue={inSequenceCheckFrames}
						customLimit={[1, 30]}
						steps={[1, 1]}
						totalWidth="150px"
						text={s.ekos.capture_limits.check_every}
						type={s.ekos.collapse_guide.frames}
						onChange={(value) =>
						{
							setSettings(KEYS.inSequenceCheckFrames, value);
							setState({ ...state, inSequenceCheckFrames: value });
						}}
					/>
				</Box>

				<Box sx={[styles.row, LOCAL_STYLES.collapseFormGroup]}>
					<CustomizedNumericInput
						isCheckBox={false}
						initialValue={hFRThresholdPercentage}
						customLimit={[0, 50]}
						steps={[1, 1]}
						totalWidth="150px"
						text={s.ekos.collapse_focus.process.threshold}
						type="%"
						onChange={(value) =>
						{
							setSettings(KEYS.hFRThresholdPercentage, value);
							setState({ ...state, hFRThresholdPercentage: value });
						}}
					/>
				</Box>

				<Box sx={[styles.row, LOCAL_STYLES.collapseFormGroup]}>
					<CustomizedNumericInput
						isCheckBox={false}
						initialValue={focusHFRValue}
						customLimit={[0, 10]}
						steps={[1, 1]}
						totalWidth="150px"
						text={s.ekos.collapse_focus.hfr}
						type={s.general.pixels}
						onChange={(value) =>
						{
							setState({ ...state, focusHFRValue: value });
							setSettings(KEYS.hFRDeviation, value);
						}}
					/>
				</Box>
			</Box>
		</Box>
	);
};

export default memo(FocusLimits);

const LOCAL_STYLES = {
	collapseHeaderContainer: {
		alignItems: "center",
		justifyContent: "center",
		flexDirection: "row",
		height: "64px",
		paddingHorizontal: "24px",
	},
	collapseBodyContainer: {
		height: "100%",
		marginLeft: "50px",
		marginRight: "50px",
		paddingLeft: "16px",
		paddingRight: "16px",
		marginBottom: "auto",
	},
	collapseFormGroup: {
		marginTop: "8px",
	},

	collapseLeftLabel: {
		marginLeft: "20px",
		width: "200px",
	},
};
