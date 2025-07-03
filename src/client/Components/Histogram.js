import React, { memo, useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { get, isEqual } from "lodash";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import IconButton from "@mui/material/IconButton";
import Button from "@mui/material/Button";
import Slider from "@mui/material/Slider";
import CircularProgress from "@mui/material/CircularProgress";
import { alpha } from "@mui/material/styles";
import AutoFixHighIcon from "@mui/icons-material/AutoFixHigh";
import Image from "mui-image";
import { Palette } from "@common/shared/common/styles";
import { ekosActions } from "@redux/actions";
import {
	selectTrainDeviceName,
	selectCaptureMetadata,
	selectMetadata,
} from "@redux/selectors";
import { DEVICE_TYPE, MetaType, trainModules } from "@indi/enums";
import s from "@common/shared/i18n/i18n";
import NumericControl from "./NumericControl";

const NumericInput = ({
	text,
	initialValue,
	min,
	max,
	onChange,
	incrementStep = 1,
	decrementStep = 1,
	...props
}) =>
{
	return (
		<Box
			sx={{
				display: "flex",
				flexDirection: "row",
				alignItems: "center",
				gap: "10px",
			}}
		>
			<Typography style={{ color: "white" }}>{text}</Typography>
			<NumericControl
				initialValue={initialValue}
				totalWidth="175px"
				customLimit={[min, max]}
				steps={[incrementStep, decrementStep]}
				onChange={onChange}
				{...props}
			/>
		</Box>
	);
};

const HistogramChart = ({ toggleHistogram, toggled }) =>
{
	const dispatch = useDispatch();
	const metadata = useSelector(selectMetadata, isEqual);

	const activeCameraName = useSelector((state) =>
		selectTrainDeviceName(state, {
			trainType: trainModules.CaptureOpticalTrain,
			deviceType: DEVICE_TYPE.CAMERA,
		}),
	);
	const [imageSource, setImageSource] = useState(null);

	// This is used to force re-render component after a sharedValue is updated
	const [ts, setTS] = useState(0);

	// Did we dispatch a request?
	const [busy, setBusy] = useState(false);

	// Min, Max, Median
	const [statisticsLabel, setStatisticsLabel] = useState("");

	const [shadowsStart, setShadowsStart] = useState(0);
	const [shadowsValue, setShadowsValue] = useState(0);

	const [midtonesStart, setMidtonesStart] = useState(50);
	const [midtonesValue, setMidtonesValue] = useState(50);

	const [highlightsValue, setHighlightsValue] = useState(100);
	const [highlightsStart, setHighlightsStart] = useState(100);

	const round = (num) =>
	{
		return Math.round((num + Number.EPSILON) * 1000) / 1000;
	};

	const setAutoStretch = () =>
	{
		setBusy(true);
		if ("view" in metadata)
			dispatch(ekosActions.invokeMethod(metadata["view"], "setAutoStretch"));
		else
			dispatch(
				ekosActions.invokeMethod(
					"Camera:" + activeCameraName,
					"setAutoStretch",
				),
			);
	};

	useEffect(() =>
	{
		if (imageSource && ts > 0)
		{
			setTS(0);

			setBusy(true);
			let objectName = "Camera:" + activeCameraName;
			if ("view" in metadata) objectName = metadata["view"];
			dispatch(
				ekosActions.invokeMethod(objectName, "setStretchValues", [
					{ type: MetaType.Double, value: shadowsValue / 100 },
					{ type: MetaType.Double, value: midtonesValue / 100 },
					{ type: MetaType.Double, value: highlightsValue / 100 },
				]),
			);
		}
	}, [shadowsValue, midtonesValue, highlightsValue, ts]);

	/**
	 *
	 */
	useEffect(() =>
	{
		const path = get(metadata, "histogram", "");
		setImageSource(path + "?ts=" + new Date());
		setBusy(false);

		setShadowsValue(round(get(metadata, "shadows", shadowsValue / 100) * 100));
		setShadowsStart(get(metadata, "shadows", shadowsStart / 100) * 100);

		setMidtonesValue(
			round(get(metadata, "midtones", midtonesValue / 100) * 100),
		);
		setMidtonesStart(get(metadata, "midtones", midtonesStart / 100) * 100);

		setHighlightsValue(
			round(get(metadata, "highlights", highlightsValue / 100) * 100),
		);
		setHighlightsStart(
			get(metadata, "highlights", highlightsStart / 100) * 100,
		);

		let newStatisticsLabel = "";
		// Make sure metadata is not empty
		if (metadata)
		{
			if ("min" in metadata)
				newStatisticsLabel +=
					s.ekos.histogram.minimum + ": " + metadata.min.toFixed(0) + " ◉ ";
			if ("max" in metadata)
				newStatisticsLabel +=
					s.ekos.histogram.maximum + ": " + metadata.max.toFixed(0) + " ◉ ";
			if ("median" in metadata)
				newStatisticsLabel +=
					s.ekos.histogram.median + ": " + metadata.median.toFixed(0);
		}

		setStatisticsLabel(newStatisticsLabel);
	}, [metadata]);

	if (toggled === false || imageSource === null) return null;

	return (
		<Box sx={[LOCAL_STYLES.container]}>
			{/* Histogram chart and axes */}
			<Button
				onClick={toggleHistogram}
				disableRipple
				sx={{
					"&:hover": {
						boxShadow: `0px 0px 0px 0px ${alpha("#000", 0.16)}`,
					},
					"&.Mui-focusVisible": {
						boxShadow: `0px 0px 0px 50px ${alpha("#000", 0.16)}`,
					},
					"&.Mui-active": {
						boxShadow: `0px 0px 0px 8px ${alpha("#000", 0.16)}`,
					},
					height: "auto",
					minHeight: "150px",
					backgroundColor: "black",
					border: `1px solid ${Palette.greydd}`,
					borderRadius: "5px",
					justifyContent: "center",
					padding: 0,
					position: "relative",
					overflow: "hidden",
				}}
			>
				<Image
					style={{ width: "100%", height: "auto" }}
					src={imageSource}
					duration={0.5}
				/>
				<Typography
					style={{
						color: Palette.white70,
						position: "absolute",
						top: "5px",
						right: "10px",
						fontSize: "15px",
					}}
				>
					{statisticsLabel}
				</Typography>
			</Button>

			<Slider
				track={false}
				defaultValue={[
					shadowsValue / 100,
					midtonesValue / 100,
					highlightsValue / 100,
				]}
				value={[shadowsValue / 100, midtonesValue / 100, highlightsValue / 100]}
				onChangeCommitted={(_, values) =>
				{
					setTS(+new Date());
					const shadows = values[0];
					const midtones = values[1];
					const highlights = values[2];

					setHighlightsValue(
						Math.max(Math.min(100 * highlights, 100), midtones + 0.1),
					);
					setMidtonesValue(
						Math.max(
							Math.min(100 * midtones, highlightsValue - 0.1),
							shadows + 0.1,
						),
					);
					setShadowsValue(
						Math.max(Math.min(100 * shadows, midtones * 100 - 0.1), 0),
					);
				}}
				max={1}
				min={0}
				step={0.02}
				sx={{
					"& .MuiSlider-thumb": {
						[`&:nth-of-type(${3})`]: {
							background: Palette.grey33,
							border: `0.7px solid ${Palette.orange}`,
						},
						[`&:nth-of-type(${4})`]: {
							background: Palette.grey66,
							border: `0.7px solid ${Palette.orange}`,
						},
						[`&:nth-of-type(${5})`]: {
							background: Palette.greycc,
							border: `0.7px solid ${Palette.orange}`,
						},
					},
				}}
			/>

			<Box
				sx={{
					display: "flex",
					flexDirection: "row",
					justifyContent: "space-evenly",
					alignItems: "center",
				}}
			>
				<IconButton
					sx={{
						width: "32px",
						height: "32px",
						backgroundColor: Palette.orange,
						padding: 0,
					}}
					onClick={setAutoStretch}
				>
					<AutoFixHighIcon sx={{ color: "white", fontSize: 20 }} />
				</IconButton>
				<NumericInput
					text="Shadows"
					initialValue={round(shadowsValue)}
					min={0}
					max={midtonesValue}
					incrementStep={0.1}
					decrementStep={0.1}
					onChange={(value) =>
					{
						setShadowsValue(value);
						setTS(value);
					}}
				/>
				<NumericInput
					text="Midtones"
					initialValue={round(midtonesValue)}
					min={shadowsValue}
					max={highlightsValue}
					onChange={(value) =>
					{
						setMidtonesValue(value);
						setTS(value);
					}}
				/>
				<NumericInput
					text="Highlights"
					initialValue={round(highlightsValue)}
					min={midtonesValue}
					max={100}
					onChange={(value) =>
					{
						setHighlightsValue(value);
						setTS(value);
					}}
				/>

				<CircularProgress
					style={{ width: "20px", height: "20px", opacity: busy ? 1 : 0 }}
					color="info"
				/>
			</Box>
		</Box>
	);
};

export default memo(HistogramChart);

const LOCAL_STYLES = {
	sliderLine: {
		height: "3px",
		backgroundColor: "#808080",
	},
	container: {
		position: "absolute",
		bottom: "-20px",
		left: "50%",
		transform: "translateX(-50%)",
		zIndex: 1,
		width: "100%",
		display: "flex",
		flexDirection: "column",
		backgroundColor: "rgba(16, 16, 16, 0.6)",
		gap: "12px",
		padding: "4px",
		borderRadius: "4px",
	},
};
