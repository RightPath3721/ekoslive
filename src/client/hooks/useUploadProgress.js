import axios from "axios";
import { useCallback, useState } from "react";

const useUploadProgress = () =>
{
	const [progress, setProgress] = useState(0);
	const [isPending, setIsPending] = useState(false);

	const uploadData = useCallback(async (url, formData, axiosConfig = {}) =>
	{
		setIsPending(true);
		try
		{
			const { data } = await axios.post(url, formData, {
				...axiosConfig,
				onUploadProgress: (progressEvent) =>
				{
					const progress = (progressEvent.loaded / progressEvent.total) * 50;
					setProgress(progress);
				},
				onDownloadProgress: (progressEvent) =>
				{
					const progress =
						50 + (progressEvent.loaded / progressEvent.total) * 50;
					setProgress(progress);
				},
			});
			return data;
		}
		catch (error)
		{
			throw error;
		}
		finally
		{
			setIsPending(false);
		}
	}, []);

	return { progress, uploadData, isPending };
};

export default useUploadProgress;
