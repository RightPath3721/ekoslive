import React, { createContext, useContext, useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import useProfile from "@hooks/community/useProfile";
import NotFound from "./NotFound";

const initialData = {
	userProfile: null,
	setUserProfile: () =>
	{},
};

const SocialProfileContext = createContext(initialData);

export const useSocialProfile = () => useContext(SocialProfileContext);

const SocialProfileContextProvider = ({ children, setLoading }) =>
{
	const [socialProfile, setSocialProfile] = useState(null);
	const { getProfileByNickname, getCurrentUserProfile } = useProfile();
	const { nickname } = useParams();

	useEffect(() =>
	{
		(async () =>
		{
			const socialProfile =
				nickname === "profile"
					? await getCurrentUserProfile()
					: await getProfileByNickname(nickname);
			if (socialProfile)
			{
				setSocialProfile(socialProfile);
				setLoading(false);
			}
			else
			{
				setSocialProfile(null);
				setLoading(false);
			}
		})();
	}, [nickname]);

	return (
		<SocialProfileContext.Provider
			value={{
				userProfile: socialProfile,
				setUserProfile: setSocialProfile,
			}}
		>
			{socialProfile ? children : <NotFound />}
		</SocialProfileContext.Provider>
	);
};

export default SocialProfileContextProvider;
