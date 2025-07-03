import React, { Suspense, useCallback, useState } from "react";
import { useSelector } from "react-redux";
import { useTheme } from "@mui/material";
import dayjs from "dayjs";
import Typography from "@mui/material/Typography";
import Grid from "@mui/material/Grid";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import CardActions from "@mui/material/CardActions";
import IconButton from "@mui/material/IconButton";
import Popover from "@mui/material/Popover";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";
import VisibilityIcon from "@mui/icons-material/Visibility";
import { achievementsConstants } from "@redux/constants";
import AchievementPreview from "@components/AchievementPreview";
import TabLoader from "@components/TabLoader";
import Messier from "./Messiers";
import achievementsInfo from "@common/shared/common/achievements";
import { styles } from "@client/shared/styles";
import { getTotalMessiers } from "@redux/selectors";
import isEqual from "lodash/isEqual";
import s from "@common/shared/i18n/i18n";

const AchievementsGridView = ({ achievements }) =>
{
	const [showMessier, setShowMessier] = useState(false);
	const [anchorEl, setAnchorEl] = useState(null);
	const [selectedAchievement, setSelectedAchievement] = useState(null);
	const { palette } = useTheme();
	const totalMessiers = useSelector(getTotalMessiers, isEqual);

	const handlePopoverOpen = (event, achievement) =>
	{
		setAnchorEl(event.currentTarget);
		setSelectedAchievement(achievement);
	};

	const handlePopoverClose = () =>
	{
		setAnchorEl(null);
		setSelectedAchievement(null);
	};

	const open = Boolean(anchorEl);

	const toggleMessierModal = useCallback(
		() => setShowMessier((p) => !p),
		[setShowMessier],
	);

	return (
		<>
			<Grid container spacing={2} sx={{ marginTop: "16px", overflow: "auto" }}>
				{achievementsInfo
					.sort((a, b) =>
					{
						const isAFinished =
							Array.isArray(achievements) &&
							achievements.some((item) => item.key === a.key && item.status);
						const isBFinished =
							Array.isArray(achievements) &&
							achievements.some((item) => item.key === b.key && item.status);

						// Sort such that finished achievements come first
						if (isAFinished && !isBFinished) return -1;
						if (!isAFinished && isBFinished) return 1;
						return 0;
					})
					.map((achievement) =>
					{
						const achievementFound =
							(Array.isArray(achievements) &&
							achievements.find((item) => item.key === achievement.key)) ||
							totalMessiers
								?.map(item => item.replace(/\s+/g, "").toLowerCase())
								.includes(achievement.key.toLowerCase());;

						return (
							<Grid
								item
								xs={3}
								lg={3}
								md={4}
								sx={{ position: "relative" }}
								key={achievement.key}
							>
								<Card
									sx={[
										styles.center,
										{
											backgroundColor: palette.grey[300],
											padding: ".5rem",
											border: achievementFound?.status
												? `3px solid ${palette.primary.main}`
												: null,
											opacity: achievementFound ? 1 : 0.7,
											pointerEvents: "auto",
											width: "100%",
											height: "100%",
											flexDirection: "column",
										},
									]}
								>
									<CardContent
										sx={{
											display: "flex",
											flexDirection: "column",
											alignItems: "center",
											justifyContent: "center",
											gap: ".25rem",
											padding: 0,
										}}
									>
										<AchievementPreview
											achievement={achievement}
											width={100}
											height={100}
										/>
										<Typography variant="h3" textAlign="center">
											{achievement.title}
										</Typography>
										<IconButton
											onClick={(e) => handlePopoverOpen(e, achievement)}
											sx={{
												position: "absolute",
												top: "1rem",
												right: ".5rem",
											}}
										>
											<InfoOutlinedIcon sx={{ color: palette.white[900] }} />
										</IconButton>
									</CardContent>
									<CardActions
										sx={{
											justifyContent: "space-between",
											color: palette.white[900],
											padding: 0,
											gap: ".25rem",
											marginTop: "auto",
										}}
									>
										{achievement.title === s.achievements.all_messier_title ? (
											<IconButton
												key={0}
												sx={{ padding: 0 }}
												onClick={toggleMessierModal}
												type="button"
											>
												{showMessier ? (
													<VisibilityOffIcon
														sx={{ color: palette.white[900], fontSize: "1rem" }}
													/>
												) : (
													<VisibilityIcon
														sx={{ color: palette.white[900], fontSize: "1rem" }}
													/>
												)}
											</IconButton>
										) : achievementFound ? (
											<>
												<CheckCircleOutlineIcon
													sx={{ color: palette.success.main, fontSize: "1rem" }}
												/>
												<Typography
													sx={{ margin: 0 }}
													component="time"
													variant="subtitle2"
												>
													{dayjs(achievementFound.ts).format(
														"YYYY.MM.DD HH:mm",
													)}
												</Typography>
											</>
										) : null}
										<Typography
											sx={{ margin: 0 }}
											variant="subtitle2"
											fontWeight={500}
										>
											Score: {achievement.points}
										</Typography>
									</CardActions>
								</Card>
							</Grid>
						);
					})}
			</Grid>

			<Popover
				open={open}
				anchorEl={anchorEl}
				onClose={handlePopoverClose}
				anchorOrigin={{
					vertical: "bottom",
					horizontal: "center",
				}}
				transformOrigin={{
					vertical: "top",
					horizontal: "center",
				}}
				slotProps={{
					paper: {
						sx: {
							backgroundColor: "common.black",
							border: "1px solid #252525",
							borderRadius: "8px",
							padding: "20px",
							maxWidth: "300px",
						},
					},
				}}
			>
				<Typography variant="h6" color="primary" sx={{ mb: 2 }}>
					{selectedAchievement?.title}
				</Typography>
				<Typography variant="body1">
					{selectedAchievement?.description}
				</Typography>
			</Popover>

			<Suspense fallback={<TabLoader />}>
				<Messier isOpen={showMessier} close={toggleMessierModal} />
			</Suspense>
		</>
	);
};

export default AchievementsGridView;
