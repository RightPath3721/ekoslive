import React from "react";
import { useTheme } from "@mui/material";
import Box from "@mui/material/Box";
import Tooltip from "@mui/material/Tooltip";
import PanoramaFishEyeIcon from "@mui/icons-material/PanoramaFishEye";
import { LOCATION_ACCURACY } from "@client/helpers/common";
import LocationMarkIcon from "@client/icons/LocationMarkIcon"

const LocationAcuraccyTooltip = ({ accuracy }) =>
{
	const { palette } = useTheme();

	return (
		<Tooltip
			title={
				accuracy === LOCATION_ACCURACY.COARSE
					? "Approximate Location"
					: "Exact Location"
			}
		>
			<Box
				sx={{
					position: "absolute",
					top: "50%",
					left: "60%",
					transform: "translateY(-50%)",
				}}
				component="span"
				fontSize="1.25rem"
			>
				{accuracy === LOCATION_ACCURACY.COARSE ? (
					<PanoramaFishEyeIcon color="primary" />
				) : (
					<LocationMarkIcon
						width="1.25rem"
						height="1.25rem"
						color={palette.primary.main}
						className="inline-block"
					/>
				)}
			</Box>
		</Tooltip>
	);
};

export default LocationAcuraccyTooltip;
