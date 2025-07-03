import React, { Suspense, useCallback } from "react";
import { motion } from "framer-motion";
import Modal from "@mui/material/Modal";
import SectionTitle from "@components/shared/SectionTitle";
import useURLSearchParam from "@hooks/useURLSearchParams";
import CloseModalButton from "@components/shared/CloseModalButton";
import { SUBSCRIPTION_MANAGER_TABS } from "@constants/subscriptionManager";
import ArrowLeft from "@client/icons/ArrowLeft";
import { useSubscriptionManagerContext } from "@components/providers/SubscriptionManagerProvider";
import { titleAnimationConfig } from "@constants/animation";
import useActiveUser from "@hooks/useActiveUser";

const TABS = {
	[SUBSCRIPTION_MANAGER_TABS.main]: {
		Component: React.lazy(() => import("./Tabs/Main")),
		title: "Manage your subscription",
	},
	[SUBSCRIPTION_MANAGER_TABS.see_plans]: {
		Component: React.lazy(() => import("./Tabs/SeePlans")),
		title: "Available plans",
	},
	[SUBSCRIPTION_MANAGER_TABS.upgrade]: {
		Component: React.lazy(() => import("./Tabs/Upgrade")),
		title: "Upgrade current plan",
	},
	[SUBSCRIPTION_MANAGER_TABS.cancel]: {
		Component: React.lazy(() => import("./Tabs/Unsubcribe")),
		title: "Unsubscribe",
	},
	[SUBSCRIPTION_MANAGER_TABS.confirmSubscription]: {
		Component: React.lazy(() => import("./Tabs/ConfirmSubscription")),
		title: "Confirm Subscription",
	},
};

const SubscriptionManager = () =>
{
	const user = useActiveUser();
	const [isOpen, setIsOpen] = useURLSearchParam("manager", false);
	const { activeTab, changeTab } = useSubscriptionManagerContext();

	const close = useCallback(() =>
	{
		changeTab(SUBSCRIPTION_MANAGER_TABS.main);
		setIsOpen(null);
	}, [setIsOpen]);

	if (!user) return null;

	const CurrentTab = TABS[activeTab].Component;
	return (
		<Modal open={isOpen === "true"} onClose={close}>
			<dialog className="relative max-h-[85vh] flex-center items-start flex-col gap-4 p-7 bg-black-primary text-white">
				{activeTab !== SUBSCRIPTION_MANAGER_TABS.main ? (
					<div className="flex-center gap-3">
						<button
							onClick={() => changeTab(SUBSCRIPTION_MANAGER_TABS.main)}
							name="go back"
							aria-label="go back to subscription manager menu"
							type="button"
							className="primary-btn w-[28px] h-[28px] rounded-full grid place-items-center p-0 -ml-4"
						>
							<ArrowLeft height={20} width={20} />
						</button>
						<SectionTitle
							title={TABS[activeTab].title}
							className="text-base sm:text-xl lg:text-xl"
						/>
					</div>
				) : (
					<motion.h2
						{...titleAnimationConfig}
						className="text-white raleway text-3xl lg:text-4xl font-medium"
					>
						{TABS[activeTab].title}
					</motion.h2>
				)}
				<Suspense>
					<CurrentTab close={close} />
				</Suspense>
				<CloseModalButton close={close} label="close subscription manager" />
			</dialog>
		</Modal>
	);
};

export default SubscriptionManager;
