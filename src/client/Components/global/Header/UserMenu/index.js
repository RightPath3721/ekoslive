import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useMediaQuery } from "react-responsive";
import isEmpty from "lodash/isEmpty";
import { Link } from "react-router-dom";
import UserAccount from "./UserAccount";
import Notification from "@components/shared/Notification/NotificationPopup";
import {
	selectIsLoggedIn,
	selectSocketsConnecting,
	selectSocketsConnected,
	selectUser,
} from "@redux/selectors";

import { wssMessageSocketActions } from "@redux/actions";
import { deviceActions } from "@redux/actions/devices.web.actions";
import DashboardIcon from "@client/icons/DashboardIcon";
import UserPopover from "./UserPopover";
import GlobeIcon from "@client/icons/GlobeIcon";
import { Palette } from "@common/shared/common/styles";

const UserMenu = () =>
{
	const dispatch = useDispatch();
	const user = useSelector(selectUser);
	// User authentication and is logged in. We have users objects.
	const loggedIn = useSelector(selectIsLoggedIn);
	// Websockets are trying to connect to online server
	const socketsConnecting = useSelector(selectSocketsConnecting);
	// Websockets are connected to online server
	const socketsConnected = useSelector(selectSocketsConnected);

	/*
	 * Action to take when logged state or websocket state changes
	 */
	useEffect(() =>
	{
		// Are we logged in?
		if (loggedIn === false)
		{
			// On logout, we must disconnect sockets
			if (socketsConnected)
			{
				dispatch(wssMessageSocketActions.disconnect());
			}
			return;
		}

		// If sockets are off, we must reconnect.
		if (socketsConnected === false)
		{
			if (!isEmpty(user) && socketsConnecting === false)
			{
				dispatch(wssMessageSocketActions.connect(user, null, null));
			}
		}
		else dispatch(deviceActions.getConnectionStatus());
	}, [loggedIn, socketsConnected]);

	const isMediumScreen = useMediaQuery({ query: "(min-width: 640px)" });

	return isMediumScreen ? (
		<div className="flex-center gap-3 relative">
			<UserPopover />
			<Link
				to="/dashboard"
				className="p-2 border border-solid border-[#EFEFEF] text-[#EFEFEF] rounded-lg flex items-center transition-colors focus-button hover:border-primary-orange hover:text-[#EFEFEF] hover:bg-primary-orange"
			>
				<DashboardIcon width={20} height={20} color="inherit" />
			</Link>
			<Link
				to="/community"
				style={{ width: "37.6px", height: "37.6px" }}
				className="p-2 border border-solid border-[#EFEFEF] text-[#EFEFEF] rounded-lg flex items-center transition-colors focus-button hover:border-primary-orange hover:text-[#EFEFEF] hover:bg-primary-orange"
			>
				<GlobeIcon width={20} height={20} color={Palette.white} />
			</Link>
			<Notification />
		</div>
	) : (
		<UserAccount />
	);
};

export default UserMenu;
