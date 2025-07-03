import { isEmpty, get } from "lodash";
import React, { memo, useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { focusActions } from "@redux/actions";
import { Box, Typography } from "@mui/material";
import { styles } from "@client/shared/styles";
import s from "@common/shared/i18n/i18n";
import Dropdown from "@components/Dropdown";
import NumericControl from "@components/NumericControl";

const CustomizedNumericInput = ({
	text,
	isNumericInput = true,
	type,
	...props
}) =>
{
	return (
		<Box sx={styles.row}>
			<Typography
				sx={{
					width: "120px",
				}}
			>
				{text}
			</Typography>
			{isNumericInput && <NumericControl {...props} />}
			{!isEmpty(type) && (
				<Typography sx={{ paddingLeft: "15px" }}>{type}</Typography>
			)}
		</Box>
	);
};

const WalkOptions = [
	{ label: "Classic", value: "Classic" },
	{ label: "Fixed Steps", value: "Fixed Steps" },
	{ label: "CFZ Shuffle", value: "CFZ Shuffle" },
];

const Mechanics = () =>
{
	const dispatch = useDispatch();

	const focusSettings = useSelector((state) => state.ekos.focusSettings);

	const [step, setStep] = useState(get(focusSettings, "focusTicks", 250));
	const [travel, setTravel] = useState(
		get(focusSettings, "focusMaxTravel", 10000),
	);
	const [maxstep, setMaxstep] = useState(
		get(focusSettings, "focusMaxSingleStep", 1000000),
	);
	const [backlash, setBacklash] = useState(
		get(focusSettings, "focusBacklash", 0),
	);
	const [settle, setSettle] = useState(
		get(focusSettings, "focusSettleTime", 1),
	);
	const [numberSteps, setNumberSteps] = useState(
		get(focusSettings, "focusNumSteps", 10),
	);
	const [walk, setWalk] = useState(
		get(focusSettings, "focusWalk", "Fixed Steps"),
	);
	const [aFOverscan, setAFOverscan] = useState(
		get(focusSettings, "focusAFOverscan", 100),
	);
	const [captureTimeout, setCaptureTimeout] = useState(
		get(focusSettings, "focusCaptureTimeout", 30),
	);
	const [overscanDelay, setOverscanDelay] = useState(
		get(focusSettings, "focusOverscanDelay", 0),
	);
	const [motionTimeout, setMotionTimeout] = useState(
		get(focusSettings, "focusMotionTimeout", 30),
	);

	useEffect(() =>
	{
		let payload = {
			focusTicks: step,
			focusMaxTravel: travel,
			focusMaxSingleStep: maxstep,
			focusBacklash: backlash,
			focusSettleTime: settle,
			focusNumSteps: numberSteps,
			focusWalk: walk,
			focusAFOverscan: aFOverscan,
			focusCaptureTimeout: captureTimeout,
			focusOverscanDelay: overscanDelay,
			focusMotionTimeout: motionTimeout,
		};
		dispatch(focusActions.setAllSettings(payload));
	}, [
		step,
		travel,
		maxstep,
		backlash,
		settle,
		numberSteps,
		walk,
		aFOverscan,
		captureTimeout,
		overscanDelay,
		motionTimeout,
	]);

	return (
		<Box
			sx={[
				LOCAL_STYLES.collapseBodyContainer,
				{
					display: "flex",
					flexDirection: "column",
					width: "100%",
				},
			]}
		>
			<Box sx={[styles.row, LOCAL_STYLES.collapseFormGroup]}>
				<Box sx={LOCAL_STYLES.flexBox}>
					<Typography sx={{ paddingLeft: "15px", width: "120px" }}>
						{s.general.walk}
					</Typography>
					<Dropdown
						options={WalkOptions}
						value={walk}
						width="120px"
						onChange={(data) => setWalk(data.label)}
					/>
				</Box>
				<Box sx={LOCAL_STYLES.flexBox}>
					<CustomizedNumericInput
						initialValue={settle}
						onChange={(value) =>
						{
							setSettle(value);
						}}
						isRight
						text={s.ekos.collapse_align.settle}
						customLimit={[0, 30]}
						width={120}
					/>
				</Box>
			</Box>
			<Box sx={[styles.row, LOCAL_STYLES.collapseFormGroup]}>
				<Box sx={LOCAL_STYLES.flexBox}>
					<CustomizedNumericInput
						text={s.ekos.collapse_focus.mechanics.initial_step_size}
						initialValue={step}
						onChange={(value) =>
						{
							setStep(value);
						}}
						width={120}
						steps={[10, 10]}
						customLimit={[1, 50000]}
					/>
				</Box>
				<Box sx={LOCAL_STYLES.flexBox}>
					<CustomizedNumericInput
						text={s.ekos.collapse_focus.mechanics.number_steps}
						initialValue={numberSteps}
						onChange={(value) =>
						{
							setNumberSteps(value);
						}}
						isRight
						width={120}
						steps={[1, 1]}
						customLimit={[5, 50]}
					/>
				</Box>
			</Box>

			<Box sx={[styles.row, LOCAL_STYLES.collapseFormGroup]}>
				<Box sx={LOCAL_STYLES.flexBox}>
					<CustomizedNumericInput
						text={s.ekos.collapse_focus.mechanics.max_travel}
						initialValue={travel}
						onChange={(value) =>
						{
							setTravel(value);
						}}
						customLimit={[10, 100000]}
						width={120}
					/>
				</Box>
				<Box sx={LOCAL_STYLES.flexBox}>
					<CustomizedNumericInput
						initialValue={maxstep}
						onChange={(value) =>
						{
							setMaxstep(value);
						}}
						isRight
						text={s.ekos.collapse_focus.mechanics.max_step_size}
						width={120}
						steps={[1000, 1000]}
						customLimit={[10, 100000]}
					/>
				</Box>
			</Box>
			<Box sx={[styles.row, LOCAL_STYLES.collapseFormGroup]}>
				<Box sx={LOCAL_STYLES.flexBox}>
					<CustomizedNumericInput
						initialValue={backlash}
						onChange={(value) =>
						{
							setBacklash(value);
						}}
						text={s.ekos.collapse_focus.mechanics.backlash}
						width={120}
						steps={[100, 100]}
						customLimit={[0, 1000]}
					/>
				</Box>
				<Box sx={LOCAL_STYLES.flexBox}>
					<CustomizedNumericInput
						initialValue={aFOverscan}
						onChange={(value) =>
						{
							setAFOverscan(value);
						}}
						isRight
						text={s.ekos.collapse_focus.mechanics.af_overscan}
						width={120}
						steps={[1, 1]}
						customLimit={[0, 10000]}
					/>
				</Box>
			</Box>
			<Box sx={[styles.row, LOCAL_STYLES.collapseFormGroup]}>
				<Box sx={LOCAL_STYLES.flexBox}>
					<CustomizedNumericInput
						initialValue={captureTimeout}
						onChange={(value) =>
						{
							setCaptureTimeout(value);
						}}
						text={s.ekos.collapse_focus.mechanics.capture_timeout}
						width={120}
						steps={[1, 1]}
						customLimit={[5, 300]}
					/>
				</Box>
				<Box sx={LOCAL_STYLES.flexBox}>
					<CustomizedNumericInput
						initialValue={overscanDelay}
						onChange={(value) =>
						{
							setOverscanDelay(value);
						}}
						text={s.ekos.collapse_focus.mechanics.overscan_delay}
						isRight
						steps={[1, 1]}
						customLimit={[0, 10]}
						width={120}
					/>
				</Box>
			</Box>
			<Box sx={[styles.row, LOCAL_STYLES.collapseFormGroup]}>
				<CustomizedNumericInput
					initialValue={motionTimeout}
					onChange={(value) =>
					{
						setMotionTimeout(value);
					}}
					text={s.ekos.collapse_focus.mechanics.motion_timeout}
					width={120}
					customLimit={[5, 120]}
					steps={[1, 1]}
				/>
			</Box>
		</Box>
	);
};

export default memo(Mechanics);

const LOCAL_STYLES = {
	collapseHeaderContainer: {
		alignItems: "center",
		justifyContent: "center",
		flexDirection: "row",
		height: "64px",
		paddingHorizontal: "24px",
	},
	collapseHeaderText: {
		fontWeight: "bold",
		fontSize: "20px",
		flex: 1,
		textAlign: "center",
		color: "white",
	},
	collapseBodyContainer: {
		marginLeft: "32px",
		marginRight: "32px",
		paddingLeft: "16px",
		paddingRight: "16px",
	},
	collapseFormGroup: {
		marginTop: "10px",
		flex: 1,
	},
	closeButton: {
		position: "absolute",
		right: "32px",
		top: "46px",
		alignItems: "center",
		justifyContent: "center",
	},
	flexBox: {
		flex: 1 / 2,
		display: "flex",
		flexDirection: "row",
	},
};
