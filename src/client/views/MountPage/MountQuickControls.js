import {
	Box,
	Button,
	Typography,
	Checkbox,
	CircularProgress,
} from "@mui/material";
import { isEmpty } from "lodash";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { indiActions, mountActions } from "@redux/actions";
import { DEVICE_TYPE, IPState, trainModules } from "@indi/enums";
import Reactor from "@indi/events";
import {
	selectCaptureStatus,
	selectTrainDevice,
	selectMountStatus,
} from "@redux/selectors";
import { styles } from "../../shared/styles";
import { Palette } from "@common/shared/common/styles";
import SliderComponent from "../../Components/Slider";
import GotoSync from "./GotoORSync";
import s from "@common/shared/i18n/i18n";
import ParkingIcon from "@client/icons/quick_controls/ParkingIcon";
import TrackingIcon from "@client/icons/quick_controls/TrackingIcon";
import HomeIcon from "@mui/icons-material/Home";
import StartIcon from "@mui/icons-material/Start";
import FindInPageIcon from "@mui/icons-material/FindInPage";
import ConfirmationNumberIcon from "@mui/icons-material/ConfirmationNumber";
import { toast } from "react-toastify";
import ArrowDropUpIcon from "@mui/icons-material/ArrowDropUp";
import ArrowDropDownIcon from "@mui/icons-material/ArrowDropDown";
import SearchIcon from "@mui/icons-material/Search";
import StartButton from "@components/StartButton";

const eventUUID = "mount";

const MountQuickControls = () =>
{
	const dispatch = useDispatch();
	const activeMount = useSelector((state) =>
		selectTrainDevice(state, {
			trainType: trainModules.MountOpticalTrain,
			deviceType: DEVICE_TYPE.MOUNT,
		}),
	);
	const status = useSelector(selectCaptureStatus);
	const mountStatus = useSelector(selectMountStatus);

	const [isMountReady, setIsMountReady] = useState(true);
	const [slewRates, setSlewRates] = useState([]);
	const inProgressRef = useRef({ index: -1, active: false });

	const [inProgress, setInProgress] = useState(inProgressRef.current);
	const [homeSupport, setHomeSupport] = useState(false);
	const [parkHomeSwtiches, setParkHomeSwtiches] = useState([]);
	const [slewRate, setSlewRate] = useState(activeMount?.slewRate());

	const [state, setState] = useState({
		reverseDirectionSupported: false,
		showReverseSettings: false,
		NSReversed: false,
		WEReversed: false,
	});
	const [showGotoSync, setShowGotoSync] = useState(false);

	const {
		NSReversed,
		WEReversed,
		reverseDirectionSupported,
		showReverseSettings,
	} = state;

	const updateSlewRate = (device, property) =>
	{
		// Make sure the temperature is for our active camera
		if (device.name === property.device)
			setSlewRate(property.getOnSwitchIndex());
	};

	const updateHomingStatus = (device, property) =>
	{
		if (device.name === property.device)
		{
			const state = {
				index: inProgressRef.current.index,
				active: property.state === IPState.IPS_BUSY,
			};
			inProgressRef.current = state;
			setInProgress(state);
		}
	};

	const onPropertyUpdate = useCallback((device, property) =>
	{
		if (property.name === "TELESCOPE_SLEW_RATE")
			setTimeout(updateSlewRate, 10, device, property);
		else if (property.name === "TELESCOPE_HOME")
			setTimeout(updateHomingStatus, 10, device, property);
	}, []);

	const stop = () =>
	{
		if (status === "Parked") return;
		dispatch(mountActions.stop());
	};

	const handleChange = (key, value) =>
	{
		switch (key)
		{
			case "park":
				if (mountStatus === "Parked") dispatch(mountActions.unpark());
				else dispatch(mountActions.park());
				break;
			case "tracking":
				dispatch(mountActions.setTracking(!(mountStatus === "Tracking")));
				break;
			case "speed":
				dispatch(mountActions.setSlewRate(value));
				break;
			default:
				break;
		}
	};

	const toggleNorthSouth = () =>
	{
		if (isEmpty(activeMount)) return;
		dispatch(activeMount.toggleNorthSouthDirections());
	};

	const toggleWestEast = () =>
	{
		if (isEmpty(activeMount)) return;
		dispatch(activeMount.toggleWestEastDirections());
	};

	useEffect(() =>
	{
		setIsMountReady(!["Slewing", "Parking", "Parked"].includes(mountStatus));
	}, [mountStatus]);

	/*
	 * Check if INDI mount support reverse directions
	 */
	useEffect(() =>
	{
		if (!isEmpty(activeMount))
		{
			dispatch(
				indiActions.subscribeToProperty(
					activeMount.name,
					["TELESCOPE_REVERSE_MOTION"],
					true,
				),
			);
			dispatch(
				indiActions.subscribeToProperty(
					activeMount.name,
					["TELESCOPE_SLEW_RATE"],
					true,
				),
			);

			if (activeMount.hasSlewRates())
			{
				const slewRates = activeMount.slewRates().getRangeList();
				setSlewRates(slewRates);
				setSlewRate(activeMount.slewRate());
				// dispatch(ekosActions.setMountQuickControls({ ...mountQuickControls, speedIndex: activeMount.slewRate() }));

				Reactor.addEventListener(
					"propertyUpdate",
					onPropertyUpdate,
					activeMount,
					eventUUID,
				);
			}

			// if mount has home supports, set the available switches
			if (activeMount?.hasHomeSupport())
			{
				dispatch(
					indiActions.subscribeToProperty(
						activeMount.name,
						["TELESCOPE_HOME"],
						true,
					),
				);
				const options = activeMount.getHomeSwitches();
				setParkHomeSwtiches(options);
			}

			const directions = activeMount.reverseDirectionSwitches();
			if (directions)
			{
				let northSouth = directions[0].state === 1;
				let westEast = directions[1].state === 1;
				setState({
					...state,
					NSReversed: northSouth,
					WEReversed: westEast,
					reverseDirectionSupported: true,
				});
			}
		}
	}, []);

	if (showGotoSync)
		return (
			<GotoSync open={showGotoSync} close={() => setShowGotoSync(false)} />
		);

	return (
		<Box
			sx={
				(styles.row,
				{ backgroundColor: "#1d1d1d", borderRadius: "8px", padding: "18px" })
			}
		>
			{reverseDirectionSupported && showReverseSettings && (
				<Box
					sx={[LOCAL_STYLES.checkboxContainer, styles.row, { padding: "6px" }]}
				>
					<Checkbox
						style={{ color: "white", padding: 0 }}
						checked={NSReversed}
						onChange={() =>
						{
							toggleNorthSouth();
							setState((prevState) => ({
								...prevState,
								NSReversed: !NSReversed,
							}));
						}}
					/>
					<Typography sx={{ color: "white", fontSize: "12px" }}>
						{s.ekos.collapse_mount.reverse_NS}
					</Typography>

					<Checkbox
						style={{ color: "white", padding: 0 }}
						checked={WEReversed}
						onChange={() =>
						{
							toggleWestEast();
							setState((prevState) => ({
								...prevState,
								WEReversed: !WEReversed,
							}));
						}}
					/>
					<Typography sx={{ color: "white", fontSize: "12px" }}>
						{s.ekos.collapse_mount.reverse_WE}
					</Typography>
				</Box>
			)}
			<Box container sx={[styles.row]}>
				<Box sx={[styles.row]}>
					<Box sx={{ padding: "5px" }}>
						{showReverseSettings ? (
							<ArrowDropDownIcon
								sx={{ color: Palette.white }}
								onClick={() =>
									setState({
										...state,
										showReverseSettings: !showReverseSettings,
									})
								}
							/>
						) : (
							<ArrowDropUpIcon
								sx={{ color: Palette.white }}
								onClick={() =>
									setState({
										...state,
										showReverseSettings: !showReverseSettings,
									})
								}
							/>
						)}
					</Box>
					<Typography
						sx={{ color: "white", fontSize: "14px", padding: "10px" }}
					>
						{s.ekos.controls_bar.mount_speed}
					</Typography>
				</Box>
				<Box sx={{ marginRight: "10px", marginTop: "5px" }}>
					<SliderComponent
						step={1}
						min={0}
						value={slewRate}
						max={isEmpty(slewRates) ? 0 : slewRates.length - 1}
						onChange={(e) =>
						{
							const newRate = e.target.value;

							setSlewRate(newRate);
							dispatch(mountActions.setSlewRate(newRate));
						}}
						width="150px"
						color="#ff6600"
					/>
					<Typography
						sx={{
							color: "white",
							marginLeft: "8px",
							fontSize: "12px",
							textAlign: "center",
						}}
					>
						{isEmpty(slewRates) ? "Centering" : slewRates[slewRate]}
					</Typography>
				</Box>
				<Box
					sx={[
						styles.row,
						{
							justifyContent: "center",
							gap: "8px",
						},
					]}
				>
					<Button
						sx={[LOCAL_STYLES.button]}
						onClick={() => setHomeSupport(!homeSupport)}
					>
						<HomeIcon sx={{ fontSize: "38px" }} />
					</Button>
					<Button
						onClick={() => handleChange("park")}
						sx={[
							LOCAL_STYLES.button,
							{
								borderRadius: "4px",
								overflow: "hidden",
							},
						]}
					>
						<ParkingIcon
							color={
								mountStatus === "Parked"
									? "#00D254"
									: mountStatus === "Parking"
										? Palette.yellow
										: Palette.red
							}
							width={24}
							height={24}
						/>
					</Button>
					<Button
						onClick={() => mountStatus !== "Parked" && handleChange("tracking")}
						sx={[LOCAL_STYLES.button]}
					>
						<TrackingIcon
							width={30}
							height={30}
							color={
								isMountReady
									? mountStatus === "Tracking"
										? "green"
										: "red"
									: "#CECECE"
							}
						/>
					</Button>

					<Button
						sx={[LOCAL_STYLES.button]}
						onClick={() => setShowGotoSync(true)}
					>
						<SearchIcon sx={{ color: "#CECECE", fontSize: "32px" }} />
					</Button>
					<StartButton
						inProgress={true}
						stop={stop}
						width={40}
						height={40}
						iconSize={38}
					/>
				</Box>
			</Box>

			{homeSupport && (
				<Box sx={LOCAL_STYLES.home}>
					<Box sx={[styles.center, LOCAL_STYLES.box]}>
						{parkHomeSwtiches.map((data, i) =>
						{
							return (
								<Button
									key={i}
									onClick={() =>
									{
										if (data.label === "Set")
										{
											toast.success(s.messages.mount_set);
										}
										else
										{
											dispatch(activeMount.setHomeOption(data.name));
											const state = {
												index: i,
												active: true,
											};
											inProgressRef.current = state;
											setInProgress(state);
										}
									}}
									sx={
										(LOCAL_STYLES.border,
										{
											border: `2px solid ${
												i === inProgress.index && inProgress.active
													? Palette.yellow
													: null
											}`,
										})
									}
								>
									<Box sx={[styles.row, { paddingTop: "5px" }]}>
										<Box sx={[styles.row, { width: "100px" }]}>
											<Typography sx={LOCAL_STYLES.label}>
												{data.label}
											</Typography>
											{inProgress.active && i === inProgress.index && (
												<CircularProgress size="18px" />
											)}
										</Box>
										<Box sx={[styles.center, {}]}>
											{data.name === "FIND" ? (
												<FindInPageIcon />
											) : data.name === "GO" ? (
												<StartIcon />
											) : (
												<ConfirmationNumberIcon />
											)}
										</Box>
										{/* {i === inProgress.index && inProgress.active ? (
											<ActivityIndicator color={Palette.red} size={25 * px} />
										) : null} */}
									</Box>
								</Button>
							);
						})}
					</Box>
				</Box>
			)}
		</Box>
	);
};

const LOCAL_STYLES = {
	button: { width: "40px", height: "40px", minWidth: "auto", padding: 0 },
	checkboxContainer: {
		position: "absolute",
		bottom: "5rem",
		backgroundColor: Palette.grey22,
		alignItems: "center",
		rowGap: "5px",
	},
	border: {
		borderWidth: "5px",
		borderRadius: "10px",
		display: "flex",
		flexDirection: "column",
		justifyContent: "space-around",
	},
	label: {
		fontWeight: "bold",
		marginRight: "10px",
	},
	box: {
		backgroundColor: Palette.grey33,
		borderRadius: "10px",
		flexDirection: "column",
	},
	home: {
		position: "absolute",
		left: "40%",
		bottom: "5rem",
	},
};

export default MountQuickControls;
