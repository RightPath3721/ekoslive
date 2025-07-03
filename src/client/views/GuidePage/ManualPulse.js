import { DEVICE_TYPE, trainModules } from "@common/shared/indi/enums";
import { selectTrainDevice } from "@common/shared/redux/selectors";
import React, { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { deltaAngle } from "@common/shared/common/common";
import { get } from "lodash";
import { Palette } from "@common/shared/common/styles";
import s from "@common/shared/i18n/i18n";
import { Box, Button, Typography } from "@mui/material";
import NumericControl from "@components/NumericControl";
import CloseButton from "@components/CloseButton";
import { styles } from "@client/shared/styles";
import Icon from "@components/Icon";

const ManualPulse = ({ onClose }) =>
{
	const dispatch = useDispatch();
	const activeGuider = useSelector((state) =>
		selectTrainDevice(state, {
			trainType: trainModules.GuideOpticalTrain,
			deviceType: DEVICE_TYPE.GUIDER,
		}),
	);
	const ra = useSelector((state) => state.status.mount.ra);
	const de = useSelector((state) => state.status.mount.de);

	const initialRa = useRef(null);
	const initialDe = useRef(null);

	const reset = () =>
	{
		initialRa.current = ra;
		initialDe.current = de;
	};

	useEffect(() =>
	{
		if (initialRa.current === null) initialRa.current = ra;

		if (initialDe.current === null) initialDe.current = de;
	}, []);

	const [pulse, setPulse] = useState(1000);

	const Controls = {
		north: {
			direction: "TELESCOPE_TIMED_GUIDE_NS",
			name: "TIMED_GUIDE_N",
		},
		south: {
			direction: "TELESCOPE_TIMED_GUIDE_NS",
			name: "TIMED_GUIDE_S",
		},
		west: {
			direction: "TELESCOPE_TIMED_GUIDE_WE",
			name: "TIMED_GUIDE_W",
		},
		east: {
			direction: "TELESCOPE_TIMED_GUIDE_WE",
			name: "TIMED_GUIDE_E",
		},
	};
	const setManualPulse = (props) =>
	{
		dispatch(activeGuider?.setManualPulse(pulse, props.direction, props.name));
	};
	return (
		<Box sx={[LOCAL_STYLES.view]}>
			<CloseButton onChange={onClose} />
			<Typography sx={[LOCAL_STYLES.text, styles.center]}>
				{s.general.manual} {s.ekos.collapse_align.calibration_settings.pulse}
			</Typography>

			<Box
				sx={{
					marginTop: "25px",
					justifyContent: "space-evenly",
				}}
			>
				<Button
					buttonStyle="orange"
					sx={[styles.center, LOCAL_STYLES.actionButton]}
					onClick={() => setManualPulse(Controls.north)}
				>
					<Typography>{s.general.north} / DE+</Typography>
				</Button>
				<Box sx={LOCAL_STYLES.buttons}>
					<Button
						sx={{ width: "150px", backgroundColor: Palette.orange }}
						onClick={() => setManualPulse(Controls.west)}
					>
						<Typography>{s.general.west} / RA-</Typography>
					</Button>
					<Button
						sx={LOCAL_STYLES.spaceButtons}
						onClick={() => setManualPulse(Controls.east)}
					>
						<Typography>{s.general.east} / RA+</Typography>
					</Button>
				</Box>
				<Button
					sx={[LOCAL_STYLES.actionButton, { marginTop: "15px" }]}
					onClick={() => setManualPulse(Controls.south)}
				>
					<Typography>{s.general.south} / DE-</Typography>
				</Button>
			</Box>
			<Box
				sx={[
					styles.row,
					{
						alignSelf: "center",
						marginTop: "25px",
					},
				]}
			>
				<Typography sx={{ width: "75px" }}>
					{s.ekos.collapse_align.calibration_settings.pulse}
				</Typography>
				<NumericControl
					initialValue={pulse}
					onFinishedEdit={(value) => setPulse(value)}
					totalWidth="150px"
					customLimit={[100, 5000]}
					steps={[100, 100]}
				/>
				<Button onClick={reset} sx={LOCAL_STYLES.reset}>
					<Icon name="settings-backup-restore" color="#fff" />
				</Button>
			</Box>
			<Box sx={[LOCAL_STYLES.offsetView, styles.center]}>
				<Typography sx={{ width: "125px" }}>RA {s.general.offset}</Typography>
				<Typography sx={LOCAL_STYLES.displayOffset}>
					{(deltaAngle(ra, get(initialRa, "current", 0)) * 3600).toFixed(2)}
				</Typography>
			</Box>
			<Box sx={[LOCAL_STYLES.offsetView, styles.center]}>
				<Typography sx={{ width: "125px" }}>DE {s.general.offset} </Typography>
				<Typography sx={LOCAL_STYLES.displayOffset}>
					{(deltaAngle(de, get(initialDe, "current", 0)) * 3600).toFixed(0)}
				</Typography>
			</Box>
		</Box>
	);
};

export default ManualPulse;

const LOCAL_STYLES = {
	view: {
		backgroundColor: "rgba(0,0,0,0.7)",
		justifyContent: "center",
		alignItems: "center",
		padding: "50px",

		position: "fixed",
		top: "50%",
		left: "50%",
		transform: "translate(-50%, -50%)",
	},
	buttons: {
		display: "flex",
		flexDirection: "row",
		marginTop: "15px",
	},
	text: {
		fontWeight: "bold",
		textAlign: "center",
	},
	offsetView: {
		display: "flex",
		flexDirection: "row",
		alignSelf: "center",
		width: "200px",
		marginTop: "25px",
	},
	displayOffset: {
		backgroundColor: Palette.grey33,
		width: "120px",
		padding: "8px",
		borderRadius: "10px",
	},
	actionButton: {
		width: "150px",
		marginLeft: "60px",
		backgroundColor: Palette.orange,
	},
	spaceButtons: {
		width: "150px",
		marginLeft: "15px",
		backgroundColor: Palette.orange,
	},
	reset: {
		minWidth: "35px",
		height: "35px",
		marginLeft: "10px",
		backgroundColor: Palette.red,
	},
};
