import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { captureException } from "@sentry/browser";
import Box from "@mui/material/Box";
import IconButton from "@mui/material/IconButton";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableContainer from "@mui/material/TableContainer";
import TablePagination from "@mui/material/TablePagination";
import Paper from "@mui/material/Paper";
import Checkbox from "@mui/material/Checkbox";
import RefreshIcon from "@mui/icons-material/Refresh";
import { styles } from "../../../shared/styles";
import useActiveUser from "../../../hooks/useActiveUser";
import UsersTableHead from "./UsersTableHead";
import UserRow from "./UserRow";
import SearchInput from "../SearchInput";
import { useAdminContext } from "../AdminTabContext";
import ConnectedUsersCounter from "./ConnectedUsersCounter";
import { Palette } from "@common/shared/common/styles";

const getUsers = async ({ user, ...params }) =>
{
	if (!user) return null;
	
	const filterParams = new URLSearchParams(params);
	const { data } = await axios.get(
		`/api/admin/users?username=${encodeURIComponent(user.username)}&token=${user.token}&${filterParams.toString()}`,
	);
	if (!data.result) return null;
	return { users: data.users, count: data.count };
};

const UsersTable = ({ changeTab }) =>
{
	const [orderBy, setOrderBy] = useState("lastLogged");
	const { usernameFilter, setUsernameFilter } = useAdminContext();
	const [sortDirection, setSortDirection] = useState("desc");
	const [page, setPage] = useState(0);
	const [users, setUsers] = useState([]);
	const [quantity, setQuantity] = useState(0);
	const [connected, setConnected] = useState();
	const user = useActiveUser();

	const handleRequestSort = (_, property) =>
	{
		const isDirectionChange = property === orderBy;
		if (isDirectionChange)
		{
			setSortDirection(sortDirection === "desc" ? "asc" : "desc");
		}
		else
		{
			setSortDirection("desc");
			setOrderBy(property);
		}
	};

	useEffect(() =>
	{
		(async () =>
		{
			try
			{
				const usersData = await getUsers({
					user,
					page,
					orderBy,
					search: usernameFilter,
					sortDirection,
					connected,
				});
				if (!usersData) return;
				setUsers(usersData.users);
				setQuantity(usersData.count ?? 0);
			}
			catch (error)
			{
				captureException(error);
			}
		})();
	}, [page, orderBy, usernameFilter, sortDirection, connected]);

	const refresh = async () =>
	{
		try
		{
			const usersData = await getUsers({
				user,
				page,
				orderBy,
				search: usernameFilter,
				sortDirection,
			});
			if (!usersData) return;
			setUsers(usersData.users);
			setQuantity(usersData.count ?? 0);
		}
		catch (error)
		{
			captureException(error);
		}
	};

	const handleChangeTab = useCallback(
		(value) =>
		{
			setUsernameFilter(value);
			changeTab(null, 2);
		},
		[setUsernameFilter, changeTab],
	);

	const handleSearchChange = useCallback(
		(value) =>
		{
			setPage(0);
			setUsernameFilter(value);
		},
		[setUsernameFilter, setPage],
	);

	return (
		<Paper
			sx={[
				styles.verticalScrollBar,
				{
					overflowY: "scroll",
					padding: "4px",
				},
			]}
		>
			<Box
				sx={[styles.center, { gap: ".75rem", justifyContent: "flex-start" }]}
			>
				<SearchInput
					action={handleSearchChange}
					placeholder="search by username or email"
				/>
				<IconButton sx={{ padding: 0 }} onClick={refresh}>
					<RefreshIcon style={{ color: "#CECECE", fontSize: 24 }} />
				</IconButton>
				<Box sx={[styles.center, { gap: ".25rem" }]}>
					<ConnectedUsersCounter />
					<Checkbox
						checked={connected ?? false}
						onChange={(e) => setConnected(e.target.checked ? true : undefined)}
						sx={{
							".css-i4bv87-MuiSvgIcon-root": {
								width: "1.875rem",
								height: "1.875rem",
							},
						}}
					/>
				</Box>
			</Box>
			<TableContainer sx={{ marginTop: "12px" }}>
				<Table
					sx={[styles.horizontalScrollBar, { minWidth: 750 }]}
					aria-label="users table"
					size="medium"
				>
					<UsersTableHead
						orderBy={orderBy}
						onRequestSort={handleRequestSort}
						sortDirection={sortDirection}
					/>
					<TableBody>
						{users.map((user) => (
							<UserRow user={user} key={user._id} changeTab={handleChangeTab} />
						))}
					</TableBody>
				</Table>
			</TableContainer>
			<TablePagination
				rowsPerPageOptions={[10]}
				component="div"
				count={quantity}
				page={page}
				onPageChange={(_, page) => setPage(page)}
				rowsPerPage={10}
				sx={{
					color: Palette.white,
					marginTop: "12px",
					overflow: "visible",
					".MuiBox-root": {
						"& .MuiSvgIcon-root": {
							color: Palette.white,
						},
					},
				}}
				slotProps={{
					select: { color: Palette.white },
				}}
			/>
		</Paper>
	);
};

export default UsersTable;
