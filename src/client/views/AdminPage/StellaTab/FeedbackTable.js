import React, { useState, useEffect } from "react";
import axios from "axios";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableContainer from "@mui/material/TableContainer";
import TablePagination from "@mui/material/TablePagination";
import Paper from "@mui/material/Paper";
import { styles } from "../../../shared/styles";
import FeedbackMessage from "./FeedbackMessage";
import useActiveUser from "../../../hooks/useActiveUser";
import FeedbackTableHead from "./FeedbackTableHead";
import SearchInput from "../SearchInput";
import { Palette } from "@common/shared/common/styles";

const getFeedback = async ({ user, ...params }) =>
{
	const filterParams = new URLSearchParams(params);
	const { data } = await axios.get(
		`/api/stella/feedback?username=${encodeURIComponent(user.username)}&token=${user.token}&${filterParams.toString()}`,
	);
	if (!data.result) return null;
	return { feedback: data.feedback, count: data.count };
};

const FeedbackTable = () =>
{
	const [orderBy, setOrderBy] = useState("createdAt");
	const [usernameFilter, setUsernameFilter] = useState("");
	const [sortDirection, setSortDirection] = useState("desc");
	const [page, setPage] = useState(0);
	const [feedback, setFeedback] = useState([]);
	const [quantity, setQuantity] = useState(0);
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
				const usersFeedback = await getFeedback({
					user,
					page,
					orderBy,
					search: usernameFilter,
					sortDirection,
				});
				if (!usersFeedback) return;
				setFeedback(usersFeedback.feedback);
				setQuantity(usersFeedback.count);
			}
			catch (error)
			{
				console.log(error);
			}
		})();
	}, [page, orderBy, usernameFilter, sortDirection]);

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
			<SearchInput
				action={setUsernameFilter}
				placeholder="search by username"
			/>
			<TableContainer sx={{ marginTop: "12px" }}>
				<Table
					sx={[styles.horizontalScrollBar, { minWidth: 750 }]}
					aria-label="reviews table"
					size="medium"
				>
					<FeedbackTableHead
						orderBy={orderBy}
						onRequestSort={handleRequestSort}
						sortDirection={sortDirection}
					/>
					<TableBody>
						{feedback.map((feedback) => (
							<FeedbackMessage feedback={feedback} key={feedback._id} />
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

export default FeedbackTable;
