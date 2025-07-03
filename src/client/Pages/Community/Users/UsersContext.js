import React, { createContext, useContext, useState } from "react";

const initialData = {
	users: [],
	setUsers: () =>
	{},
	itemsCount: 0,
	setItemsCount: () =>
	{},
	currentPage: 0,
	setCurrentPage: () =>
	{},
};

const UsersContext = createContext(initialData);

export const useUsersContext = () => useContext(UsersContext);

const UsersContextProvider = ({ children }) =>
{
	const [users, setUsers] = useState([]);
	const [itemsCount, setItemsCount] = useState(0);
	const [currentPage, setCurrentPage] = useState(0);

	return (
		<UsersContext.Provider
			value={{
				users,
				setUsers,
				itemsCount,
				setItemsCount,
				currentPage,
				setCurrentPage,
			}}
		>
			{children}
		</UsersContext.Provider>
	);
};

export default UsersContextProvider;
