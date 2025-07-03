import React, { forwardRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import Grid from "@mui/material/Grid";
import Avatar from "@mui/material/Avatar";
import Typography from "@mui/material/Typography";
import { useTheme, Box } from "@mui/material";
import { styles } from "@client/shared/styles";
import truncateUsername from "@utils/truncateUsername";

const breadcrumbs = (username) =>
{
	return [
		{
			name: "Community",
			link: "/community",
		},
		{
			name: "Users",
			link: "/community/users",
		},
		{
			name: username,
			link: "/community/users",
		},
	];
};

const UserGridCard = forwardRef(({ item, ...props }, ref) =>
{
	const { palette } = useTheme();
	const navigate = useNavigate();

	const handleClick = useCallback(
		() =>
			navigate(`/community/${item.social_nickname?.replace(/@/i, "")}`, {
				state: breadcrumbs(item.social_nickname?.replace(/@/i, "")),
			}),
		[navigate],
	);

	return (
		<Grid
			sx={{
				display: "grid",
				placeItems: "center",
			}}
			item
			{...props}
			ref={ref}
		>
			<Box
				sx={{
					...styles.center,
					flexDirection: "column",
					gap: { xxs: ".75rem", sm: "1.25rem" },
					width: "fit-content",
					height: "fit-content",
					padding: "1rem",
					cursor: "pointer",
					borderStyle: "solid",
					borderWidth: "1px",
					borderColor: "transparent",
					borderRadius: ".5rem",
					":hover": {
						borderColor: `${palette.grey.main}20`,
					},
				}}
				onClick={handleClick}
				role="link"
			>
				<Avatar
					sx={{
						width: { xxs: 80, sm: 124, lg: 140 },
						height: { xxs: 80, sm: 124, lg: 140 },
						borderRadius: "50%",
					}}
					src={item.avatar || "/public/profile_default_image.webp"}
					alt={item.social_nickname}
				/>
				<Typography
					sx={{ flexDirection: "column", gap: ".25rem", alignItems: "center" }}
					display="inline-flex"
				>
					<Typography
						variant="body1"
						fontWeight={500}
						lineHeight={1.1}
						component="span"
						sx={{
							fontSize: { xxs: ".75rem", sm: "1rem", lg: "1.25rem" },
						}}
					>
						{truncateUsername(item.full_name)}
					</Typography>
					<Typography
						sx={{ color: palette.grey.main }}
						variant="body1"
						component="span"
					>
						{truncateUsername(item.social_nickname)}
					</Typography>
				</Typography>
			</Box>
		</Grid>
	);
});

export default UserGridCard;
