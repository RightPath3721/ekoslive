import React from "react";
import { Link, useParams } from "react-router-dom";
import Typography from "@mui/material/Typography";
import { useTheme, Divider, useMediaQuery } from "@mui/material";
import Box from "@mui/material/Box";
import s from "@common/shared/i18n/i18n";
import PersonIcon from "@mui/icons-material/Person";
import PersonAddIcon from "@mui/icons-material/PersonAdd";
import { styled } from "@mui/material/styles";
import { Palette } from "@common/shared/common/styles";

const CounterContainer = styled(Box)(({ theme }) => ({
	display: "flex",
	backgroundColor: Palette.grey22,
	color: "#fff",
	padding: theme.spacing(1.5, 3),
	borderRadius: theme.shape.borderRadius,
	alignItems: "center",
	justifyContent: "space-between",

	[theme.breakpoints.between("sm", "md")]: {
		padding: theme.spacing(1.2, 2.5),
		minWidth: 200,
	},

	[theme.breakpoints.down("sm")]: {
		padding: theme.spacing(1, 2),
		minWidth: 160,
	},

	maxWidth: 350,
}));

const CounterItem = styled(Box)(({ theme }) => ({
	display: "flex",
	alignItems: "center",
	cursor: "pointer",
	transition: "color 0.3s ease",
	"&:hover": {
		color: theme.palette.primary.main,
	},

	[theme.breakpoints.between("sm", "md")]: {
		paddingRight: theme.spacing(1),
	},
}));

const CountColumn = styled(Box)(({ theme }) => ({
	display: "flex",
	flexDirection: "column",
	alignItems: "center",

	[theme.breakpoints.between("sm", "md")]: {
		minWidth: 40,
	},

	[theme.breakpoints.down("sm")]: {
		minWidth: 30,
	},
}));

const StyledDivider = styled(Divider)(({ theme }) => ({
	height: 32,
	width: 1,
	backgroundColor: "rgba(255, 255, 255, 0.2)",
	margin: theme.spacing(0, 1),

	[theme.breakpoints.down("md")]: {
		display: "none",
	},
}));

const FollowersButtons = ({ profile }) =>
{
	const theme = useTheme();

	const isSmallScreen = useMediaQuery(theme.breakpoints.down("sm"));

	const { nickname } = useParams();

	return (
		<Box
			sx={{
				display: "flex",
				alignItems: "center",
				gap: 1,
				padding: "8px 12px",
				borderRadius: "8px",
				backgroundColor: "rgba(0, 0, 0, 0.03)",
				width: "fit-content",
				margin: "8px 0",
			}}
		>
			<CounterContainer>
				<CounterItem>
					<Link
						style={{
							display: "flex",
							alignItems: "center",
							textDecoration: "none",
							position: "relative",
						}}
						to={`/community/${nickname ?? "profile"}/followers`}
					>
						<CountColumn>
							<PersonIcon
								sx={{
									marginRight: isSmallScreen ? "0.5px" : "1px",
									color: "rgba(255, 255, 255, 0.5)",
									fontSize: isSmallScreen ? "16px" : "18px",
									transition: "color 0.3s ease",
									"&:hover": {
										color: "#3b82f6",
									},
								}}
							/>
							<Typography
								variant="subtitle1"
								sx={{
									fontWeight: "bold",
									fontSize: isSmallScreen ? "1rem" : "1.125rem",
								}}
							>
								{profile.followers?.length ?? 0}
							</Typography>
							<Typography
								variant="caption"
								sx={{
									color: "rgba(255, 255, 255, 0.7)",
									fontSize: isSmallScreen ? "0.7rem" : "0.75rem",
								}}
							>
								{s.social.followers}
							</Typography>
						</CountColumn>
					</Link>
				</CounterItem>

				<StyledDivider orientation="vertical" flexItem />

				<CounterItem>
					<Link
						style={{
							display: "flex",
							alignItems: "center",
							textDecoration: "none",
							position: "relative",
						}}
						to={`/community/${nickname ?? "profile"}/following`}
					>
						<CountColumn>
							<PersonAddIcon
								sx={{
									marginRight: isSmallScreen ? "0.5px" : "1px",
									color: "rgba(255, 255, 255, 0.5)",
									fontSize: isSmallScreen ? "16px" : "18px",
									transition: "color 0.3s ease",
									"&:hover": {
										color: "#3b82f6",
									},
								}}
							/>

							<Typography
								variant="subtitle1"
								sx={{
									fontWeight: "bold",
									fontSize: isSmallScreen ? "1rem" : "1.125rem",
								}}
							>
								{profile.following?.length ?? 0}
							</Typography>
							<Typography
								variant="caption"
								sx={{
									color: "rgba(255, 255, 255, 0.7)",
									fontSize: isSmallScreen ? "0.7rem" : "0.75rem",
								}}
							>
								{s.social.following}
							</Typography>
						</CountColumn>
					</Link>
				</CounterItem>
			</CounterContainer>
		</Box>
	);
};

export default FollowersButtons;
