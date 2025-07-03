import React, { useCallback, useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { useTheme } from "@mui/material/styles";
import { Menu, Badge, Box, Avatar } from "@mui/material";
import UserIcon from "@client/icons/UsersIcon";
import PopoverList from "./PopoverList";
import { useModerationContext } from "@components/providers/ModerationProvider";
import { Can } from "@components/providers/AclProvider";
import { ekosliveServer } from "@client/config";
import { useSelector } from "react-redux";
import { selectUser } from "@redux/selectors";
import { captureException } from "@sentry/browser";
import useProfile from "@hooks/community/useProfile";

const UserPopover = () =>
{
	const { setCount, count } = useModerationContext();
	const { palette } = useTheme();
	const { pathname } = useLocation();
	const [anchorEl, setAnchorEl] = useState(null);
	const user = useSelector(selectUser);
	const open = Boolean(anchorEl);
	const id = open ? "user-menu-popover" : undefined;
	const { getCurrentUserProfile } = useProfile();
	const [userProfile, setUserProfile] = useState(null);

	const handleClick = (event) =>
	{
		setAnchorEl(event.currentTarget);
	};

	const handleClose = useCallback(() =>
	{
		setAnchorEl(null);
	}, [setAnchorEl]);
	
	useEffect(() => {
		const abortController = new AbortController();
		const signal = abortController.signal;
		const fetchData = async () => {
			try {
				if (!user) return;
				const url = `/api/equipments/pending-tasks?username=${encodeURIComponent(user.username)}&token=${user.token}`;
				const response = await ekosliveServer.get(url, { signal });
				if (!signal.aborted) {
					setCount(response.data.count);
				}
			} catch (error) {
				if (error.name === 'CanceledError' || error.name === 'AbortError') 
					// Don't report cancellation errors to Sentry
					return;
				// Only capture non-cancellation errors
				captureException(error);
			}
		};
		fetchData();
		return () => abortController.abort();
	}, [user]);

	useEffect(() => {
		handleClose();
	}, [pathname, handleClose]);

	useEffect(() => {
		const abortController = new AbortController();
		const signal = abortController.signal;
		const fetchProfile = async () => {
			try {
				if (!user) return;

				const profile = await getCurrentUserProfile();
				setUserProfile(profile);

				if (!signal.aborted) {
					setUserProfile(profile);
				}
			} catch (error) {
				if (error.name === 'CanceledError' || error.name === 'AbortError') 
					// Don't report cancellation errors to Sentry
					return;
				// Only capture non-cancellation errors
				captureException(error);
			}
		};
		if (user) {
			fetchProfile();
		}

		return () => abortController.abort();
	}, [user]);

	return (
		<>
			<Can action="update" subject="ModeratingStatus" passThrough>
				{(allowed) =>
					allowed ? (
						<Badge
							sx={{
								cursor: "pointer",
								padding: ".25rem",
								borderRadius: "50%",
								":hover": {
									backgroundColor: `${palette.white[900]}1A`,
								},
							}}
							color="primary"
							badgeContent={count.reduce((a, b) => a + b, 0)}
							onClick={handleClick}
						>
							<Avatar
								src={userProfile?.avatar || "/public/profile_default_image.webp"}
								alt={user?.username}
								sx={{ 
									width: 32, 
									height: 32,
									backgroundColor: `${palette.white[900]}33`,
								}}
							>
								{user?.username?.charAt(0).toUpperCase()}
							</Avatar>
						</Badge>
					) : (
						<Badge
							sx={{
								cursor: "pointer",
								padding: ".25rem",
								borderRadius: "50%",
								":hover": {
									backgroundColor: `${palette.white[900]}1A`,
								},
							}}
							color="primary"
							onClick={handleClick}
						>
							<Avatar
								src={userProfile?.avatar || "/public/profile_default_image.webp"}
								alt={user?.username}
								sx={{ 
									width: 32, 
									height: 32,
									backgroundColor: `${palette.white[900]}33`,
								}}
							>
								{user?.username?.charAt(0).toUpperCase()}
							</Avatar>
						</Badge>
					)
				}
			</Can>
			<Menu
				id={id}
				open={open}
				anchorEl={anchorEl}
				onClose={handleClose}
				anchorOrigin={{
					vertical: "bottom",
					horizontal: "left",
				}}
				transformOrigin={{
					vertical: "top",
					horizontal: "left",
				}}
				PaperProps={{
					sx: {
						backgroundColor: pathname === "/" ? `${palette.common.white}0F` : palette.black[700],
						borderRadius: "8px",
						width: "180px",
						mt: 1
					}
				}}
			>
				<PopoverList handleClose={handleClose} />
			</Menu>
		</>
	);
};

export default UserPopover;
