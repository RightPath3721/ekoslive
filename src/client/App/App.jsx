import React, { useEffect } from "react";
import { Route, Routes, useLocation } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import axios from "axios";
import { AliveScope } from "react-activation";
import { captureException } from "@sentry/browser";

// For user logging actions
import { LoginPage } from "../views/LoginPage";

import MapsProvider from "@components/providers/MapsApiProvider";
import BreadcrumbProvider from "@components/providers/BreadcrumbProvider";
import {
	selectCapturePresets,
	selectIsLoggedIn,
	selectSocketsConnected,
} from "@redux/selectors";
import {
	achievementActions,
	captureActions,
	logout,
	targetsActions,
} from "@redux/actions";
import ThemeProvider from "../Components/ThemeProvider";
import ModerationProvider from "@components/providers/ModerationProvider";

import HomePageLayout from "../Pages/Home";
import Header from "@components/global/Header";
import CurrentProfileContextProvider from "@client/Pages/Community/CurrentProfileContext";
import cachePage from "@client/cachePage";
import useActiveUser from "@hooks/useActiveUser";
import SocialStreamContextProvider from "../Pages/Community/SocialStreamContext";
import AnimationListener from "@components/AnimationListener";
import "./global.css";
import TourGuideContextProvider from "@components/providers/TourGuideProvider";
import ProtectedRoute from "@components/ProtectedRoute";
import VersionPopover from "@components/VersionPopover";
import { login } from "@redux/actions";
import { SubscriptionManagerProvider } from "@components/providers/SubscriptionManagerProvider";
import SubscriptionManager from "@components/sections/SubscriptionManager";
import { get, isEmpty, isEqual, isObject } from "lodash";
import { Sync } from "@indi/enums";
import SyncSettings from "@common/shared/utils/sync";
import config from "@client/config";

const Setup = cachePage(React.lazy(() => import("../views/Setup/Setup")));
const Landing = cachePage(React.lazy(() => import("../Pages/HomePage")));
const PricingPage = cachePage(React.lazy(() => import("../Pages/Pricing")));
const FeaturesPage = cachePage(React.lazy(() => import("../Pages/Features")));

const MyAccountPage = cachePage(React.lazy(() => import("../Pages/MyAccount/MyAccountPage")));

const NotificationPage = cachePage(
	React.lazy(() => import("../Pages/Notification")),
);
const CommunityPage = cachePage(React.lazy(() => import("../Pages/Community")));
const ProfilePage = cachePage(
	React.lazy(() => import("../Pages/Community/Profile/ProfilePage")),
	"profile",
);
const DetailViewPage = React.lazy(
	() => import("../Pages/Community/DetailView"),
);
const EquipmentPage = cachePage(
	React.lazy(() => import("../Pages/Community/Equipment")),
);
const EquipmentDetailPage = cachePage(
	React.lazy(() => import("../Pages/Community/Equipment/EquipmentDetail")),
);
const ManufacturerPage = cachePage(
	React.lazy(() => import("../Pages/Community/Equipment/Maunfacturer")),
);
const ModelPage = cachePage(
	React.lazy(() => import("../Pages/Community/Equipment/Model")),
);
const ModerationPage = cachePage(
	React.lazy(() => import("../Pages/Community/Moderation")),
);
const UsersPage = cachePage(
	React.lazy(() => import("../Pages/Community/Users")),
);
const ObservatoriesPage = cachePage(
	React.lazy(() => import("../Pages/Community/Observatories")),
);

const ObservatoryDetailPage = cachePage(
	React.lazy(
		() =>
			import(
				"../Pages/Community/Observatories/ObervatoryDetailPage"
			),
	),
);
const BookingPage = cachePage(
	React.lazy(() => import("../Pages/Community/Booking")),
);
const BookingDetailViewPage = (
	React.lazy(() => import("../Pages/Community/Booking/DetailView/booking"))
);

const MyBookingDetailViewPage = (
	React.lazy(() => import("../Pages/Community/Booking/DetailView/my_booking"))
);
const DashboardLayout = cachePage(
	React.lazy(() => import("../Pages/DashboardLayout")),
);
const CommunityLayout = cachePage(
	React.lazy(
		() => import("../Pages/Community/CommunityLayout"),
		"community_layout",
	),
);
const FollowersPage = cachePage(
	React.lazy(() => import("../Pages/Community/Followers/FollowersPage")),
);
const FollowingPage = cachePage(
	React.lazy(() => import("../Pages/Community/Following/FollowingPage")),
);

const NotFoundPage = cachePage(
	React.lazy(() => import("../Pages/NotFoundPage")),
);

const SocialWizardPage = cachePage(
	React.lazy(() => import("../Pages/SocialWizard/SocialWizard")),
);

const BookingDetailPage = 
	React.lazy(() => import("../Pages/Community/Observatories/BookingDetailPage/BookingDetailPage"))
;
/**
 *
 * @returns {JSX.Element} - The rendered application component.
 */
const App = () =>
{
	// User authentication and is logged in. We have users objects.
	const loggedIn = useSelector(selectIsLoggedIn);
	const user = useActiveUser();
	const dispatch = useDispatch();
	const location = useLocation();
	const socketsConnected = useSelector(selectSocketsConnected);
	const capturePresets = useSelector(selectCapturePresets);
	const achievements = useSelector((state) => state.achievements, isEqual);
	const lists = useSelector((state) => state.targets.lists);
	const fovProfiles = useSelector((state) => state.targets.fovProfiles);
	const isSyncAllowed = useSelector((state) => state.wsMessage.connected);

	useEffect(() =>
	{
		// Check for login success and userData in URL
		const queryParams = new URLSearchParams(location.search);
		const loginStatus = queryParams.get("login");
		const userDataStr = queryParams.get("userData");

		if (loginStatus === "success" && userDataStr)
		{
			try
			{
				const userData = JSON.parse(decodeURIComponent(userDataStr));
				dispatch(login(userData));
			}
			catch (error)
			{
				console.error("Error parsing user data:", error);
			}
		}
	}, []);

	useEffect(() =>
	{
		if (isObject(lists))
		{
			dispatch(
				targetsActions.setLists([
					{
						name: "Favorites",
						payload: [],
					},
					{
						name: "My Searches",
						payload: [],
					},
				]),
			);
		}
	}, []);

	const useEffectAsync = (effect, inputs) =>
	{
		useEffect(() =>
		{
			effect();
		}, inputs);
	};

	/**
	 * Sync user settings on start when sockets are connected
	 */
	useEffectAsync(async () =>
	{
		if (socketsConnected && user)
		{
			const Presets = SyncSettings({
				data: capturePresets,
				updaterAction: (array) =>
					dispatch(captureActions.saveCapturePresets(array)),
				type: Sync.PRESET,
				username: get(user, "username", null),
				token: get(user, "token", null),
				URL: config.EKOSLIVE_URL,
			});

			const Achievements = SyncSettings({
				type: Sync.ACHIEVEMENT,
				data: Object.values(achievements).filter(
					(item) => item.status === true,
				),
				updaterAction: (array) =>
					dispatch(achievementActions.setAchievements(array)),
				username: get(user, "username", null),
				token: get(user, "token", null),
				URL: config.EKOSLIVE_URL,
			});

			const Targets = SyncSettings({
				data: lists,
				updaterAction: (array) => dispatch(targetsActions.setLists(array)),
				type: Sync.TARGETS,
				username: get(user, "username", null),
				token: get(user, "token", null),
				URL: config.EKOSLIVE_URL,
			});

			const FOVs = SyncSettings({
				data: fovProfiles,
				updaterAction: (array) =>
					dispatch(targetsActions.setFovProfiles(array)),
				type: Sync.FOV,
				username: get(user, "username", null),
				token: get(user, "token", null),
				URL: config.EKOSLIVE_URL,
			});

			await Promise.all([Presets, Achievements, Targets, FOVs]);
		}
	}, [socketsConnected, user]);

	/**
	 * Runs when achievements are updated
	 */
	useEffectAsync(async () =>
	{
		if (socketsConnected && user && !isEmpty(achievements))
		{
			if (!isEmpty(achievements) && isSyncAllowed)
			{
				await SyncSettings({
					type: Sync.ACHIEVEMENT,
					data: Object.values(achievements).filter(
						(item) => item.status === true,
					),
					updaterAction: (array) =>
						dispatch(achievementActions.setAchievements(array)),
					username: get(user, "username", null),
					token: get(user, "token", null),
					URL: config.EKOSLIVE_URL,
				});
			}
		}
	}, [achievements]);

	return (
		<ThemeProvider>
			<MapsProvider>
				<BreadcrumbProvider>
					<SocialStreamContextProvider>
						<ModerationProvider>
							<Header />
							<AliveScope>
								<TourGuideContextProvider>
									<CurrentProfileContextProvider>
										<Routes>
											<Route path="/" element={<HomePageLayout />}>
												<Route index element={<Landing />} />
												<Route path="/pricing" element={<PricingPage />} />
												<Route path="/my-account" element={<MyAccountPage />} />
												<Route path="/features" element={<FeaturesPage />} />
												<Route
													path="/notification"
													element={<NotificationPage />}
												/>
												<Route path="/community" element={<CommunityLayout />}>
													<Route index element={<CommunityPage />} />
													<Route
														path="post/:postNameId"
														element={<DetailViewPage />}
													/>
													<Route path="users" element={<UsersPage />} />
													<Route
														path="moderation"
														element={
															<ProtectedRoute>
																<ModerationPage />
															</ProtectedRoute>
														}
													/>
													<Route path="equipment">
														<Route index element={<EquipmentPage />} />
														<Route path=":equipmentTypeNameId">
															<Route index element={<EquipmentDetailPage />} />
															<Route path=":manufacturerNameId">
																<Route index element={<ManufacturerPage />} />
																<Route
																	path=":modelNameId"
																	element={<ModelPage />}
																/>
															</Route>
														</Route>
													</Route>
													<Route path=":nickname">
														<Route index element={<ProfilePage />} />
														<Route path="observatories">
															<Route index element={<ObservatoriesPage />} />
															<Route
																path=":observatoryNameId"
																element={<ObservatoryDetailPage />}
															/>
															<Route path="bookings/:type">
																<Route index element={<BookingDetailPage />} />
															</Route>
														</Route>
														<Route path="followers" element={<FollowersPage />} />
														<Route path="following" element={<FollowingPage />} />
													</Route>
													<Route path="bookings">
														<Route index element={<BookingPage />} />
														<Route path=":bookingId" element={<BookingDetailViewPage />} />
														<Route path="my-booking/:bookingId">
															<Route index element={<MyBookingDetailViewPage />} />
														</Route>
													</Route>
												</Route>
											</Route>
											<Route path="/dashboard" element={<DashboardLayout />}>
												<Route
													index
													element={loggedIn ? <Setup /> : <LoginPage />}
												/>
											</Route>
											<Route path="/renter" element={<DashboardLayout renter={true}/>}>
												<Route
													index
													element={loggedIn ? <Setup renter={true}/> : <LoginPage />}
												/>
											</Route>
											<Route path="/updates" element={<DashboardLayout />}>
												<Route index element={<VersionPopover />} />
											</Route>
											<Route path="/wizard" element={<SocialWizardPage />} />
											{/* 404 catch-all route */}
											<Route path="*" element={<NotFoundPage />} />
										</Routes>
									</CurrentProfileContextProvider>
								</TourGuideContextProvider>
							</AliveScope>
							<AnimationListener />
							<SubscriptionManagerProvider>
								<SubscriptionManager />
							</SubscriptionManagerProvider>
						</ModerationProvider>
					</SocialStreamContextProvider>
				</BreadcrumbProvider>
			</MapsProvider>
		</ThemeProvider>
	);
};

const connectedApp = App;
export { connectedApp as App };
