import React from "react";
import { useSelector } from "react-redux";
import { get, isEmpty } from "lodash";
import { Box, Grid, Typography } from "@mui/material";
import s from "@common/shared/i18n/i18n";
import { Palette } from "@common/shared/common/styles";
import { selectAlignSettings } from "@redux/selectors";
import { styles } from "@client/shared/styles";

const SolutionBar = () =>
{
	const status = useSelector((state) => state.status.align);
	const solution = status.solution;
	const alignSettings = useSelector(selectAlignSettings);

	if (isEmpty(solution)) return null;

	const targetDiff = get(solution, "targetDiff", 0).toFixed();
	const dRA = get(solution, "dRA", 0).toFixed();
	const dDE = get(solution, "dDE", 0).toFixed();
	const pix = get(solution, "pix", 0).toFixed(2);
	const PA = get(solution, "PA", 0).toFixed(2);
	const fov = get(solution, "fov", "NA");

	const getColor = () =>
	{
		if (targetDiff <= alignSettings.alignAccuracyThreshold) return "#0f0";
		else if (targetDiff <= alignSettings.alignAccuracyThreshold * 1.5)
			return "#ff0";
		else return "#f00";
	};

	return (
		<Box container sx={{ width: "100%" }}>
			<Box sx={[LOCAL_STYLES.solutionBarContainer]}>
				<Typography sx={LOCAL_STYLES.text}>
					{s.general.error}:{" "}
					<span style={{ color: getColor() }}>
						{targetDiff}
						{s.ekos.solution_bar.arcsec}
					</span>
				</Typography>
				<Typography sx={LOCAL_STYLES.text}>
					{s.ekos.solution_bar.dra}: {dRA}
					{s.ekos.solution_bar.arcsec}
				</Typography>
				<Typography sx={LOCAL_STYLES.text}>
					{s.ekos.solution_bar.dde}: {dDE}
					{s.ekos.solution_bar.arcsec}
				</Typography>
				<Typography sx={LOCAL_STYLES.text}>
					{s.ekos.solution_bar.pix}: {pix}
				</Typography>
				<Typography sx={LOCAL_STYLES.text}>PA: {PA}</Typography>
				<Typography sx={LOCAL_STYLES.text}>
					{s.ekos.solution_bar.fov}: {fov}
				</Typography>
			</Box>
			<Box
				sx={[
					styles.row,
					{
						justifyContent: "center",
						alignSelf: "center",
						borderColor: Palette.grey33,
					},
				]}
			>
				{!isEmpty(get(status, "downloadProgress", "")) && (
					<Typography
						style={{ width: "200px", fontSize: "14px", padding: "5px" }}
					>
						{get(status, "downloadProgress", "")}
					</Typography>
				)}
			</Box>
		</Box>
	);
};

export default SolutionBar;

const LOCAL_STYLES = {
	text: {
		color: Palette.grey66,
		fontSize: "16px",
		width: "fit-content",
	},
	solutionBarContainer: {
		display: "grid",
		gridTemplateColumns: "repeat(3, 1fr)",
		backgroundColor: Palette.grey11,
		borderTop: "1px solid #333",
		padding: "4px",
	},
};
