import { Checkbox, Grid, Typography } from "@mui/material";
import { Box } from "@mui/system";
import { get, isEmpty, merge } from "lodash";
import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { alignActions } from "@redux/actions";
import { trainModules, DEVICE_TYPE } from "@indi/enums";
import s from "@common/shared/i18n/i18n";
import CustomizedSwitch from "../../Components/CustomSwitch";
import Dropdown from "../../Components/Dropdown";
import NumericControl from "../../Components/NumericControl";
import { SelectInput } from "../../Components/Select";
import {
	selectAlignSettings,
	selectFilterWheelNames,
	selectTrainDevice,
} from "@redux/selectors";

const profiles = [
	{
		label: "1-Default",
		value: 0,
	},
	{
		label: "2-SingleThreadSolving",
		value: 1,
	},
	{
		label: "3-LargeScaleSolving",
		value: 2,
	},
	{
		label: "4-SmallScaleSolving",
		value: 3,
	},
];

const AlignCheckbox = ({ checked, onChange, title }) =>
{
	return (
		<Box
			sx={[
				LOCAL_STYLES.gridItem,
				{
					display: "grid",
					gridTemplateColumns: "120px auto",
					justifyContent: "flex-start",
				},
			]}
		>
			<Typography sx={{ color: "white" }}>{title}</Typography>
			<Checkbox
				style={{ color: "white", padding: 0 }}
				checked={checked}
				onChange={onChange}
			/>
		</Box>
	);
};

const Preset = () =>
{
	const dispatch = useDispatch();
	const alignSettings = useSelector(selectAlignSettings);
	const [activeSettings, setActiveSettings] = useState({
		name: "",
		iso: isEmpty(alignSettings) ? "" : alignSettings.alignISO,
		filter: isEmpty(alignSettings) ? "--" : alignSettings.alignFilter,
		dark: isEmpty(alignSettings) ? "--" : alignSettings.alignDarkFrame,
		accuracy: isEmpty(alignSettings)
			? "--"
			: alignSettings.alignAccuracyThreshold,
		settle: isEmpty(alignSettings) ? "--" : alignSettings.alignSettlingTime,
		profile: isEmpty(alignSettings)
			? "1-Default"
			: alignSettings.kcfg_SolveOptionsProfile,
		useAutoImageScale: isEmpty(alignSettings)
			? false
			: alignSettings.kcfg_AstrometryUseImageScale,
		useAutoPositionScale: isEmpty(alignSettings)
			? false
			: alignSettings.kcfg_AstrometryUsePosition,
		solverIndex: 0,
	});
	const {
		filter,
		accuracy,
		settle,
		dark,
		iso,
		profile,
		useAutoImageScale,
		useAutoPositionScale,
	} = activeSettings;
	// const [isoControl, setISOControl] = useState({ limit: [], range: [] });
	const isoControl = { limit: [], range: [] };

	const connected = useSelector(
		(state) => state.ekos.connection.connected && state.ekos.connection.online,
	);

	// Filter Wheel
	const filterWheelNames = useSelector(selectFilterWheelNames);
	const activeFilterWheel = useSelector((state) =>
		selectTrainDevice(state, {
			trainType: trainModules.AlignOpticalTrain,
			deviceType: DEVICE_TYPE.FILTER_WHEEL,
		}),
	);
	const [filtersList, setFiltersList] = useState([]);

	useEffect(() =>
	{
		const combinedObject = merge(activeSettings, alignSettings);
		setActiveSettings({ ...combinedObject, name: "" });
	}, [alignSettings]);

	useEffect(() =>
	{
		const payload = {
			alignFilter: filter,
			alignAccuracyThreshold: accuracy,
			alignSettlingTime: settle,
			alignDarkFrame: dark,
			alignISO: iso,
			kcfg_SolveOptionsProfile: profile,
			kcfg_AstrometryUseImageScale: useAutoImageScale,
			kcfg_AstrometryUsePosition: useAutoPositionScale,
		};
		dispatch(alignActions.setAllSettings(payload));
	}, [
		filter,
		settle,
		accuracy,
		iso,
		dark,
		profile,
		useAutoImageScale,
		useAutoPositionScale,
	]);

	/*
	 * Set Filters List from the active filter wheel if available.
	 */
	useEffect(() =>
	{
		if (connected && !isEmpty(activeFilterWheel))
		{
			const filters = activeFilterWheel.availableFilters();
			if (filters)
				setFiltersList(
					filters.map((item) => ({ label: item.text, value: item.text })),
				);
		}
	}, [connected, activeFilterWheel?.name]);

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
				<Typography sx={{ color: "white" }}>{s.general.profile}</Typography>
				<SelectInput
					options={profiles}
					value={profile}
					onChange={(e) =>
					{
						setActiveSettings({ ...activeSettings, profile: e.label });
						dispatch(
							alignActions.setAllSettings({
								kcfg_SolveOptionsProfile: e.value,
							}),
						);
					}}
				/>
			</Box>

			{!isEmpty(filterWheelNames) && (
				<Box sx={[LOCAL_STYLES.gridItem]}>
					<Typography sx={{ color: "white" }}>{s.general.filter}</Typography>
					<Dropdown
						disabled={isEmpty(activeFilterWheel)}
						options={filtersList}
						onChange={(data) =>
						{
							setActiveSettings({ ...activeSettings, filter: data.value });
						}}
						value={isEmpty(activeFilterWheel) ? "--" : filter}
						background="#1D1D1D"
						placeholder={s.general.select_option}
					/>
				</Box>
			)}

			<AlignCheckbox
				checked={useAutoImageScale}
				onChange={() =>
				{
					setActiveSettings({
						...activeSettings,
						useAutoImageScale: !useAutoImageScale,
					});
				}}
				title={s.ekos.collapse_align.align_settings.use_scale}
			/>

			<Box sx={[LOCAL_STYLES.gridItem]}>
				<Typography sx={{ color: "white" }}>
					{s.ekos.collapse_align.accuracy}
				</Typography>
				<NumericControl
					onChange={(value) =>
						setActiveSettings({ ...activeSettings, accuracy: value })
					}
					steps={[10, 10]}
					initialValue={activeSettings.accuracy}
					customLimit={[1, 1200]}
				/>
			</Box>

			<AlignCheckbox
				checked={useAutoPositionScale}
				onChange={() =>
				{
					setActiveSettings({
						...activeSettings,
						useAutoPositionScale: !useAutoPositionScale,
					});
				}}
				title={s.ekos.collapse_align.align_settings.use_position}
			/>

			<Box sx={[LOCAL_STYLES.gridItem]}>
				<Typography sx={{ color: "white" }}>
					{s.ekos.collapse_align.settle}
				</Typography>
				<NumericControl
					onChange={(value) =>
						setActiveSettings({ ...activeSettings, settle: value })
					}
					initialValue={activeSettings.settle}
					customLimit={[0, 15000]}
					steps={[100, 100]}
				/>
			</Box>

			<Box
				sx={[
					LOCAL_STYLES.gridItem,
					{ gridColumn: isEmpty(isoControl.range) ? 2 : 1 },
				]}
			>
				<Typography sx={{ color: "white" }}>
					{s.ekos.collapse_align.dark}
				</Typography>
				<CustomizedSwitch
					options={[
						{ label: s.general.on, value: true },
						{ label: s.general.off, value: false },
					]}
					onChange={() =>
						setActiveSettings({ ...activeSettings, dark: !activeSettings.dark })
					}
					value={activeSettings.dark}
				/>
			</Box>

			{!isEmpty(isoControl.range) && (
				<Box sx={[LOCAL_STYLES.gridItem]}>
					<Typography sx={{ color: "white" }}>ISO Range</Typography>
					<Dropdown
						options={isoControl.range.map((item, index) => ({
							label: item,
							value: index,
						}))}
						value={isoControl.range[get(activeSettings, "iso", 0)]}
						onChange={(e) =>
						{
							setActiveSettings({ ...activeSettings, iso: e.value });
						}}
					/>
				</Box>
			)}
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
