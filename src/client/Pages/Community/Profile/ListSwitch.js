import React from "react";
import TabsView from "@components/TabsView";

export const Lists = {
	POSTS: 0,
	IMAGES: 1,
	ACHIEVEMENTS: 2,
};

const ListSwitch = ({ value, setValue, isOwner, profile }) =>
{
	const handleValueChange = (_, value) =>
	{
		if (value !== null)
		{
			setValue(value);
		}
	};

	return (
		<TabsView
			tabValue={value}
			handleChange={handleValueChange}
			tabs={[
				{
					value: Lists.POSTS,
					label: isOwner ? "My Posts" : "Posts",
					id: "profile_posts",
				},
				...(isOwner && profile
					? [
							{
								value: Lists.IMAGES,
								label: isOwner ? "My Images" : "Images",
								id: "profile_image",
							},
						]
					: []),
				...(profile
					? [
							{
								value: Lists.ACHIEVEMENTS,
								label: isOwner ? "My Achievements" : "Achievements",
								id: "profile_achievements",
							},
						]
					: []),
			]}
			isScrollable={false}
		/>
	);
};

export default ListSwitch;
