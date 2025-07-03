import { useEffect, useRef, useState } from "react";

const useScrollPagination = ({
	setPage,
	itemsRemaining,
	loadingDelay = 500,
}) =>
{
	const observeRef = useRef();
	const [isLoading, setIsLoading] = useState(false);

	useEffect(() =>
	{
		const intersectionObserver = new IntersectionObserver(
			(entries) =>
			{
				const entry = entries[0];
				if (entry.isIntersecting && !isLoading && itemsRemaining > 0)
				{
					setIsLoading(true);
					setPage((prevPage) => prevPage + 1);
					setTimeout(() => setIsLoading(false), loadingDelay);
				}
			},
			{ threshold: 0.05 },
		);

		if (itemsRemaining > 0 && observeRef.current)
		{
			intersectionObserver.observe(observeRef.current);
		}

		if (itemsRemaining <= 0 && observeRef.current)
		{
			intersectionObserver.unobserve(observeRef.current);
		}

		return () =>
		{
			if (observeRef.current)
			{
				intersectionObserver.unobserve(observeRef.current);
			}
		};
	}, [isLoading, itemsRemaining, setPage, loadingDelay]);

	return { observeRef, isLoading };
};

export default useScrollPagination;
