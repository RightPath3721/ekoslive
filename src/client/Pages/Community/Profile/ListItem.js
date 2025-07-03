import React, { forwardRef } from "react";
import Box from "@mui/material/Box";
import { useProfileContext } from "./ProfileContext";
import Post from "@components/shared/Community/Post";

const ListItem = forwardRef(({ post }, ref) =>
{
	const { currentUserProfile } = useProfileContext();

	const breadcrumbs = (postTitle) => {
		return [
			{
				name: "Community",
				link: "/community"
			},
			{
				name: "Profile",
				link: "/community/profile",
			},
			{
				name: postTitle,
				link: "/community"
			}
		]
	};

	return (
		<Box ref={ref}>
			<Post post={post} socialProfile={currentUserProfile} breadcrumbs={breadcrumbs}/>;
		</Box>
	);
});

export default ListItem;
