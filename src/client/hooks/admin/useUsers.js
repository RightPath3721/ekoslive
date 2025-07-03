import { useCallback } from "react";
import axios from "axios";
import { captureException } from "@sentry/browser";
import useActiveUser from "../useActiveUser";

const useUsers = () =>
{
	const user = useActiveUser();

	const getCount = useCallback(async () =>
	{
		if (!user) return null;
		try
		{
			const { data } = await axios.get(
				`/api/admin/users/count?username=${encodeURIComponent(user.username)}&token=${user.token}`,
			);
			return data;
		}
		catch (error)
		{
			captureException(error);
			return null;
		}
	}, [user]);

	const getSubscribersCount = useCallback(async () =>
	{
		if (!user) return null;
		try
		{
			const { data } = await axios.get(
				`/api/admin/users/subscribers-count?username=${encodeURIComponent(user.username)}&token=${user.token}`,
			);
			return data;
		}
		catch (error)
		{
			captureException(error);
			return null;
		}
	}, [user]);

	const getFilteredUsersProfiles = useCallback(
		async (filters) =>
		{
			try
			{
				const { data } = await axios.get(`/api/equipments/filtered/social`, {
					params: filters,
				});
				return data;
			}
			catch (error)
			{
				captureException(error);
				return { data: [], count: 0 };
			}
		},
		[user],
	);

	return { getCount, getSubscribersCount, getFilteredUsersProfiles };
};

export default useUsers;
