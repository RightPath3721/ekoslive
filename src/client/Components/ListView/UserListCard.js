import React, { forwardRef, useCallback } from "react";
import Grid from "@mui/material/Grid";
import Avatar from "@mui/material/Avatar";
import Typography from "@mui/material/Typography";
import { useTheme, Box } from "@mui/material";
import { styles } from "@client/shared/styles";
import { useNavigate } from "react-router-dom";

const UserListCard = forwardRef(({ item, ...props }, ref) =>
{
	const { palette } = useTheme();
	const navigate = useNavigate();

	const breadcrumbs = (username) => {
		return [
			{
				name: "Community",
				link: "/community"
			},
			{
				name: "Users",
				link: "/community/users",
			},
			{
				name: username,
				link: "/community/users"
			}
		]
	};

	const handleClick = useCallback(
		() =>
			navigate(`/community/${item.social_nickname?.replace(/@/i, "")}`, {state: breadcrumbs(item.social_nickname?.replace(/@/i, ""))}),
		[navigate],
	);

	return (
		<Grid
			sx={{
				padding: 0,
			}}
			item
			{...props}
			ref={ref}
		>
			<Box
				style={{
					...styles.center,
					justifyContent: "flex-start",
					gap: "1.5rem",
					width: "100%",
					height: "100%",
					cursor: "pointer"
				}}
				onClick={handleClick}
			>
				<Avatar
					sx={{ width: 44, height: 44, borderRadius: "50%" }}
					src={item.avatar || "/public/profile_default_image.webp"}
					alt={item.social_nickname}
				/>
				<Typography
					sx={{
						flexDirection: "column",
						gap: ".25rem",
						alignItems: "flex-start",
					}}
					display="inline-flex"
				>
					<Typography
						variant="body1"
						fontWeight={500}
						lineHeight={1.1}
						fontSize="1.25rem"
						component="span"
					>
						{item.full_name}
					</Typography>
					<Typography
						sx={{ color: palette.grey.main }}
						variant="body1"
						component="span"
					>
						{item.social_nickname}
					</Typography>
				</Typography>
			</Box>
		</Grid>
	);
});

export default UserListCard;
