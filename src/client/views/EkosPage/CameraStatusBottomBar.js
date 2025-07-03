import { Button, Grid, IconButton, Typography } from "@mui/material";
import { get, isEmpty } from "lodash";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useSelector } from "react-redux";
import { styles } from "../../shared/styles";
import { Palette } from "@common/shared/common/styles";
import Icon from "../../Components/Icon";
import OffsetIcon from "@client/icons/OffsetIcon";
import GainIcon from "@client/icons/GainIcon";
import { selectTrainDevice } from "@redux/selectors";
import { trainModules, DEVICE_TYPE } from "@indi/enums";
import s from "@common/shared/i18n/i18n";
import EkosModal from "@components/EkosModal";
import SettingsIcon from "@mui/icons-material/Settings";
import Reactor from "@indi/events";
import { generateUUID } from "../../helpers/common";

const ResolutionList = React.lazy(() => import("./ResolutionList"));

const CameraStatusBottomBar = () =>
{
	const status = useSelector((state) => state.status.capture.status);
	const activeCamera = useSelector((state) =>
		selectTrainDevice(state, {
			trainType: trainModules.CaptureOpticalTrain,
			deviceType: DEVICE_TYPE.CAMERA,
		}),
	);

	const [offset, setOffset] = useState(null);
	const [iso, setISO] = useState(null);
	const [gain, setGain] = useState("--");
	const [showResolutionList, setShowResolutionList] = useState(false);

	const uuid = useMemo(() => generateUUID(), []);

	const onPropertyUpdate = useCallback(
		(device, property) =>
		{
			if (property.name === "CCD_CONTROLS")
			{
				// Make sure the temperature is for our active camera
				if (device.name === property.device)
				{
					const gainValue = device.getGain();
					if (!isNaN(gainValue)) setGain(gainValue.toFixed(0));

					const offsetValue = device.getOffset();
					if (!isNaN(offsetValue)) setOffset(offsetValue.toFixed(0));
				}
			}
			else if (property.name === "CCD_GAIN")
			{
				setGain(property.numbers?.[0]?.value ?? null);
			}
			else if (property.name === "CCD_OFFSET")
			{
				setOffset(property.numbers?.[0]?.value);
			}
			else if (property.name === "CCD_ISO")
				setISO(property.numbers?.[0]?.value ?? null);
		},
		[setGain],
	);

	useEffect(() =>
	{
		if (isEmpty(activeCamera)) return;

		// Watch property updates
		Reactor.addEventListener(
			"propertyUpdate",
			onPropertyUpdate,
			activeCamera,
			uuid,
		);

		if (activeCamera.hasGain())
		{
			const gainValue = activeCamera.getGain();
			if (!isNaN(gainValue) && gainValue >= 0) setGain(gainValue.toFixed(0));
		}
		if (activeCamera.hasOffset())
		{
			const offsetValue = activeCamera.getOffset();
			if (!isNaN(offsetValue) && offsetValue >= 0)
				setOffset(offsetValue.toFixed(0));
		}
		if (activeCamera.isDSLR()) setISO(activeCamera.getISO());
		else setISO(null);
		return () =>
		{
			Reactor.removeEventListener("propertyUpdate", uuid);
		};
	}, [activeCamera]);

	if (
		isEmpty(activeCamera) ||
		isEmpty(status) ||
		activeCamera.isConnected() === false
	)
		return (
			<Typography sx={[LOCAL_STYLES.text, { padding: "5px" }]}>
				{s.status.no_camera_detected}
			</Typography>
		);
	return (
		<Grid
			container
			sx={[
				{
					display: "flex",
					width: "50%",
					padding: "4px",
					justifyContent: "space-evenly",
				},
			]}
		>
			{get(activeCamera, "getResolution", false) && (
				<Grid item sx={styles.center}>
					<Button
						onClick={() =>
						{
							setShowResolutionList(!showResolutionList);
						}}
					>
						<Icon name="aspect" color={Palette.orange} />
						<Typography sx={LOCAL_STYLES.text}>
							{get(activeCamera, "getResolution", false)
								? `${activeCamera.getResolution()?.width.value ?? 0}x${activeCamera.getResolution()?.height.value ?? 0}`
								: "N/A"}
						</Typography>
						<IconButton>
							<SettingsIcon sx={{ color: "#CECECE" }} />
						</IconButton>
					</Button>
				</Grid>
			)}
			{showResolutionList && (
				<EkosModal onClose={() => setShowResolutionList(false)}>
					<ResolutionList onClose={() => setShowResolutionList(false)} />
				</EkosModal>
			)}
			<Grid item sx={[styles.center, { color: Palette.orange }]}>
				<Icon name="grid" size={24} color={Palette.orange} />
				<Typography sx={LOCAL_STYLES.text}>
					{get(activeCamera, "getBinning", false)
						? `${activeCamera.getBinning().x}x${activeCamera.getBinning().y}`
						: "N/A"}
				</Typography>
			</Grid>

			{gain !== null && (
				<Grid item sx={styles.center}>
					<GainIcon style={{ width: 24, height: 24 }} />
					<Typography sx={LOCAL_STYLES.text}>
						{isNaN(gain) ? 0 : gain}
					</Typography>
				</Grid>
			)}

			{iso !== null && (
				<Grid item sx={styles.center}>
					<Typography sx={LOCAL_STYLES.text}>
						<Typography sx={[LOCAL_STYLES.text, { color: Palette.orange }]}>
							{s.general.iso}
						</Typography>
						{iso}
					</Typography>
				</Grid>
			)}

			{offset !== null && (
				<Grid item sx={styles.center}>
					<OffsetIcon style={{ width: 26, height: 26 }} />
					<Typography sx={LOCAL_STYLES.text}>{offset}</Typography>
				</Grid>
			)}
		</Grid>
	);
};

const LOCAL_STYLES = {
	text: {
		fontSize: "1rem",
		marginLeft: "6px",
	},
	row: {
		justifyContent: "center",
		flexDirection: "row",
		alignItems: "center",
	},
	infoBarContainer: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "space-between",
		height: "38px",
		backgroundColor: Palette.grey11,
		borderTopWidth: 1,
		borderTopColor: "#333",
		elevation: 1,
		paddingInline: "10px",
	},
};

export default CameraStatusBottomBar;
