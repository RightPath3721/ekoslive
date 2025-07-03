import axios from "axios";

class SubscriptionService
{
    #axios;
    constructor()
    {
        this.#axios = axios.create({ baseURL: "/api/subscriptions" });
    }

    async renewSubscription(user, data)
    {
        if (!user) return;

        try
        {
            const { data: result } = await this.#axios.post(
                `/renew?username=${encodeURIComponent(user.username)}&token=${user.token}`,
                {
                    user: { ...user, user_id: "9605" },
                    data: this.#filterDetailsObject(data),
                },
            );
            return result;
        }
        catch (error)
        {
            console.error(error);
            throw new Error("Subscription renewal failed, please try again");
        }
    }

    async cancelSubscription(user)
    {
        try
        {
            const { data: result } = await this.#axios.post("/cancel", { user });
            return result;
        }
        catch (error)
        {
            return error;
        }
    }

    async upgradeSubscription(user, plan_id, data)
    {
        try
        {
            const { data: result } = await this.#axios.post("/upgrade", {
                user,
                plan_id,
                data,
            });
            return result;
        }
        catch (error)
        {
            return error;
        }
    }

    async addSubscription(user, plan_id, data)
    {
        if (!user) return;

        try
        {
            const { data: result } = await this.#axios.post(
                `/add?username=${encodeURIComponent(user.username)}&token=${user.token}`,
                { user, plan_id, data },
            );
            return result;
        }
        catch (error)
        {
            throw new Error(error.response.data.message);
        }
    }

    async getActiveSubscriptionData(user)
    {
        if (!user) return;

        try
        {
            const url = `/api/subscriptions/get-active-subscription?username=${encodeURIComponent(user.username)}&token=${user.token}&user_id=${user.user_id}`;
            const { data } = await axios.get(url);
            return data.data;
        }
        catch (error)
        {
            throw new Error(error.response.data.message);
        }
    }

    async getActivePlans()
    {
        try
        {
            const { data } = await this.#axios.get(
                `/get-active-plans`,
            );
            return data;
        }
        catch (error)
        {
            throw new Error(error.response.data.message);
        }
    }

    async updateSubscription(user, membershipSubscriptionId, subscriptionData)
    {
        if (!user) return;
        
        try
        {
            await this.#axios.post(
                `/update-subscription/${membershipSubscriptionId}?username=${encodeURIComponent(user.username)}&token=${user.token}`,
                {
                    data: { ...subscriptionData, plan_id: user.plan_id },
                },
            );
        }
        catch (error)
        {
            throw new Error(error.message);
        }
    }

    #filterDetailsObject(data)
    {
        return Object.fromEntries(
            Object.entries(data).filter(([, value]) => value),
        );
    }
}

export default new SubscriptionService();
