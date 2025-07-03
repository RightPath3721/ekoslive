import React, { createContext, useContext, useEffect } from "react";
import { toast } from "react-toastify";
import { useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import { useDispatch } from "react-redux";
import { captureException } from "@sentry/browser";
import { logout } from "@redux/actions";
import { userConstants } from "@redux/constants";
import paypalService from "@services/paypalService";
import useURLSearchParam from "@hooks/useURLSearchParams";
import useActiveUser from "@hooks/useActiveUser";
import userService from "@services/userService";

const AuthContext = createContext(null);

export const useAuthContext = () => useContext(AuthContext);

const AuthProvider = ({ children }) =>
{
	const user = useActiveUser();
	const { hash } = useLocation();
	const dispatch = useDispatch();

	const [subscriptionId, setSubscriptionId] = useURLSearchParam(
		"subscription_id",
		null,
	);
	const navigate = useNavigate();

	useEffect(() =>
	{
		if (!hash) return;

		if (
			hash
				.split("&")
				.filter(
					(item) =>
						item.startsWith("id_token") || item.startsWith("access_token"),
				).length === 0
		)
		{
			return;
		}

		(async () =>
		{
			try
			{
				const user = await userService.getUserFromGoogle(hash);
				dispatch({ type: userConstants.USER_LOGIN_SUCCEEDED, user });
				navigate("/", { replace: true });
			}
			catch
			{
				navigate("/", { replace: true });
			}
		})();
	}, []);

	useEffect(() =>
	{
		if (!subscriptionId || !subscriptionId.startsWith("I-"))
		{
			setSubscriptionId(null);
			return;
		}
		(async () =>
		{
			try
			{
				await paypalService.checkSubscription(user, subscriptionId);
				toast.success("Thank you for using our service");
			}
			catch (error)
			{
				captureException(error, { addAttachment: { subscriptionId, user } });
			}
			finally
			{
				setSubscriptionId(null);
			}
		})();
	}, [subscriptionId, user]);

	useEffect(() =>
	{
		if (!user) return;
		const abortController = new AbortController();

		(async () =>
		{
			try
			{
				const { data } = await axios.get(
					`/api/check-token?token=${user.token}`,
					{ signal: abortController.signal },
				);
				if (data.success) return;
				dispatch(logout());
			}
			catch (error) {
				if (error.name === 'CanceledError' || error.name === 'AbortError') 
					// Don't report cancellation errors to Sentry
					return;
				// Only capture non-cancellation errors
				captureException(error);
				dispatch(logout());
			}
		})();

		// Cleanup function to abort the request if component unmounts or dependencies change
		return () => {
			abortController.abort();
		};
	}, [user]);

	return <AuthContext.Provider value={null}>{children}</AuthContext.Provider>;
};

export default AuthProvider;
