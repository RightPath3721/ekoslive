import React, { useEffect, useState } from "react";
import ListView from "@components/ListView";
import useProfile from "@hooks/community/useProfile";
import { useProfileContext } from "../Profile/ProfileContext";

const UsersList = ({ view }) =>
{
	const [following, setFollowing] = useState([]);
	const [count, setCount] = useState(0);
	const { profile, currentUserProfile } = useProfileContext();
	const { getUserFollowing } = useProfile();

	useEffect(() =>
	{
		if (!profile) return;

		(async () =>
		{
			const { data, count } = await getUserFollowing(
				profile?._id ?? currentUserProfile?._id,
				{
					page: 0,
					limit: 10,
				},
			);
			setFollowing(data);
			setCount(count);
		})();
	}, [profile, currentUserProfile]);

	return (
		<ListView
			data={following}
			itemsRemaining={count - 10 * (0 + 1)}
			setPage={0}
			view={view}
			columns={view === "grid" ? 5 : 2}
		/>
	);
};

export default UsersList;
