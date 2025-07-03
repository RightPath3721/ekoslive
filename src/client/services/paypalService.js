import axios from "axios";
import dayjs from "dayjs";
import subscriptionService from "@services/subscriptionService";
import { getPlanId } from "../utils/getPlanId";

const SUBSCRIPTION_DATE_FORMAT = "YYYY-MM-DD";

class PayPalService
{
	#axios;
	constructor()
	{
		this.#axios = axios.create({ baseURL: "/api/paypal" });
	}

	async createSubscription(user, planId)
	{
		if (!user) return;

		try
		{
			const { data } = await this.#axios.post(
				`/create-subscription?username=${encodeURIComponent(user.username)}&token=${user.token}`,
				{ planId, user },
			);
			return data.link;
		}
		catch (error)
		{
			throw new Error(error.response.data.message);
		}
	}

	async checkSubscription(user, subscriptionId)
	{
		if (!user) return;

		try
		{
			const { data } = await this.#axios.get(
				`/check-subscription/${subscriptionId}?username=${encodeURIComponent(user.username)}&token=${user.token}`,
			);
			const subscriptionPlans = await subscriptionService.getActivePlans();
			const selectedPlan = subscriptionPlans.plans?.find(
				(plan) => plan.id === data.data.plan_id,
			);
			const plan_id = getPlanId(selectedPlan);
			await subscriptionService.addSubscription(user, plan_id, {
				...this.#parsePaypalResponse(data.data),
				...this.#getSubscriptionDate(selectedPlan),
				subscription_id: data.data.id,
			});

			return plan_id.toString();
		}
		catch (error)
		{
			throw new Error(error.response.data.message);
		}
	}

	async cancelSubscription(user)
	{
		try
		{
			const { data } = await this.#axios.post(
				`/cancel/${user.subscription_id}?username=${encodeURIComponent(user.username)}&token=${user.token}`,
			);
			const membershipProSubscription =
				await subscriptionService.getActiveSubscriptionData(user);
			await subscriptionService.updateSubscription(
				user,
				membershipProSubscription.id,
				{ published: 0 },
			);
			return data;
		}
		catch (error)
		{
			throw new Error(error.response.data.message);
		}
	}

	async upgradeCurrentPlan(user, subscriptionId, planId)
	{
		if (!user) return;
		
		try
		{
			const { data } = await this.#axios.post(
				`/upgrade-subscription?username=${encodeURIComponent(user.username)}&token=${user.token}`,
				{ subscriptionId, planId, user },
			);
			return data.link;
		}
		catch (error)
		{
			throw new Error(error.response.data.message);
		}
	}

	#parsePaypalResponse(paypalResponse)
	{
		return {
			first_name: paypalResponse.subscriber.name.given_name,
			last_name: paypalResponse.subscriber.name.surname,
			address:
				paypalResponse.subscriber.shipping_address.address.address_line_1,
			city: `${paypalResponse.subscriber.shipping_address.address.admin_area_1} ${paypalResponse.subscriber.shipping_address.address.admin_area_2}`,
			zip: paypalResponse.subscriber.shipping_address.address.postal_code,
			country: paypalResponse.subscriber.shipping_address.address.country_code,
			email: paypalResponse.subscriber.email_address,
		};
	}

	#getSubscriptionDate(plan)
	{
		const dates = {};
		dates.from_date = dayjs().format(SUBSCRIPTION_DATE_FORMAT);
		if (!plan)
		{
			dates.to_date = dayjs().add(1, "year").format(SUBSCRIPTION_DATE_FORMAT);
			return dates;
		}
		if (plan.description.toLowerCase().includes("basic"))
		{
			dates.to_date = dayjs().add(99, "years").format(SUBSCRIPTION_DATE_FORMAT);
			return dates;
		}
		else if (plan.description.toLowerCase().includes("annual"))
		{
			dates.to_date = dayjs().add(1, "year").format(SUBSCRIPTION_DATE_FORMAT);
			return dates;
		}
		else
		{
			dates.to_date = dayjs()
				.add(5, "days")
				.add(1, "month")
				.format(SUBSCRIPTION_DATE_FORMAT);
			return dates;
		}
	}
}

export default new PayPalService();
