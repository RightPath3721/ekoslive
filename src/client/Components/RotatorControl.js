import React, { useEffect } from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import RotateLeftIcon from "@mui/icons-material/RotateLeft";
import RotateRightIcon from "@mui/icons-material/RotateRight";
import { isEmpty } from "lodash";
import { useDispatch, useSelector } from "react-redux";
import { indiActions } from "@redux/actions";
import { trainModules, DEVICE_TYPE } from "@indi/enums";
import {
	selectRotatorElementAttributeSelector,
	selectTrainDevice,
} from "@redux/selectors";
import { range360 } from "@common/shared/common/common";
import NumericControl from "./NumericControl";
import StopQcIcon from "@client/icons/quick_controls/StopIcon";
import { styles } from "@client/shared/styles";

const RotatorControl = () =>
{
	const dispatch = useDispatch();
	const activeRotator = useSelector((state) =>
		selectTrainDevice(state, {
			trainType: trainModules.CaptureOpticalTrain,
			deviceType: DEVICE_TYPE.ROTATOR,
		}),
	);
	const isConnected = isEmpty(activeRotator)
		? false
		: activeRotator.isConnected();
	const absoluteRotatorAngle = useSelector((state) =>
		selectRotatorElementAttributeSelector(state, {
			device: activeRotator?.name,
			property: "ABS_ROTATOR_ANGLE",
			element: "ANGLE",
			attribute: "value",
		}),
	);

	/**
	 * Subscribe to rotator absolute angle.
	 */
	useEffect(() =>
	{
		if (isConnected)
			dispatch(
				indiActions.subscribeToProperty(
					activeRotator.name,
					"ABS_ROTATOR_ANGLE",
				),
			);
	}, [isConnected]);

	return (
		<Box
			sx={[
				styles.row,
				{
					backgroundColor: "#1d1d1d",
					borderRadius: "8px",
					padding: "20px",
				},
			]}
		>
			<NumericControl
				initialValue={absoluteRotatorAngle}
				onChange={(value) =>
				{
					dispatch(activeRotator.setAngle(value));
				}}
				customLimit={[0, 359]}
				steps={[10, 10]}
			/>

			<Button
				onClick={() =>
				{
					dispatch(activeRotator.setAngle(range360(absoluteRotatorAngle + 10)));
				}}
				sx={[LOCAL_STYLES.button]}
			>
				<RotateLeftIcon style={{ color: "#CECECE", fontSize: 20 }} />
			</Button>

			<Button
				onClick={() =>
				{
					dispatch(activeRotator.setAngle(range360(absoluteRotatorAngle - 10)));
				}}
				sx={[LOCAL_STYLES.button]}
			>
				<RotateRightIcon style={{ color: "#CECECE", fontSize: 20 }} />
			</Button>

			<Button
				onClick={() =>
				{
					dispatch(activeRotator.stop());
				}}
				sx={[
					LOCAL_STYLES.button,
					{ gridColumn: "span 2", justifySelf: "center" },
				]}
			>
				<StopQcIcon width={20} height={20} />
			</Button>
		</Box>
	);
};

const LOCAL_STYLES = {
	button: {
		width: "40px",
		height: "40px",
		minWidth: "auto",
		marginRight: "10px",
		padding: 0,
		backgroundColor: "#FFFCFA1F",
	},
};

export default RotatorControl;
