import React, { Fragment, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { isEmpty, get } from "lodash";
import { focusActions } from "@redux/actions";
import { Box, Checkbox, Typography } from "@mui/material";
import { styles } from "@client/shared/styles";
import NumericControl from "@components/NumericControl";
import Dropdown from "@components/Dropdown";
import s from "@common/shared/i18n/i18n";

const Detections = [
	{ label: "Gradient", value: "Gradient" },
	{ label: "Centroid", value: "Centroid" },
	{ label: "Threshold", value: "Threshold" },
	{ label: "SEP", value: "SEP" },
	{ label: "Bahtinov", value: "Bahtinov" },
];

const Algorithms = [
	{ label: "Iterative", value: "Iterative" },
	{ label: "Polynomial", value: "Polynomial" },
	{ label: "Linear", value: "Linear" },
	{ label: "Linear 1 Pass", value: "Linear 1 Pass" },
];

const CurveFits = [
	{ label: "Quadratic", value: "Quadratic" },
	{ label: "Hyperbola", value: "Hyperbola" },
	{ label: "Parabola", value: "Parabola" },
];

const CustomCheckBox = ({ checked, onPress, text }) =>
{
	return (
		<Box sx={styles.row}>
			<Checkbox checked={checked} onClick={onPress} />
			<Typography sx={{ paddingLeft: "25px" }}>{text}</Typography>
		</Box>
	);
};

const CustomNumericalInput = ({
	initialValue,
	onChange,
	steps,
	customLimit,
	text,
	right = false,
}) =>
{
	return (
		<Box sx={styles.row}>
			<Typography sx={{ marginRight: "15px", marginLeft: right ? "90px" : 0 }}>
				{text}
			</Typography>
			<NumericControl
				initialValue={initialValue}
				onChange={onChange}
				steps={steps}
				customLimit={customLimit}
				totalWidth="200px"
			/>
		</Box>
	);
};
const Process = () =>
{
	const dispatch = useDispatch();
	const focusSettings = useSelector((state) => state.ekos.focusSettings);

	const [detection, setDetection] = useState(
		get(focusSettings, "focusDetection", "SEP"),
	);
	const [sep, setSep] = useState(
		get(focusSettings, "focusSEPProfile", "1-Focus-Default"),
	);
	const [algorithm, setAlgorithm] = useState(
		get(focusSettings, "focusAlgorithm", "Linear 1 Pass"),
	);
	const [curveFit, setCurveFit] = useState(
		get(focusSettings, "focusCurveFit", "N/A"),
	);
	const [threshold, setThreshold] = useState(
		get(focusSettings, "focusThreshold", 150),
	);
	const [tolerance, setTolerance] = useState(
		get(focusSettings, "focusTolerance", 1),
	);
	const [average, setAverage] = useState(
		get(focusSettings, "focusFramesCount", 1),
	);
	const [kernel, setKernel] = useState(
		get(focusSettings, "focusGaussianKernelSize", 5),
	);
	const [rows, setRows] = useState(
		get(focusSettings, "focusMultiRowAverage", 3),
	);
	const [sigma, setSigma] = useState(
		get(focusSettings, "focusGaussianSigma", 1.5),
	);
	const [state, setState] = useState({
		useWeight: get(focusSettings, "focusUseWeights", false),
		rLimit: get(focusSettings, "focusR2Limit", 0),
		refineCurve: get(focusSettings, "focusRefineCurveFit", false),
		averageOver: get(focusSettings, "focusFramesCount", 0),
		averageHFR: get(focusSettings, "focusHFRFramesCount", 0),

		timeDilation: get(focusSettings, "focusTimeDilation", 0),
		outlier: get(focusSettings, "focusOutlierRejection", 0),

		dataPoints: get(focusSettings, "focusScanDatapoints", 0),
		stepSize: get(focusSettings, "focusScanStepSizeFactor", 0),
	});

	const { useWeight, rLimit, refineCurve, averageOver, averageHFR } = state;
	const stellarSolverProfiles = useSelector(
		(state) => state.ekos.stellarSolverProfiles.focus,
	);

	const setSettings = (key, payload) =>
	{
		dispatch(focusActions.setAllSettings({ [key]: payload }));
	};

	return (
		<Box sx={{ alignItems: "center" }}>
			<Box
				sx={[
					LOCAL_STYLES.collapseBodyContainer,
					{
						marginRight: "auto",
						marginLeft: "auto",
						marginTop: "50px",
						marginBottom: "auto",
					},
				]}
			>
				<Box>
					<Box sx={[styles.row, LOCAL_STYLES.collapseFormGroup]}>
						<Typography sx={LOCAL_STYLES.label}>
							{s.ekos.collapse_focus.process.detection}
						</Typography>
						<Dropdown
							sx={{ width: "200px" }}
							options={Detections}
							value={detection}
							onChange={(data) =>
							{
								setDetection(data.value);
								setSettings("focusDetection", data.value);
							}}
						/>
						{!isEmpty(stellarSolverProfiles) && (
							<Fragment>
								<Typography
									sx={[
										LOCAL_STYLES.label,
										{
											marginLeft: "100px",
										},
									]}
								>
									{s.general.sep_profile}
								</Typography>
								<Dropdown
									sx={{ width: "200px" }}
									options={stellarSolverProfiles.map((item) => ({
										label: item,
										value: item,
									}))}
									value={sep}
									onChange={(data) =>
									{
										setSep(data.value);
										setSettings("focusSEPProfile", data.value);
									}}
								/>
							</Fragment>
						)}
					</Box>

					<Box sx={[styles.row, LOCAL_STYLES.collapseFormGroup]}>
						<Box sx={[styles.row, { flex: 1 / 2 }]}>
							<Typography sx={LOCAL_STYLES.label}>
								{s.ekos.collapse_focus.process.algorithm}
							</Typography>
							<Dropdown
								// sx={{ width: "200px" }}
								options={Algorithms}
								value={algorithm}
								onChange={(data) =>
								{
									setAlgorithm(data.value);
									setSettings("focusAlgorithm", data.value);
								}}
								isSelected={(item) =>
								{
									return algorithm === item.label;
								}}
							/>
						</Box>
						<Box sx={[styles.row, { flex: 1 / 2 }]}>
							{algorithm !== Algorithms[0].label && (
								<Fragment>
									<Typography sx={[LOCAL_STYLES.label]}>
										{s.ekos.collapse_focus.process.curve_fit}
									</Typography>
									<Dropdown
										options={CurveFits}
										value={curveFit}
										onChange={(data) =>
										{
											setCurveFit(data.value);
											setSettings("focusCurveFit", data.value);
										}}
										isSelected={(item) =>
										{
											return curveFit === item.label;
										}}
									/>
								</Fragment>
							)}
						</Box>
					</Box>

					{algorithm !== Algorithms[3].text && (
						<Box sx={[styles.row, LOCAL_STYLES.collapseFormGroup]}>
							<Box sx={[styles.row, { flex: 1 / 2 }]}>
								<Typography sx={LOCAL_STYLES.label}>
									{s.ekos.collapse_focus.process.average_over}
								</Typography>
								<NumericControl
									initialValue={average}
									onChange={(value) =>
									{
										setAverage(value);
										setSettings("focusFramesCount", value);
									}}
									width={120}
									steps={[1, 1]}
									customLimit={[0, 99]}
								/>
								{/* <Typography
									sx={{
										marginLeft: "20px",
										paddingTop: "2px",
									}}
								>
									{s.ekos.collapse_guide.frames}
								</Typography> */}
							</Box>
							<Box sx={[styles.row, { flex: 1 / 2 }]}>
								<Typography sx={[LOCAL_STYLES.label]}>
									{s.ekos.capture_auto_calibration.tolerance}
								</Typography>
								<NumericControl
									initialValue={tolerance}
									onChange={(value) =>
									{
										setTolerance(value);
										setSettings("focusTolerance", value);
									}}
									width={120}
									numberType="float"
									steps={[0.1, 0.1]}
									customLimit={[0.01, 20.0]}
								/>
								<Typography sx={{ marginLeft: "15px" }}>%</Typography>
							</Box>
						</Box>
					)}

					{detection === "Bahtinov" && (
						<Box sx={[styles.row, LOCAL_STYLES.collapseFormGroup]}>
							<Box sx={[styles.row, { flex: 1 / 2 }]}>
								<Typography sx={[LOCAL_STYLES.label]}>
									{s.ekos.collapse_focus.process.num_of_rows}
								</Typography>
								<NumericControl
									initialValue={rows}
									onChange={(value) =>
									{
										setRows(value);
										setSettings("focusMultiRowAverage", value);
									}}
									width={120}
									steps={[2, 2]}
									customLimit={[1, 15]}
								/>
							</Box>
							<Box sx={[styles.row, { flex: 1 / 2 }]}>
								<Typography sx={LOCAL_STYLES.label}>
									{s.ekos.collapse_focus.process.kernel_size}
								</Typography>
								<NumericControl
									initialValue={kernel}
									onChange={(value) =>
									{
										setKernel(value);
										setSettings("focusGaussianKernelSize", value);
									}}
									width={120}
									steps={[2, 2]}
									customLimit={[3, 15]}
								/>
							</Box>
						</Box>
					)}

					{detection === "Bahtinov" && (
						<Box sx={[styles.row, LOCAL_STYLES.collapseFormGroup]}>
							<Typography sx={LOCAL_STYLES.label}>
								{s.ekos.collapse_focus.process.sigma}
							</Typography>
							<NumericControl
								initialValue={sigma}
								onChange={(value) =>
								{
									setSigma(value);
									setSettings("focusGaussianSigma", value);
								}}
								width={120}
								steps={[0.1, 0.1]}
								customLimit={[0.1, 10]}
							/>
						</Box>
					)}

					<Box sx={[styles.row, LOCAL_STYLES.collapseFormGroup]}>
						<Box sx={{ flex: 1 / 2 }}>
							<CustomCheckBox
								checked={useWeight}
								onPress={() =>
								{
									setState({ ...state, useWeight: !useWeight });
									setSettings("focusUseWeights", !useWeight);
								}}
								text={s.ekos.collapse_focus.process.use_weights}
							/>
						</Box>
						<Box sx={[styles.row, { flex: 1 / 2 }]}>
							<Typography
								sx={{
									paddingTop: "10px",
									paddingLeft: "5px",
									width: "100px",
								}}
							>
								R² {s.ekos.collapse_focus.process.limit}
							</Typography>
							<Box sx={{ marginRight: "15px" }}>
								<NumericControl
									initialValue={rLimit}
									onChange={(value) =>
									{
										setState({ ...state, rLimit: value });
										setSettings("focusR2Limit", value);
									}}
									width={120}
									steps={[0.1, 0.1]}
									customLimit={[0, 1]}
								/>
							</Box>
						</Box>
					</Box>

					<Box sx={[styles.row, LOCAL_STYLES.collapseFormGroup]}>
						<Box sx={{ flex: 1 / 2 }}>
							<CustomCheckBox
								checked={refineCurve}
								onPress={() =>
								{
									setState({ ...state, refineCurve: !refineCurve });
									setSettings("focusRefineCurveFit", !refineCurve);
								}}
								text={s.ekos.collapse_focus.process.refine_curve}
							/>
						</Box>
						<Box sx={[styles.row, { flex: 1 / 2 }]}>
							<Typography
								sx={[
									LOCAL_STYLES.label,
									{
										paddingTop: "10px",
									},
								]}
							>
								{s.ekos.collapse_focus.process.average_over}
							</Typography>
							<CustomNumericalInput
								initialValue={averageOver}
								onChange={(value) =>
								{
									setState({ ...state, averageOver: value });
									setSettings("focusFramesCount", value);
								}}
								steps={[1, 1]}
								customLimit={[1, 99]}
							/>
						</Box>
					</Box>

					<Box
						sx={[
							styles.row,
							LOCAL_STYLES.collapseFormGroup,
							{ justifyContent: "space-between" },
						]}
					>
						<Box sx={styles.row}>
							<Typography
								sx={{
									paddingTop: "10px",
									width: "145px",
								}}
							>
								{s.ekos.collapse_focus.process.average_hfr}
							</Typography>
							<Box sx={styles.row}>
								<CustomNumericalInput
									initialValue={averageHFR}
									onCh={(value) =>
									{
										setState({ ...state, averageHFR: value });
										setSettings("focusHFRFramesCount", value);
									}}
									steps={[1, 1]}
									customLimit={[1, 99]}
								/>
							</Box>

							{detection === "Threshold" && (
								<Box sx={styles.row}>
									<Typography sx={{ width: "15px", marginLeft: "90px" }}>
										{s.ekos.collapse_focus.process.threshold}
									</Typography>
									<NumericControl
										initialValue={threshold}
										onChange={(value) =>
										{
											setThreshold(value);
											setSettings("focusThreshold", value);
										}}
										width={120}
										incrementStep={10}
										decrementStep={10}
										minValue={90}
										maxValue={500}
									/>
								</Box>
							)}
						</Box>
					</Box>
				</Box>
			</Box>
		</Box>
	);
};

export default Process;

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
		height: "100%",
		// marginTop: 32 * px,
		marginLeft: "32px",
		marginRight: "32px",
		paddingLeft: "16px",
		paddingRight: "16px",
		// paddingTop: 8 * px
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
	label: { width: "120px" },
};
