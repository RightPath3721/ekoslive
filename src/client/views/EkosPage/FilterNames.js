import s from "@common/shared/i18n/i18n";
import { DEVICE_TYPE, trainModules } from "@indi/enums";
import { Grid, IconButton, TextField, Typography } from "@mui/material";
import { selectTrainDevice } from "@redux/selectors";
import { isEmpty } from "lodash";
import React from "react";
import { useEffect } from "react";
import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import SettingsIcon from "@mui/icons-material/Settings";

const Settings = React.lazy(() => import("../CapturePage/Settings"));
const FilterNames = () =>
{
	const dispatch = useDispatch();

	const activeFilterWheel = useSelector((state) =>
		selectTrainDevice(state, {
			trainType: trainModules.CaptureOpticalTrain,
			deviceType: DEVICE_TYPE.FILTER_WHEEL,
		}),
	);

	const [filters, setFilters] = useState([]);
	const [showSettings, setShowSettings] = useState(false);

	/**
	 * Get filters from the Driver.
	 */
	useEffect(() =>
	{
		if (!isEmpty(activeFilterWheel))
		{
			setFilters(activeFilterWheel.availableFilters());
		}
	}, [activeFilterWheel]);

	if (showSettings) return <Settings index={2} />;
	return (
		<Grid container sx={{ backgroundColor: "#0f0e0e" }}>
			<Grid xs={10} item sx={{ position: "relative" }}>
				<Typography>{s.general.filter_wheel}</Typography>
			</Grid>
			<Grid>
				<IconButton
					sx={{
						position: "absolute",
						top: "40px",
						right: "5px",
						borderRadius: "4px",
						color: "white",
						width: "28px",
						height: "28px",
						zIndex: 1,
						padding: 0,
					}}
					onClick={() => setShowSettings(true)}
				>
					<SettingsIcon sx={{ color: "#CECECE" }} />
				</IconButton>
			</Grid>
			<Grid>
				{filters.map((item, index) =>
				{
					return (
						<Grid
							key={index}
							style={{
								display: "flex",
								flexDirection: "row",
								padding: "5px",
							}}
						>
							<Typography
								sx={{
									width: "125px",
									padding: "20px",
								}}
							>
								{filters[index].text}
							</Typography>
							<TextField
								onChange={(e) =>
									setFilters(
										filters.map((oneFilter, i) =>
											i == index
												? { ...oneFilter, text: e.target.value }
												: oneFilter,
										),
									)
								}
								onBlur={() =>
								{
									dispatch(
										activeFilterWheel.setFilterName(filters[index].text, index),
									);
								}}
								value={filters[index].text}
								style={{ width: "200px" }}
							/>
						</Grid>
					);
				})}
			</Grid>
		</Grid>
	);
};

export default FilterNames;
