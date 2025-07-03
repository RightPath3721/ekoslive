import React from "react";
import { useMediaQuery } from "react-responsive";
import ListView from "@components/ListView";
import { useUsersContext } from "./UsersContext";

const getGreedColumnsCount = (large, medium, xl) =>
{
	return xl ? 5 : large ? 4 : medium ? 3 : 2;
};

const getListColumnsCount = (medium) =>
{
	return medium ? 2 : 1;
};

const UsersList = ({ view }) =>
{
	const { users, itemsCount, setCurrentPage, currentPage } = useUsersContext();
	const isXlScreen = useMediaQuery({ query: "(min-width: 1280px)" });
	const isLargeScreen = useMediaQuery({ query: "(min-width: 1024px)" });
	const isMediumScreen = useMediaQuery({ query: "(min-width: 640px)" });

	return (
		<ListView
			data={users}
			itemsRemaining={itemsCount - 10 * (currentPage + 1)}
			setPage={setCurrentPage}
			view={view}
			columns={
				view === "grid"
					? getGreedColumnsCount(isLargeScreen, isMediumScreen, isXlScreen)
					: getListColumnsCount(isMediumScreen)
			}
		/>
	);
};

export default UsersList;
