import React, { createContext, useContext, useState } from "react";

const initialData = {
	followers: [],
	setFollowers: () =>
	{},
	itemsCount: 0,
	setItemsCount: () =>
	{},
	currentPage: 0,
	setCurrentPage: () =>
	{},
};

const FollowersContext = createContext(initialData);

export const useFollowersContext = () => useContext(FollowersContext);

const FollowersProvider = ({ children }) =>
{
	const [followers, setFollowers] = useState([]);
	const [itemsCount, setItemsCount] = useState(0);
	const [currentPage, setCurrentPage] = useState(0);

	return (
		<FollowersContext.Provider
			value={{
				followers,
				setFollowers,
				itemsCount,
				setItemsCount,
				currentPage,
				setCurrentPage,
			}}
		>
			{children}
		</FollowersContext.Provider>
	);
};

export default FollowersProvider;
