import React, { useState, useEffect } from "react";
import {
	Box,
	Typography,
	Button,
	Card,
	CardContent,
	Grid,
	Switch,
} from "@mui/material";
import { useDispatch, useSelector } from "react-redux";
import CommentIcon from "@mui/icons-material/Comment";
import { highlightText } from "./NotificationPopup";
import { ekosliveServer } from "@client/config";
import { selectUser } from "@redux/selectors";
import { captureException } from "@sentry/browser";
import AddIcon from "@mui/icons-material/Add";
import InfoIcon from "@mui/icons-material/Info";
import WarningIcon from "@mui/icons-material/Warning";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import DangerousIcon from "@mui/icons-material/Dangerous";
import ReportIcon from "@mui/icons-material/Report";
import DeleteIcon from "@mui/icons-material/Delete";
import RemoveCircleIcon from "@mui/icons-material/RemoveCircle";
import Moment from "react-moment";
import FavoriteIcon from "@mui/icons-material/Favorite";
import NotificationActions from "./notificationActions";
import { Severity } from "@indi/enums";
import { Source } from "@indi/enums";
import { isString } from "lodash";
import GuideModuleIcon from "@client/icons/modules/GuideModuleIcon";
import SchedulerModuleIcon from "@client/icons/modules/SchedulerModuleIcon";
import AlignModuleIcon from "@client/icons/modules/AlignModuleIcon";
import IndiModuleIcon from "@client/icons/modules/IndiModuleIcon";
import ObservatoryIcon from "@client/icons/ObservatoryIcon";
import FocusModuleIcon from "@client/icons/modules/FocusModuleIcon";
import CameraTrainIcon from "@client/icons/trains/CameraIcon";
import TelescopeIcon from "@client/icons/trains/TelescopeIcon";
import ChatIcon from "@client/icons/ChatIcon";
import LikeIcon from "@client/icons/LikeIcon";
import { useTheme } from "@mui/material/styles";
import { notificationAction } from "@redux/actions";
import s from "@common/shared/i18n/i18n";
import { checkSurveyStatus } from "@client/Pages/Community/CommunityLayout";

export const NotificationIcons = () =>
{
	const theme = useTheme();

	const iconStyles = {
		small: {
			width: 16,
			height: 16,
			color: theme.palette.primary.main,
		},
		medium: {
			width: 24,
			height: 24,
			color: theme.palette.primary.main,
		},
	};

	return {
		POST: <AddIcon sx={iconStyles.medium} />,
		MANUFACTURER: <AddIcon sx={iconStyles.medium} />,
		MODEL: <AddIcon sx={iconStyles.medium} />,
		PENDING: <InfoIcon sx={iconStyles.medium} />,
		APPROVED: <CheckCircleIcon sx={iconStyles.medium} />,
		REJECTED: <DangerousIcon sx={iconStyles.medium} />,
		COMMENT: (
			<ChatIcon width={24} height={24} color={theme.palette.primary.main} />
		),
		REPORT: <ReportIcon sx={iconStyles.medium} />,
		DELETE: <DeleteIcon sx={iconStyles.medium} />,
		IGNORE: <InfoIcon sx={iconStyles.medium} />,
		BAN: <RemoveCircleIcon sx={iconStyles.medium} />,
		LIKE: (
			<LikeIcon width={24} height={24} color={theme.palette.primary.main} />
		),
		General: <AddIcon sx={iconStyles.medium} />,
		INDI: (
			<IndiModuleIcon
				width={24}
				height={24}
				color={theme.palette.primary.main}
			/>
		),
		Capture: (
			<CameraTrainIcon
				width={24}
				height={24}
				color={theme.palette.primary.main}
			/>
		),
		Focus: (
			<FocusModuleIcon
				width={24}
				height={24}
				color={theme.palette.primary.main}
			/>
		),
		Align: (
			<AlignModuleIcon
				width={24}
				height={24}
				color={theme.palette.primary.main}
			/>
		),
		Mount: (
			<TelescopeIcon
				width={24}
				height={24}
				color={theme.palette.primary.main}
			/>
		),
		Guide: (
			<GuideModuleIcon
				width={24}
				height={24}
				color={theme.palette.primary.main}
			/>
		),
		Observatory: (
			<ObservatoryIcon
				width={24}
				height={24}
				color={theme.palette.primary.main}
			/>
		),
		Scheduler: (
			<SchedulerModuleIcon
				width={24}
				height={24}
				color={theme.palette.primary.main}
			/>
		),
	};
};

export const notificationIcons = {
	POST: <AddIcon sx={{ width: 24, height: 24, color: "#ff6600" }} />,
	MANUFACTURER: <AddIcon sx={{ width: 16, height: 16 }} htmlColor="#ff6600" />,
	MODEL: <AddIcon sx={{ width: 16, height: 16 }} htmlColor="#ff6600" />,
	PENDING: <InfoIcon sx={{ width: 16, height: 16 }} htmlColor="#ff6600" />,
	APPROVED: (
		<CheckCircleIcon sx={{ width: 16, height: 16 }} htmlColor="#ff6600" />
	),
	REJECTED: (
		<DangerousIcon sx={{ width: 16, height: 16 }} htmlColor="#ff6600" />
	),
	COMMENT: <CommentIcon sx={{ width: 16, height: 16 }} htmlColor="#ff6600" />,
	REPORT: <ReportIcon sx={{ width: 16, height: 16 }} htmlColor="#ff6600" />,
	DELETE: <DeleteIcon sx={{ width: 16, height: 16 }} htmlColor="#ff6600" />,
	IGNORE: <InfoIcon sx={{ width: 16, height: 16 }} htmlColor="#ff6600" />,
	BAN: <RemoveCircleIcon sx={{ width: 16, height: 16 }} htmlColor="#ff6600" />,
	LIKE: <FavoriteIcon sx={{ width: 16, height: 16 }} htmlColor="#ff6600" />,
	General: <AddIcon sx={{ width: 16, height: 16 }} htmlColor="#ff6600" />,
	INDI: <IndiModuleIcon width={16} height={16} color="#ff6600" />,
	Capture: <CameraTrainIcon width={16} height={16} color="#ff6600" />,
	Focus: <FocusModuleIcon width={16} height={16} color="#ff6600" />,
	Align: <AlignModuleIcon width={16} height={16} color="#ff6600" />,
	Mount: <TelescopeIcon width={16} height={16} color="#ff6600" />,
	Guide: <GuideModuleIcon width={16} height={16} color="#ff6600" />,
	Observatory: <ObservatoryIcon width={16} height={16} color="#ff6600" />,
	Scheduler: <SchedulerModuleIcon width={16} height={16} color="#ff6600" />,
};

export const severityIcons = {
	INFO: <InfoIcon sx={{ width: 16, height: 16, color: "#167412" }} />,
	WARNING: <WarningIcon sx={{ width: 16, height: 16, color: "#EAD200" }} />,
	CRITICAL: <WarningIcon sx={{ width: 16, height: 16, color: "#EA001C" }} />,
};

export const severityColors = {
	INFO: "#16741226",
	WARNING: "#EAD20026",
	CRITICAL: "#EA001C26",
};

/**
 * Gets the key corresponding to a given value.
 *
 * @param {number} value - The value to look for.
 * @returns {string|null} - The key corresponding to the value or null if not found.
 */
export const getKey = (value, source) =>
{
	return Object.keys(source).find((key) => source[key] === value);
};

const NotificationList = () =>
{
	const notificationIcons = NotificationIcons();
	const user = useSelector(selectUser);
	const [notifications, setNotifications] = useState([]);
	const { palette } = useTheme();

	const dispatch = useDispatch();
	const dnd = useSelector((state) => state.notifications.dnd);
	const unReadNotifications = useSelector(
		(state) => state.notifications.unReadNotifications ?? []
	);

	const fetchNotifications = async () =>
	{
		try
		{
			if (!user?.username || !user?.token) return;
			
			const url = `/api/notification?username=${encodeURIComponent(user.username)}&token=${user.token}`;
			const response = await ekosliveServer.get(url);
			setNotifications(response.data || []);
		}
		catch (error)
		{
			captureException(error);
			setNotifications([]);
		}
	};

	const fetchUnReadNotifications = async () =>
	{
		try
		{
			const status = await checkSurveyStatus(user);
			if (!status) return;
			
			if (!user?.username || !user?.token) return;

			const url = `/api/notification/unread?username=${encodeURIComponent(user.username)}&token=${user.token}`;
			const response = await ekosliveServer.get(url);
			dispatch(notificationAction.setUnreadNotification(response.data || []));
		}
		catch (error)
		{
			captureException(error);
			dispatch(notificationAction.setUnreadNotification([]));
		}
	};

	const readAll = async () =>
	{
		try
		{
			if (!user?.username || !user?.token) return;

			const unreadNotifications = unReadNotifications.map(
				(notification) => notification._id
			);
			dispatch(notificationAction.setUnreadNotification([]));
			
			await Promise.all(unreadNotifications.map(async (notificationId) => {
				const url = `/api/notification/read/${notificationId}?username=${encodeURIComponent(user.username)}&token=${user.token}`;
				return ekosliveServer.get(url);
			}));
		}
		catch (error)
		{
			captureException(error);
		}
	};

	const handleDND = () =>
	{
		dispatch(notificationAction.setDND());
	};

	useEffect(() =>
	{
		if (user?.username && user?.token)
		{
			fetchNotifications();
			fetchUnReadNotifications();
		}
	}, [user]);

	return (
		<Box sx={{ bgcolor: "black", color: "white", p: 2, minHeight: "100vh" }}>
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
				<Button
					sx={{ fontSize: "0.8rem", color: palette.primary.main }}
					onClick={readAll}
				>
					{s.notifications.read_all}
				</Button>
			</Box>
			<Grid container spacing={2}>
				{notifications?.map((notification, index) =>
				{
					const severityKey = isString(notification.severity)
						? notification.severity
						: getKey(notification.severity, Severity);
					
					const typeKey = isString(notification.type)
						? notification.type
						: getKey(notification.type, Source);

					return (
						<Grid item xs={12} key={notification._id || index}>
							<Card
								sx={{
									display: "flex",
									alignItems: "center",
									borderBottom: "1px grey solid",
									borderRadius: 0,
									background: "none",
								}}
							>
								<CardContent
									sx={{
										flexGrow: 1,
										display: "flex",
										alignItems: "center",
										background:
											notification.channel === "COMMUNITY"
												? null
												: severityColors[severityKey] || 'transparent',
									}}
								>
									<Box
										sx={{
											mr: 2,
										}}
									>
										{notificationIcons[typeKey] || notificationIcons.General}
									</Box>
									{notification.channel === "EKOS" && (
										<Box
											sx={{
												width: 26,
												height: 26,
												backgroundColor: `${palette.white[900]}33`,
												borderRadius: "50%",
												display: "inline-grid",
												placeItems: "center",
												color: "inherit",
												mr: 2,
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
									)}
									<Box sx={{ flexGrow: 1 }}>
										<Typography variant="body2">
											<div
												dangerouslySetInnerHTML={{
													__html: highlightText(notification.content),
												}}
											/>
										</Typography>
									</Box>
									<Box
										sx={{
											ml: 2,
											display: "flex",
											flexDirection: "row",
											alignItems: "flex-end",
											gap: "30px",
										}}
									>
										<Typography variant="body2">
											<Moment format="YYYY.MM.DD HH:mm">
												{notification.createdAt}
											</Moment>
										</Typography>
										<Typography
											sx={{
												bgcolor: "#252525",
												padding: "1px 8px",
												borderRadius: "5px",
											}}
											variant="body2"
										>
											<Moment fromNow ago>
												{notification.createdAt}
											</Moment>{" "}
											ago
										</Typography>
									</Box>
									<Box
										sx={{
											display: "flex",
											flexDirection: "row",
											color: "#ff6600",
										}}
									>
										{notification.actions?.map((action, index) => (
											<NotificationActions
												key={index}
												actionType={action.type}
												actionId={action.id}
											/>
										))}
									</Box>
								</CardContent>
							</Card>
						</Grid>
					);
				})}
			</Grid>
		</Box>
	);
};

export default NotificationList;
