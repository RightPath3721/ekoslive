import React, { createContext, useContext, useEffect, useState } from "react";
import useProfile from "@hooks/community/useProfile";

const initValue = {
	profile: null,
	setProfile: () =>
	{},
};

const CurrentProfileContext = createContext(initValue);

export const useCurrentProfileContext = () => useContext(CurrentProfileContext);

const CurrentProfileContextProvider = ({ children }) =>
{
	const [profile, setProfile] = useState(null);
	const { getCurrentUserProfile } = useProfile();

	useEffect(() =>
	{
		(async () =>
		{
			const socialProfile = await getCurrentUserProfile();
			setProfile(socialProfile);
		})();
	}, [getCurrentUserProfile]);

	return (
		<CurrentProfileContext.Provider value={{ profile, setProfile }}>
			{children}
		</CurrentProfileContext.Provider>
	);
};

export default CurrentProfileContextProvider;
