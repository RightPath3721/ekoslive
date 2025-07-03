import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";

const useURLSearchParam = (key, defaultValue = null) =>
{
	const [searchParams, setSearchParams] = useSearchParams();
	const [paramValue, setParamValue] = useState(
		searchParams.get(key) ?? defaultValue,
	);

	useEffect(() =>
	{
		const value = searchParams.get(key) || defaultValue;
		setParamValue(value);
	}, [searchParams, key]);

	const setSearchParam = useCallback(
		(newValue) =>
		{
			if (newValue?.toString().trim())
			{
				setSearchParams((params) =>
				{
					params.set(key, newValue.toString().trim());
					return params;
				});
			}
			else
			{
				searchParams.delete(key);
				setSearchParams(searchParams);
			}
		},
		[setSearchParams, searchParams],
	);

	return [paramValue, setSearchParam];
};

export default useURLSearchParam;
