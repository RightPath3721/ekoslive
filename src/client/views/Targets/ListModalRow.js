import React, { useState } from "react";
import { isEmpty } from "lodash";
import Box from "@mui/material/Box";
import Checkbox from "@mui/material/Checkbox";
import Typography from "@mui/material/Typography";

const ListModalRow = ({ target, list, listName, objectName, addToList }) =>
{
	const initialCheckedStatus =
		list.payload?.findIndex((name) => name === objectName) > -1;
	const [checkedStatus, setCheckedStatus] = useState(initialCheckedStatus);

	if (!isEmpty(listName) && listName !== "Favorites")
		return (
			<Box
				sx={{
					display: "flex",
					justifyContent: "flex-start",
					alignItems: "center",
					flexDirection: "row",
					padding: "5px 10px",
					gap: "10px",
					width: "100%",
				}}
			>
				<Checkbox
					checked={checkedStatus}
					onChange={() =>
					{
						addToList(listName, target);
						setCheckedStatus((prevStatus) => !prevStatus);
					}}
					style={{ color: "white", padding: 0 }}
				/>
				<Typography sx={{ color: "white" }}>{listName}</Typography>
			</Box>
		);
	else return null;
};

export default ListModalRow;
