import React, { createContext, useContext, useState } from "react";

const SocialWizardContext = createContext({
	profile: null,
	observatory: null,
	survey: {},
	setProfile: () =>
	{},
	setObservatory: () =>
	{},
	setSurvey: () =>
	{},
});

export const useSocialWizardContext = () => useContext(SocialWizardContext);

const SocialWizardContextProvider = ({ children }) =>
{
	const [profile, setProfile] = useState(null);
	const [observatory, setObservatory] = useState(null);
	const [survey, setSurvey] = useState({});

	return (
		<SocialWizardContext.Provider
			value={{
				observatory,
				profile,
				survey,
				setObservatory,
				setProfile,
				setSurvey,
			}}
		>
			{children}
		</SocialWizardContext.Provider>
	);
};

export default SocialWizardContextProvider;
