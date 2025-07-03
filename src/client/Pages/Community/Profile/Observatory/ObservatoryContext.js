import React, { createContext, useContext, useState } from "react";

const ObservatoryContext = createContext({
	observatoryId: null,
	setObservatoryId: () =>
	{},
});

export const useActiveObservatory = () => useContext(ObservatoryContext);

const ObservatoryProvider = ({ children }) =>
{
	const [observatoryId, setObservatoryId] = useState(null);

	return (
		<ObservatoryContext.Provider
			value={{
				observatoryId,
				setObservatoryId,
			}}
		>
			{children}
		</ObservatoryContext.Provider>
	);
};

export default ObservatoryProvider;
