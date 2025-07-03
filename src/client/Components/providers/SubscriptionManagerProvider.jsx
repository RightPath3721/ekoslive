import React, { createContext, useContext, useEffect, useState } from "react";
import { SUBSCRIPTION_MANAGER_TABS } from "@constants/subscriptionManager";
import subscriptionService from "@services/subscriptionService";

const defaultContext = {
	activeTab: SUBSCRIPTION_MANAGER_TABS.main,
	currentConfirmPlan: null,
	changeTab: () =>
	{},
	setCurrentConfirmPlan: () =>
	{},
	subscriptionPlans: [],
};

const SubscriptionManagerContext = createContext(defaultContext);

export const useSubscriptionManagerContext = () =>
	useContext(SubscriptionManagerContext);

export const SubscriptionManagerProvider = ({ children }) =>
{
	const [activeTab, setActiveTab] = useState(SUBSCRIPTION_MANAGER_TABS.main);
	const [currentConfirmPlan, setCurrentConfirmPlan] = useState(null);
	const [subscriptionPlans, setSubscriptionPlans] = useState([]);

	useEffect(() =>
	{
		(async () =>
		{
			try
			{
				const res = await subscriptionService.getActivePlans();
				setSubscriptionPlans(
					res.plans.map((plan) => ({ id: plan.id, title: plan.name })),
				);
			}
			catch (error)
			{
				console.error(error);
			}
		})();
	}, []);

	return (
		<SubscriptionManagerContext.Provider
			value={{
				activeTab,
				changeTab: setActiveTab,
				currentConfirmPlan,
				setCurrentConfirmPlan,
				subscriptionPlans,
			}}
		>
			{children}
		</SubscriptionManagerContext.Provider>
	);
};
