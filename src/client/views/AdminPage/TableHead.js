import React from "react";
import Box from "@mui/material/Box";
import TableCell from "@mui/material/TableCell";
import TableRow from "@mui/material/TableRow";
import TableSortLabel from "@mui/material/TableSortLabel";
import MuiTableHead from "@mui/material/TableHead";
import { visuallyHidden } from "@mui/utils";
import { Palette } from "@common/shared/common/styles";

const TableHead = ({ orderBy, onRequestSort, sortDirection, headCells }) =>
{
	const createSortHandler = (property) => (event) =>
	{
		onRequestSort(event, property);
	};

	return (
		<MuiTableHead>
			<TableRow>
				{headCells.map((headCell) => (
					<TableCell
						key={headCell.id}
						align="right"
						padding="none"
						sortDirection={orderBy === headCell.id ? "desc" : false}
						style={{ minWidth: headCell.minWidth }}
						sx={{
							padding: "8px",
							whiteSpace: "nowrap",
							border: "1px solid #FFFCFA1F",
							color: Palette.white,
							width: "100px",
						}}
						variant="head"
					>
						<TableSortLabel
							active={orderBy === headCell.id}
							direction={sortDirection}
							onClick={createSortHandler(headCell.id)}
							sx={{
								color: Palette.white,
								"&.Mui-active": { color: Palette.white },
								"&.MuiButtonBase-root.MuiTableSortLabel-root.Mui-active .MuiTableSortLabel-icon":
									{ color: Palette.white },
							}}
						>
							{headCell.title}
							{orderBy === headCell.id ? (
								<Box component="span" sx={visuallyHidden}>
									sorted descending
								</Box>
							) : null}
						</TableSortLabel>
					</TableCell>
				))}
			</TableRow>
		</MuiTableHead>
	);
};

export default TableHead;
