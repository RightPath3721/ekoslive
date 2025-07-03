import React, { createContext, useContext, useState } from "react";

const SocialStreamContextInitialValue = {
	posts: [],
	setPosts: () =>
	{},
	editId: null,
	setEditId: () =>
	{},
	tabValue: null,
	setTabValue: () => 
	{}
};

const SocialStreamContext = createContext(SocialStreamContextInitialValue);

export const useSocialStreamContext = () => useContext(SocialStreamContext);

const SocialStreamContextProvider = ({ children }) =>
{
	const [posts, setPosts] = useState([]);
	const [editId, setEditId] = useState(null);
	const [tabValue, setTabValue] = useState(0);

	return (
		<SocialStreamContext.Provider
			value={{ editId, posts, setEditId, setPosts, tabValue, setTabValue }}
		>
			{children}
		</SocialStreamContext.Provider>
	);
};

export default SocialStreamContextProvider;
