import {
	range360,
	rangePositionAngle,
	toPierSideText,
} from "@common/shared/common/common";
import Dropdown from "@components/Dropdown";
import NumericControl from "@components/NumericControl";
import { Box, Checkbox, IconButton, Typography } from "@mui/material";
import React, { useCallback, useEffect, useState } from "react";
import Reactor from "@indi/events";
import {
	selectIsAlignSolved,
	selectOptionValue,
	selectTrainDevice,
} from "@redux/selectors";
import { useDispatch, useSelector } from "react-redux";
import { DEVICE_TYPE, pierSide, trainModules } from "@indi/enums";
import { get, isEmpty, isEqual } from "lodash";
import { indiActions, optionActions } from "@redux/actions";
import { Palette } from "@common/shared/common/styles";
import { styles } from "@client/shared/styles";
import s from "@common/shared/i18n/i18n";
import { CircularProgressbar, buildStyles } from "react-circular-progressbar";
import "react-circular-progressbar/dist/styles.css";
import Slider from "@mui/material/Slider";
import Image from "mui-image";

const flipPolicies = [
	{
		label: s.ekos.collapse_camera.rotator_control.flip_rotator,
		value: s.ekos.collapse_camera.rotator_control.flip_rotator,
	},
	{
		label: s.ekos.collapse_camera.rotator_control.flip_position,
		value: s.ekos.collapse_camera.rotator_control.flip_position,
	},
];

const RotatorProperties = ["ABS_ROTATOR_ANGLE", "ROTATOR_REVERSE"];

const icons = {
	abort: require("@images/abort.webp"),
};
const RotatorControl = () =>
{
	const dispatch = useDispatch();
	const activeRotator = useSelector((state) =>
		selectTrainDevice(state, {
			trainType: trainModules.CaptureOpticalTrain,
			deviceType: DEVICE_TYPE.ROTATOR,
		}),
	);
	// If the Ekos Profile up and running?
	const ekosProfileRunning = useSelector(
		(state) => state.ekos.connection.online,
	);
	const pAOffset = useSelector((state) => selectOptionValue(state, "pAOffset"));
	const flipRotationAllowed = useSelector(
		(state) => selectOptionValue(state, "astrometryFlipRotationAllowed"),
		isEqual,
	);
	const mountPierSide = useSelector((state) => state.status.mount.pierSide);
	const solutionFound = useSelector(
		(state) => selectIsAlignSolved(state),
		isEqual,
	);

	const [state, setState] = useState({
		cameraOffset: 0,
		isFlipped: get(flipRotationAllowed, "value", false),
		positionAngle: 0,
		// absoluteRotatorAngle: 0,
		reverseDirection: false,
	});
	const [absoluteRotatorAngle, setAbsoluteRotatorAngle] = useState(0);
	const [positionAngle, setPositionAngle] = useState(0);
	const eventUUID = "rotator";
	const [isSubscribed, setIsSubscribed] = useState(false);

	const { reverseDirection } = state;

	/**
	 * Calculates Rotator Angle
	 * @param {*} PositionAngle Camera position angle i.e 34.44
	 * @returns
	 */
	const calcRotatorAngle = (PositionAngle) =>
	{
		if (pierSide.EAST !== mountPierSide)
		{
			PositionAngle += 180;
		}
		return range360(PositionAngle - get(pAOffset, "value", 0));
	};

	/**
	 * Calculates Camera position angle
	 * @returns
	 */
	const calcCameraAngle = () =>
	{
		let PositionAngle = 0;
		if (absoluteRotatorAngle > 180)
		{
			PositionAngle = absoluteRotatorAngle - 360 + get(pAOffset, "value", 0);
		}
		else
		{
			PositionAngle = absoluteRotatorAngle + get(pAOffset, "value", 0);
		}
		if (pierSide.EAST === mountPierSide)
		{
			if (PositionAngle > 0)
			{
				PositionAngle -= 180;
			}
			else
			{
				PositionAngle += 180;
			}
		}
		const range = `${rangePositionAngle(PositionAngle).toFixed(2)}`;
		setPositionAngle(parseFloat(range));
	};

	/**
	 * Update rotator angle from the given property
	 * @param property
	 */
	const updateRotatorAngle = (device, property) =>
	{
		// Make sure the temperature is for our active camera
		if (property !== undefined && device.name === property.device)
			setAbsoluteRotatorAngle(get(property.numbers[0], "value", 0));
	};

	/**
	 * Update temperature from the given property
	 * @param property
	 */
	const updateReverseDirection = (device, property) =>
	{
		// Make sure the temperature is for our active camera
		if (property !== undefined && device.name === property.device)
			setState({
				...state,
				reverseDirection: get(property.switches[0], "state", 0),
			});
	};

	/**
	 * Watch for property updates registered in the addEventListener
	 * @type {(function(*=): void)|*}
	 */
	const onPropertyUpdate = useCallback((device, property) =>
	{
		if (property.name === "ABS_ROTATOR_ANGLE")
			setTimeout(updateRotatorAngle, 10, device, property);
		else if (property.name === "ROTATOR_REVERSE")
			setTimeout(updateReverseDirection, 10, device, property);
	});

	useEffect(() =>
	{
		if (!isEmpty(activeRotator) && ekosProfileRunning)
		{
			if (!isSubscribed)
			{
				dispatch(
					indiActions.subscribeToProperty(
						get(activeRotator, "name", ""),
						RotatorProperties,
						true,
					),
				);
				setIsSubscribed(true);
			}
			// fetch rotatorAngle
			const rotatorAngle = activeRotator.getAngle();
			setAbsoluteRotatorAngle(rotatorAngle);

			try
			{
				// fetch reverseDirection
				const reverseDirection = activeRotator.isReversed();
				setState({ ...state, reverseDirection: reverseDirection });
			}
			catch (error)
			{
				// Reverse Direction not supported
				setState({ ...state, reverseDirection: null, error });
			}

			// Listen for the properties ROTATOR_ANGLE and REVERSE_DIRECTION
			Reactor.addEventListener(
				"propertyUpdate",
				onPropertyUpdate,
				activeRotator,
				eventUUID,
			);

			dispatch(
				optionActions.getOptions([
					{ name: "pAOffset" },
					{ name: "astrometryFlipRotationAllowed" },
				]),
			);

			return () =>
			{
				Reactor.removeEventListener("propertyUpdate", eventUUID);
			};
		}
	}, [activeRotator, ekosProfileRunning, solutionFound]);

	useEffect(() =>
	{
		if (ekosProfileRunning && isSubscribed) calcCameraAngle();
	}, [absoluteRotatorAngle, pAOffset, ekosProfileRunning]);

	return (
		<Box
			sx={{
				display: "flex",
				flexDirection: { xs: "column", md: "row" },
				alignItems: "center",
				justifyContent: "center",
				flexWrap: "wrap",
				gap: 3,
				padding: 2,
				...LOCAL_STYLES.viewContainer,
			}}
		>
			<Typography
				sx={{
					textAlign: "center",
					position: "absolute",
					top: "5px",
					left: 0,
					right: 0,
					color: Palette.orange,
					fontSize: { xs: "18px", md: "22px" },
				}}
			>
				{get(activeRotator, "name", "N/A")}
			</Typography>

			{/* Left Side Dial */}
			<Box
				sx={{ display: "flex", flexDirection: "column", alignItems: "center" }}
			>
				<Box
					sx={{
						position: "relative",
						width: { xs: "250px", md: "325px" },
						height: { xs: "250px", md: "325px" },
					}}
				>
					<CircularProgressbar
						value={positionAngle / 2}
						strokeWidth={3}
						styles={buildStyles({
							rotation: positionAngle < 0 ? 0 : 180,
							pathColor: "#967800",
							textColor: "#967800",
							trailColor: "#d6d6d6",
							textSize: "16px",
						})}
					/>

					{/* Inner Dial */}
					<Box
						sx={{
							position: "absolute",
							top: "12%",
							left: "12%",
							width: "76%",
							height: "76%",
						}}
					>
						<CircularProgressbar
							value={range360(absoluteRotatorAngle)}
							text={`${absoluteRotatorAngle.toFixed(2)}`}
							strokeWidth={3}
							styles={buildStyles({
								rotation: 0,
								pathColor: "#2e3436",
								textColor: "#2e3436",
								trailColor: "#d6d6d6",
								textSize: "12px",
							})}
						/>
					</Box>
				</Box>

				<IconButton
					onClick={() => dispatch(activeRotator.stop())}
					sx={{ mt: 1 }}
				>
					<Image
						src={icons.abort}
						style={{
							width: "40px",
							height: "40px",
							objectFit: "contain",
						}}
					/>
				</IconButton>
			</Box>

			{/* Right Side Controls */}
			<Box sx={{ maxWidth: "450px", width: "100%" }}>
				{[
					{
						label: s.ekos.collapse_camera.rotator_control.angle,
						value: absoluteRotatorAngle.toFixed(2),
					},
					{
						label: s.ekos.collapse_camera.rotator_control.offset,
						value: get(pAOffset, "value", 0).toFixed(2),
					},
					{
						label: s.ekos.collapse_camera.rotator_control.pierside,
						value: toPierSideText(mountPierSide),
					},
				].map(({ label, value }) => (
					<Box key={label} sx={[styles.row, { mt: 1 }]}>
						<Typography sx={LOCAL_STYLES.text}>{label}</Typography>
						<Typography sx={LOCAL_STYLES.value}>{value}</Typography>
					</Box>
				))}

				{/* Flip Dropdown */}
				<Box sx={[styles.row, { mt: 2 }]}>
					<Typography sx={LOCAL_STYLES.text}>
						{s.ekos.collapse_camera.rotator_control.flip}
					</Typography>
					<Dropdown
						width="275px"
						value={
							get(flipRotationAllowed, "value", false)
								? flipPolicies[0].label
								: flipPolicies[1].label
						}
						options={flipPolicies}
						onChange={(data) =>
						{
							dispatch(
								optionActions.setOptions([
									{
										name: "astrometryFlipRotationAllowed",
										value: data.label === flipPolicies[0].label,
									},
								]),
							);
							dispatch(
								optionActions.getOptions([
									{ name: "astrometryFlipRotationAllowed" },
								]),
							);
						}}
					/>
				</Box>

				{/* Position Angle */}
				<Box sx={{ mt: 2 }}>
					<Box sx={styles.row}>
						<Typography sx={LOCAL_STYLES.text}>
							{s.ekos.collapse_camera.rotator_control.pos_angle}
						</Typography>
						<NumericControl
							initialValue={positionAngle}
							minValue={-180}
							maxValue={180}
							incrementStep={1}
							decrementStep={1}
							totalWidth="200px"
							onChange={(value) =>
							{
								dispatch(activeRotator.setAngle(calcRotatorAngle(value)));
							}}
						/>
					</Box>

					<Slider
						sx={{ mt: 2 }}
						value={positionAngle}
						step={1}
						min={-180}
						max={180}
						onChange={(e) => setPositionAngle(e.target.value)}
						onChangeCommitted={(_, values) =>
						{
							dispatch(activeRotator.setAngle(calcRotatorAngle(values)));
						}}
					/>
				</Box>

				{/* Reverse Direction */}
				{reverseDirection !== null && (
					<Box sx={[styles.row, { mt: 2 }]}>
						<Checkbox
							checked={reverseDirection}
							onClick={() =>
							{
								dispatch(activeRotator.setReversedDirection(!reverseDirection));
							}}
						/>
						<Typography sx={{ fontSize: "20px", ml: 1 }}>
							{s.ekos.collapse_camera.rotator_control.reverse_direction}
						</Typography>
					</Box>
				)}
			</Box>
		</Box>
	);
};

export default RotatorControl;
const LOCAL_STYLES = {
	viewContainer: {
		backgroundColor: "rgba(0,0,0,0.95)",
		borderWidth: 1,
		borderColor: Palette.grey44,
		borderRadius: "24px",
		padding: "16px",
		width: "100%",
	},
	text: {
		fontSize: { xs: "16px", md: "20px" },
		padding: "6px",
		width: { xs: "180px", md: "250px" },
	},
	value: {
		fontSize: { xs: "16px", md: "20px" },
		padding: "6px",
		backgroundColor: Palette.grey44,
		width: "100px",
		textAlign: "center",
	},
	button: {
		margin: "18px",
		height: "72px",
		alignItems: "center",
		justifyContent: "center",
	},
};
