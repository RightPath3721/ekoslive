import { useCallback } from "react";
import axios from "axios";
import useActiveUser from "./useActiveUser";

const useGalleryApi = () =>
{
	const user = useActiveUser();

	const getImages = useCallback(async () =>
	{
		if (!user) return null;

		const url = `/api/gallery/?username=${encodeURIComponent(user.username)}&token=${user.token}`;
		const { data } = await axios.get(url);
		return data;
	}, [user]);

	return { getImages };
};

export default useGalleryApi;
