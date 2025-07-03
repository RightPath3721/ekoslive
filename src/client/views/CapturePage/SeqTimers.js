import React from "react";
import { useSelector } from "react-redux";
import { Box, Typography, CircularProgress } from "@mui/material";
import { Palette } from "@common/shared/common/styles";

const CircularProgressWithLabel = ({ value, color, label }) =>
{
	return (
		<Box position="relative" display="inline-flex">
			<CircularProgress
				variant="determinate"
				value={value}
				size={30}
				thickness={4}
				sx={{ color }}
			/>
			<Box
				top={0}
				left={0}
				bottom={0}
				right={0}
				position="absolute"
				display="flex"
				alignItems="center"
				justifyContent="center"
			>
				<Typography
					sx={{ color: Palette.white }}
					variant="caption"
					component="div"
					color="textPrimary"
				>
					{label}
				</Typography>
			</Box>
		</Box>
	);
};

const SeqTimers = ({
	isCapturing,
	isSettingTemperature,
	isSummary = false,
}) =>
{
	const expv = useSelector((state) => state.status.capture.expv);
	const expr = useSelector((state) => state.status.capture.expr);
	const seqt = useSelector((state) => state.status.capture.seqt);
	const ovt = useSelector((state) => state.status.capture.ovt);

	const fill = ((expr - expv) / expr) * 100;

	return (
		<Box display="flex" flexDirection="row" alignItems="center">
			<Box
				sx={{
					minWidth: "50px",
					marginRight: "24px",
					// height: "72px",
					display: "flex",
					alignItems: "center",
					justifyContent: "center",
				}}
			>
				{isCapturing && !isSummary && !isSettingTemperature && (
					<CircularProgressWithLabel
						value={fill}
						color={Palette.orange}
						label={`${expv.toFixed(0)}s`}
					/>
				)}
			</Box>

			<Box>
				{isCapturing && (
					<Typography sx={{ marginRight: "3px" }}>{seqt}</Typography>
				)}
				{isCapturing && !isSettingTemperature && <Typography>{ovt}</Typography>}
			</Box>
		</Box>
	);
};

export default SeqTimers;
