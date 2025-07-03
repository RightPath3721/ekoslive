import { useCallback, useEffect, useState } from "react";
import axios from "axios";
import { captureException } from "@sentry/browser";
import useActiveUser from "./useActiveUser";

const useObservatoryAPI = (observatoryId) =>
{
	const user = useActiveUser();
	const [observatory, setObservatory] = useState(null);

	useEffect(() =>
	{
		if (!observatoryId) return;
		(async () =>
		{
			try
			{
				const { data } = await axios.get(`/api/observatories/${observatoryId}`);
				setObservatory(data.observatory);
			}
			catch (error)
			{
				captureException(error);
			}
		})();
	}, [observatoryId]);

	const postObservatoryData = useCallback(
		async (observatoryData, action = "post") =>
		{
			if (!user) return "";

			try
			{
				const { data } =
					action === "patch"
						? await axios.patch(
								`/api/observatories/${observatoryId}?username=${encodeURIComponent(user.username)}&token=${user.token}`,
								observatoryData,
							)
						: await axios.post(
								`/api/observatories?username=${encodeURIComponent(user.username)}&token=${user.token}`,
								observatoryData,
							);
				setObservatory(data.observatory);
				return data.observatory;
			}
			catch (err)
			{
				captureException(err);
				return err.message;
			}
		},
		[observatoryId, user],
	);

	const deleteObservatory = useCallback(
		async (observatoryId) =>
		{
			if (!user) return "";

			try
			{
				await axios.delete(
					`/api/observatories/${observatoryId}?username=${encodeURIComponent(user.username)}&token=${user.token}`,
				);
				setObservatory(null);
			}
			catch (error)
			{
				captureException(error);
				return error?.response?.data?.message || "";
			}
		},
		[user],
	);

	return { observatory, postObservatoryData, deleteObservatory, setObservatory };
};

export default useObservatoryAPI;
