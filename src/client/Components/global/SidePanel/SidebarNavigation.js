import React from "react";
import axios from "axios";
import WarningIcon from "@mui/icons-material/Warning";
import { useLocation, Link, useParams } from "react-router-dom";
import { useTheme } from "@mui/material";
import Box from "@mui/material/Box";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import MuiLink from "@mui/material/Link";
import Typography from "@mui/material/Typography";
import s from "@common/shared/i18n/i18n";
import { styles } from "@client/shared/styles";
import CameraIcon from "@client/icons/trains/CameraIcon";
import GlobeIcon from "@client/icons/GlobeIcon";
import ObservatoriesIcon from "@client/icons/ObservatoryIcon";
import ProfileIcon from "@client/icons/ProfileIcon";
import UsersIcon from "@client/icons/UsersIcon";
import CalendarIcon from "@client/icons/CalendarIcon";

import { useCurrentProfileContext } from "@client/Pages/Community/CurrentProfileContext";
import useActiveUser from "@hooks/useActiveUser";

const authNavItems = [
	{
		label: s.general.profile,
		icon: <ProfileIcon color="currentColor" width={16} height={16} />,
		path: "/community/profile/",
		regex: new RegExp(
			/\/community\/profile(?!(\/observatories|\/equipment.*|\/users))/,
		),
	},
	{
		label: "Feed",
		icon: <GlobeIcon color="currentColor" width={16} height={16} />,
		path: "/community/",
		regex: new RegExp(
			/^\/community\/?((?!(observatories|equipment|profile|users|bookings)).)*$/,
		),
	},
	{
		label: "Users",
		icon: <UsersIcon color="currentColor" width={16} height={16} />,
		path: "/community/users/",
		regex: new RegExp(/\/community\/users.*/),
	},
	{
		label: "Equipment",
		icon: <CameraIcon color="currentColor" width={16} height={16} />,
		path: "/community/equipment/",
		regex: new RegExp(/\/community\/equipment.*/),
	},
	{
		label: "Observatories",
		icon: <ObservatoriesIcon color="currentColor" width={16} height={16} />,
		path: "/community/:nickname/observatories/",
		regex: new RegExp(/\/community.*\/observatories/i),
	},
	{
		label: "Bookings",
		icon: <CalendarIcon color="currentColor" width={16} height={16} />,
		path: "/community/bookings/",
		regex: new RegExp(/\/community\/bookings.*/),
	},
];

const defaultNavItems = [
	{
		label: "Feed",
		icon: <GlobeIcon color="currentColor" width={16} height={16} />,
		path: "/community/",
		regex: new RegExp(
			/^\/community\/?((?!observatories|equipment|profile|users).)*$/,
		),
	},
	{
		label: "Users",
		icon: <UsersIcon color="currentColor" width={16} height={16} />,
		path: "/community/users/",
		regex: new RegExp(/\/community\/users.*/),
	},
	{
		label: "Equipment",
		icon: <CameraIcon color="currentColor" width={16} height={16} />,
		path: "/community/equipment/",
		regex: new RegExp(/\/community\/equipment.*/),
	},
	{
		label: "Observatories",
		icon: <ObservatoriesIcon color="currentColor" width={16} height={16} />,
		path: "/community/profile/observatories/",
		regex: new RegExp(/\/community.*\/observatories/i),
	},
];

const otherProfileItems = [
	{
		label: "Feed",
		icon: <GlobeIcon color="currentColor" width={16} height={16} />,
		path: "/community/",
		regex: new RegExp(
			/^\/community\/?((?!observatories|equipment|profile|users).)*$/,
		),
	},
	{
		label: "Observatories",
		icon: <ObservatoriesIcon color="currentColor" width={16} height={16} />,
		path: "/community/:nickname/observatories/",
		regex: new RegExp(/\/community.*\/observatories/i),
	},
];

const SidebarNavigation = ({ userProfile, observatory }) =>
{
	const { profile } = useCurrentProfileContext();
	const user = useActiveUser();
	const { palette, breakpoints } = useTheme();
	const { pathname } = useLocation();
	const { nickname } = useParams();
	
	// Add state to track observatories without machine_id
	const [hasObservatoriesWithoutMachineId, setHasObservatoriesWithoutMachineId] = React.useState(false);
	
	// Check for observatories without machine_id
	React.useEffect(() => {
		const checkObservatories = async () => {
			if (user) {
				try {
					const response = await axios.get(`/api/observatories?username=${user.username}&token=${user.token}`);
					if (response.data && response.data.observatories) {
						// Check if any observatory doesn't have a machine_id
						const hasIncomplete = response.data.observatories.some(obs => !obs.machine_id);
						setHasObservatoriesWithoutMachineId(hasIncomplete);
					}
				} catch (error) {
					console.error("Error fetching observatories:", error);
				}
			}
		};
		
		checkObservatories();
	}, [user]);

	return (
		<Box
			component="nav"
			sx={{
				[breakpoints.down("sm")]: {
					marginTop: "1rem",
				},
				flex: 1,
				overflow: "visible",
				"@media (max-height: 800px)": {
					overflow: "visible",
				},
			}}
		>
			<List
				sx={[
					styles.center,
					{
						gap: ".5rem",
						flexDirection: "column",
						[breakpoints.down("sm")]: {
							maxWidth: "220px",
							margin: "0 auto",
						},
						padding: 0,
						"@media (max-height: 800px)": {
							gap: ".3rem",
						}
					},
				]}
			>
				{(profile && profile?._id === userProfile?._id
					? authNavItems
					: userProfile && profile && profile?._id !== userProfile?._id
						? otherProfileItems
						: defaultNavItems
				).map((item, idx) =>
				{
					const isActive = item.regex
						? item.regex.test(pathname)
						: item.path === pathname;
					return (
						<ListItem
							sx={{
								padding: ".625rem .75rem",
								backgroundColor: isActive ? palette.primary.main : "",
								borderRadius: ".5rem",
								"@media (max-height: 800px)": {
									padding: ".4rem .5rem",
								}
							}}
							key={idx}
						>
							<MuiLink
								width="100%"
								display="inline-grid"
								sx={{
									alignItems: "center",
									gridTemplateColumns: "26px 1fr auto",
									gap: ".625rem",
									textDecoration: "none",
									color: palette.white[900],
									":hover": {
										color: isActive ? palette.grey.main : palette.primary.main,
									},
									cursor: "pointer",
								}}
								to={
									item.path.includes(":")
										? item.path.replace(
												":nickname/",
												`${nickname ? nickname + "/" : profile ? "profile/" : ""}`,
											)
										: item.path
								}
								component={Link}
							>
								<Box
									sx={{
										width: 26,
										height: 26,
										backgroundColor: `${palette.white[900]}33`,
										borderRadius: "50%",
										display: "inline-grid",
										placeItems: "center",
										color: "inherit",
										"@media (max-height: 800px)": {
											width: 22,
											height: 22,
										}
									}}
									component="span"
								>
									{item.icon}
								</Box>
								<Typography 
									sx={{ 
										color: "inherit",
										"@media (max-height: 800px)": {
											fontSize: "0.875rem"
										}
									}}
								>
									{item.label}
								</Typography>
								{item.label === "Observatories" && hasObservatoriesWithoutMachineId && (
									<WarningIcon 
										sx={{ 
											color: 'white',
											fontSize: '20px'
										}} 
									/>
								)}
							</MuiLink>
						</ListItem>
					);
				})}
			</List>
		</Box>
	);
};

export default SidebarNavigation;
