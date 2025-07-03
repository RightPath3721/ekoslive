import { useCallback, useEffect, useRef } from "react";
import throttle from "lodash/throttle";

const useThrottle = (cb, delay) =>
{
	const options = { leading: true, trailing: false };
	const cbRef = useRef(cb);

	useEffect(() =>
	{
		cbRef.current = cb;
	}, [cb]);

	return useCallback(
		throttle(
			(...args) =>
			{
				cbRef.current(...args);
			},
			delay,
			options,
		),
		[delay, cbRef],
	);
};

export default useThrottle;
