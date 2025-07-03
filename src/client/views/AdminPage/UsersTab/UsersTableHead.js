import React from "react";
import dayjs from "dayjs";
import axios from "axios";
import { captureException } from "@sentry/browser";
import TableHead from "../TableHead";

const logoutUser = async (username, user) =>
{
	if (!user) return;
	
	try
	{
		await axios.post(
			`/api/admin/users/logout?username=${encodeURIComponent(user.username)}&token=${user.token}`,
			{ username },
		);
	}
	catch (error)
	{
		captureException(error);
	}
};

export const headCells = [
	{
		id: "username",
		title: "username",
		path: "username",
		minWidth: "150px",
	},
	{
		id: "email",
		title: "email",
		path: "email",
		minWidth: "200px",
	},
	{
		id: "promptsLeft",
		title: "Prompts left",
		path: "promptsLeft",
		minWidth: "36px",
	},
	{
		id: "promptCount",
		title: "Request Prompts",
		path: "promptCount",
		minWidth: "36px",
	},
	{
		id: "executedPromptCount",
		title: "Executed Prompts",
		path: "executedPromptCount",
		minWidth: "36px",
	},
	{
		id: "lastLogged",
		title: "last logged",
		path: "lastLogged",
		minWidth: "120px",
		format: (value) => dayjs(value).format("YYYY-MM-DD HH:mm"),
	},
	{
		id: "machine_id",
		title: "machine id",
		path: "machine_id",
		minWidth: "80px",
	},
	{
		id: "role",
		title: "Role",
		path: "role",
		minWidth: "80px",
	},
	{
		id: "plan_id",
		title: "Plan",
		path: "plan_id",
		minWidth: "20px",
	},
	{
		id: "logout",
		title: "Logout",
		minWidth: "40px",
		action: logoutUser,
	},
];

const UsersTableHead = (props) =>
{
	return <TableHead headCells={headCells} {...props} />;
};

export default UsersTableHead;
