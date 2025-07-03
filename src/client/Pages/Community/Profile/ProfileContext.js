import React, {
	createContext,
	useContext,
	useState,
	useEffect,
	useCallback,
} from "react";
import { useParams } from "react-router-dom";
import useProfile from "@hooks/community/useProfile";

const initialData = {
	profile: null,
	setProfile: () =>
	{},
	setCurrentUserProfile: () =>
	{},
	currentUserProfile: null,
	refreshUserProfile: () =>
	{},
	isLoading: true,
};

const ProfileContext = createContext(initialData);

export const useProfileContext = () => useContext(ProfileContext);

const ProfileContextProvider = ({ children }) =>
{
	const params = useParams();
	const { getProfileByNickname, getCurrentUserProfile } = useProfile();
	const [currentUserProfile, setCurrentUserProfile] = useState(null);
	const [profile, setProfile] = useState(null);
	const [isLoading, setIsLoading] = useState(true);

	useEffect(() =>
	{
		setIsLoading(true);
		refreshUserProfile();
	}, [params, setProfile]);

	const refreshUserProfile = useCallback(async () =>
	{
		(async () =>
		{
			const userProfile = await getCurrentUserProfile();
			setCurrentUserProfile(userProfile);

			const { nickname } = params;
			if (nickname && nickname !== "profile")
			{
				const socialProfile = await getProfileByNickname(nickname);
				if (socialProfile)
				{
					setProfile(socialProfile);
				}
				else
				{
					setProfile(null);
				}
			}
			else
			{
				setProfile(userProfile);
			}

			setIsLoading(false);
		})();
	}, [params, setProfile, getCurrentUserProfile]);

	return (
		<ProfileContext.Provider
			value={{
				profile,
				setProfile,
				currentUserProfile,
				setCurrentUserProfile,
				refreshUserProfile,
				isLoading,
			}}
		>
			{children}
		</ProfileContext.Provider>
	);
};

export default ProfileContextProvider;
