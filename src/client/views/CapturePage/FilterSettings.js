import { Button, Typography, Box } from "@mui/material";
import LockIcon from "@mui/icons-material/Lock";
import Image from "mui-image";
import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { captureActions, indiActions } from "@redux/actions";
import { numericControls, trainModules, DEVICE_TYPE } from "@indi/enums";
import s from "@common/shared/i18n/i18n";
import CustomizedSwitch from "@components/CustomSwitch";
import Dropdown from "@components/Dropdown";
import { styles } from "../../shared/styles";
import NumericControl from "@components/NumericControl";
import InputField from "@components/InputField";
import { reduceDecimalPlaces } from "@common/shared/common/common";
import {
	selectFilterSettings,
	selectActiveFilterWheelName,
	selectTrainDevice,
} from "@redux/selectors";

const FilterSettings = () =>
{
	const dispatch = useDispatch();
	useEffect(() =>
	{
		dispatch(captureActions.getFilterSettings());
	}, []);
	// Filter Wheel
	const filterSettings = useSelector(selectFilterSettings);
	const device = useSelector(selectActiveFilterWheelName);
	const activeCamera = useSelector((state) =>
		selectTrainDevice(state, {
			trainType: trainModules.CaptureOpticalTrain,
			deviceType: DEVICE_TYPE.CAMERA,
		}),
	);
	const [filterSettingsState, setFilterSettingsState] = useState({
		device: device,
		index: null,
		label: null,
		exposure: null,
		offset: null,
		autofocus: null,
		lock: null,
		editMode: null,
		toggleExp: null,
		flat: null,
	});

	const { label, exposure, offset, editMode } = filterSettingsState;

	const fillFilterData = (index) =>
	{
		setFilterSettingsState({
			...filterSettingsState,
			index: filterSettings.filters[index].index,
			label: filterSettings.filters[index].label,
			exposure: filterSettings.filters[index].exposure,
			offset: filterSettings.filters[index].offset,
			autofocus: filterSettings.filters[index].autofocus,
			lock: filterSettings.filters[index].lock,
			flat: filterSettings.filters[index].flat,
			editMode: true,
		});
	};

	// on mount

	return (
		<Box
			sx={{
				display: "grid",
				gridTemplateColumns: "repeat(2, 1fr)",
				columnGap: "32px",
				paddingBlock: "6px",
			}}
		>
			<Box
				sx={{
					display: "grid",
					gridTemplate: "repeat(auto-fill, 47px) / 120px 1fr",
					rowGap: "16px",
					columnGap: "10px",
					alignItems: "center",
				}}
			>
				<Typography>{s.general.name}</Typography>
				<InputField
					value={`${label || ""}`}
					onChange={(e) =>
						setFilterSettingsState({
							...filterSettingsState,
							label: e,
						})
					}
					disabled={!editMode}
					clear={() =>
						setFilterSettingsState({ ...filterSettingsState, label: "" })
					}
					height="47px"
				/>
				<Typography>{s.general.exposure}</Typography>
				<NumericControl
					initialValue={reduceDecimalPlaces(exposure)}
					editable={!filterSettingsState.editMode}
					device={activeCamera}
					type={numericControls.EXPOSURE}
					onChange={(value) =>
						setFilterSettingsState({ ...filterSettingsState, exposure: value })
					}
				/>

				<Typography>{s.general.offset}</Typography>
				<NumericControl
					initialValue={offset}
					editable={!filterSettingsState.editMode}
					device={activeCamera}
					onChange={(value) =>
						setFilterSettingsState({ ...filterSettingsState, offset: value })
					}
					customLimit={[0, 10000]}
					steps={[100, 100]}
				/>
				<Typography>{s.ekos.capture_filters.auto_focus}</Typography>
				<CustomizedSwitch
					disabled={!filterSettingsState.editMode}
					roundCorner={true}
					options={[
						{ label: s.general.off, value: false },
						{ label: s.general.on, value: true },
					]}
					onChange={(value) =>
					{
						setFilterSettingsState({
							...filterSettingsState,
							autofocus: value,
						});
					}}
					value={filterSettingsState.autofocus}
				/>

				<Typography>{s.ekos.capture_filters.lock_filter}</Typography>
				<Dropdown
					disabled={!filterSettingsState.editMode}
					options={
						filterSettings.filters &&
						Array.isArray(filterSettings.filters) &&
						filterSettings.filters.length > 0
							? [
									{
										label: "--",
										value: "--",
									},
									...filterSettings.filters.map((item) => ({
										label: item.label,
										value: item.label,
									})),
								]
							: [
									{
										label: "--",
										value: "--",
									},
								]
					}
					value={filterSettingsState.lock}
					onChange={(e) =>
						setFilterSettingsState({
							...filterSettingsState,
							lock: e.label,
						})
					}
				/>

				{filterSettingsState.editMode && (
					<>
						<Button
							sx={{ height: "80%" }}
							variant="outlined"
							onClick={() =>
							{
								setFilterSettingsState({
									...filterSettingsState,
									device: null,
									index: null,
									label: null,
									exposure: null,
									offset: "",
									autofocus: null,
									lock: null,
									editMode: false,
									toggleExp: false,
								});
							}}
						>
							{s.general.cancel}
						</Button>
						<Button
							sx={{ maxWidth: "120px", height: "80%" }}
							variant="contained"
							onClick={() =>
							{
								let filtersArr = filterSettings.filters;
								let filterObj = {
									index: filterSettingsState.index,
									label: filterSettingsState.label,
									exposure: filterSettingsState.exposure,
									offset: filterSettingsState.offset,
									autofocus: filterSettingsState.autofocus,
									lock: filterSettingsState.lock,
									flat: filterSettingsState.flat,
								};
								filtersArr.splice(filterSettingsState.index, 1, filterObj);

								let settings = {
									device: filterSettingsState.device,
									filters: filtersArr,
								};
								dispatch(captureActions.setFilterSettings(settings));

								setFilterSettingsState({
									...filterSettingsState,
									index: null,
									label: null,
									exposure: null,
									offset: "",
									autofocus: null,
									lock: null,
									editMode: false,
									toggleExp: false,
								});
								setTimeout(() =>
								{
									// Refresh all filter settings
									dispatch(captureActions.getFilterSettings());
									// Must call this as well to refresh the filter name property
									// in case it was not subscribed already for whatever reason.
									dispatch(
										indiActions.getDeviceProperty(device, "FILTER_NAME", true),
									);
								}, 1000);
							}}
						>
							{s.general.save}
						</Button>
					</>
				)}
			</Box>

			<Box
				sx={{
					display: "flex",
					flexDirection: "column",
					gap: "8px",
					maxHeight: "362px",
					overflowY: "scroll",
					width: "max-content",
				}}
			>
				{filterSettings.filters &&
				Array.isArray(filterSettings.filters) &&
				filterSettings.filters.length > 0 ? (
					filterSettings.filters.map((item, index) =>
						{
						return (
							<Button
								sx={{
									display: "grid",
									gridTemplateColumns: "20px 140px 40px 70px repeat(2, 40px)",
									padding: "6px",
									backgroundColor: "#1d1d1d",
									borderRadius: "6px",
									textTransform: "none",
								}}
								onClick={() =>
									{
									fillFilterData(index);
								}}
								key={item.label}
							>
								<Typography sx={styles.text}>{index + 1}</Typography>
								<Typography sx={styles.text}>{item.label}</Typography>
								<Box
									sx={{
										position: "relative",
										width: "35px",
										height: "35px",
										display: "grid",
										placeItems: "center",
									}}
								>
									<Image
										src="/public/icons/exposure_stopwatch.png"
										bgColor="transparent"
										width="100%"
										height="100%"
										duration={0}
									/>
									<Typography
										sx={{
											color: "white",
											position: "absolute",
											left: "50%",
											top: "50%",
											transform: "translate(-50%, -50%)",
											fontSize:
												item.exposure?.toString()?.length > 2 ? "10px" : "16px",
										}}
									>
										{item.exposure?.toString()?.length > 2
											? parseFloat(item.exposure).toFixed(3)
											: item.exposure}
									</Typography>
								</Box>

								<Box
									sx={{
										display: "flex",
										flexDirection: "row",
										justifyContent: "flex-start",
										alignItems: "center",
										gap: "4px",
									}}
								>
									<Typography
										sx={{
											textAlign: "center",
											width: "30px",
											height: "30px",
											border: "2px solid white",
											fontSize: "10px",
											color: "white",
										}}
									>
										OFF{"\n"}SET
									</Typography>
									<Typography sx={{ fontSize: "10px", color: "white" }}>
										{item.offset ? item.offset : "0"}
									</Typography>
								</Box>

								{item.autofocus != null && item.autofocus !== false ? (
									<Typography sx={{ fontSize: "10px", color: "white" }}>
										AF
									</Typography>
								) : null}

								{item.lock != null && item.lock !== "--" ? (
									<Box
										sx={{
											display: "flex",
											flexDirection: "row",
											justifyContent: "center",
											alignItems: "center",
											gap: "4px",
										}}
									>
										<LockIcon
											width={30}
											height={30}
											style={{ color: "white" }}
										/>
										<Typography sx={{ fontSize: "10px", color: "white" }}>
											{item.lock.slice(0, 3)}
										</Typography>
									</Box>
								) : null}
							</Button>
						);
					})
				) : (
					<Typography>No filters have been found</Typography>
				)}
			</Box>
		</Box>
	);
};

export default FilterSettings;
