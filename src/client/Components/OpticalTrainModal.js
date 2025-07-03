import { Button, Typography, Box } from "@mui/material";
import { isEmpty } from "lodash";
import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { opticalTrainActions } from "@redux/actions";
import NumericControl from "./NumericControl";
import { SelectInput } from "./Select";
import InputField from "./InputField";
import s from "@common/shared/i18n/i18n";
import { styles } from "../shared/styles";
import { Palette } from "@common/shared/common/styles";
import CameraTrainIcon from "@client/icons/trains/CameraIcon";
import CompassIcon from "@client/icons/trains/CompassIcon";
import DustcapIcon from "@client/icons/trains/DustcapIcon";
import TrainsFilterIcon from "@client/icons/trains/FilterIcon";
import FocusIcon from "@client/icons/quick_controls/FocusIcon";
import GuiderIcon from "@client/icons/trains/GuiderIcon";
import LensIcon from "@client/icons/trains/LensIcon";
import LightBoxIcon from "@client/icons/trains/LightBoxIcon";
import ReducerIcon from "@client/icons/trains/ReducerIcon";
import TelescopeIcon from "@client/icons/trains/TelescopeIcon";

import {
	selectMountOptions,
	selectLightBoxOptions,
	selectFocuserOptions,
	selectCameraOptions,
	selectDustCapOptions,
	selectRotatorOptions,
	selectGuiderOptions,
	selectFilterWheelOptions,
	selectScopeOptions,
} from "@redux/selectors";

const type = {
	name: "name",
	mount: "Mount",
	focuser: "Focuser",
	lightbox: "Light Box",
	camera: "Camera",
	dustcap: "Dust Cap",
	rotator: "Rotator",
	guider: "Guider",
	filterwheel: "Filter Wheel",
	scope: "Scope",
	reducer: "Reducer",
};

const TrainRow = ({ title, onChange, type, data, value, icon }) =>
{
	return (
		<Box>
			<Typography sx={{ color: Palette.orange, marginBottom: "4px" }}>
				{title}
			</Typography>
			<Box sx={[styles.row, { alignItems: "center", gap: "6px" }]}>
				{icon}
				<SelectInput
					onChange={(value, type) => onChange(value, type)}
					type={type}
					options={data}
					value={value}
				/>
			</Box>
		</Box>
	);
};

const OpticalTrainModal = ({ currentTrain, toggleScopeLens }) =>
{
	const dispatch = useDispatch();
	const mount = useSelector(selectMountOptions);
	const lightBox = useSelector(selectLightBoxOptions);
	const focuser = useSelector(selectFocuserOptions);
	const camera = useSelector(selectCameraOptions);

	const dustCap = useSelector(selectDustCapOptions);
	const rotator = useSelector(selectRotatorOptions);
	const guider = useSelector(selectGuiderOptions);
	const filterWheel = useSelector(selectFilterWheelOptions);
	const scope = useSelector(selectScopeOptions);

	const [state, setState] = useState({
		camera: "",
		dustcap: "",
		filterwheel: "",
		focuser: "",
		guider: "",
		lightbox: "",
		mount: "",
		name: "",
		reducer: 1,
		rotator: "",
		scope: "",
	});

	const updateTrain = (data, oneType) =>
	{
		switch (oneType)
		{
			case type.name:
				return setState((prevState) => ({ ...prevState, name: data }));
			case type.mount:
				return setState((prevState) => ({ ...prevState, mount: data.label }));
			case type.camera:
				return setState((prevState) => ({ ...prevState, camera: data.label }));
			case type.dustcap:
				return setState((prevState) => ({ ...prevState, dustcap: data.label }));
			case type.lightbox:
				return setState((prevState) => ({
					...prevState,
					lightbox: data.label,
				}));
			case type.filterwheel:
				return setState((prevState) => ({
					...prevState,
					filterwheel: data.label,
				}));
			case type.rotator:
				return setState((prevState) => ({ ...prevState, rotator: data.label }));
			case type.guider:
				return setState((prevState) => ({ ...prevState, guider: data.label }));
			case type.scope:
				return setState((prevState) => ({ ...prevState, scope: data.label }));
			case type.reducer:
				return setState((prevState) => ({ ...prevState, reducer: data }));
			case type.focuser:
				return setState((prevState) => ({ ...prevState, focuser: data.label }));
			default:
				return;
		}
	};

	// run when state is changed
	useEffect(() =>
	{
		dispatch(opticalTrainActions.updateTrain(state));
	}, [state]);

	// Set settings for a train specifically
	useEffect(() =>
	{
		if (!isEmpty(currentTrain))
		{
			setState({
				...state,
				...currentTrain,
			});
		}
	}, [currentTrain]);

	return (
		<Box sx={[LOCAL_STYLES.root]}>
			<Box
				sx={{
					display: "flex",
					flexDirection: "row",
					alignItems: "center",
					gap: "6px",
				}}
			>
				<Typography sx={{ color: Palette.orange }}>{s.general.name}</Typography>
				<InputField
					value={state.name}
					placeholder="Train name"
					onChange={(val) => updateTrain(val, type.name)}
					clear={() => setState({ ...state, name: "" })}
					height="45px"
				/>
			</Box>

			<Box
				sx={{
					display: "grid",
					gridTemplateColumns: "repeat(2, 1fr)",
					gap: "16px",
				}}
			>
				<TrainRow
					title={s.tourGuide.title_mount}
					icon={<TelescopeIcon width={24} height={24} />}
					onChange={(value, type) => updateTrain(value, type)}
					type={type.mount}
					data={mount}
					value={state.mount}
				/>

				<TrainRow
					title="Light Box"
					icon={<LightBoxIcon width={24} height={24} />}
					onChange={(value, type) => updateTrain(value, type)}
					type={type.lightbox}
					data={lightBox}
					value={state.lightbox}
				/>

				<Box>
					<Typography sx={{ color: Palette.orange, marginBottom: "4px" }}>
						Reducer
					</Typography>
					<Box sx={[styles.row, { alignItems: "center", gap: "6px" }]}>
						<CompassIcon width={24} height={24} />
						<NumericControl
							initialValue={state.reducer}
							onChange={(val) =>
							{
								updateTrain(val, type.reducer);
							}}
							steps={[0.1, 0.1]}
							customLimit={[0.1, 3.0]}
							height={38}
						/>
					</Box>
				</Box>

				<TrainRow
					title={s.general.focuser}
					icon={<FocusIcon width={24} height={24} />}
					onChange={(value, type) => updateTrain(value, type)}
					type={type.focuser}
					data={focuser}
					value={state.focuser}
				/>

				<TrainRow
					title={s.general.camera}
					icon={<CameraTrainIcon width={24} height={24} />}
					onChange={(value, type) => updateTrain(value, type)}
					type={type.camera}
					data={camera}
					value={state.camera}
				/>

				<TrainRow
					title="Dust Cap"
					icon={<DustcapIcon width={24} height={24} />}
					onChange={(value, type) => updateTrain(value, type)}
					type={type.dustcap}
					data={dustCap}
					value={state.dustcap}
				/>

				<TrainRow
					title={s.connect.scope}
					icon={<LensIcon width={24} height={24} />}
					onChange={(value, type) => updateTrain(value, type)}
					type={type.scope}
					data={scope}
					value={state.scope}
				/>

				<TrainRow
					title="Rotator"
					icon={<ReducerIcon width={24} height={24} />}
					onChange={(value, type) => updateTrain(value, type)}
					type={type.rotator}
					data={rotator}
					value={state.rotator}
				/>

				<TrainRow
					title={s.general.filter_wheel}
					icon={<TrainsFilterIcon width={24} height={24} />}
					onChange={(value, type) => updateTrain(value, type)}
					type={type.filterwheel}
					data={filterWheel}
					value={state.filterwheel}
				/>

				<TrainRow
					title={s.tourGuide.title_guide}
					icon={<GuiderIcon width={24} height={24} />}
					onChange={(value, type) => updateTrain(value, type)}
					type={type.guider}
					data={guider}
					value={state.guider}
				/>
			</Box>

			<Button onClick={() => toggleScopeLens(true)} sx={[LOCAL_STYLES.btn]}>
				{s.optical_train.telescope}
			</Button>
		</Box>
	);
};

const LOCAL_STYLES = {
	btn: {
		backgroundColor: "#ff6600",
		color: "#FFFFFF",
		textTransform: "none",
		width: "175px",
		height: "46px",
		border: "1px solid #2d2d2d",
		marginLeft: "auto",
	},
	root: {
		display: "flex",
		flexDirection: "column",
		gap: "12px",
	},
};

export default OpticalTrainModal;
