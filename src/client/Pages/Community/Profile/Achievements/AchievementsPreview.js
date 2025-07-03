import React, { Suspense, useEffect, useState } from "react";
import { captureException } from "@sentry/browser";
import Grid from "@mui/material/Grid";
import useActiveUser from "@hooks/useActiveUser";
import { ekosliveServer } from "@client/config";
import TabLoader from "@components/TabLoader";
import { useSelector } from "react-redux";
import { Sync } from "@indi/enums";
import { get } from "lodash";

const AchievementPreview = React.lazy(
	() => import("@components/AchievementPreview"),
);

const AchievementsPreview = () =>
{
	const user = useActiveUser();
	const achievementsData = useSelector((state) => state.achievements);
	const [achievements, setAchievements] = useState([]);

	const getAchievements = async () =>
	{
		if (!user) return;
		const url = `/api/sync?username=${encodeURIComponent(user.username)}&token=${user.token}`;
		try
		{
			const response = await ekosliveServer.post(url, {
				type: Sync.ACHIEVEMENT,
				data: Object.values(achievementsData).filter(
					(item) => item.status === true,
				),
			});
			return get(response.data, "payload", []);
		}
		catch (error)
		{
			captureException(error);
			return [];
		}
	};

	useEffect(() =>
	{
		(async () =>
		{
			const fetchedAchievements = await getAchievements();
			setAchievements(fetchedAchievements);
		})();
	}, [user]);

	return (
		<Grid
			container
			sx={{
				display: "flex",
				alignItems: "center",
				justifyContent: "center",
				gap: { xxs: ".5rem", sm: ".25rem" },
			}}
		>
			{achievements?.slice?.(-3)?.map((achievement) => (
				<Grid item key={achievement._id}>
					<Suspense fallback={<TabLoader />}>
						<AchievementPreview achievement={achievement} />
					</Suspense>
				</Grid>
			))}
		</Grid>
	);
};

export default AchievementsPreview;
