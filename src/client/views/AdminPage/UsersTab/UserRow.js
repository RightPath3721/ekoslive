import React from "react";
import { get } from "lodash";
import TableRow from "@mui/material/TableRow";
import TableCell from "@mui/material/TableCell";
import Logout from "@mui/icons-material/Logout";
import useActiveUser from "../../../hooks/useActiveUser";
import { headCells } from "./UsersTableHead";
import { Palette } from "@common/shared/common/styles";

const icons = {
	logout: <Logout style={{ color: "#CECECE", fontSize: 24 }} />,
};

const filters = ["machine_id", "username", "email"];

const UserRow = ({ user, changeTab }) =>
{
	const activeUser = useActiveUser();

	return (
		<TableRow
			sx={{ background: user.connected ? Palette.darkGreen : Palette.red }}
			role="cell"
			tabIndex={-1}
		>
			{headCells.map((header, idx) =>
			{
				let value = get(user, header.path, "");
				if (typeof value === "boolean") value = value.toString();

				return (
					<TableCell
						sx={{
							padding: "8px",
							border: "1px solid #FFFCFA1F",
							color: Palette.white,
							cursor:
								header.action || filters.includes(header.id)
									? "pointer"
									: "default",
						}}
						key={idx}
						align="right"
						onClick={
							header.action
								? () => header.action(user.username, activeUser)
								: filters.includes(header.id)
									? () => changeTab(value)
									: undefined
						}
					>
						{icons[header.id]
							? icons[header.id]
							: value
								? header.format
									? header.format(value)
									: value
								: "N/A"}
					</TableCell>
				);
			})}
		</TableRow>
	);
};

export default UserRow;
