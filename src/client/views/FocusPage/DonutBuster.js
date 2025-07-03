import React, { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { get } from "lodash";
import { focusActions } from "@redux/actions";
import { Box, Checkbox, Typography } from "@mui/material";
import NumericControl from "@components/NumericControl";
import { styles } from "@client/shared/styles";
import s from "@common/shared/i18n/i18n";

const CustomNumericalInput = ({
	initialValue,
	onChange,
	editable = true,
	text,
	...props
}) =>
{
	return (
		<Box sx={styles.row}>
			<Typography sx={{ marginRight: "15px", width: "120px" }}>
				{text}
			</Typography>
			<NumericControl
				initialValue={initialValue}
				onChange={onChange}
				width={120}
				editable={editable}
				{...props}
			/>
		</Box>
	);
};
const DonutBuster = () =>
{
	const dispatch = useDispatch();
	const focusSettings = useSelector((state) => state.ekos.focusSettings);

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

		focusDonut: get(focusSettings, "focusDonut", false),
		startPos: get(focusSettings, "focusScanStartPos", false),
		always_on: get(focusSettings, "focusScanAlwaysOn", false),
	});

	const {
		dataPoints,
		stepSize,
		timeDilation,
		startPos,
		always_on,
		outlier,
		focusDonut,
	} = state;

	const setSettings = (key, payload) =>
	{
		dispatch(focusActions.setAllSettings({ [key]: payload }));
	};

	return (
		<Box sx={{ alignItems: "center" }}>
			<Box sx={[LOCAL_STYLES.collapseBodyContainer, {}]}>
				<Box>
					<Box
						sx={[
							styles.row,
							{
								alignSelf: "center",
								marginTop: "10px",
								justifyContent: "center",
							},
						]}
					>
						<Checkbox
							checked={focusDonut}
							onClick={() =>
							{
								setState({ ...state, focusDonut: !focusDonut });
								setSettings("focusDonut", !focusDonut);
							}}
						/>
						<Typography sx={{ marginLeft: "15px" }}>
							{s.ekos.collapse_focus.process.donut_buster}
						</Typography>
					</Box>

					<Box
						sx={[
							styles.row,
							LOCAL_STYLES.collapseFormGroup,
							{ justifyContent: "space-between", marginTop: "15px" },
						]}
					>
						<Box sx={[styles.row, LOCAL_STYLES.collapseFormGroup]}>
							<Box sx={[styles.row, { flex: 1 / 2 }]}>
								<CustomNumericalInput
									initialValue={timeDilation}
									onChange={(value) =>
									{
										setState({ ...state, timeDilation: value });
										setSettings("focusTimeDilation", value);
									}}
									steps={[1, 1]}
									customLimit={[0, 20]}
									text={s.ekos.collapse_focus.process.time_dilation}
									editable={focusDonut}
								/>
							</Box>

							<Box sx={[styles.row, { flex: 1 / 2 }]}>
								<CustomNumericalInput
									initialValue={outlier}
									onChange={(value) =>
									{
										setState({ ...state, outlier: value });
										setSettings("focusOutlierRejection", value);
									}}
									customLimit={[0, 0.4]}
									steps={[0.1, 0.1]}
									text={s.ekos.collapse_focus.process.outlier_rejection}
									editable={focusDonut}
									numberType="float"
									right
								/>
							</Box>
						</Box>
					</Box>

					<Box
						sx={[
							styles.row,
							{
								alignSelf: "center",
								marginTop: "20px",
								justifyContent: "center",
							},
						]}
					>
						<Checkbox
							checked={startPos}
							onClick={() =>
							{
								setState({ ...state, startPos: !startPos });
								setSettings("focusScanStartPos", !startPos);
							}}
						/>
						<Typography sx={{ marginLeft: "15px" }}>
							{s.ekos.collapse_focus.process.scan_pos}
						</Typography>
					</Box>
					<Box
						sx={[
							styles.row,
							LOCAL_STYLES.collapseFormGroup,
							{ justifyContent: "space-between", marginTop: "15px" },
						]}
					>
						<Box sx={[styles.row, LOCAL_STYLES.collapseFormGroup]}>
							<Box sx={[styles.row, { flex: 1 / 2 }]}>
								<CustomNumericalInput
									initialValue={dataPoints}
									onChange={(value) =>
									{
										setState({ ...state, dataPoints: value });
										setSettings("focusScanDatapoints", value);
									}}
									// totalWidth={200 * px}
									steps={[2, 2]}
									customLimit={[5, 11]}
									text={s.ekos.collapse_focus.process.datapoints}
									editable={startPos}
								/>
							</Box>

							<Box sx={[styles.row, { flex: 1 / 2 }]}>
								<CustomNumericalInput
									initialValue={stepSize}
									onChange={(value) =>
									{
										setState({ ...state, stepSize: value });
										setSettings("focusScanStepSizeFactor", value);
									}}
									customLimit={[0.1, 10]}
									steps={[1, 1]}
									numberType="float"
									text={s.ekos.collapse_focus.process.initial_size}
									editable={startPos}
									right
								/>
							</Box>
						</Box>
					</Box>
					<Box sx={[styles.row, { marginTop: "10px" }]}>
						<Checkbox
							checked={always_on}
							onClick={() =>
							{
								setState({ ...state, always_on: !always_on });
								setSettings("focusScanAlwaysOn", !always_on);
							}}
						/>
						<Typography sx={{ marginLeft: "10px" }}>
							{s.ekos.collapse_focus.donut_buster.always_on}
						</Typography>
					</Box>
				</Box>
			</Box>
		</Box>
	);
};

export default DonutBuster;

const LOCAL_STYLES = {
	collapseBodyContainer: {
		height: "100%",
		marginLeft: "32px",
		marginRight: "32px",
		paddingLeft: "16px",
		paddingRight: "16px",
		width: "100%",
	},
	collapseFormGroup: {
		marginTop: "10px",
		flex: 1,
		border: "1px solid rgba(0,0,0,0)",
	},
};
