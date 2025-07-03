/* eslint-disable react/jsx-no-duplicate-props */
import React, { Fragment, memo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { captureActions } from "@redux/actions";
import { get, isEmpty } from "lodash";
import { Box, Checkbox, Typography } from "@mui/material";
import NumericControl from "@components/NumericControl";
import { styles } from "@client/shared/styles";
import s from "@common/shared/i18n/i18n";

const KEYS = {
	enforceStartGuiderDrift: "enforceStartGuiderDrift",
	startGuideDeviation: "startGuideDeviation",

	enforceGuideDeviation: "enforceGuideDeviation",
	guideDeviation: "guideDeviation",

	guideDeviationReps: "guideDeviationReps",
	guideDitherPerJobFrequency: "guideDitherPerJobFrequency",

	limitGuideDeviationRepsN: "limitGuideDeviationRepsN",
	limitDitherFrequencyN: "limitDitherFrequencyN",

	deviationValue: "deviationValue",
	deviationCheck: "deviationCheck",
};

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
		<Box sx={styles.row}>
			<Box sx={{ width: "50px" }}>
				{isCheckBox && <Checkbox checked={checked} onChange={onChangeBox} />}
			</Box>
			{!isEmpty(text) && (
				<Typography
					sx={{ paddingLeft: "15px", paddingRight: "15px", width: "200px" }}
				>
					{text}
				</Typography>
			)}
			{isNumericInput && <NumericControl {...props} />}
			{!isEmpty(type) && (
				<Typography sx={{ paddingLeft: "15px" }}>{type}</Typography>
			)}
		</Box>
	);
};

const GuideLimits = () =>
{
	const dispatch = useDispatch();
	const captureSettings = useSelector((state) => state.ekos.captureSettings);

	const SETTINGS = captureSettings;

	// State for new Capture Settings i.e Kstars => 3.7.0
	const NEW_STATE = {
		checkStartGuide: get(SETTINGS, KEYS.enforceStartGuiderDrift, false),
		startGuideDeviation: get(SETTINGS, KEYS.startGuideDeviation, 0),
		abortGuideDeviation: get(SETTINGS, KEYS.enforceGuideDeviation, false),
		guideDeviation: get(SETTINGS, KEYS.guideDeviation, 0),
		consecutiveTimes: get(SETTINGS, KEYS.guideDeviationReps, 0),
		ditherJob: get(SETTINGS, KEYS.guideDitherPerJobFrequency, 0),
	};

	const [state, setState] = useState(NEW_STATE);

	const {
		checkStartGuide,
		startGuideDeviation,
		abortGuideDeviation,
		guideDeviation,
		consecutiveTimes,
		ditherJob,
	} = state;

	const setSettings = (key, value, type = "") =>
	{
		let localType = isEmpty(type) ? key : type;
		setState({ ...state, [localType]: value });
		dispatch(captureActions.setAllSettings({ [key]: value }));
	};

	return (
		<Box>
			<Box sx={{ alignItems: "center" }}>
				<Box
					sx={[
						LOCAL_STYLES.collapseBodyContainer,
						{
							marginRight: "auto",
							marginLeft: "auto",
							marginBottom: "auto",
						},
					]}
				>
					<Box sx={[styles.row, LOCAL_STYLES.collapseFormGroup]}>
						<CustomizedNumericInput
							checked={checkStartGuide}
							// editable={checkStartGuide}
							onChangeBox={() =>
								setSettings(
									KEYS.enforceStartGuiderDrift,
									!checkStartGuide,
									"checkStartGuide",
								)
							}
							initialValue={startGuideDeviation}
							customLimit={[0, 30]}
							steps={[1, 1]}
							totalWidth="150px"
							text={s.ekos.capture_limits.start_deviation}
							type={'"'}
							onChange={(value) => setSettings(KEYS.startGuideDeviation, value)}
						/>
					</Box>

					<Fragment>
						<Box sx={[styles.row, LOCAL_STYLES.collapseFormGroup]}>
							<CustomizedNumericInput
								checked={abortGuideDeviation}
								// editable={checkAbortGuide}
								onChangeBox={() =>
									setSettings(
										KEYS.enforceGuideDeviation,
										!abortGuideDeviation,
										"abortGuideDeviation",
									)
								}
								initialValue={guideDeviation}
								customLimit={[0, 30]}
								steps={[1, 1]}
								totalWidth="150px"
								text={s.ekos.capture_limits.guide_deviation}
								type={'"'}
								onChange={(value) => setSettings(KEYS.guideDeviation, value)}
							/>

							<CustomizedNumericInput
								isCheckBox={false}
								initialValue={consecutiveTimes}
								customLimit={[0, 20]}
								steps={[1, 1]}
								totalWidth="150px"
								type={s.ekos.capture_limits.consecutive_times}
								onChange={(value) =>
									setSettings(
										KEYS.guideDeviationReps,
										value,
										"consecutiveTimes",
									)
								}
							/>
						</Box>
						<Box sx={[styles.row, LOCAL_STYLES.collapseFormGroup]}>
							<CustomizedNumericInput
								isCheckBox={false}
								initialValue={ditherJob}
								customLimit={[0, 60]}
								steps={[1, 1]}
								totalWidth="150px"
								text={s.ekos.capture_limits.dither_job}
								type={s.ekos.collapse_guide.frames}
								onChange={(value) =>
									setSettings(
										KEYS.guideDitherPerJobFrequency,
										value,
										"ditherJob",
									)
								}
							/>
						</Box>
					</Fragment>
				</Box>
			</Box>
		</Box>
	);
};

export default memo(GuideLimits);

const LOCAL_STYLES = {
	collapseBodyContainer: {
		height: "100%",
		marginLeft: "32px",
		marginRight: "32px",
		paddingLeft: "16px",
		paddingRight: "16px",
	},
	collapseFormGroup: {
		marginTop: "8px",
	},
};
