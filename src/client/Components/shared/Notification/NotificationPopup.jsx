import React, { useState, useEffect } from "react";
import {
	Popover,
	Tabs,
	Tab,
	Box,
	Typography,
	List,
	ListItem,
	Divider,
	Badge,
	Button,
	IconButton,
} from "@mui/material";
import NotificationsIcon from "@mui/icons-material/Notifications";
import { useNavigate } from "react-router-dom";
import Switch from "@mui/material/Switch";
import NotificationsOffIcon from "@mui/icons-material/NotificationsOff";
import { useDispatch, useSelector } from "react-redux";
import { notificationAction } from "@redux/actions";
import { selectUser } from "@redux/selectors";
import { ekosliveServer } from "@client/config";
import { captureException } from "@sentry/browser";
import Moment from "react-moment";
import { NotificationIcons, getKey, severityColors } from "./index";
import CloseIcon from "@mui/icons-material/Close";
import s from "@common/shared/i18n/i18n";
import NotificationActions from "./notificationActions";
import { navigateAction } from "./notificationActions";
import { Severity } from "@indi/enums";
import { Source } from "@indi/enums";
import { useTheme } from "@mui/material/styles";
import { isString } from "lodash";
import { checkSurveyStatus } from "@client/Pages/Community/CommunityLayout";
import MarkChatReadIcon from "@mui/icons-material/MarkChatRead";
import Tooltip from "@mui/material/Tooltip";

// Utility function to replace #...# with <em>...</em>
export const highlightText = (text) =>
{
	const parts = text?.split(/(#.*?#)/g);
	return parts
		?.map((part) =>
		{
			if (part.startsWith("#") && part.endsWith("#"))
			{
				const content = part.slice(1, -1);

				if (content.startsWith("@"))
				{
					// For parts like #@...#
					const username = content.slice(1);
					// Create anchor tags for user profile
					return `<a href="/community/${username}" style="color: #ff6600">${content}</a>`;
				}

				// For parts like #...#
				return `<em style="color: #ff6600">${content}</em>`;
			}
			return part;
		})
		.join("");
};

const NotificationPopup = () =>
{
	const navigate = useNavigate();
	const dispatch = useDispatch();
	const dnd = useSelector((state) => state.notifications.dnd);
	const notifications = useSelector(
		(state) => state.notifications.unReadNotifications,
	);
	const [anchorEl, setAnchorEl] = useState(null);
	const [tabIndex, setTabIndex] = useState(0);
	const [hoveredIndex, setHoveredIndex] = useState(null);

	const user = useSelector(selectUser);
	const { palette } = useTheme();
	const notificationIcons = NotificationIcons();

	const fetchNotifications = async () =>
	{
		try
		{
			const status = await checkSurveyStatus(user);
			if (!status) return;

			if (!user?.username || !user?.token) return;

			const url = `/api/notification/unread?username=${encodeURIComponent(user.username)}&token=${user.token}`;
			const response = await ekosliveServer.get(url);
			dispatch(notificationAction.setUnreadNotification(response.data));
		}
		catch (error)
		{
			captureException(error);
		}
	};

	useEffect(() =>
	{
		fetchNotifications();
	}, []);

	const markAsRead = async (index, id) =>
	{
		dispatch(
			notificationAction.setUnreadNotification(
				notifications.filter((_, i) => i !== index),
			),
		);
		const url = `/api/notification/read/${id}?username=${encodeURIComponent(user.username)}&token=${user.token}`;
		await ekosliveServer.get(url);
	};

	const readAll = async () =>
	{
		const unreadNotifications = notifications.map(
			(notification) => notification._id,
		);
		dispatch(notificationAction.setUnreadNotification([]));
		for (const notificationId of unreadNotifications)
		{
			const url = `/api/notification/read/${notificationId}?username=${encodeURIComponent(user.username)}&token=${user.token}`;
			await ekosliveServer.get(url);
		}
	};

	const handleClick = (event) =>
	{
		setAnchorEl(event.currentTarget);
	};

	const handleClose = () =>
	{
		setAnchorEl(null);
	};

	const handleTabChange = (event, newValue) =>
	{
		setTabIndex(newValue);
	};

	const goToNotification = () =>
	{
		handleClose();
		readAll();
		navigate(`/notification`);
	};

	const open = Boolean(anchorEl);
	const id = open ? "simple-popover" : undefined;

	const handleDND = () =>
	{
		handleClose();
		dispatch(notificationAction.setDND());
	};

	const renderNotifications = (filter) =>
	{
		return (
			notifications &&
			Array.isArray(notifications) &&
			notifications
				.filter(
					(notification) => filter === "all" || notification?.channel == filter,
				)
				.map((notification, index) => (
					<ListItem
						key={index}
						alignItems="flex-start"
						onClick={() =>
						{
							if (notification?.actions && notification?.actions.length > 0)
							{
								const defaultAction = notification?.actions[0];
								if (defaultAction)
								{
									navigateAction(
										navigate,
										defaultAction.type,
										defaultAction.id,
									);
									handleClose();
									markAsRead(index, notification?._id);
								}
							}
						}}
						onMouseEnter={() => setHoveredIndex(index)}
						onMouseLeave={() => setHoveredIndex(null)}
					>
						<Box
							sx={{
								display: "flex",
								flexDirection: "row",
								gap: "10px",
								width: "100%",
								borderBottom: "1px grey solid",
								p: 1,
								"&:hover": {
									opacity: 0.6,
								},
								background:
									notification.channel === "COMMUNITY"
										? null
										: severityColors[
												isString(notification.severity)
													? notification.severity
													: getKey(notification.severity, Severity)
											],
							}}
						>
							{
								notificationIcons[
									isString(notification.type)
										? notification.type
										: getKey(notification.type, Source)
								]
							}

							{/* {
								notification.channel === "EKOS" && 
								<Box
									sx={{
										width: 24,
										height: 24,
										backgroundColor: `${palette.white[900]}33`,
										borderRadius: "50%",
										display: "inline-grid",
										placeItems: "center",
										color: "inherit",
									}}
								>
									{
										severityIcons[
											isString(notification.severity)
												? notification.severity
												: getKey(notification.severity, Severity)
										]
									}
								</Box>
							} */}

							<Box
								sx={{ display: "flex", flexDirection: "column", width: "100%" }}
							>
								<Typography
									component="span"
									variant="body2"
									color={palette.white[900]}
								>
									<div
										dangerouslySetInnerHTML={{
											__html: highlightText(notification?.content),
										}}
									/>
								</Typography>

								<Box
									sx={{
										display: "flex",
										flexDirection: "row",
										justifyContent: "space-between",
									}}
								>
									<Typography
										component="span"
										sx={{ fontSize: "0.7rem" }}
										color={palette.white[900]}
									>
										<Moment format="YYYY.MM.DD HH:mm">
											{notification?.createdAt}
										</Moment>{" "}
										-{" "}
										<Moment fromNow ago>
											{notification?.createdAt}
										</Moment>{" "}
										ago
									</Typography>

									<Box
										sx={{
											display: "flex",
											flexDirection: "row",
											color: "#ff6600",
										}}
									>
										{notification?.actions?.map((action, index) => (
											<NotificationActions
												key={index}
												actionType={action.type}
												actionId={action.id}
												handleClose={handleClose}
												markAsRead={markAsRead}
												notificationId={notification._id}
												index={index}
											/>
										))}
									</Box>
								</Box>
							</Box>
						</Box>
						{hoveredIndex === index && (
							<IconButton
								sx={{
									position: "absolute",
									top: "-2px",
									right: "10px",
									color: palette.white[900],
								}}
								variant="body2"
								onClick={(event) =>
								{
									event.stopPropagation();
									markAsRead(index, notification._id);
								}}
							>
								<CloseIcon />
							</IconButton>
						)}
						<Divider />
					</ListItem>
				))
		);
	};

	return (
		<>
			<Badge
				sx={{
					border: `1px solid ${palette.grey[200]}`,
					cursor: "pointer",
					padding: ".5rem",
					borderRadius: "8px",
					":hover": {
						backgroundColor: palette.primary.main,
						borderColor: "transparent",
					},
				}}
				color="primary"
				badgeContent={dnd ? null : notifications?.length}
				onClick={handleClick}
			>
				{dnd ? (
					<NotificationsOffIcon
						sx={{ color: palette.white[900], fontSize: "1.25rem" }}
						onClick={handleClick}
					/>
				) : (
					<NotificationsIcon
						sx={{ color: palette.white[900], fontSize: "1.25rem" }}
					/>
				)}
			</Badge>
			<Popover
				id={id}
				open={open}
				anchorEl={anchorEl}
				onClose={handleClose}
				anchorOrigin={{
					vertical: "bottom",
					horizontal: "left",
				}}
			>
				<Box p={2} width="500px">
					<Box
						sx={{
							display: "flex",
							flexDirection: "row",
							justifyContent: "space-between",
						}}
					>
						<Box>
							<Switch color="warning" onChange={handleDND} checked={dnd} />
							<span style={{ color: palette.white[900] }}>
								{s.notifications.dnd}
							</span>
						</Box>
						<Box sx={{ display: "flex", flexDirection: "row" }}>
							<Button
								sx={{ fontSize: "0.8rem", color: palette.primary.main }}
								onClick={goToNotification}
							>
								{s.settings.notifications}
							</Button>

							<Tooltip title={s.notifications.read_all}>
								<IconButton
									onClick={readAll}
									sx={{ color: palette.primary.main }}
								>
									<MarkChatReadIcon
										sx={{ fontSize: "1.25rem", color: "#fff" }}
									/>
								</IconButton>
							</Tooltip>
						</Box>
					</Box>
					<Tabs
						sx={{
							"& .MuiTabs-indicator": {
								backgroundColor: palette.primary.main,
							},
							"& .MuiTab-root": {
								color: "#fff", // Default color for tabs
							},
							"& .MuiTab-root.Mui-selected": {
								color: palette.primary.main, // Color for the selected tab
							},
							borderBottom: `1px solid ${palette.grey[300]}`,
						}}
						value={tabIndex}
						onChange={handleTabChange}
						variant="fullWidth"
						indicatorColor="primary"
						textColor="primary"
					>
						<Tab label="All" />
						<Tab label="Community" />
						<Tab label="Ekos" />
					</Tabs>
					<Box pt={1}>
						{tabIndex === 0 && <List>{renderNotifications("all")}</List>}
						{tabIndex === 1 && <List>{renderNotifications("COMMUNITY")}</List>}
						{tabIndex === 2 && <List>{renderNotifications("EKOS")}</List>}
					</Box>
				</Box>
			</Popover>
		</>
	);
};

export default NotificationPopup;
