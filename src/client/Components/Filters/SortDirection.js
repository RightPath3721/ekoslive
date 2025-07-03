import React from "react";
import IconButton from "@mui/material/IconButton";
import SortArrowDown from "@client/icons/SortArrowDown";
import SortArrowUp from "@client/icons/SortArrowUp";
import { Palette } from "@common/shared/common/styles";

const SortDirection = ({ direction, setDirection }) =>
{
	return (
		<IconButton
			id="search_sort"
			onClick={() => setDirection(direction === "asc" ? "desc" : "asc")}
			sx={{
				padding: ".5rem",
				backgroundColor: "#3C3B3B3B",
				borderRadius: "50%",
				color: "#CECECE",
				":hover": {
					color: Palette.orange,
				},
			}}
		>
			{direction === "asc" ? (
				<SortArrowUp width={20} height={20} color="currentColor" />
			) : (
				<SortArrowDown width={20} height={20} color="currentColor" />
			)}
		</IconButton>
	);
};

export default SortDirection;
