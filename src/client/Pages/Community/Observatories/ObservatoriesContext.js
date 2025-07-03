import React, { createContext, useContext, useState } from "react";

const initialData = {
	observatories: [],
	setObservatories: () =>
	{},
	itemsCount: 0,
	setItemsCount: () =>
	{},
	currentPage: 0,
	setCurrentPage: () =>
	{},
};

const ObservatoriesContext = createContext(initialData);

export const useObservatoriesContext = () => useContext(ObservatoriesContext);

const ObservatoriesContextProvider = ({ children }) =>
{
	const [observatories, setObservatories] = useState([]);
	const [itemsCount, setItemsCount] = useState(0);
	const [currentPage, setCurrentPage] = useState(0);

	return (
		<ObservatoriesContext.Provider
			value={{
				observatories,
				setObservatories,
				itemsCount,
				setItemsCount,
				currentPage,
				setCurrentPage,
			}}
		>
			{children}
		</ObservatoriesContext.Provider>
	);
};

export default ObservatoriesContextProvider;
