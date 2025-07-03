import React, { useState } from "react";
import { PricingSlot, PricingDetail } from "react-pricing-table";
import { toast } from "react-toastify";
import { cn } from "@utils/cn";
import PopularTag from "./PopularTag";
import useActiveUser from "@hooks/useActiveUser";
import paypalService from "@services/paypalService";
import isEmpty from "lodash/isEmpty";
import shouldDisplaySubscribeButton from "@utils/shouldDisplaySubscribeButton";
import AuthButtons from "@components/global/Header/AuthButtons";

const PricingCard = ({ plan, paypalData, isYearView }) =>
{
	const user = useActiveUser();
	const [activeModal, setActiveModal] = useState("");

	const onSubmit = async (subscriptionId) =>
	{
		try
		{
			if (isEmpty(user))
			{
				setActiveModal("LOGIN");
			}
			else 
			{
				const link = await paypalService.createSubscription(user, subscriptionId);
				window.location.href = link;
			}
		}
		catch (error)
		{
			toast.error(error.message);
		}
	};

	return (
		<PricingSlot
			onClick={() => onSubmit(paypalData.id)}
			buttonText="Choose plan"
			title={plan.title}
			buttonClass="px-3 mt-2 primary-btn"
			shouldDisplayButton={shouldDisplaySubscribeButton(
				user?.plan_id,
				isYearView,
				plan.title,
			)}
		>
			{plan.popular && (
				<PricingDetail>
					<div className="w-full h-full relative">
						<PopularTag />
					</div>
				</PricingDetail>
			)}
			<PricingDetail>
				<p className="text-white-primary text-3xl">
					{isYearView ? plan.data.yearPrice : plan.data.monthPrice}
				</p>
			</PricingDetail>
			{plan.data.featuresList.map((feature, i) =>
			{
				return (
					<PricingDetail key={i}>
						<span
							className={cn(
								"text-white-primary inline-block w-max",
								feature.available ? "" : "line-through",
							)}
						>
							{feature.title}
						</span>
					</PricingDetail>
				);
			})}

			<AuthButtons mode={activeModal} setMode={setActiveModal} />

		</PricingSlot>
	);
};

export default PricingCard;
