import React, { Suspense, useCallback, useState } from "react";
import { IconButton } from "@mui/material";
import { useSelector } from "react-redux";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import HighlightOffIcon from "@mui/icons-material/HighlightOff";
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";
import VisibilityIcon from "@mui/icons-material/Visibility";
import { Palette } from "@common/shared/common/styles";
import s from "@common/shared/i18n/i18n";
import AchievementPreview from "@components/AchievementPreview";
import TabLoader from "@components/TabLoader";
import Messier from "./Messiers";
import { useTheme } from "@mui/material";
import Moment from "react-moment";
import achievementsInfo from "@common/shared/common/achievements";
import { getTotalMessiers } from "@redux/selectors";
import isEqual from "lodash/isEqual";

const AchievementsListView = ({ achievements }) =>
{
	const [showMessier, setShowMessier] = useState(false);
	const { palette } = useTheme();
	const totalMessiers = useSelector(getTotalMessiers, isEqual);

	const toggleMessierModal = useCallback(
		() => setShowMessier((p) => !p),
		[setShowMessier],
	);

	const tableStyles = {
		Header: {
			position: "relative",
			display: "flex",
			justifyContent: "center",
			alignItems: "center",
			color: palette.primary.main,
			fontWeight: "bold",
		},
		title: {
			fontSize: "30px",
		},
		Score: {
			position: "absolute",
			left: "20px",
			fontSize: "20px",
		},
		tableContainer: {
			flex: 1,
			overflowY: "auto",
			marginTop: "20px",
		},
		tableHeader: {
			position: "sticky",
			top: 0,
			backgroundColor: palette.black[900],
		},
		table: {
			width: "100%",
			borderCollapse: "collapse",
		},
		th: {
			padding: "12px",
			backgroundColor: palette.black[500],
			color: palette.white[900],
			border: `1px solid ${palette.black[500]}`,
		},
		td: {
			padding: "12px",
			backgroundColor: palette.black[900],
			color: palette.white[900],
			border: `1px solid ${palette.black[500]}`,
			textAlign: "center",
			verticalAlign: "middle",
		},
	};

	return (
		<>
			<div style={tableStyles.tableContainer}>
				<table style={tableStyles.table}>
					<thead style={tableStyles.tableHeader}>
						<tr>
							<th style={tableStyles.th}></th>
							<th style={tableStyles.th}>No</th>
							<th style={tableStyles.th}>{s.achievements.achievements}</th>
							<th style={tableStyles.th}>{s.general.status}</th>
							<th style={tableStyles.th}>{s.achievements.points}</th>
						</tr>
					</thead>
					<tbody>
						{achievementsInfo
							.sort((a, b) =>
							{
								const isAFinished =
									Array.isArray(achievements) &&
									achievements.some(
										(item) => item.key === a.key && item.status,
									);
								const isBFinished =
									Array.isArray(achievements) &&
									achievements.some(
										(item) => item.key === b.key && item.status,
									);

								// Sort such that finished achievements come first
								if (isAFinished && !isBFinished) return -1;
								if (!isAFinished && isBFinished) return 1;
								return 0;
							})
							.map((achievement, index) =>
							{
								const achievementFound =
									(Array.isArray(achievements) &&
										achievements.find(
											(item) => item.key === achievement.key,
										)) ||
									totalMessiers
										?.map((item) => item.replace(/\s+/g, "").toLowerCase())
										.includes(achievement.key.toLowerCase());

								return (
									<tr
										key={achievement.key}
										style={{ opacity: achievementFound ? 1 : 0.5 }}
									>
										<td style={tableStyles.td}>
											<AchievementPreview achievement={achievement} />
										</td>
										<td style={tableStyles.td}>{index + 1}</td>
										<td style={tableStyles.td}>
											<p style={{ color: Palette.orange }}>
												{achievement.title.toUpperCase()}
											</p>
											<p>{achievement.description}</p>
										</td>
										<td style={tableStyles.td}>
											{achievement.title ===
											s.achievements.all_messier_title ? (
												<IconButton
													key={0}
													sx={{ padding: 0 }}
													onClick={toggleMessierModal}
													type="button"
												>
													{showMessier ? (
														<VisibilityOffIcon
															sx={{ color: palette.white[900], fontSize: 24 }}
														/>
													) : (
														<VisibilityIcon
															sx={{ color: palette.white[900], fontSize: 24 }}
														/>
													)}
												</IconButton>
											) : achievementFound ? (
												<CheckCircleOutlineIcon
													sx={{ color: palette.success.main, fontSize: 24 }}
												/>
											) : (
												<HighlightOffIcon
													sx={{ color: palette.white[900], fontSize: 24 }}
												/>
											)}

											{achievementFound && (
												<Moment
													format="YYYY.MM.DD HH:mm"
													sx={{ color: palette.white[900] }}
												>
													{achievementFound?.ts}
												</Moment>
											)}
										</td>
										<td style={tableStyles.td}>
											<p style={{ fontSize: "18px", fontWeight: "bold" }}>
												{achievement.points}
											</p>
										</td>
									</tr>
								);
							})}
					</tbody>
				</table>
			</div>
			<Suspense fallback={<TabLoader />}>
				<Messier isOpen={showMessier} close={toggleMessierModal} />
			</Suspense>
		</>
	);
};

export default AchievementsListView;
