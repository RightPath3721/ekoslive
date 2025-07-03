import React, { useEffect, useState } from "react";
import ListView from "@components/ListView";
import useProfile from "@hooks/community/useProfile";
import { useProfileContext } from "../Profile/ProfileContext";

const UsersList = ({ view }) =>
{
	const [followers, setFollowers] = useState([]);
	const [count, setCount] = useState(0);
	const { profile, currentUserProfile } = useProfileContext();
	const { getUserFollowers } = useProfile();
	
	useEffect(() =>
	{
		if (!profile) return;

		(async () =>
		{
			const { data, count } = await getUserFollowers(profile?._id ?? currentUserProfile?._id, {
				page: 0,
				limit: 10,
			});
			setFollowers(data);
			setCount(count);
		})();
	}, [profile, currentUserProfile]);

	return (
		<ListView
			data={followers}
			itemsRemaining={count - 10 * (0 + 1)}
			setPage={0}
			view={view}
			columns={view === "grid" ? 5 : 2}
		/>
	);
};

export default UsersList;
