import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { captureException } from "@sentry/browser";
import useActiveUser from "./useActiveUser";

const useObservatories = () =>
{
	const [observatories, setObservatories] = useState([]);
	const user = useActiveUser();

	useEffect(() =>
	{
		if (!user) return;

		(async () =>
		{
			try
			{
				const { data } = await axios.get(
					`/api/observatories?username=${encodeURIComponent(user.username)}&token=${user.token}`,
				);
				setObservatories(data.observatories ?? []);
			}
			catch (error)
			{
				captureException(error);
				setObservatories([]);
			}
		})();
	}, [user]);

	const getObservatories = useCallback(async () =>
	{
		if (!user) return [];

		try
		{
			const { data } = await axios.get(
				`/api/observatories?username=${encodeURIComponent(user.username)}&token=${user.token}`,
			);
			return data.observatories;
		}
		catch (error)
		{
			captureException(error);
			return [];
		}
	}, [user]);

	const getFilteredObservatories = useCallback(
		async (filters) =>
		{
			try
			{
				const { data } = await axios.get(
					`/api/equipments/filtered/observatory`,
					{ params: filters },
				);
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

	return {
		observatories,
		setObservatories,
		getObservatories,
		getFilteredObservatories,
	};
};

export default useObservatories;
