import React, { useEffect, useState } from "react";
import get from "lodash/get";
import isEmpty from "lodash/isEmpty";
import isEqual from "lodash/isEqual";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";
import Grid from "@mui/material/Grid";
import IconButton from "@mui/material/IconButton";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import ObservatoryIcon from "@client/icons/ObservatoryIcon";
import AddIcon from "@mui/icons-material/Add";
import { useObservatoryRole } from "@components/providers/ObservatoryRoleProvider";
import { Can } from "@components/providers/AclProvider";
import { useDispatch, useSelector } from "react-redux";
import { profileActions } from "@redux/actions";
import {
	selectDslrInfo,
	selectProfiles,
	selectConnectionOnline,
	selectConnected,
	selectIsLoggedIn,
	selectShowPortSelectorPanel,
	selectIndiDevicesCount,
	selectSelectedProfile,
	selectEkosOptions,
	selectActiveKStarID,
	selectConnectedKStarInstances,
	selectUser,
} from "@redux/selectors";
import { Palette } from "@common/shared/common/styles";
import AlertDialog from "@components/AlertDialog";
import OpticalTrains from "@components/OpticalTrains";
import { SelectInput } from "@components/Select";
import WeatherBar from "@components/WeatherBar";
import DSLRSetup from "../DSLRSetup";
import ScopeLens from "../ScopeLens";
import ScopeLensEditor from "../ScopeLensEditor";
import ProfileEditor from "./ProfileEditor";
import PortSelector from "../PortSelector/PortSelector";
import { optionActions } from "@redux/actions";
import { optionsConstants } from "@redux/constants";
import Telescope from "@client/icons/Telescope";
import s from "@common/shared/i18n/i18n";
import ObservatoriesList from "../EkosInstanceSelector/ObservatoriesList";
import ConnectedObservatoryIndicator from "./ConnectedObservatoryIndicator";
import tourGuide from "@components/global/tourGuide";
import SetupBoxWrapper from "./SetupBoxWrapper";
import CurrentPlanInformer from "@components/shared/PricingTable/CurrentPlanInformer";
import { planType } from "@indi/enums";

const defaultNewProfile = {
	mount: "",
	ccd: "",
	guider: "",
	focuser: "",
	filter: "",
	ao: "",
	dome: "",
	weather: "",
	aux1: "",
	aux2: "",
	aux3: "",
	aux4: "",
};

const tourGuideSteps = [
	{
		selector: "#equipmentProfiles",
		title: s.tourGuide.title_profiles,
		content: s.tourGuide.description_profiles,
	},
	{
		selector: "#portSelector",
		title: s.tourGuide.title_port_selector,
		content: s.tourGuide.description_port_selector,
	},
	{
		selector: "#opticalTrains",
		title: s.tourGuide.title_trains,
		content: s.tourGuide.description_trains,
	},
];

const Profile = ({ active }) =>
{
	const dispatch = useDispatch();
	const observatoryRole = useObservatoryRole();

	const profiles = useSelector(selectProfiles, isEqual);
	const selectedProfile = useSelector(selectSelectedProfile, isEqual);
	const dslr = useSelector(selectDslrInfo);
	// Ekos profile is running
	const ekosProfileRunnig = useSelector(selectConnectionOnline);
	// KStars is running and connected to online server
	const kstarsRunning = useSelector(selectConnected);
	const loggedIn = useSelector(selectIsLoggedIn);
	const showPortSelectorPanel = useSelector(selectShowPortSelectorPanel);
	const indiDevicesCount = useSelector(selectIndiDevicesCount);
	const options = useSelector(selectEkosOptions, isEqual);
	const activeInstanceID = useSelector(selectActiveKStarID);
	const connectedKStarsInstances = useSelector(selectConnectedKStarInstances);
	const user = useSelector(selectUser);

	const [state, setState] = useState({
		toggleEdit: false,
		showDialog: false,
		showTrains: false,
		showDSLRSetup: false,
		showPortSelector: false,
		showScopeLens: false,
		showScopeLensEditor: false,
		new: false,
		connectionList: false,
		targetProfile: selectedProfile,
		newProfile: {
			auto_connect: true,
			port_selector: true,
			mode: "local",
			guiding: 0,
			primary_scope: 0,
			guide_scope: 0,
			use_web_manager: true,
		},
	});
	const {
		targetProfile,
		newProfile,
		showDSLRSetup,
		toggleEdit,
		showTrains,
		showPortSelector,
		showScopeLens,
		showScopeLensEditor,
		connectionList,
	} = state;

	const startProfile = () =>
	{
		// Check if the currently selected scopes are the same ones selected in the profile
		// if not, sync them and THEN start the profile.
		const profile = profiles.find(
			(item) => get(item, "name", "") === selectedProfile,
		);
		if (profile)
		{
			//set auto_connect to true, if its not checked by default.
			if (profile.auto_connect === false)
			{
				profile.auto_connect = true;
			}
			dispatch(profileActions.updateProfile(profile));
			dispatch(profileActions.saveSelectedProfile(profile.name));
			dispatch(profileActions.startProfile(profile));
		}
	};

	const stopProfile = () =>
	{
		dispatch(profileActions.stopProfile());
	};

	const deleteProfile = () =>
	{
		dispatch(profileActions.deleteProfile(targetProfile.name));
		setState({ ...state, targetProfile: profiles[0], showDialog: false });
	};

	useEffect(() =>
	{
		if (loggedIn && kstarsRunning)
		{
			dispatch(
				optionActions.getOptions([
					{ name: optionsConstants.ekosLiveImageTransfer },
					{ name: optionsConstants.ekosLiveCloud },
					{ name: optionsConstants.ekosLiveHighBandwidth },
					{ name: optionsConstants.ekosLiveNotifications },
					{ name: optionsConstants.ekosLiveSound },
				]),
			);

			if (!isEmpty(options))
			{
				options.map((oneOption) =>
				{
					dispatch(optionActions.setOption(oneOption.name, oneOption.value));
				});
			}
		}
	}, [kstarsRunning, loggedIn]);

	/**
	 * If Ekos requests DSLR setup then show it.
	 */
	useEffect(() =>
	{
		if (dslr) setState({ ...state, showDSLRSetup: true });
	}, [dslr]);

	useEffect(() => {
		if (profiles && profiles.length > 0 && !selectedProfile) {
			const defaultProfile = profiles[0];
			setState(prevState => ({ 
				...prevState,
				targetProfile: defaultProfile,
			}));
			dispatch(profileActions.saveSelectedProfile(defaultProfile.name));
		}
	}, [profiles, selectedProfile]);

	if (!active) return null;

	// if (!activeInstanceID || !kstarsRunning) return <ObservatoriesList />;

	return (
		<Box sx={[LOCAL_STYLES.container]}>
			<ConnectedObservatoryIndicator />
			{toggleEdit ? (
				<ProfileEditor
					profile={
						state.new
							? { ...defaultNewProfile, ...newProfile }
							: profiles.find(
									(oneProfile) => oneProfile.name === selectedProfile,
								)
					}
					setTargetProfile={(profile) =>
						setState({ ...state, targetProfile: profile })
					}
					open={toggleEdit}
					isNew={state.new}
					close={() => setState({ ...state, toggleEdit: false })}
				/>
			) : showTrains ? (
				<OpticalTrains
					toggleScopeLens={(val) =>
						setState({ ...state, showScopeLens: val, showTrains: false })
					}
					close={() => setState({ ...state, showTrains: false })}
				/>
			) : showPortSelector || showPortSelectorPanel ? (
				<PortSelector
					togglePortSelector={() =>
						setState({ ...state, showPortSelector: !showPortSelector })
					}
				/>
			) : showScopeLens ? (
				<ScopeLens
					toggleScopeLens={(val) =>
						setState({ ...state, showScopeLens: val, showTrains: true })
					}
				/>
			) : showScopeLensEditor ? (
				<ScopeLensEditor
					toggleScopeLens={(val) =>
						setState({
							...state,
							showScopeLensEditor: val,
							showScopeLens: true,
						})
					}
				/>
			) : showDSLRSetup ? (
				<DSLRSetup close={() => setState({ ...state, showDSLRSetup: false })} />
			) : connectionList ? (
				<ObservatoriesList
					close={() =>
						setState((prevState) => ({ ...prevState, connectionList: false }))
					}
				/>
			) : (
				<Grid container sx={{ padding: "4px", gap: "4px", flexWrap: "nowrap" }}>
					<SetupBoxWrapper item xs={6} id="equipmentProfiles">
						<Grid container>
							<Grid
								item
								xs={6}
								style={{ display: "flex", alignItems: "center", gap: "16px" }}
							>
								<Telescope width={35} height={35} color="#FF6600" />
								<Typography sx={{ color: "#FFFFFF" }}>
									{s.connect.profile_manager.heading}
								</Typography>
							</Grid>
							<Grid
								item
								xs={6}
								style={{
									display: "flex",
									alignItems: "center",
									justifyContent: "flex-end",
									gap: "6px",
								}}
							>
							<Can action="owner" subject="Observatory" object={{ userRole: observatoryRole }}>
								<IconButton
									disabled={ekosProfileRunnig}
									onClick={() =>
										setState({ ...state, new: true, toggleEdit: true })
									}
									sx={[LOCAL_STYLES.imageButton]}
								>
									<AddIcon sx={{ color: "#CECECE", fontSize: 20 }} />
								</IconButton>
								<IconButton
									disabled={
										ekosProfileRunnig ||
										get(targetProfile, "name", "") === "Simulators"
									}
									onClick={() =>
										setState({ ...state, new: false, toggleEdit: true })
									}
									sx={[LOCAL_STYLES.imageButton]}
								>
									<EditIcon sx={{ color: "#CECECE", fontSize: 20 }} />
								</IconButton>
								<IconButton
									disabled={ekosProfileRunnig || targetProfile === profiles[0]}
									onClick={() => setState({ ...state, showDialog: true })}
									sx={[LOCAL_STYLES.imageButton]}
								>
									<DeleteIcon sx={{ color: Palette.red, fontSize: 20 }} />
								</IconButton>
							</Can>
							</Grid>
						</Grid>
						<Grid
							sx={{
								display: "flex",
								flexDirection: "row",
								alignItems: "center",
								gap: "8px",
								marginTop: "24px",
							}}
						>
							<Typography sx={{ color: "white" }}>
								{s.general.profile}
							</Typography>
							<Can action="owner" subject="Observatory" object={{ userRole: observatoryRole }} passThrough>
								{can => (
									<SelectInput
										options={profiles.map((item) => ({
											label: item.name,
											value: item.name,
										}))}
										onChange={(e) =>
										{
											if (!e || !e.label) {
												return;
											}

											let profile = profiles.find(
												(oneProfile) => oneProfile.name === e.label,
											);
											if (!profile) {
												return;
											}
											setState({
												...state,
												targetProfile: profile,
											});
											dispatch(profileActions.saveSelectedProfile(profile.name));
										}}
										value={selectedProfile || "Simulators"}
										disabled={ekosProfileRunnig || !can}
									/>
								)}
							</Can>
						</Grid>
						<Grid
							sx={{
								display: "flex",
								justifyContent: "flex-end",
								marginTop: "40px",
								gap: "16px",
							}}
						>
							<Can action="renter" subject="Observatory" object={{ userRole: observatoryRole }}>
								<Button
									sx={[
										LOCAL_STYLES.btn,
										{
											width: "auto",
										},
									]}
									variant="contained"
									disabled={!selectedProfile}
									onClick={ekosProfileRunnig ? stopProfile : startProfile}
								>
									{ekosProfileRunnig ? s.general.stop : s.general.start}
								</Button>
							</Can>
						</Grid>
					</SetupBoxWrapper>

					<Can action="owner" subject="Observatory" object={{ userRole: observatoryRole }}>
						<SetupBoxWrapper item xs={6}>
							<Typography sx={{ color: "white" }}>Options</Typography>
							<Grid
								container
								style={{
									display: "flex",
									justifyContent: "center",
									alignItems: "center",
									marginTop: "1.5rem",
									gap: "1rem",
								}}
							>
								<Button
									id="portSelector"
									disabled={indiDevicesCount === 0}
									onClick={() => setState({ ...state, showPortSelector: true })}
									sx={[LOCAL_STYLES.btn]}
									variant="contained"
								>
									{s.tourGuide.title_port_selector}
								</Button>
								<Button
									id="opticalTrains"
									disabled={indiDevicesCount === 0}
									sx={[LOCAL_STYLES.btn]}
									variant="contained"
									onClick={() =>
										{
										setState({ ...state, showTrains: true });
									}}
								>
									{s.tourGuide.title_trains}
								</Button>
								{dslr && (
									<Can action="onwer" subject="Observatory" object={{ userRole: observatoryRole }}>
										<Button
											onClick={() => setState({ ...state, showDSLRSetup: true })}
											sx={[LOCAL_STYLES.btn]}
										>
											{s.connect.btn_dslr_setup}
										</Button>
									</Can>
								)}
							</Grid>
							{/* {!connectionList && connectedKStarsInstances?.length > 0 && (
								<Box
									sx={{
										display: "flex",
										marginTop: "20px",
										gap: "16px",
										display: "flex",
										justifyContent: "center",
									}}
								>
									<Button
										sx={{
											color: Palette.white,
											minWidth: "auto",
											justifySelf: "flex-end",
											backgroundColor: Palette.orange,
											borderRadius: "8px",
											gap: "12px",
										}}
										onClick={() =>
											setState((prevState) => ({
												...prevState,
												connectionList: true,
											}))
										}
										disabled={
											user
												? user.plan_id === planType.DEFAULT ||
													user.plan_id === planType.PRO_PLAN
												: true
										}
									>
										<ObservatoryIcon
											height={24}
											width={24}
											color={Palette.white}
										/>
										Observatory Management
									</Button>
									{user &&
										(user.plan_id === planType.DEFAULT ||
											user.plan_id === planType.PRO_PLAN) && (
											<CurrentPlanInformer text="Unlock with Ultimate Plan" />
										)}
								</Box>
							)} */}
						</SetupBoxWrapper>
					</Can>
				</Grid>
			)}

			<WeatherBar />
			<AlertDialog
				title={s.general.alert_confirm_delete_title}
				description={s.general.alert_delete_profile_body}
				handleDelete={deleteProfile}
				show={state.showDialog}
				close={() => setState({ ...state, showDialog: false })}
			/>
		</Box>
	);
};

const LOCAL_STYLES = {
	container: {
		width: "100%",
		display: "grid",
		gridTemplateRows: "max-content",
		gap: ".75rem",
		backgroundColor: "#0f0e0e",
		justifyItems: "center",
		paddingBlock: ".75rem",
	},
	btn: {
		textTransform: "none",
		width: "150px",
		height: "46px",
		border: "1px solid #2d2d2d",
	},
	imageButton: {
		width: "40px",
		height: "40px",
		minWidth: "auto",
		padding: 0,
		backgroundColor: "#FFFCFA1A",
		borderRadius: "50%",
	},
};

export default tourGuide(Profile, {
	steps: tourGuideSteps,
	key: "setup",
});
