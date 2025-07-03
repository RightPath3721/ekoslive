import { Box, Button, Typography } from "@mui/material";
import { get, isEmpty } from "lodash";
import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { captureActions } from "@redux/actions";
import { numericControls, trainModules, DEVICE_TYPE } from "@indi/enums";
import { selectTrainDevice } from "@redux/selectors";
import { styles } from "../../../shared/styles";
import { Palette } from "@common/shared/common/styles";
import CustomizedSwitch from "../../../Components/CustomSwitch";
import Dropdown from "../../../Components/Dropdown";
import NumericControl from "../../../Components/NumericControl";
import s from "@common/shared/i18n/i18n";
import {
	selectDarkLibraryAllSettings,
	selectDarkLibraryTableData,
	selectCaptureStatus,
} from "@redux/selectors";
import Icon from "@components/Icon";
import defaultImg from "@images/background.webp";

const DarkText = ({ title }) =>
{
	return (
		<Typography sx={{ color: "white", width: "max-content" }}>
			{title}
		</Typography>
	);
};
const DarkInput = ({
	title,
	device,
	value,
	type,
	onChange,
	limits,
	steps,
	editable,
}) =>
{
	return (
		<Box
			sx={{
				display: "grid",
				gridTemplateColumns: "90px auto",
				alignItems: "center",
				justifyContent: "flex-start",
				padding: "10px",
			}}
		>
			<DarkText title={title} />
			<NumericControl
				type={type}
				editable={editable}
				initialValue={value}
				device={device}
				onChange={onChange}
				steps={steps}
				customLimit={limits}
			/>
		</Box>
	);
};
const CreateDarks = () =>
{
	const dispatch = useDispatch();

	const activeCamera = useSelector((state) =>
		selectTrainDevice(state, {
			trainType: trainModules.CaptureOpticalTrain,
			deviceType: DEVICE_TYPE.CAMERA,
		}),
	);
	const metadata = useSelector((state) => state.wsMedia.darkLibraryMetaData);

	const [isoControl, setISOControl] = useState({ limit: [], range: [] });
	const settings = useSelector(selectDarkLibraryAllSettings);
	const tableData = useSelector(selectDarkLibraryTableData);
	const status = useSelector(selectCaptureStatus);

	const [totalImageCount, setTotalImageCount] = useState(
		parseInt(settings.totalImages),
	);
	const [showControls, setShowControls] = useState(true);
	const [imageData, setImageData] = useState(defaultImg);
	const [hasMounted, setHasMounted] = useState(false);

	const [state, setState] = useState({
		minExposureSpin: get(settings, "minExposureSpin", 0),
		maxExposureSpin: get(settings, "maxExposureSpin", 0),
		minTemperatureSpin: get(settings, "minTemperatureSpin", 0),
		maxTemperatureSpin: get(settings, "maxTemperatureSpin", 0),
		bin1Check: get(settings, "bin1Check", false),
		bin2Check: get(settings, "bin2Check", false),
		bin4Check: get(settings, "bin4Check", false),
		countSpin: get(settings, "countSpin", 0),
		captureGainN: get(settings, "captureGainN", 0),
		captureISOS: get(settings, "captureISOS", ""),
		exposureStepSin: get(settings, "exposureStepSin", 0),
		temperatureStepSpin: get(settings, "temperatureStepSpin", 0),
	});

	const isCapturing =
		status !== "Idle" && status !== "Aborted" && status !== "Complete";
	// const [isStreaming, setIsStreaming] = useState(false);
	const isStreaming = false;
	const isSettingTemperature = status === "Setting Temperature";
	const isIdle = !isCapturing && !isStreaming && !isSettingTemperature;

	const binningOptions = [
		{
			label: "1x1",
			value: 1,
		},
		{
			label: "2x2",
			value: 2,
		},
		{
			label: "4x4",
			value: 4,
		},
	];

	const {
		minExposureSpin,
		maxExposureSpin,
		minTemperatureSpin,
		maxTemperatureSpin,
		bin1Check,
		bin2Check,
		bin4Check,
		countSpin,
		captureGainN,
		captureISOS,
		exposureStepSin,
		temperatureStepSpin,
	} = state;

	const countTotalImages = () =>
	{
		let imageCount = 0;
		let temperatureCount = 1.0;
		let binnings = 0;

		if (settings.temperatureEnabled)
		{
			temperatureCount = Math.max(
				1,
				Math.abs(maxTemperatureSpin - minTemperatureSpin) + 1,
			);
		}
		if (bin1Check) binnings++;
		if (bin2Check) binnings++;
		if (bin4Check) binnings++;

		for (let i = minExposureSpin; i <= maxExposureSpin; i += 1)
		{
			imageCount += temperatureCount * binnings * countSpin;
		}
		setTotalImageCount(imageCount);
	};

	const ArrowStyles = showControls
		? { right: 0, top: "15rem" }
		: { left: 0, top: "20rem" };

	const ArrowButton = () => (
		<Box sx={[ArrowStyles, { position: "absolute", display: "flex" }]}>
			<Button
				onClick={() => setShowControls(!showControls)}
				sx={{ height: "50px" }}
			>
				<Icon name="arrow-right" />
			</Button>
		</Box>
	);

	useEffect(() =>
	{
		dispatch(captureActions.darkLibrarySetDefectFrame());
		dispatch(captureActions.darkLibraryGetDarkSettings());
		dispatch(captureActions.darkLibraryGetViewMasters());

		if (!isEmpty(tableData))
		{
			tableData.map((rows, index) =>
			{
				if (index === 0)
				{
					let data = {
						row: index,
					};
					dispatch(captureActions.darkLibraryGetMastersImage(data));
				}
			});
		}
	}, []);

	useEffect(() =>
	{
		countTotalImages();
	}, [state]);

	useEffect(() =>
	{
		if (activeCamera)
		{
			setISOControl({ range: activeCamera.getRangeList("CCD_ISO") });
		}
	}, []);

	useEffect(() =>
	{
		dispatch(captureActions.setDarkLibrarySettings(state));
		dispatch(captureActions.getAllDarkLibrarySettings());
	}, [state]);

	useEffect(() =>
	{
		if (!hasMounted)
		{
			setHasMounted(true);
			return;
		}

		if (!isEmpty(metadata))
		{
			setImageData(metadata.preview + "?ts=" + new Date());
		}
	}, [metadata]);

	return (
		<Box sx={{}}>
			{showControls && (
				<Box
					sx={{
						position: "absolute",
						backgroundColor: "rgba(0,0,0,0.7)",
						height: "80%",
					}}
				>
					<Box sx={[styles.row, { padding: "16px" }]}>
						<DarkInput
							title={`${s.darkLibrary.create_darks.exposure_range}: `}
							device={activeCamera}
							type={numericControls.EXPOSURE}
							steps={[1, 1]}
							limits={[0.01, 998]}
							onChange={(e) => setState({ ...state, minExposureSpin: e })}
							value={minExposureSpin}
						/>

						<DarkInput
							title={s.darkLibrary.create_darks.to}
							steps={[1, 1]}
							limits={[0.01, 999]}
							onChange={(e) => setState({ ...state, maxExposureSpin: e })}
							value={maxExposureSpin}
							device={activeCamera}
						/>

						<DarkInput
							title={s.ekos.collapse_focus.steps}
							device={activeCamera}
							steps={[1, 1]}
							limits={[0.5, 20]}
							onChange={(e) => setState({ ...state, exposureStepSin: e })}
							value={exposureStepSin}
						/>
					</Box>

					{settings.temperatureEnabled && (
						<Box
							sx={[
								styles.row,
								{
									alignItems: "center",
									justifyContent: "flex-start",
									padding: "16px",
								},
							]}
						>
							<DarkInput
								title={`${s.darkLibrary.create_darks.temp_range}: `}
								steps={[1, 1]}
								limits={[-50, maxTemperatureSpin]}
								onChange={(value) =>
									setState({ ...state, minTemperatureSpin: value })
								}
								value={minTemperatureSpin}
								type={numericControls.TEMPERATURE}
							/>

							<DarkInput
								title={`${s.darkLibrary.create_darks.to}: `}
								steps={[1, 1]}
								limits={[minTemperatureSpin, 20]}
								onChange={(value) =>
									setState({ ...state, maxTemperatureSpin: value })
								}
								value={maxTemperatureSpin}
								device={activeCamera}
								type={numericControls.TEMPERATURE}
							/>

							<DarkInput
								title={s.ekos.collapse_focus.steps}
								device={activeCamera}
								value={temperatureStepSpin}
								limits={[0.5, 20]}
								steps={[1, 1]}
								onChange={(value) =>
									setState({ ...state, temperatureStepSpin: value })
								}
							/>
						</Box>
					)}

					{activeCamera?.hasGain() && (
						<DarkInput
							title="Gain"
							value={captureGainN}
							onChange={(e) => setState({ ...state, captureGainN: e })}
							type={numericControls.GAIN}
						/>
					)}

					{isEmpty(isoControl.range) && (
						<Box sx={[LOCAL_STYLES.gridItem]}>
							<DarkText title={s.general.iso} />
							<Dropdown
								options={isoControl.range.map((item, index) => ({
									label: item,
									value: index,
								}))}
								value={captureISOS}
								onChange={(e) =>
								{
									setState({ ...state, captureISOS: e.label });
								}}
							/>
						</Box>
					)}

					<Box sx={[LOCAL_STYLES.gridItem]}>
						<DarkText title={s.general.binning} />
						<CustomizedSwitch
							options={binningOptions}
							roundCorner={true}
							onChange={(val) =>
							{
								if (val === 1)
									setState({
										...state,
										bin1Check: true,
										bin2Check: false,
										bin4Check: false,
									});
								else if (val === 2)
									setState({
										...state,
										bin1Check: false,
										bin2Check: true,
										bin4Check: false,
									});
								else if (val === 4)
									setState({
										...state,
										bin1Check: false,
										bin2Check: false,
										bin4Check: true,
									});
							}}
							value={bin1Check ? 1 : bin2Check ? 2 : bin4Check ? 4 : 1}
						/>
					</Box>

					<DarkInput
						title="Count"
						value={countSpin}
						onChange={(e) => setState({ ...state, countSpin: e })}
						steps={[1, 1]}
						limits={[3, 20]}
						width="100px"
					/>

					<Box sx={[LOCAL_STYLES.gridItem]}>
						<Typography sx={{ color: "white" }}>
							{s.darkLibrary.create_darks.total_images}:{" "}
						</Typography>
						<Typography
							sx={[
								{
									backgroundColor: "#444444",
									color: "white",
									textAlign: "center",
									width: "70px",
									borderRadius: "8px",
								},
							]}
						>
							{isNaN(totalImageCount) ? 0 : totalImageCount}
						</Typography>
					</Box>

					<Button
						sx={{
							backgroundColor: "#ff6600",
							width: "150px",
							margin: "0 auto",
							textTransform: "none",
							color: "white",
							textAlign: "center",
							color: Palette.white,
						}}
						onClick={() =>
						{
							if (isIdle)
							{
								countTotalImages();
								dispatch(captureActions.darkLibraryGetDarkSettings());
								dispatch(captureActions.darkLibraryStart(state));
							}

							if (isCapturing || isSettingTemperature)
							{
								dispatch(captureActions.darkLibraryStop());
							}
						}}
					>
						{isIdle ? s.general.start : s.general.stop}
					</Button>
					<ArrowButton />
				</Box>
			)}

			<img style={LOCAL_STYLES.image} src={imageData} />
			{!showControls && <ArrowButton />}
		</Box>
	);
};

const LOCAL_STYLES = {
	gridItem: {
		display: "grid",
		gridTemplateColumns: "90px auto",
		alignItems: "center",
		justifyContent: "flex-start",
		padding: "10px",
	},
	image: {
		objectFit: "contain",
		width: "80%",
		height: "80%",
		maxHeight: "calc(100vh - 280px)",
	},
};

export default CreateDarks;
