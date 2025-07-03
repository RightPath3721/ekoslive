import React, { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Checkbox, Typography, Box, Button } from "@mui/material";
import { focusActions } from "@redux/actions";
import Dropdown from "../../Components/Dropdown";
import NumericControl from "../../Components/NumericControl";
import s from "@common/shared/i18n/i18n";
import RadioButton from "@components/RadioButton";
import Image from "mui-image";
import { get } from "lodash";
import { styles } from "@client/shared/styles";

const LOCAL_STYLES = {
	gridItem: {
		alignItems: "center",
		gap: "10px",
	},
	collapseFormGroup: {
		marginTop: "8px",
	},
	collapseLeftLabel: {
		marginLeft: "20px",
		width: "200px",
		padding: "10px",
	},
	collapseHeaderContainer: {
		alignItems: "center",
		justifyContent: "center",
		flexDirection: "row",
		height: "64px",
		paddingHorizontal: "24px",
	},
	collapseHeaderText: {
		fontWeight: "bold",
		fontSize: "20px",
		flex: 1,
		textAlign: "center",
		color: "white",
	},
	collapseBodyContainer: {
		height: "100%",
	},
	closeButton: {
		right: "32px",
		alignItems: "center",
		justifyContent: "center",
	},
};

const BoxData = [
	16, 32, 48, 64, 80, 96, 112, 128, 44, 160, 176, 192, 208, 224, 240, 256,
];

const icons = {
	save: require("@images/save.webp"),
	cancel: require("@images/cancel.webp"),
	edit: require("@images/edit-pencil.webp"),
};

const AdvancedSettings = () =>
{
	const dispatch = useDispatch();

	const focusSettings = useSelector((state) => state.ekos.focusSettings);

	const [activeMask, setActiveMask] = useState({
		stars: get(focusSettings, "focusNoMaskRB", false),
		ring: get(focusSettings, "focusRingMaskRB", false),
		mosaic: get(focusSettings, "focusMosaicMaskRB", false),
	});
	const [suspend, setSuspend] = useState(
		get(focusSettings, "focusSuspendGuiding", false),
	);
	const [autostar, setAutostar] = useState(
		get(focusSettings, "focusAutoStarEnabled", false),
	);
	const [subframe, setSubframe] = useState(
		get(focusSettings, "focusSubFrame", false),
	);
	const [fullfield, setFullfield] = useState(
		get(focusSettings, "focusUseFullField", false),
	);
	const [dark, setDark] = useState(
		get(focusSettings, "useFocusDarkFrame", 1000),
	);
	const [box, setBox] = useState(get(focusSettings, "focusBoxSize", 1000));
	const [inner, setInner] = useState(
		get(focusSettings, "focusFullFieldInnerRadius", 1000),
	);
	const [outer, setOuter] = useState(
		get(focusSettings, "focusFullFieldOuterRadius", 1000),
	);
	const [maskWidth, setMaskWidth] = useState(
		get(focusSettings, "focusMosaicTileWidth", 1),
	);
	const [maskSpacer, setMaskSpacer] = useState(
		get(focusSettings, "focusMosaicSpace", 1000),
	);
	const [guide_settle, setGuide_settle] = useState(
		get(focusSettings, "focusGuideSettleTime", 1000),
	);
	const [toggleBox, setToggleBox] = useState(
		get(focusSettings, "useFocusDarkFrame", 1000),
	);

	const [maxMove, setMaxMove] = useState(
		get(focusSettings, "focusAdaptiveMaxMove", 1000),
	);
	const [minMove, setMinMove] = useState(
		get(focusSettings, "focusAdaptiveMinMove", 1000),
	);
	const [adaptiveFocus, setAdaptiveFocus] = useState(
		get(focusSettings, "focusAdaptive", false),
	);
	const [adaptivePos, setAdaptivePos] = useState(
		get(focusSettings, "focusAdaptStart", false),
	);

	const setSettings = (key, payload) =>
	{
		dispatch(focusActions.setAllSettings({ [key]: payload }));
	};

	return (
		<Box sx={{ alignItems: "center" }}>
			<Box
				sx={[
					LOCAL_STYLES.collapseBodyContainer,
					{
						marginRight: "auto",
						marginLeft: "auto",
						marginTop: "50px",
					},
				]}
			>
				<Box>
					<Box sx={[styles.row, LOCAL_STYLES.collapseFormGroup]}>
						<Checkbox
							checked={autostar}
							onChange={() =>
							{
								setAutostar(!autostar);
								setSettings("focusAutoStarEnabled", !autostar);
							}}
						/>
						<Typography sx={LOCAL_STYLES.collapseLeftLabel}>
							{s.ekos.collapse_focus.settings.auto_select_star}
						</Typography>

						<Checkbox
							checked={dark}
							onChange={() =>
							{
								setDark(!dark);
								setSettings("useFocusDarkFrame", !dark);
							}}
						/>
						<Typography sx={LOCAL_STYLES.collapseLeftLabel}>
							{s.ekos.collapse_focus.settings.dark}
						</Typography>
					</Box>

					<Box sx={[styles.row, LOCAL_STYLES.collapseFormGroup]}>
						<Box sx={styles.center}>
							<RadioButton
								disabled={subframe}
								checked={subframe}
								onPress={() =>
								{
									setSubframe(!subframe);
									setFullfield(fullfield ? false : fullfield);
									setSettings(
										"focusUseFullField",
										fullfield ? false : fullfield,
									);
									setSettings("focusSubFrame", !subframe);
								}}
							/>
						</Box>
						<Typography sx={LOCAL_STYLES.collapseLeftLabel}>
							{s.ekos.collapse_focus.settings.subframe}
						</Typography>

						<Box sx={styles.center}>
							<Typography sx={{ width: "80px" }}>
								{s.ekos.collapse_guide.box}
							</Typography>
						</Box>
						{toggleBox ? (
							<NumericControl
								initialValue={box}
								onFinishedEdit={(value) =>
									{
									setBox(value);
									setSettings("focusBoxSize", value);
								}}
								totalWidth="200px"
								customLimit={[16, 512]}
								steps={[16, 16]}
							/>
						) : (
							<Dropdown
								sx={{ width: "200px", textAlign: "center" }}
								options={BoxData.map((oneBox) => ({
									label: oneBox.toString(),
									value: oneBox,
								}))}
								value={box}
								onChange={(data) =>
									{
									setBox(data.value);
									setSettings("focusBoxSize", data.value);
								}}
							/>
						)}
						<Button
							behaviour="toggle"
							active={toggleBox}
							sx={{
								width: "32px",
								height: "40px",
								marginLeft: "8px",
							}}
							onClick={() =>
							{
								setToggleBox(!toggleBox);
								setSettings("useFocusDarkFrame", !toggleBox);
							}}
						>
							<Image sx={{ width: "40px", height: "40px" }} src={icons.edit} />
						</Button>
					</Box>

					<Box sx={[styles.row, LOCAL_STYLES.collapseFormGroup]}>
						<Box sx={styles.center}>
							<RadioButton
								disabled={fullfield}
								checked={fullfield}
								handleChange={() =>
								{
									setFullfield(!fullfield);
									setSubframe(subframe ? false : subframe);
									setSettings("focusSubFrame", subframe ? false : subframe);
									setSettings("focusUseFullField", !fullfield);
								}}
							/>
						</Box>
						<Typography sx={LOCAL_STYLES.collapseLeftLabel}>
							{s.ekos.collapse_focus.settings.fullfield}
						</Typography>
					</Box>

					<Box sx={[styles.row, LOCAL_STYLES.collapseFormGroup]}>
						<Checkbox
							checked={suspend}
							onChange={() =>
							{
								setSuspend(!suspend);
								setSettings("focusSuspendGuiding", !suspend);
							}}
						/>
						<Typography sx={LOCAL_STYLES.collapseLeftLabel}>
							{s.ekos.collapse_focus.settings.suspend_guiding}
						</Typography>

						<Typography sx={{ width: "80px" }}>
							{s.ekos.collapse_align.settle}
						</Typography>
						<NumericControl
							initialValue={guide_settle}
							onFinishedEdit={(value) =>
							{
								setGuide_settle(value);
								setSettings("focusGuideSettleTime", value);
							}}
							totalWidth="200px"
							customLimit={[0, 60]}
						/>
					</Box>
				</Box>
				<Box
					sx={{
						border: "1px solid white",
						marginTop: "10px",
					}}
				>
					<Typography sx={{ textAlign: "center" }}>
						{s.ekos.collapse_focus.settings.mask}
					</Typography>
				</Box>

				<Box sx={[styles.row, { marginTop: "15px" }]}>
					<Box sx={styles.center}>
						<RadioButton
							checked={activeMask.stars}
							handleChange={() =>
							{
								setActiveMask({ stars: true });
								setSettings("focusNoMaskRB", true);
							}}
						/>
					</Box>
					<Typography sx={{ marginLeft: "10px" }}>
						{s.ekos.collapse_focus.settings.stars}
					</Typography>
				</Box>

				<Box sx={[styles.row, { marginTop: "15px" }]}>
					<Box sx={styles.center}>
						<RadioButton
							checked={activeMask.ring}
							handleChange={() =>
							{
								setActiveMask({ ring: true });
								setSettings("focusRingMaskRB", true);
							}}
						/>
					</Box>
					<Typography sx={{ marginLeft: "10px", marginRight: "50px" }}>
						{s.ekos.collapse_focus.settings.ring}
					</Typography>

					<NumericControl
						disabled={!fullfield}
						initialValue={inner}
						onFinishedEdit={(value) =>
						{
							setInner(value);
							setSettings("focusFullFieldInnerRadius", value);
						}}
						totalWidth="100px"
						steps={[10, 10]}
						customLimit={[0, 100]}
					/>
					<Typography sx={{ margin: "8px" }}>%</Typography>
					<NumericControl
						disabled={!fullfield}
						initialValue={outer}
						onFinishedEdit={(value) =>
						{
							setOuter(value);
							setSettings("focusFullFieldOuterRadius", value);
						}}
						totalWidth="100px"
						steps={[10, 10]}
						customLimit={[0, 100]}
					/>
					<Typography sx={{ margin: "8px" }}>%</Typography>
				</Box>

				<Box sx={[styles.row, { marginTop: "15px" }]}>
					<Box sx={styles.center}>
						<RadioButton
							checked={activeMask.mosaic}
							handleChange={() =>
							{
								setActiveMask({ mosaic: true });
								setSettings("focusMosaicMaskRB", true);
							}}
						/>
					</Box>
					<Typography sx={{ marginLeft: "10px", marginRight: "25px" }}>
						{s.ekos.scheduler.mosaic.mask}
					</Typography>

					<NumericControl
						disabled={!fullfield}
						initialValue={maskWidth}
						onChange={(value) =>
						{
							setMaskWidth(value);
							setSettings("focusMosaicTileWidth", value);
						}}
						totalWidth="100px"
						steps={[1, 1]}
						customLimit={[1, 26]}
					/>
					<Typography sx={{ margin: "8px" }}>%</Typography>
					<NumericControl
						disabled={!fullfield}
						initialValue={maskSpacer}
						onFinishedEdit={(value) =>
						{
							setMaskSpacer(value);
							setSettings("focusMosaicSpace", value);
						}}
						totalWidth="100px"
						steps={[10, 10]}
						customLimit={[0, 100]}
					/>
					<Typography sx={{ margin: "8px" }}>%</Typography>
				</Box>

				<Box
					sx={{
						border: "1px solid white",
						marginTop: "15px",
					}}
				>
					<Typography sx={{ textAlign: "center" }}>
						{s.ekos.collapse_focus.settings.adaptive}
					</Typography>
				</Box>

				<Box sx={{ marginTop: "15px" }}>
					<Box
						sx={[
							styles.row,
							{
								justifyContent: "space-between",
							},
						]}
					>
						<Box sx={styles.row}>
							<Box sx={styles.center}>
								<Checkbox
									onChange={() =>
									{
										setAdaptiveFocus(!adaptiveFocus);
										setSettings("focusAdaptive", !adaptiveFocus);
									}}
									checked={adaptiveFocus}
								/>
							</Box>
							<Typography sx={LOCAL_STYLES.collapseLeftLabel}>
								{s.ekos.collapse_focus.settings.adaptive}
								{s.ekos.collapse_focus.heading}
							</Typography>
						</Box>

						<Box sx={styles.row}>
							<Typography
								sx={[LOCAL_STYLES.collapseLeftLabel, { marginRight: "15px" }]}
							>
								{s.ekos.collapse_focus.settings.min_move}
							</Typography>
							<NumericControl
								initialValue={minMove}
								onChange={(value) =>
								{
									setMinMove(value);
									setSettings("focusAdaptiveMinMove", value);
								}}
								totalWidth="200px"
								customLimit={[1, 10000]}
								steps={[1, 1]}
							/>
						</Box>
					</Box>

					<Box
						sx={[
							styles.row,
							{
								justifyContent: "space-between",
								marginTop: "15px",
							},
						]}
					>
						<Box sx={styles.row}>
							<Checkbox
								checked={adaptivePos}
								onChange={() =>
								{
									setAdaptivePos(!adaptivePos);
									setSettings("focusAdaptStart", !adaptivePos);
								}}
							/>
							<Typography sx={LOCAL_STYLES.collapseLeftLabel}>
								{s.ekos.collapse_focus.settings.start}
							</Typography>
						</Box>

						<Box sx={styles.row}>
							<Typography
								sx={[LOCAL_STYLES.collapseLeftLabel, { marginRight: "15px" }]}
							>
								{s.ekos.collapse_focus.settings.max_move}
							</Typography>
							<NumericControl
								initialValue={maxMove}
								onFinishedEdit={(value) =>
								{
									setMaxMove(value);
									setSettings("focusAdaptiveMaxMove", value);
								}}
								totalWidth="200px"
								customLimit={[1, 100000]}
								steps={[1, 1]}
							/>
						</Box>
					</Box>
				</Box>
			</Box>
		</Box>
	);
};

export default AdvancedSettings;
