import React, {
	createContext,
	useState,
	useEffect,
	useContext,
	useCallback,
} from "react";
import axios from "axios";
import { captureException } from "@sentry/browser";
import useActiveUser from "@hooks/useActiveUser";

const defaultTourGuideState = {
	tour_guide: {
		profile: false,
		feed: false,
		users: false,
		equipment: false,
		observatories: false,
	},
	detailed_tour_guide: {},
};

const TourGuideContext = createContext({
	tourGuideState: {},
	updateTourGuideState: async () =>
	{},
});

export const useTourGuideContext = () => useContext(TourGuideContext);

const TourGuideContextProvider = ({ children }) =>
{
	const user = useActiveUser();
	const [tourGuideState, setTourGuideState] = useState(null);

	useEffect(() =>
	{
		if (!user) return;

		(async () =>
		{
			try
			{
				const { data } = await axios.get("/api/survey", {
					params: { username: user.username, token: user.token },
				});
				setTourGuideState(data ?? defaultTourGuideState);
			}
			catch (error)
			{
				captureException(error);
				setTourGuideState(defaultTourGuideState);
			}
		})();
	}, [user]);

	const updateTourGuideState = useCallback(
		async (key, initial = false) =>
		{
			if (!user || !tourGuideState) return;

			const updatedState = initial
				? {
						...tourGuideState,
						tour_guide: { ...tourGuideState.tour_guide, [key]: true },
					}
				: {
						...tourGuideState,
						detailed_tour_guide: {
							...tourGuideState.detailed_tour_guide,
							[key]: true,
						},
					};
			try
			{
				await axios.put("/api/survey", updatedState, {
					params: { username: user.username, token: user.token },
				});
			}
			catch (error)
			{
				captureException(error);
			}
			finally
			{
				setTourGuideState(updatedState);
			}
		},
		[user, setTourGuideState, tourGuideState],
	);

	return (
		<TourGuideContext.Provider value={{ tourGuideState, updateTourGuideState }}>
			{children}
		</TourGuideContext.Provider>
	);
};

export default TourGuideContextProvider;
