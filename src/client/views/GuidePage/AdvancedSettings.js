import React, { useEffect, useState } from "react";
import { get, isEmpty } from "lodash";
import { Button, Checkbox, Grid, Typography } from "@mui/material";
import DeleteForeverIcon from "@mui/icons-material/DeleteForever";
import { Box } from "@mui/system";
import { useDispatch, useSelector } from "react-redux";
import { guideActions } from "@redux/actions";
import s from "@common/shared/i18n/i18n";
import NumericControl from "../../Components/NumericControl";
import { selectGuideSettings } from "@redux/selectors";

const GuideCheckbox = ({ title, checked, onChange, sx = {} }) =>
{
	return (
		<Box
			sx={{
				display: "flex",
				flexDirection: "row",
				alignItems: "center",
				justifyContent: "flex-start",
				gap: "10px",
				...sx,
			}}
		>
			<Checkbox
				style={{ color: "white", padding: 0 }}
				checked={checked}
				onChange={onChange}
			/>
			<Typography sx={{ color: "white", width: "max-content" }}>
				{title}
			</Typography>
		</Box>
	);
};

const AdvancedSettings = ({ inProgress }) =>
{
	const dispatch = useDispatch();
	const guideSettings = useSelector(selectGuideSettings);

	const [state, setState] = useState({
		ra_control: isEmpty(guideSettings) ? false : guideSettings.rAGuideEnabled,
		de_control: isEmpty(guideSettings) ? false : guideSettings.dECGuideEnabled,
		east: isEmpty(guideSettings) ? false : guideSettings.eastRAGuideEnabled,
		west: isEmpty(guideSettings) ? false : guideSettings.westRAGuideEnabled,
		north: isEmpty(guideSettings) ? false : guideSettings.northDECGuideEnabled,
		south: isEmpty(guideSettings) ? false : guideSettings.southDECGuideEnabled,
		dither_enabled: isEmpty(guideSettings)
			? false
			: guideSettings.kcfg_DitherEnabled,
		dither_pixels: isEmpty(guideSettings)
			? 2.0
			: guideSettings.kcfg_DitherPixels,
		dither_frequency: isEmpty(guideSettings)
			? 1
			: guideSettings.kcfg_DitherFrames,
		gpg_enabled: isEmpty(guideSettings) ? false : guideSettings.kcfg_GPGEnabled,
		ra_gain: isEmpty(guideSettings)
			? 0.75
			: guideSettings.kcfg_RAProportionalGain,
		de_gain: isEmpty(guideSettings)
			? 0.75
			: guideSettings.kcfg_DECProportionalGain,
		min_error: get(guideSettings, "kcfg_RAMinimumPulseArcSec", 0),
		max_error: get(guideSettings, "kcfg_DECMinimumPulseArcSec", 0),
		min_response: get(guideSettings, "kcfg_RAMaximumPulseArcSec", 0),
		max_response: get(guideSettings, "kcfg_DECMaximumPulseArcSec", 0),
	});

	const {
		ra_control,
		ra_gain,
		de_control,
		de_gain,
		east,
		west,
		north,
		south,
		dither_enabled,
		dither_frequency,
		dither_pixels,
		gpg_enabled,
		max_error,
		min_error,
		max_response,
		min_response,
	} = state;

	const clear = () =>
	{
		dispatch(guideActions.clear());
	};

	useEffect(() =>
	{
		const payload = {
			rAGuideEnabled: ra_control,
			dECGuideEnabled: de_control,
			eastRAGuideEnabled: east,
			westRAGuideEnabled: west,
			northDECGuideEnabled: north,
			southDECGuideEnabled: south,
			kcfg_DitherEnabled: dither_enabled,
			kcfg_DitherPixels: parseFloat(dither_pixels),
			kcfg_DitherFrames: dither_frequency,
			kcfg_GPGEnabled: gpg_enabled,
			kcfg_RAProportionalGain: ra_gain,
			kcfg_DECProportionalGain: de_gain,
			kcfg_RAMinimumPulseArcSec: min_error,
			kcfg_DECMinimumPulseArcSec: max_error,
			kcfg_RAMaximumPulseArcSec: min_response,
			kcfg_DECMaximumPulseArcSec: max_response,
		};
		dispatch(guideActions.setAllSettings(payload));
	}, [state]);

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
				width: "max-content",
			}}
		>
			<Box sx={[LOCAL_STYLES.gridItem, { gridColumn: "1" }]}>
				<Box sx={{ display: "flex", flexDirection: "row" }}>
					<Checkbox
						style={{ color: "white", padding: 0 }}
						checked={dither_enabled}
						onClick={() =>
							setState({ ...state, dither_enabled: !dither_enabled })
						}
					/>
				</Box>

				<Typography sx={{ color: "white", width: "max-content" }}>
					{s.ekos.collapse_guide.dither} by
				</Typography>
				<NumericControl
					onChange={(val) =>
					{
						setState({ ...state, dither_pixels: val });
					}}
					steps={[0.1, 0.1]}
					initialValue={dither_pixels}
					customLimit={[0.1, 30]}
					numberType="float"
				/>
			</Box>

			<Box sx={[LOCAL_STYLES.gridItem, { gridColumn: "2" }]}>
				<Typography
					sx={{ color: "white", width: "max-content" }}
				>{`${s.ekos.capture_limits.focus_hfr_unit} ${s.ekos.collapse_guide.every}`}</Typography>
				<NumericControl
					onChange={(val) =>
					{
						setState({ ...state, dither_frequency: val });
					}}
					steps={[1, 1]}
					initialValue={dither_frequency}
					customLimit={[1, 60]}
				/>
				<Typography sx={{ color: "white", width: "max-content" }}>
					{s.ekos.collapse_guide.frames}
				</Typography>
			</Box>

			<Box sx={[LOCAL_STYLES.gridItem]}>
				<Checkbox
					style={{ color: "white", padding: 0 }}
					checked={gpg_enabled}
					onClick={() => setState({ ...state, gpg_enabled: !gpg_enabled })}
				/>
				<Typography sx={{ color: "white", width: "max-content" }}>
					{s.ekos.collapse_guide.gpg}
				</Typography>
			</Box>

			<Box sx={[LOCAL_STYLES.gridItem, { alignItems: "flex-start" }]}>
				<Typography sx={{ color: "white", width: "max-content" }}>
					{s.ekos.collapse_guide.directions}
				</Typography>

				<Box
					sx={{
						display: "grid",
						gridTemplateColumns: "repeat(4, 1fr)",
						columnGap: "10px",
						rowGap: "12px",
					}}
				>
					<GuideCheckbox
						title={s.ekos.mount_status_bar.ra}
						checked={ra_control}
						onChange={() => setState({ ...state, ra_control: !ra_control })}
						sx={{ gridColumn: "span 2" }}
					/>
					<GuideCheckbox
						title={s.ekos.collapse_guide.dec}
						checked={de_control}
						onChange={() => setState({ ...state, de_control: !de_control })}
						sx={{ gridColumn: "span 2" }}
					/>

					<GuideCheckbox
						title="+"
						checked={east}
						onChange={() => setState({ ...state, east: !east })}
					/>
					<GuideCheckbox
						title="-"
						checked={west}
						onChange={() => setState({ ...state, west: !west })}
					/>
					<GuideCheckbox
						title="+"
						checked={north}
						onChange={() => setState({ ...state, north: !north })}
					/>
					<GuideCheckbox
						title="-"
						checked={south}
						onChange={() => setState({ ...state, south: !south })}
					/>
				</Box>
			</Box>

			<Box
				sx={[
					LOCAL_STYLES.gridItem,
					{ display: "grid", gridTemplateColumns: "200px auto auto" },
				]}
			>
				<Typography sx={{ color: "white", width: "min-content" }}>
					{s.ekos.collapse_guide.aggressiveness}
				</Typography>
				<NumericControl
					onChange={(val) =>
					{
						setState({ ...state, ra_gain: val });
					}}
					steps={[0.05, 0.05]}
					initialValue={ra_gain}
					customLimit={[0, 1]}
					numberType="float"
				/>
				<NumericControl
					onChange={(val) =>
					{
						setState({ ...state, de_gain: val });
					}}
					steps={[0.05, 0.05]}
					initialValue={de_gain}
					customLimit={[0, 1]}
					numberType="float"
				/>
			</Box>

			<Box
				sx={[
					LOCAL_STYLES.gridItem,
					{ display: "grid", gridTemplateColumns: "200px auto auto" },
				]}
			>
				<Typography
					sx={{ color: "white" }}
				>{`${s.ekos.collapse_guide.min_error} (${s.ekos.collapse_align.arcsec})`}</Typography>
				<NumericControl
					initialValue={min_error}
					onChange={(val) =>
					{
						setState({ ...state, min_error: val });
					}}
					steps={[0.1, 0.1]}
					customLimit={[0.0, 1000]}
					numberType="float"
				/>
				<NumericControl
					initialValue={max_error}
					onChange={(val) =>
					{
						setState({ ...state, max_error: val });
					}}
					steps={[0.1, 0.1]}
					customLimit={[0.0, 1000]}
					numberType="float"
				/>
			</Box>

			<Box
				sx={[
					LOCAL_STYLES.gridItem,
					{ display: "grid", gridTemplateColumns: "200px auto auto" },
				]}
			>
				<Typography
					sx={{ color: "white" }}
				>{`${s.ekos.collapse_guide.max_response} (${s.ekos.collapse_align.arcsec})`}</Typography>
				<NumericControl
					initialValue={min_response}
					onChange={(val) =>
					{
						setState({ ...state, min_response: val });
					}}
					steps={[10, 10]}
					customLimit={[0, 3600]}
				/>
				<NumericControl
					initialValue={max_response}
					onChange={(val) =>
					{
						setState({ ...state, max_response: val });
					}}
					steps={[10, 10]}
					customLimit={[0, 3600]}
				/>
			</Box>

			<Box sx={[LOCAL_STYLES.gridItem, { justifyContent: "center" }]}>
				<Button sx={LOCAL_STYLES.btn} onClick={clear} disabled={inProgress}>
					<DeleteForeverIcon sx={{ color: "#550000", fontSize: 25 }} />
					<Typography sx={{ color: "white", width: "max-content" }}>
						{s.ekos.collapse_guide.clear_model}
					</Typography>
				</Button>
			</Box>
		</Grid>
	);
};

const LOCAL_STYLES = {
	btn: {
		backgroundColor: "#ff6600",
		color: "#FFFFFF",
		textTransform: "none",
		display: "flex",
		justifyContent: "space-between",
		gap: "6px",
		border: "1px solid #2d2d2d",
	},
	gridItem: {
		display: "flex",
		alignItems: "center",
		gridColumn: "span 2",
		justifyContent: "flex-start",
		gap: "10px",
	},
	imageButton: { width: "40px", height: "40px", minWidth: "auto", padding: 0 },
};

export default AdvancedSettings;
