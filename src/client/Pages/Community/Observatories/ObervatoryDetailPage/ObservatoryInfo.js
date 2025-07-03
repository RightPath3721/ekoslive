import React, { useEffect, useState } from "react";
import axios from "axios";
import { captureException } from "@sentry/browser";
import { useTheme } from "@mui/material";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import s from "@common/shared/i18n/i18n";
import TabLoader from "@components/TabLoader";
import { convertCoordToDms } from "@utils/convertCoordToDms";
import useActiveUser from "@hooks/useActiveUser";
import LocationAcuraccyTooltip from "./LocationAcuraccyTooltip";
import ObservatoryTimeClock from "./ObservatoryTimeClock";

const ObservatoryInfo = ({ observatory, isOwner }) =>
{
	const user = useActiveUser();
	const { palette } = useTheme();
	const [location, setLocation] = useState(null);

	useEffect(() =>
	{
		if (!user) return;

		(async () =>
		{
			try
			{
				const { data } = await axios.get(`/api/observatories/locations`, {
					params: {
						observatories: [observatory?._id],
						username: user.username,
						token: user.token,
					},
				});
				if (data[0]?.location)
				{
					setLocation(data[0]?.location);
				}
				else
				{
					setLocation(null);
				}
			}
			catch (error)
			{
				captureException(error);
			}
		})();
	}, [observatory, user]);

	if (!observatory) return <TabLoader />;

	return (
		<Box>
			{observatory?.owner && (
				<Typography
					sx={{
						display: "flex",
						justifyContent: "space-between",
						alignItems: "center",
						gap: ".5rem",
					}}
				>
					<Typography component="span" variant="subtitle1" fontSize="1rem">
						{s.general.owner}
					</Typography>
					<Typography
						variant="subtitle1"
						fontSize="1rem"
						component="span"
						sx={{ color: palette.grey.main }}
					>
						{observatory?.owner}
					</Typography>
				</Typography>
			)}
			{(isOwner || observatory.isPublicLocation) && (
				<>
					{location?.country && (
						<Typography
							sx={{
								display: "flex",
								justifyContent: "space-between",
								alignItems: "center",
							}}
						>
							<Typography variant="subtitle1" component="span" fontSize="1rem">
								{s.general.country}
							</Typography>
							<Typography
								variant="subtitle1"
								component="span"
								fontSize="1rem"
								sx={{ color: palette.grey.main }}
							>
								{location.country}
							</Typography>
						</Typography>
					)}
					{location?.region && (
						<Typography
							sx={{
								display: "flex",
								justifyContent: "space-between",
								alignItems: "center",
							}}
						>
							<Typography variant="subtitle1" component="span" fontSize="1rem">
								{s.general.region}
							</Typography>
							<Typography
								variant="subtitle1"
								component="span"
								fontSize="1rem"
								sx={{ color: palette.grey.main }}
							>
								{location.region}
							</Typography>
						</Typography>
					)}
					{location && (
						<Box
							sx={{
								position: "relative",
							}}
						>
							<Typography
								sx={{
									display: "flex",
									justifyContent: "space-between",
									alignItems: "center",
								}}
							>
								<Typography
									variant="subtitle1"
									component="span"
									fontSize="1rem"
								>
									{s.general.latitude}
									{location.accuracy && (
										<LocationAcuraccyTooltip accuracy={location.accuracy} />
									)}
								</Typography>
								<Typography
									variant="subtitle1"
									fontSize="1rem"
									component="span"
									sx={{ color: palette.grey.main }}
								>
									{convertCoordToDms(location.lat)}
								</Typography>
							</Typography>
							<Typography
								sx={{
									display: "flex",
									justifyContent: "space-between",
									alignItems: "center",
								}}
							>
								<Typography
									variant="subtitle1"
									component="span"
									fontSize="1rem"
								>
									{s.general.longitude}
								</Typography>
								<Typography
									variant="subtitle1"
									fontSize="1rem"
									component="span"
									sx={{ color: palette.grey.main }}
								>
									{convertCoordToDms(location.lng, "lon")}
								</Typography>
							</Typography>
						</Box>
					)}
					
					{/* Observatory Time Clock */}
					{location && (
						<Box sx={{ marginTop: "1rem", marginBottom: "1rem" }}>
							<ObservatoryTimeClock location={location} />
						</Box>
					)}
				</>
			)}
			<Typography
				sx={{
					display: "flex",
					justifyContent: "space-between",
					alignItems: "center",
				}}
			>
				<Typography variant="subtitle1" component="span" fontSize="1rem">
					Pictures Captured
				</Typography>
				<Typography
					variant="subtitle1"
					fontSize="1rem"
					component="span"
					sx={{ color: palette.grey.main }}
				>
					{observatory?.images_captured ?? 0}
				</Typography>
			</Typography>
		</Box>
	);
};

export default ObservatoryInfo;
