import React from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import get from "lodash/get";
import isEqual from "lodash/isEqual";
import { useSelector } from "react-redux";
import { toDMS } from "@common/shared/common/common";
import { styles } from "../../shared/styles";
import { Palette } from "@common/shared/common/styles";
import Icon from "../../Components/Icon";
import { selectPolarStage, selectPolar } from "@redux/selectors";

const LOCAL_STYLES = {
	polarErrors: {
		backgroundColor: "black",
		flexDirection: "column",
		gap: "16px",
		justifyContent: "center",
		position: "relative",
		zIndex: "2",
		borderRadius: "15px",
		padding: "6px",
	},
	polarItem: {
		padding: "4px",
	},
};

const PolarCoordinates = () =>
{
	const stage = useSelector(selectPolarStage);
	const polar = useSelector(selectPolar, isEqual);

	const refreshSolverFailed = get(polar, "updatedError", 0) === -1;
	const finalTotalError = get(polar, "updatedError", polar.vector.error);
	const finalAltError =
		polar.updatedALTError !== -1
			? polar.updatedALTError
			: polar.vector.altError;
	const finalAzError =
		polar.updatedALTError !== -1 ? polar.updatedAZError : polar.vector.azError;

	/**
	 * Returns the Arrow Icon based on Error.
	 * @returns Name of icons.
	 */
	const azIcon = () =>
	{
		return finalAzError < 0 ? "arrow-right" : "arrow-left";
	};

	const altIcon = () =>
	{
		return finalAltError < 0 ? "arrow-up" : "arrow-down";
	};
	return (stage !== "Idle" && stage === "Select Star") ||
		stage === "Select Refresh" ||
		stage === "Refreshing" ? (
		<Box sx={LOCAL_STYLES.polarErrors}>
			<Box
				sx={[
					{
						borderWidth: "5px",
						border: `2px solid ${Palette.contrastPurple}`,
						backgroundColor: Palette.grey22,
					},
				]}
			>
				<Box
					sx={[
						styles.row,
						LOCAL_STYLES.polarItem,
						{ backgroundColor: Palette.contrastRed },
					]}
				>
					<Icon name="search" color={Palette.white} />
					<Typography
						sx={{ color: "white", width: "min-content" }}
					>{`ΣError: ${toDMS(polar.vector.error)}`}</Typography>
				</Box>
				{refreshSolverFailed === false && (
					<Box
						sx={[
							styles.row,
							LOCAL_STYLES.polarItem,
							{ backgroundColor: Palette.contrastGrey },
						]}
					>
						<Icon name="search" color={Palette.white} />
						<Typography
							sx={{ color: "white", width: "min-content" }}
						>{`ΣError: ${toDMS(finalTotalError)}`}</Typography>
					</Box>
				)}
			</Box>

			<Box sx={[{ border: `2px solid ${Palette.yellow}` }]}>
				<Box sx={styles.center}>
					<Icon name={altIcon()} color={Palette.white} />
				</Box>
				<Box
					sx={[
						styles.row,
						LOCAL_STYLES.polarItem,
						{
							borderWidth: 1,
							borderColor: Palette.white70,
							backgroundColor: Palette.contrastRed,
						},
					]}
				>
					<Icon name="search" color={Palette.white} />
					<Typography
						sx={{ color: "white", width: "min-content" }}
					>{`ΔAlt ${toDMS(polar.vector.altError)}`}</Typography>
				</Box>
				{refreshSolverFailed === false && (
					<Box
						sx={[
							styles.row,
							LOCAL_STYLES.polarItem,
							{ backgroundColor: Palette.contrastGrey },
						]}
					>
						<Icon name="find" color={Palette.white} />
						<Typography
							sx={{ color: "white", width: "min-content" }}
						>{` ΔAlt: ${toDMS(finalAltError)}`}</Typography>
					</Box>
				)}
			</Box>

			<Box sx={[{ border: `2px solid ${Palette.contrastGreen}` }]}>
				<Box sx={styles.center}>
					<Icon name={azIcon()} color={Palette.white} />
				</Box>
				<Box
					sx={[
						styles.row,
						LOCAL_STYLES.polarItem,
						{
							borderWidth: 1,
							borderColor: Palette.white70,
							backgroundColor: Palette.contrastRed,
						},
					]}
				>
					<Icon name="search" color={Palette.white} />
					<Typography
						sx={{ color: "white", width: "min-content" }}
					>{`ΔAz ${toDMS(polar.vector.azError)}`}</Typography>
				</Box>
				{refreshSolverFailed === false && (
					<Box
						sx={[
							styles.row,
							LOCAL_STYLES.polarItem,
							{ backgroundColor: Palette.contrastGrey },
						]}
					>
						<Icon name="find" color={Palette.white} />
						<Typography
							sx={{ color: "white", width: "min-content" }}
						>{`ΔAz: ${toDMS(finalAzError)}`}</Typography>
					</Box>
				)}
			</Box>
		</Box>
	) : null;
};

export default PolarCoordinates;
