import { Checkbox, Grid, Typography } from "@mui/material";
import { Box } from "@mui/system";
import { isEmpty } from "lodash";
import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { guideActions } from "@redux/actions";
import s from "@common/shared/i18n/i18n";
import CustomizedSwitch from "@components/CustomSwitch";
import Dropdown from "@components/Dropdown";
import { selectGuideSettings } from "@redux/selectors";

const darkOptions = [
	{
		label: "OFF",
		value: false,
	},
	{
		label: "ON",
		value: true,
	},
];

const Preset = () =>
{
	const dispatch = useDispatch();
	const guideSettings = useSelector(selectGuideSettings);

	const [bin, setBin] = useState(
		isEmpty(guideSettings) ? "1x1" : guideSettings.guideBinning,
	);
	const [dark, setDark] = useState(
		isEmpty(guideSettings) ? false : guideSettings.guideDarkFrame,
	);
	const [box, setBox] = useState(
		isEmpty(guideSettings) ? "8" : guideSettings.guideSquareSize,
	);
	const [subFrame, setSubFrame] = useState(
		isEmpty(guideSettings) ? false : guideSettings.guideSubframe,
	);
	const [autoStar, setAutoStar] = useState(
		isEmpty(guideSettings) ? false : guideSettings.guideAutoStar,
	);

	useEffect(() =>
	{
		const payload = {
			guideBinning: bin,
			guideDarkFrame: dark,
			guideSquareSize: box,
			guideSubframe: subFrame,
			guideAutoStar: autoStar,
		};
		dispatch(guideActions.setAllSettings(payload));
	}, [bin, dark, box, subFrame, autoStar]);

	return (
		<Grid
			container
			sx={{
				display: "grid",
				gridTemplateColumns: "repeat(2, 1fr)",
				justifyContent: "start",
				rowGap: "16px",
				columnGap: "32px",
				padding: "12px 0px",
			}}
		>
			<Box sx={[LOCAL_STYLES.gridItem]}>
				<Typography sx={{ color: "white", width: "max-content" }}>
					{s.general.binning}
				</Typography>
				<CustomizedSwitch
					options={[
						{ label: "1x1", value: "1x1" },
						{ label: "2x2", value: "2x2" },
						{ label: "4x4", value: "4x4" },
					]}
					onChange={(value) =>
					{
						setBin(value);
					}}
					value={bin}
				/>
			</Box>

			<Box sx={[LOCAL_STYLES.gridItem]}>
				<Typography sx={{ color: "white", width: "max-content" }}>
					{s.ekos.collapse_guide.box}
				</Typography>
				<Dropdown
					options={[
						{ label: "8", value: 8 },
						{ label: "16", value: 16 },
						{ label: "32", value: 32 },
						{ label: "64", value: 64 },
						{ label: "128", value: 128 },
					]}
					value={box}
					onChange={(e) => setBox(e.value)}
				/>
			</Box>

			<Box sx={[LOCAL_STYLES.gridItem]}>
				<Typography sx={{ color: "white", width: "max-content" }}>
					{s.ekos.collapse_guide.subframe}
				</Typography>
				<Checkbox
					style={{ color: "white", padding: 0 }}
					checked={subFrame}
					onClick={() =>
					{
						setSubFrame(!subFrame);
					}}
				/>
			</Box>

			<Box sx={[LOCAL_STYLES.gridItem]}>
				<Typography sx={{ color: "white", width: "max-content" }}>
					{s.ekos.collapse_align.dark}
				</Typography>
				<CustomizedSwitch
					options={darkOptions}
					onChange={(value) =>
					{
						setDark(value);
					}}
					value={dark}
				/>
			</Box>

			<Box sx={[LOCAL_STYLES.gridItem]}>
				<Typography sx={{ color: "white", width: "max-content" }}>
					{s.ekos.collapse_guide.autostar}
				</Typography>
				<Checkbox
					style={{ color: "white", padding: 0 }}
					checked={autoStar}
					onClick={() =>
					{
						setAutoStar(!autoStar);
					}}
				/>
			</Box>
		</Grid>
	);
};

const LOCAL_STYLES = {
	gridItem: {
		display: "flex",
		justifyContent: "space-between",
		alignItems: "center",
		gap: "16px",
	},
	imageButton: { width: "40px", height: "40px", minWidth: "auto", padding: 0 },
};

export default Preset;
