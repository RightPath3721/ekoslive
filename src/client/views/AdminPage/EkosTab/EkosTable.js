import React, { useCallback } from "react";
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
import SearchInput from "../SearchInput";
import EkosTableHead from "./EkosTableHead";
import EkosRow from "./EkosRow";
import { useAdminContext } from "../AdminTabContext";
import useEkos from "@hooks/admin/useEkos";
import ConnectedEkosCounter from "./ConnectedEkosCount";
import { Palette } from "@common/shared/common/styles";

const EkosTable = ({ changeTab }) =>
{
	const { setUsernameFilter } = useAdminContext();
	const { updateFilters, count, ekos, filters, refreshEkos } = useEkos();

	const handleRequestSort = (_, property) =>
	{
		const isDirectionChange = property === filters.orderBy;
		if (isDirectionChange)
		{
			updateFilters({
				name: "sortDirection",
				value: filters.sortDirection === "desc" ? "asc" : "desc",
			});
		}
		else
		{
			updateFilters({ name: "sortDirection", value: "desc" });
			updateFilters({ name: "orderBy", value: property });
		}
	};

	const handleChangeTab = useCallback(
		(value) =>
		{
			setUsernameFilter(value);
			changeTab(null, 1);
		},
		[setUsernameFilter, changeTab],
	);

	const handleSearchChange = useCallback(
		(value) =>
		{
			updateFilters({ name: "page", value: 0 });
			setUsernameFilter(value);
		},
		[setUsernameFilter, updateFilters],
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
				<IconButton sx={{ padding: 0 }} onClick={refreshEkos}>
					<RefreshIcon style={{ color: "#CECECE", fontSize: 24 }} />
				</IconButton>
				<Box sx={[styles.center, { gap: ".25rem" }]}>
					<ConnectedEkosCounter />
					<Checkbox
						checked={filters.connected ?? false}
						onChange={(e) =>
							updateFilters({
								name: "connected",
								value: e.target.checked ? true : undefined,
							})
						}
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
					<EkosTableHead
						orderBy={filters.orderBy}
						onRequestSort={handleRequestSort}
						sortDirection={filters.sortDirection}
					/>
					<TableBody>
						{ekos.map((ekos) => (
							<EkosRow ekos={ekos} key={ekos._id} changeTab={handleChangeTab} />
						))}
					</TableBody>
				</Table>
			</TableContainer>
			<TablePagination
				rowsPerPageOptions={[10]}
				component="div"
				count={count}
				page={filters.page}
				onPageChange={(_, page) => updateFilters({ name: "page", value: page })}
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

export default EkosTable;
