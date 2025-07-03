import React, { useCallback, useEffect, useState } from "react";
import { captureException } from "@sentry/browser";
import axios from "axios";
import pickBy from "lodash/pickBy";
import identity from "lodash/identity";
import Box from "@mui/material/Box";
import Filters from "@components/Filters/Filters";
import useUsers from "@hooks/admin/useUsers";
import ToggleViewButtons from "@components/ToggleViewButtons";
import useActiveUser from "@hooks/useActiveUser";
import { useFollowersContext } from "./FollowersContext";

const TopBar = ({ toggleView, view }) =>
{
	const user = useActiveUser();
	const [filtersData, setFiltersData] = useState([]);
	const { setFollowers, currentPage, setCurrentPage, setItemsCount } =
		useFollowersContext();
	const { getFilteredUsersProfiles } = useUsers();

	useEffect(() =>
	{
		if (!user) return;

		(async () =>
		{
			try
			{
				const { data } = await axios.get("/api/equipments/filters/social", {
					params: { username: user.username, token: user.token },
				});
				setFiltersData(data);
			}
			catch (error)
			{
				captureException(error);
			}
		})();
	}, [user]);

	const fetchUsers = useCallback(
		async (filters) =>
		{
			const { data, count } = await getFilteredUsersProfiles({
				...pickBy(filters, identity),
				page: currentPage,
				sort_by: "social_nickname",
			});
			setItemsCount(count);
			setFollowers((prevData) =>
				currentPage === 0 ? data : unionBy(prevData, data, "_id"),
			);
		},
		[setFollowers, setItemsCount, getFilteredUsersProfiles, currentPage],
	);

	return (
		<Box
			sx={{
				width: "100%",
				display: "grid",
				gridTemplateColumns: "minmax(120px, 341px) auto",
				justifyContent: "flex-end",
				alignItems: "center",
				gap: "1.75rem",
				padding: "1.125rem 1.5rem 0 0",
			}}
		>
			<Filters
				fetchData={fetchUsers}
				filtersData={filtersData}
				page={currentPage}
				setPage={setCurrentPage}
			/>
			<ToggleViewButtons toggleView={toggleView} view={view} />
		</Box>
	);
};

export default TopBar;
