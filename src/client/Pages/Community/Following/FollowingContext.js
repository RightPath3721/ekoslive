import React, { createContext, useContext, useState } from "react";

const initialData = {
	following: [],
	setFollowing: () =>
	{},
	itemsCount: 0,
	setItemsCount: () =>
	{},
	currentPage: 0,
	setCurrentPage: () =>
	{},
};

const FollowingContext = createContext(initialData);

export const useFollowingContext = () => useContext(FollowingContext);

const FollowingContextProvider = ({ children }) =>
{
	const [following, setFollowing] = useState([]);
	const [itemsCount, setItemsCount] = useState(0);
	const [currentPage, setCurrentPage] = useState(0);

	return (
		<FollowingContext.Provider
			value={{
				following,
				setFollowing,
				itemsCount,
				setItemsCount,
				currentPage,
				setCurrentPage,
			}}
		>
			{children}
		</FollowingContext.Provider>
	);
};

export default FollowingContextProvider;
