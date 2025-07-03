import React from "react";
import { useDispatch } from "react-redux";
import Logout from "@mui/icons-material/Logout";
import useURLSearchParam from "@hooks/useURLSearchParams";
import { logout } from "@redux/actions";
import s from "@common/shared/i18n/i18n";
import { Can } from "@components/providers/AclProvider";

const UserAccount = () =>
{
	const dispatch = useDispatch();
	const [, setSubscriptionManager] = useURLSearchParam("manager");

	const handleLogout = () =>
	{
		dispatch(logout());
		if (window.location.pathname !== "/")
		{
			setTimeout(() => (window.location.href = "/"), 150);
		}
	};

	return (
		<div className="flex-center flex-col gap-3 text-white">
			<a className={menuItem} href="/community/profile">
				{s.menu.go_to_profile}
			</a>
			<a className={menuItem} href="/community/equipment">
				{s.menu.go_to_equipment}
			</a>
			<Can action="update" subject="ModeratingStatus">
				<a className={menuItem} href="/community/moderation">
					{s.menu.go_to_moderation}
				</a>
			</Can>
			<button
				onClick={() => setSubscriptionManager(true)}
				className={menuItem}
				aria-label="manage subscription"
				type="button"
			>
				{s.menu.manage_subscriptions}
			</button>
			<a className={menuItem} href={`${window.location.origin}/dashboard`}>
				{s.menu.go_to_dashboard}
			</a>
			<button
				onClick={handleLogout}
				className="p-2 rounded-[4px] font-normal border border-grey-primary"
			>
				<Logout className="text-red-600" />
			</button>
		</div>
	);
};

const menuItem =
	"primary-btn w-full text-center rounded-[0.25rem] padding-2 shadow-none";

export default UserAccount;
