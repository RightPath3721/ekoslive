import React from "react";
import Grid from "@mui/material/Grid";
import TabLoader from "@components/TabLoader";
import GridViewItem from "./GridViewItem";
import ListViewItem from "./ListViewItem";
import UserGridCard from "./UserGridCard";
import UserListCard from "./UserListCard";
import useScrollPagination from "@hooks/useScrollPagination";

const ListView = ({
	data,
	itemsRemaining,
	setPage,
	columns = 4,
	view,
	prependChilren = null,
	containerStylesOverrides = {},
	...props
}) =>
{
	const { isLoading, observeRef } = useScrollPagination({
		setPage,
		itemsRemaining,
	});

	return (
		<Grid
			container
			sx={{
				display: "grid",
				gridTemplateColumns: `repeat(${columns ?? 4}, 1fr)`,
				padding: {
					xxs: ".75rem",
					xs: "1rem",
					sm: "1.5rem",
					md: "2rem",
				},
				gap: { xxs: "1rem", sm: "1.25rem", md: "1.5rem" },
				...containerStylesOverrides,
			}}
		>
			{prependChilren}
			{data.map((item, idx) =>
			{
				const isUser = !!item.social_nickname;
				const Component =
					view === "grid"
						? isUser
							? UserGridCard
							: GridViewItem
						: isUser
							? UserListCard
							: ListViewItem;
				return (
					<Component
						key={item?._id ?? idx}
						ref={idx === data.length - 1 ? observeRef : null}
						item={item}
						{...props}
					/>
				);
			})}
			{isLoading && (
				<Grid item>
					<TabLoader />
				</Grid>
			)}
		</Grid>
	);
};

export default ListView;
