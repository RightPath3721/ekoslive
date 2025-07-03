import React from "react";
import { toast } from "react-toastify";
import paypalService from "@services/paypalService";
import useActiveUser from "@hooks/useActiveUser";

const Unsubcribe = ({ close }) =>
{
	const user = useActiveUser();

	const cancelSubscription = async () =>
	{
		try
		{
			await toast.promise(paypalService.cancelSubscription(user), {
				pending:
					"We are cancelling your subscription, please do not refresh the page",
				success: "Subscription cancelled",
			});
			close();
		}
		catch (error)
		{
			toast.error(error.message || "Something went rong, please try again");
		}
	};

	return (
		<button
			className="primary-btn focus-button bg-red-600 p-2 rounded-lg focus-within:text-white focus:text-white mx-auto mt-5"
			type="button"
			onClick={cancelSubscription}
		>
			Confirm
		</button>
	);
};

export default Unsubcribe;
