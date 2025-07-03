import { get, isEmpty } from "lodash";
import React, { useEffect, useRef, useState } from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import CameraAltIcon from "@mui/icons-material/CameraAlt";
import RepeatIcon from "@mui/icons-material/Repeat";
import StopIcon from "@mui/icons-material/Stop";
import SettingsIcon from "@mui/icons-material/Settings";
import { useDispatch, useSelector } from "react-redux";
import { captureActions } from "@redux/actions";
import { ekosConstants } from "@redux/constants";
import {
	trainModules,
	DEVICE_TYPE,
	frameTypes,
	Bins,
} from "@common/shared/indi/enums";
import { styles } from "../../shared/styles";
import { Palette } from "@common/shared/common/styles";
import CircularStatic from "../../Components/CircularProgress";
import s from "@common/shared/i18n/i18n";
import {
	selectTrainDevice,
	selectCheckStatus,
	selectPreviewPreset,
	selectExposureDuration,
	selectExposureRemaining,
	elementAttributeSelector,
	checkNewCaptureSettings,
} from "@redux/selectors";
import tourGuide from "@components/global/tourGuide";

const tourGuideSteps = [
	{
		selector: "#Preview",
		content: s.tourGuide.description_preview,
	},
	{
		selector: "#Loop",
		content: s.tourGuide.description_framing,
	},
	{
		selector: "#Stop",
		content: s.tourGuide.description_stop,
	},
	{
		selector: "#quickSettings",
		content: s.tourGuide.description_quick_settings,
	},
];

const CameraQuickControls = ({ toggleCameraSettings }) =>
{
	const dispatch = useDispatch();
	const activeCamera = useSelector((state) =>
		selectTrainDevice(state, {
			trainType: trainModules.CaptureOpticalTrain,
			deviceType: DEVICE_TYPE.CAMERA,
		}),
	);
	const isNewCaptureSettingsSupported = useSelector(checkNewCaptureSettings);
	const isCapturing = useSelector(selectCheckStatus);
	const previewPreset = useSelector(selectPreviewPreset);
	const exposureDuration = useSelector(selectExposureDuration);
	const exposureRemaining = useSelector(selectExposureRemaining);
	const isStreaming = useSelector((state) =>
		elementAttributeSelector(state, {
			device: activeCamera?.name,
			property: "CCD_VIDEO_STREAM",
			element: "STREAM_ON",
			attribute: "state",
		}),
	);
	const counterRemaining = useRef(exposureRemaining);
	const counterDuration = useRef(exposureDuration);

	const [activeSettings, setActiveSettings] = useState("");
	// just send the preview settings, no need of camera
	const capturePreview = () =>
	{
		if (!isEmpty(previewPreset))
			if (!isEmpty(previewPreset))
			{
				if (isNewCaptureSettingsSupported)
				{
					// Get frame type as a text i.e Light
					const frame = frameTypes.filter(
						(data) => data.value === get(previewPreset, "frameType", 0),
					);

					// Get Active bin as text i.e "1x1"
					let bin = Bins.filter(
						(data) => data.value === get(previewPreset, "bin", 1),
					);
					bin = get(bin[0], "text", "1x1");
					bin = bin.split("x");

					let payload = {
						captureTypeS: get(frame[0], "label", "Light"),
						captureBinHN: bin[0],
						captureBinVN: bin[1],
						captureExposureN: get(previewPreset, "exp", 1),
						captureGainN: get(previewPreset, "gain", 0),
						captureOffsetN: get(previewPreset, "offset", 0),
						FilterPosCombo: get(previewPreset, "filter", "--"),
						captureFormatS: get(previewPreset, "captureFormat", "--"),
					};

					if (activeCamera?.canCool())
					{
						payload = {
							...payload,
							cameraTemperatureN: get(previewPreset, "temperature", "--"),
							// Force temperature cooling if the temperature is not "--"
							cameraTemperatureS:
								get(previewPreset, "temperature", "--") != "--",
						};
					}

					// Set recent preview settings before capturing a preview
					dispatch(captureActions.setAllSettings(payload));
				}
				dispatch(captureActions.capturePreview(previewPreset));
			}
	};

	const loop = () =>
	{
		// send previewPreset, so if settings are updated, it should be set with loop as well
		dispatch(captureActions.loop(previewPreset));
	};

	const data = [
		{
			icon: <CameraAltIcon sx={{ color: "#CECECE", fontSize: 20 }} />,
			title: s.tourGuide.title_preview,
			func: () =>
			{
				if (!isCapturing)
				{
					capturePreview();
				}
			},
			disabled: isEmpty(activeCamera),
		},
		{
			icon: <RepeatIcon sx={{ color: "#CECECE", fontSize: 20 }} />,
			title: s.ekos.collapse_camera.btn_loop,
			func: () => loop(),
			disabled: isEmpty(activeCamera),
		},
		{
			icon: <StopIcon sx={{ color: "#CECECE", fontSize: 20 }} />,
			title: s.general.stop,
			func: () =>
			{
				if (isCapturing)
				{
					// set the indicator, so users would know their  to stop loop is in progress
					dispatch(captureActions.stop());
				}

				if (isStreaming)
				{
					dispatch(captureActions.toggleVideo(false));
				}
			},
			disabled: isEmpty(activeCamera),
		},
		{
			icon: <SettingsIcon sx={{ color: "#CECECE", fontSize: 20 }} />,
			title: s.settings.heading,
			func: () => toggleCameraSettings(),
			disabled: false,
		},
	];

	// update refs when the exposure duaration / remaining are changed
	useEffect(() =>
	{
		counterDuration.current = exposureDuration;
		counterRemaining.current = exposureRemaining;

		if (isCapturing && exposureRemaining <= 0)
			dispatch({ type: ekosConstants.SET_IMAGE_LOADING, payload: true });
	}, [exposureDuration, exposureRemaining]);

	return (
		<Box
			sx={{
				display: "flex",
				flexDirection: "column",
				alignItems: "center",
				backgroundColor: "#1d1d1d",
				padding: "18px",
				borderRadius: "8px",
				justifyContent: "center",
				gap: "12px",
			}}
		>
			<Box
				sx={[
					{
						display: "flex",
						flexDirection: "column",
						gap: "16px",
						alignItems: "center",
					},
				]}
			>
				{data.map((oneData) =>
				{
					if (isCapturing && oneData.title === s.tourGuide.title_preview)
						return (
							<Box
								id={oneData.title}
								sx={{ width: "36px", height: "36px" }}
								key={oneData.title}
							>
								<CircularStatic
									progress={counterRemaining.current.toFixed(0)}
									value={
										((counterDuration.current - counterRemaining.current) /
											counterDuration.current) *
										100
									}
								/>
							</Box>
						);
					return (
						<Button
							id={
								oneData.title === "Settings" ? "quickSettings" : oneData.title
							}
							disabled={
								oneData.title === s.general.stop ? isEmpty(activeCamera) : false
							}
							onClick={() =>
							{
								if (oneData.title === s.settings.heading)
								{
									if (oneData.title === activeSettings) setActiveSettings("");
									else setActiveSettings(oneData.title);
								}
								oneData.func();
							}}
							sx={[
								{
									backgroundColor:
										activeSettings === oneData.title ? Palette.orange : "",
									"&:hover": {
										backgroundColor:
											activeSettings !== oneData.title
												? "rgba(255,102,0, 0.5)"
												: Palette.orange,
									},
									opacity:
										oneData.title === s.general.stop
											? isStreaming || isCapturing
												? 1
												: 0.2
											: 1,
									display: "flex",
									justifyContent: "flex-start",
									alignItems: "center",
									gap: "8px",
									width: "100%",
								},
							]}
							key={oneData.title}
						>
							{isCapturing && oneData.title === s.tourGuide.title_preview ? (
								<CircularStatic
									progress={counterRemaining.current.toFixed(0)}
									value={
										((counterDuration.current - counterRemaining.current) /
											counterDuration.current) *
										100
									}
								/>
							) : (
								oneData.icon
							)}
							<Typography sx={[styles.text, { textTransform: "none" }]}>
								{oneData.title}
							</Typography>
						</Button>
					);
				})}
			</Box>
		</Box>
	);
};

export default tourGuide(CameraQuickControls, {
	steps: tourGuideSteps,
	key: "quick_control",
});
