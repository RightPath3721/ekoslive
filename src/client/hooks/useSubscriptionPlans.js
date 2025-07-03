import { useEffect, useState } from "react";
import subscriptionService from "../services/subscriptionService";

const useSubscriptionPlans = () =>
{
    const [plans, setPlans] = useState([]);

    useEffect(() =>
    {
        (async () =>
        {
            try
            {
                const subscriptionPlans = await subscriptionService.getActivePlans();
                setPlans(subscriptionPlans.plans);
            } catch (error)
            {
                console.error(error);
            }
        })();
    }, []);

    return plans
}

export default useSubscriptionPlans