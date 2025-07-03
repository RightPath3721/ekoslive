import React, { createContext, useContext, useState } from "react";

const ModerationContext = createContext({
	count: null,
	setCount: () =>
	{}
});

export const useModerationContext = () => useContext(ModerationContext);

const ModerationProvider = ({ children }) =>
{
	const [count, setCount] = useState([0, 0, 0, 0]);

	return (
		<ModerationContext.Provider
			value={{
				count,
				setCount
			}}
		>
			{children}
		</ModerationContext.Provider>
	);
};

export default ModerationProvider;
