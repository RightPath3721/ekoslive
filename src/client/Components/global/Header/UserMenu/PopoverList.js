import React, { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useTheme } from "@mui/material/styles";
import { MenuItem, Typography, Badge, Avatar, Box, Divider } from "@mui/material";
import { logout } from "@redux/actions";
import ArrowsIcon from "@client/icons/Arrows";
import LogoutIcon from "@client/icons/Logout";
import ProfileIcon from "@client/icons/ProfileIcon";
import User from "@client/icons/UsersIcon";
import { Can } from "@components/providers/AclProvider";
import { useModerationContext } from "@components/providers/ModerationProvider";
import useProfile from "@hooks/community/useProfile";
import { selectUser } from "@redux/selectors";
import { useSelector } from "react-redux";

const items = [
	{
		icon: <ProfileIcon color="currentColor" width={16} height={16} />,
		label: "Account",
		action: "account",
	},
	{
		icon: <User width={16} height={16} />,
		label: "Profile",
		action: "profile",
	},
	// {
	// 	icon: <ArrowsIcon width={14} height={11} />,
	// 	label: "Subscription",
	// 	action: "manager",
	// },
	{
		icon: <ArrowsIcon width={14} height={11} />,
		label: "Moderation",
		action: "moderation",
		condition: {
			can: "update",
			subject: "ModeratingStatus",
		},
	},
	{
		icon: <LogoutIcon width={16} height={16} />,
		label: "Logout",
		action: "logout",
	},
];

const PopoverList = ({ handleClose }) => {
	const dispatch = useDispatch();
	const navigate = useNavigate();
	const [, setSearchParams] = useSearchParams();
	const { palette } = useTheme();
	const { count } = useModerationContext();
	const { getCurrentUserProfile } = useProfile();
	const user = useSelector(selectUser);
	const [userProfile, setUserProfile] = useState(null);

	const fetchProfile = async () => {
		try {
			const profile = await getCurrentUserProfile();
			setUserProfile(profile);
		} catch (error) {
			console.error('Error fetching user profile:', error);
		}
	};

	useEffect(() => {
		if (user) {
			fetchProfile();
		}
	}, [user]);

	const handleItemClick = (item) => {
		switch (item.action) {
			case "profile":
				handleClose?.();
				navigate("/community/profile");
				break;
			case "account":
				handleClose?.();
				navigate("/my-account");
				break;
			case "manager":
				handleClose?.();
				setSearchParams({ manager: 'true' });
				break;
			case "moderation":
				handleClose?.();
				navigate("/community/moderation");
				break;
			case "logout":
				handleClose?.();
				navigate("/");
				dispatch(logout());
				break;
			default:
				return;
		}
	};

	return (
		<>
			{/* User info item */}
			{userProfile && (
				<>
					<MenuItem
						sx={{
							width: '100%',
							display: "flex",
							justifyContent: "flex-start",
							alignItems: "center",
							gap: ".625rem",
							backgroundColor: "transparent",
							cursor: "pointer",
							padding: ".625rem .75rem",
							":hover": {
								backgroundColor: `${palette.white[900]}1A`,
							},
						}}
						onClick={() => navigate("/community/profile")}
					>
						<Box sx={{ display: 'flex', flexDirection: 'column' }}>
							<Typography 
								component="span" 
								variant="body2" 
								fontWeight="bold"
								sx={{
									maxWidth: '120px',
									overflow: 'hidden',
									textOverflow: 'ellipsis',
									whiteSpace: 'nowrap'
								}}
							>
								{user.username}
							</Typography>
							{userProfile.social_nickname && (
								<Typography 
									component="span" 
									variant="caption" 
									sx={{
										maxWidth: '120px',
										overflow: 'hidden',
										textOverflow: 'ellipsis',
										whiteSpace: 'nowrap'
									}}
								>
									{userProfile.social_nickname}
								</Typography>
							)}
						</Box>
					</MenuItem>
					<Divider sx={{ borderColor: `${palette.white[900]}1A`, my: 0.5 }} />
				</>
			)}
			{items.map((item, index) => {
				// Add divider before the Logout item
				const isLogoutItem = item.action === 'logout';
				return (
					<React.Fragment key={item.action}>
						{isLogoutItem && <Divider sx={{ borderColor: `${palette.white[900]}1A`, my: 0.5 }} />}
						{item.condition ? (
							<Can
								action={item.condition.can}
								subject={item.condition.subject}
							>
							<MenuItem
								sx={{
									width: '100%',
									display: "flex",
									justifyContent: "flex-start",
									alignItems: "center",
									gap: ".625rem",
									backgroundColor: "transparent",
									cursor: "pointer",
									padding: ".625rem .75rem",
									":hover": {
										backgroundColor: `${palette.white[900]}1A`,
									},
								}}
								onClick={() => handleItemClick(item)}
							>
								<Typography
									component="span"
									display="inline-grid"
									sx={{
										width: 26,
										height: 26,
										placeItems: "center",
										backgroundColor: `${palette.white[900]}33`,
										borderRadius: "50%",
									}}
								>
									{item.icon}
								</Typography>

								<Typography component="span">
									<Badge
										color="primary"
										badgeContent={count.reduce((a, b) => a + b, 0)}
										sx={{
											'& .MuiBadge-badge': {
												right: -5
											}
										}}
									>
										{item.label}
									</Badge>
								</Typography>
							</MenuItem>
							</Can>
						) : (
							<MenuItem
								sx={{
									width: '100%',
									display: "inline-grid",
									justifyContent: "flex-start",
									alignItems: "center",
									gridTemplateColumns: "26px 1fr",
									gap: ".625rem",
									backgroundColor: "transparent",
									cursor: "pointer",
									padding: ".625rem .75rem",
									":hover": {
										backgroundColor: `${palette.white[900]}1A`,
									},
								}}
								onClick={() => handleItemClick(item)}
							>
						<Typography
							display="inline-grid"
							sx={{
								width: 26,
								height: 26,
								placeItems: "center",
								backgroundColor: `${palette.white[900]}33`,
								borderRadius: "50%",
							}}
							component="span"
						>
							{item.icon}
						</Typography>
						<Typography component="span">{item.label}</Typography>
							</MenuItem>
						)}
					</React.Fragment>
				);
			})}
		</>
	);
};

export default PopoverList;
