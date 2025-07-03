import React, { useCallback, useEffect, useState, useMemo } from "react";
import { captureException } from "@sentry/browser";
import dayjs from "dayjs";
import axios from "axios";
import pickBy from "lodash/pickBy";
import identity from "lodash/identity";
import unionBy from "lodash/unionBy";
import Box from "@mui/material/Box";
import { useTheme } from "@mui/material";
import Filters from "@components/Filters/Filters";
import { useUsersContext } from "./UsersContext";
import useUsers from "@hooks/admin/useUsers";
import ToggleViewButtons from "@components/ToggleViewButtons";
import RecentlyJoinedToggle, { values } from "./RecentlyJoinedToggle";
import useActiveUser from "@hooks/useActiveUser";

const TopBar = ({ toggleView, view }) =>
{
	const { breakpoints } = useTheme();
	const user = useActiveUser();
	const [filtersData, setFiltersData] = useState([]);
	const [value, setValue] = useState(values.ALL);
	const [sortDirection, setSortDirection] = useState("asc");
	const { setUsers, setItemsCount, currentPage, setCurrentPage } =
		useUsersContext();
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
			});
			setItemsCount(count);
			setUsers((prevData) =>
				currentPage === 0 ? data : unionBy(prevData, data, "_id"),
			);
		},
		[setUsers, setItemsCount, getFilteredUsersProfiles, currentPage, value],
	);

	return (
		<Box
			sx={{
				display: "flex",
				alignItems: "center",
				justifyContent: "space-between",
				padding: { xs: "1rem", sm: "1.5rem", md: "2rem" },
				[breakpoints.down("xs")]: {
					flexDirection: "column",
					gap: "1rem",
					marginTop: ".75rem",
				},
			}}
		>
			<RecentlyJoinedToggle value={value} setValue={setValue} />
			<Box
				sx={{
					display: "flex",
					alignItems: "center",
					justifyContent: "space-between",
					gap: "1.725rem",
				}}
			>
				<Filters
					fetchData={fetchUsers}
					filtersData={filtersData}
					page={currentPage}
					setPage={setCurrentPage}
					resetPageOnSortChange
					setSortDirection={setSortDirection}
					{...(value === values.RECENTLY_JOINED
						? { createdAt: dayjs().subtract(1, "month").toISOString() }
						: {})}
				/>
				<ToggleViewButtons toggleView={toggleView} view={view} />
			</Box>
		</Box>
	);
};

export default TopBar;
