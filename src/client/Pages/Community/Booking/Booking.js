import React, {
	forwardRef,
	Suspense,
	useCallback,
	useEffect,
	useState,
} from "react";
import isEmpty from "lodash/isEmpty";
import Box from "@mui/material/Box";
import IconButton from "@mui/material/IconButton";
import AddIcon from "@mui/icons-material/Add";
import { useTheme } from "@mui/system";
import UploadForm from "@components/UploadPostForm";
import useActiveUser from "@hooks/useActiveUser";
import usePostAPI from "@hooks/usePostAPI";
import { useSocialStreamContext } from "../SocialStreamContext";
import ToggleViewButtons from "@components/ToggleViewButtons";
import TabsView from "@components/TabsView";
import { styles } from "@client/shared/styles";
import TabLoader from "@components/TabLoader";
import Badge from "@mui/material/Badge";
import axios from "axios";
import { useSelector } from "react-redux";

const MyBookings = React.lazy(() => import("./MyBookings"));
const MyObservatories = React.lazy(() => import("./MyObservatories"));
const Messages = React.lazy(() => import("./Messages"));

export const Lists = {
	MYBOOKINGS: 0,
	MYOBSERVATORIES: 1,
	MESSAGES: 2,
};

const Booking = forwardRef(({}, ref) =>
{
	const { palette } = useTheme();
	const user = useActiveUser();
	const [tabValue, setTabValue] = useState(Lists.MYBOOKINGS);
	const [bookingsCount, setBookingsCount] = useState(0);
	const [observatoriesCount, setObservatoryCount] = useState(0);
	const [messagesCount, setMessagesCount] = useState(0);

	// Get unread message count from Redux store if available
	const messagesState = useSelector(state => state.messages || {});
	const unreadMessagesFromRedux = messagesState.totalUnreadCount || 0;
	const bookings = useSelector(state => state.bookings.bookings || []);
	const receivedBookings = useSelector(state => state.bookings.receivedBookings || []);

	useEffect(() => {
		const fetchCounts = async () => {
			try {
				// Replace these API calls with your actual endpoints
				const bookingsResponse = await axios.get(`/api/observatories/mybookings/pending?username=${user.username}&token=${user.token}`);
				setBookingsCount(bookingsResponse.data.count);

				const observatoriesResponse = await axios.get(`/api/observatories/receivedbookings/pending?username=${user.username}&token=${user.token}`);
				setObservatoryCount(observatoriesResponse.data.count);

				const messagesResponse = await axios.get(`/api/messages/pending?username=${user.username}&token=${user.token}`);
				setMessagesCount(messagesResponse.data.messages);
			} catch (error) {
				console.error('Error fetching counts:', error);
			}
		};

		fetchCounts();
	}, []);

	useEffect(() => {
		setBookingsCount(bookings.filter(booking => booking.status === "pending").length);
		setObservatoryCount(receivedBookings.filter(booking => booking.status === "pending").length);
	}, [bookings, receivedBookings]);

	// Update message count from Redux when available
	useEffect(() => {
		if (unreadMessagesFromRedux !== undefined) {
			setMessagesCount(unreadMessagesFromRedux);
		}
	}, [unreadMessagesFromRedux]);

	// Refresh message count when Messages tab is active
	useEffect(() => {
		if (tabValue === Lists.MESSAGES && user?.username) {
			const refreshMessageCount = async () => {
				try {
					const messagesResponse = await axios.get(`/api/messages/pending?username=${user.username}&token=${user.token}`);
					setMessagesCount(messagesResponse.data.messages);
				} catch (error) {
					console.error('Error refreshing message count:', error);
				}
			};
			
			refreshMessageCount();
			
			// Set up polling to refresh the count while on the Messages tab
			const intervalId = setInterval(refreshMessageCount, 5000); // Every 5 seconds for more responsive updates
			
			return () => clearInterval(intervalId);
		}
	}, [tabValue, user?.username]);
	
	// Add a more frequent polling for message count regardless of active tab
	useEffect(() => {
		if (user?.username) {
			const pollMessageCount = async () => {
				try {
					const messagesResponse = await axios.get(`/api/messages/pending?username=${user.username}&token=${user.token}`);
					setMessagesCount(messagesResponse.data.messages);
				} catch (error) {
					console.error('Error polling message count:', error);
				}
			};
			
			// Poll every 10 seconds to ensure badge is updated even when Messages tab is not active
			const intervalId = setInterval(pollMessageCount, 10000);
			
			return () => clearInterval(intervalId);
		}
	}, [user?.username]);

	const handleTabValueChange = (_, value) =>
	{
		if (value !== null)
		{
			setTabValue(value);
		}
	};

	const breadcrumbs = (postTitle) =>
	{
		return [
			{
				name: "Community",
				link: "/community",
			},
			{
				name: "Feed",
				link: "/community",
			},
			{
				name: postTitle,
				link: "/community",
			},
		];
	};

	return (
		<>
			<Box
				sx={[
					styles.center,
					{
						width: "100%",
						justifyContent: user ? "space-between" : "flex-end",
						paddingInline: ".75rem",
						paddingBlock: ".5rem",
					},
				]}
			>
				{user && (
					<TabsView
						tabValue={tabValue}
						handleChange={handleTabValueChange}
						sx={{
							"& .MuiTabs-indicator": {
								backgroundColor: "#ff6600",
							},
							"& .MuiTab-root": {
								color: "#fff",
							},
							"& .MuiTab-root.Mui-selected": {
								color: "#ff6600",
							},
						}}
						tabs={[
							{ 
								value: Lists.MYBOOKINGS, 
								label: (
									<Badge badgeContent={bookingsCount} color="primary" max={99} 
										sx={{
											'& .MuiBadge-badge': {
												right: -6,
												top: -4
											}
										}}
									>
										My Bookings
									</Badge>
								), 
								id: "mybookings" 
							},
							{
								value: Lists.MYOBSERVATORIES,
								label: (
									<Badge badgeContent={observatoriesCount} color="primary" max={99} 
										sx={{
											'& .MuiBadge-badge': {
												right: -6,
												top: -4
											}
										}}
									>
										My Observatories
									</Badge>
								),
								id: "myobservatories",
							},
							{
								value: Lists.MESSAGES,
								label: (
									<Badge badgeContent={messagesCount} color="primary" max={99} 
										sx={{
											'& .MuiBadge-badge': {
												right: -6,
												top: -4
											}
										}}
									>
										Messages
									</Badge>
								),
								id: "messages",
							},
						]}
						isScrollable={false}
					/>
				)}
				{/* <ToggleViewButtons toggleView={toggleView} view={view} /> */}
			</Box>
			<Suspense fallback={<TabLoader />}>
				{tabValue === Lists.MYBOOKINGS && <MyBookings />}
				{tabValue === Lists.MYOBSERVATORIES && <MyObservatories />}
				{tabValue === Lists.MESSAGES && <Messages />}
			</Suspense>
			{/* <Suspense fallback={<TabLoader />}>
				{view === "grid" ? (
					<GalleryView breadcrumbs={breadcrumbs} ref={ref} />
				) : (
					<SocialStream ref={ref} breadcrumbs={breadcrumbs} />
				)}
			</Suspense>
			{!isEmpty(user) && (
				<Box
					sx={{
						position: "fixed",
						bottom: { xxs: "65px", sm: "24px" },
						right: { xxs: "16px", sm: "24px" },
						zIndex: 1000,
						width: { xxs: "40px", sm: "70px" },
						height: { xxs: "40px", sm: "70px" },
						borderRadius: "50%",
						backgroundColor: palette.primary.main,
						display: "flex",
						alignItems: "center",
						justifyContent: "center",
					}}
				>
					<IconButton
						id="feed_add"
						onClick={toggleFormState}
						sx={{ color: palette.white[900] }}
					>
						<AddIcon
							sx={{
								width: { xxs: "24px", sm: "40px" },
								height: { xxs: "24px", sm: "40px" },
							}}
						/>
					</IconButton>

					<UploadForm
						close={toggleFormState}
						open={isFormOpen}
						id={editId}
						submit={onUploadSubmit}
						mode={editId ? "edit" : "add"}
					/>
				</Box>
			)} */}
		</>
	);
});

export default Booking;
