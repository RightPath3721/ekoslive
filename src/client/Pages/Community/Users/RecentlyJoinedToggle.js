import React, { useCallback } from "react";
import Stack from "@mui/material/Stack";
import TabsView from "@components/TabsView";

export const values = {
	ALL: 0,
	RECENTLY_JOINED: 1,
};

const RecentlyJoinedToggle = ({ value, setValue }) =>
{
	const handleValueChange = useCallback(
		(_, value) =>
		{
			if (value !== null)
			{
				setValue(value);
			}
		},
		[setValue],
	);

	return (
		<Stack direction="row" spacing={4}>
			<TabsView
				tabValue={value}
				handleChange={handleValueChange}
				tabs={[
					{ value: values.ALL, label: "All", id: "users_all" },
					{
						value: values.RECENTLY_JOINED,
						label: "Recently joined",
						id: "users_recent",
					},
				]}
			/>
		</Stack>
	);
};

export default RecentlyJoinedToggle;
