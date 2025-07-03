import React, { useCallback, useEffect } from "react";
import { toast } from "react-toastify";
import { useSubscriptionManagerContext } from "@components/providers/SubscriptionManagerProvider";
import SubscriptionForm from "../SubscriptionForm";
import { getCurrentSubscription } from "@utils/getCurrentSubscription";
import paypalService from "@services/paypalService";
import { planType } from "@indi/enums";
import useActiveUser from "@hooks/useActiveUser";

const ConfirmSubscription = ({ close }) =>
{
	const { currentConfirmPlan } = useSubscriptionManagerContext();
	const user = useActiveUser();

	const onSubmit = useCallback(async (user, data) =>
	{
		try
		{
			const link = await paypalService.createSubscription(
				{
					...user,
					email: data?.email ? data.email : user.email,
					...(data
						? { firstName: data.first_name, lastName: data.last_name }
						: {}),
				},
				currentConfirmPlan.id,
			);
			window.location.href = link;
		}
		catch (error)
		{
			toast.error(error.message);
		}
	}, []);

	useEffect(() =>
	{
		if (user.plan_id === planType.DEFAULT) return;
		onSubmit(user);
	}, []);

	if (user.plan_id !== planType.DEFAULT) return;

	return (
		<>
			<p className="secondary-text max-w-[600px]">
				Please enter information on the form below to process upgrade of your
				subscription from Ekos&nbsp;
				<span className="text-primary-orange">
					{getCurrentSubscription(user.plan_id)}
				</span>
				&nbsp;To&nbsp;
				<span className="text-primary-orange">{currentConfirmPlan?.title}</span>
				:
			</p>
			{user.plan_id === planType.DEFAULT && (
				<SubscriptionForm action="Confirm" submit={onSubmit} close={close} />
			)}
		</>
	);
};

export default ConfirmSubscription;
