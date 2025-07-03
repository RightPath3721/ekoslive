import React from "react";
import dayjs from "dayjs";
import { getCurrentSubscription } from "@utils/getCurrentSubscription";
import SubscriptionManagerButton from "../SubscriptionManagerButton";
import { SUBSCRIPTION_MANAGER_TABS } from "@constants/subscriptionManager";
import { useSubscriptionManagerContext } from "@components/providers/SubscriptionManagerProvider";
import { planType } from "@indi/enums";
import useActiveUser from "@hooks/useActiveUser";

const Main = () =>
{
	const user = useActiveUser();
	const { changeTab } = useSubscriptionManagerContext();

	return (
		<>
			<p>Current subscription: {getCurrentSubscription(user.plan_id)}</p>
			<p>Expired date: {dayjs(user.to_date).format("YYYY.MM.DD")}</p>
			<div className="flex-center gap-3">
				<SubscriptionManagerButton
					label="see available plans"
					text="See plans"
					onClick={() => changeTab(SUBSCRIPTION_MANAGER_TABS.see_plans)}
				/>
				{user.plan_id !== planType.ULTIMATE && (
					<SubscriptionManagerButton
						label="Upgrade current subscription"
						text="Upgrade"
						onClick={() => changeTab(SUBSCRIPTION_MANAGER_TABS.upgrade)}
					/>
				)}
			</div>
			{user.plan_id !== planType.DEFAULT && (
				<button
					aria-label="unsubscribe"
					className="primary-btn focus-button bg-red-600 p-2 rounded-lg focus-within:text-white focus:text-white"
					type="button"
					onClick={() => changeTab(SUBSCRIPTION_MANAGER_TABS.cancel)}
				>
					Unsubcribe
				</button>
			)}
		</>
	);
};

export default Main;
