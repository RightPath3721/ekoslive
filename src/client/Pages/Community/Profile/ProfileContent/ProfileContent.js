import React, { useCallback, useEffect, useState } from "react";
import Box from "@mui/material/Box";
import { useTheme } from "@mui/material";
import ToggleViewButtons from "@components/ToggleViewButtons";
import ListSwitch, { Lists } from "../ListSwitch";
import ContentList from "../ContentList";
import { useProfileContext } from "../ProfileContext";
import NotFound from "../NotFound";
import TabLoader from "@components/TabLoader";

const ProfileContent = () =>
{
	const { palette } = useTheme();
	const { profile, currentUserProfile, isLoading } = useProfileContext();
	const [listView, setListView] = useState("grid");
	const [list, setList] = useState(Lists.POSTS);

	const toggleListView = useCallback(
		() => setListView((view) => (view === "grid" ? "list" : "grid")),
		[setListView],
	);

	useEffect(() =>
	{
		setListView("grid");
		setList(Lists.POSTS);
	}, [profile]);

	if (isLoading) return <TabLoader />;

	return profile ? (
		<Box
			sx={{
				padding: { xxs: ".75rem 1rem", xs: "1rem 1.125rem" },
				backgroundColor: palette.black[900],
			}}
		>
			<Box
				sx={{
					width: "100%",
					display: "flex",
					alignItems: "center",
					justifyContent: "space-between",
				}}
			>
				<ListSwitch
					value={list}
					setValue={setList}
					isOwner={
						currentUserProfile && profile?._id === currentUserProfile?._id
					}
					profile={profile}
				/>
				<ToggleViewButtons toggleView={toggleListView} view={listView} />
			</Box>
			<ContentList list={list} listView={listView} />
		</Box>
	) : (
		<NotFound />
	);
};

export default ProfileContent;
