import { useCallback, useEffect, useReducer, useState } from "react";
import { captureException } from "@sentry/browser";
import axios from "axios";
import useActiveUser from "../useActiveUser";
import { useAdminContext } from "../../views/AdminPage/AdminTabContext";

const initialFilters = {
	orderBy: "lastLogged",
	sortDirection: "desc",
	page: 0,
};

const reducer = (state, action) =>
{
	if (action === "reset") return initialFilters;
	return { ...state, [action.name]: action.value };
};

const useEkos = () =>
{
	const user = useActiveUser();
	const [filters, dispatch] = useReducer(reducer, initialFilters);
	const [ekos, setEkos] = useState([]);
	const [count, setCount] = useState(0);
	const { usernameFilter } = useAdminContext();

	const getEkos = useCallback(
		async (params = {}) =>
		{
			if (!user) return null;
			const filterParams = new URLSearchParams({
				...filters,
				search: usernameFilter,
				...params,
			});
			const { data } = await axios.get(
				`/api/admin/ekos?username=${encodeURIComponent(user.username)}&token=${user.token}&${filterParams.toString()}`,
			);
			if (!data.result) return null;
			return { ekos: data.ekos, count: data.count };
		},
		[user, usernameFilter, filters],
	);

	const refreshEkos = useCallback(async () =>
	{
		try
		{
			const ekosData = await getEkos();
			setEkos(ekosData.ekos);
			setCount(ekosData.count);
		}
		catch
		{}
	}, [getEkos]);

	const getCount = useCallback(async () =>
	{
		try
		{
			const { data } = await axios.get(
				`/api/admin/ekos/count?username=${encodeURIComponent(user.username)}&token=${user.token}`,
			);
			return data;
		}
		catch (error)
		{
			captureException(error);
		}
	}, [user]);

	useEffect(() =>
	{
		(async () =>
		{
			try
			{
				const ekosData = await getEkos();
				if (!ekosData) return;
				setEkos(ekosData.ekos);
				setCount(ekosData.count);
			}
			catch (error)
			{
				captureException(error);
			}
		})();
	}, [filters, usernameFilter]);

	return {
		getEkos,
		updateFilters: dispatch,
		filters,
		ekos,
		count,
		refreshEkos,
		getCount,
	};
};

export default useEkos;
