import { Box, Button, IconButton, Typography } from "@mui/material";
import SaveIcon from "@mui/icons-material/Save";
import { get, inRange, isEmpty } from "lodash";
import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { captureActions } from "@redux/actions";
import Checkbox from "@mui/material/Checkbox";
import Dropdown from "../../../Components/Dropdown";
import NumericControl from "../../../Components/NumericControl";
import { styles } from "../../../shared/styles";
import s from "@common/shared/i18n/i18n";
import {
	selectDarkLibraryAllSettings,
	selectDefectSettings,
	selectDarkLibraryTableData,
	selectMetadata,
} from "@redux/selectors";
import Icon from "@components/Icon";
import defaultImg from "@images/background.webp";

const DefectText = ({ title }) =>
{
	return (
		<Typography sx={{ color: "white", width: "max-content" }}>
			{title}
		</Typography>
	);
};

const DefectBackgroundText = ({ title, styles = {} }) =>
{
	return (
		<Typography
			sx={{
				background: "#444444",
				paddingBlock: "6px",
				borderRadius: "8px",
				color: "white",
				textAlign: "center",
				width: "max-content",
				minWidth: "40px",
				...styles,
			}}
		>
			{title}
		</Typography>
	);
};

const DefectMap = () =>
{
	const dispatch = useDispatch();

	const settings = useSelector(selectDarkLibraryAllSettings);
	const defectSettings = useSelector(selectDefectSettings);
	const tableData = useSelector(selectDarkLibraryTableData);
	const metadata = useSelector(selectMetadata);

	const [showControls, setShowControls] = useState(true);
	const [imageData, setImageData] = useState(defaultImg);

	const [state, setState] = useState({
		hotSpin: isEmpty(settings) ? 0 : settings.aggresivenessHotSpin,
		coldSpin: isEmpty(settings) ? 0 : settings.aggresivenessColdSpin,
		hotPixelsEnabled: isEmpty(settings) ? 0 : settings.hotPixelsEnabled,
		coldPixelsEnabled: isEmpty(settings) ? 0 : settings.coldPixelsEnabled,
		toggleEdit: true,
		dropDownString: isEmpty(settings) ? "0" : settings.masterDarksCombo,
		cameraName: "",
		saved: false,
	});

	const [rowData, setRowData] = useState({
		selectedIndex: selectedIndex,
		selectedText: selectedText,
	});
	const { selectedIndex, selectedText } = rowData;
	const {
		hotSpin,
		coldSpin,
		hotPixelsEnabled,
		coldPixelsEnabled,
		dropDownString,
		saved,
	} = state;

	/**
	 * @description - Checks if temperature is valid and sets the value for dropdown box.
	 * @returns {void}
	 */
	const isTemp = () =>
	{
		setState({ ...state, hotSpin: settings.aggresivenessHotSpin });
		setState({ ...state, coldSpin: settings.aggresivenessColdSpin });
		let masterDarksArray = [];
		if (!isEmpty(tableData))
		{
			tableData.map((rows, index) =>
			{
				let data = rows.duaration + " secs " + rows.binX + "x" + rows.binY;
				let temp = inRange(parseFloat(rows.temperature), -100, 100)
					? " @ " + rows.temperature + "°C"
					: "";
				masterDarksArray.push({
					text: data + temp,
					value: data + temp,
					index: index,
				});
				setState({ ...state, dropDownString: masterDarksArray[0].text });
			});
		}
		else setState({ ...state, dropDownString: "Default" });
	};

	/**
	 *
	 */
	const loadImage = () =>
	{
		if (!isEmpty(tableData))
		{
			tableData.map((rows, index) =>
			{
				if (index === 0)
				{
					let data = {
						row: index,
					};
					dispatch(captureActions.darkLibraryGetMastersImage(data));
				}
			});
		}
	};

	// This function returns all of the master files data
	const mastersData = () =>
	{
		let masterDarksArray = [];
		if (!isEmpty(defectSettings))
		{
			let split = defectSettings.masterDarks?.split("|");
			if (!isEmpty(split))
			{
				split.map((oneMaster, index) =>
				{
					masterDarksArray.push({ label: oneMaster, value: index });
				});
				return masterDarksArray;
			}
		}
	};

	const generateMapB = () =>
	{
		setState({
			...state,
			saved: false,
		});
		let payload = {
			hotSpin: hotSpin,
			coldSpin: coldSpin,
			hotEnabled: hotPixelsEnabled,
			coldEnabled: coldPixelsEnabled,
			isDefect: true,
		};
		dispatch(captureActions.darkLibrarySetDefectPixels(payload));
		dispatch(captureActions.darkLibraryGetDefectSettings());
	};

	const ArrowStyles = showControls
		? { right: 0, top: "15rem" }
		: { left: 0, top: "20rem" };

	const ArrowButton = () => (
		<Box sx={[ArrowStyles, { position: "absolute", display: "flex" }]}>
			<Button
				onClick={() => setShowControls(!showControls)}
				sx={{ height: "50px" }}
			>
				<Icon name="arrow-right" />
			</Button>
		</Box>
	);
	useEffect(() =>
	{
		dispatch(captureActions.darkLibraryGetDefectSettings());
		dispatch(captureActions.darkLibraryGetViewMasters());
		loadImage();
		isTemp();
	}, []);

	useEffect(() =>
	{
		let payload = {
			aggresivenessHotSpin: hotSpin,
			aggresivenessColdSpin: coldSpin,
			hotPixelsEnabled: hotPixelsEnabled,
			coldPixelsEnabled: coldPixelsEnabled,
			masterDarksCombo: dropDownString,
		};
		dispatch(captureActions.setDarkLibrarySettings(payload));
		dispatch(captureActions.getAllDarkLibrarySettings());

		// add slight delay so the UI in Ekos::Dark library gets updated and then call to receive the payload
		setTimeout(
			() => dispatch(captureActions.darkLibraryGetDefectSettings()),
			1000,
		);
	}, [state]);

	useEffect(() =>
	{
		if (!isEmpty(metadata))
		{
			if (get(metadata, "uuid", "") === "+D")
			{
				setImageData(metadata.preview + "?ts=" + new Date());
			}
		}
	}, [metadata]);

	return (
		<Box>
			{showControls && (
				<Box
					sx={{
						position: "absolute",
						backgroundColor: "rgba(0,0,0,0.7)",
						height: "80%",
					}}
				>
					{" "}
					<Box sx={[LOCAL_STYLES.gridItem]}>
						<DefectText title={s.darkLibrary.create_defect_map.master_dark} />
						<Dropdown
							options={mastersData()}
							value={defectSettings.masterDarks || "Default"}
							onChange={({ label, value }) =>
							{
								if (!isEmpty(tableData))
								{
									let imagePayload = {
										row: value,
									};
									setState({
										...state,
										dropDownString: label,
										saved: false,
										hotSpin: settings.aggresivenessHotSpin,
										coldSpin: settings.aggresivenessColdSpin,
									});
									setRowData({
										...rowData,
										selectedIndex: value,
										selectedText: label,
									});
									// dispatch(
									//     captureActions.darkLibrarySetDefectSettings(payload)
									// );
									dispatch(
										captureActions.darkLibraryGetMastersImage(imagePayload),
									);
									dispatch(captureActions.darkLibrarySetDefectSettings());
									// dispatch(captureActions.darkLibraryGetDefectSettings());
								}
							}}
							width="280px"
						/>
					</Box>
					<Typography sx={[LOCAL_STYLES.textTitle]}>{s.status.info}</Typography>
					<Box sx={[LOCAL_STYLES.gridItem]}>
						<DefectText title={`${s.status.time}: `} />
						<DefectBackgroundText
							styles={{ paddingInline: "6px" }}
							title={defectSettings.masterTime}
						/>
					</Box>
					<Box sx={[LOCAL_STYLES.gridItem]}>
						<DefectText title="Exposure" />
						<DefectBackgroundText title={defectSettings.masterExposure} />
					</Box>
					<Box
						sx={[
							LOCAL_STYLES.gridItem,
							{ gridTemplateColumns: "140px auto 140px auto" },
						]}
					>
						<DefectText title="Mean" />
						<DefectBackgroundText title={defectSettings.masterMean} />

						{inRange(
							parseFloat(defectSettings.masterTempreture),
							-100,
							100,
						) && (
							<>
								<DefectText title="Temperature" />
								<DefectBackgroundText title={defectSettings.masterTempreture} />
							</>
						)}
					</Box>
					<Box
						sx={[
							LOCAL_STYLES.gridItem,
							{ gridTemplateColumns: "140px auto 140px auto" },
						]}
					>
						<DefectText title="Median" />
						<DefectBackgroundText title={defectSettings.masterMedian} />

						<DefectText title="σ" />
						<DefectBackgroundText title={defectSettings.masterDeviation} />
					</Box>
					<Typography sx={[LOCAL_STYLES.textTitle]}>
						{s.darkLibrary.create_defect_map.bad_pixels}
					</Typography>
					<Box sx={[LOCAL_STYLES.gridCheckbox]}>
						<Checkbox
							style={{ color: "white" }}
							checked={hotPixelsEnabled}
							onChange={() =>
								setState({
									...state,
									hotPixelsEnabled: !hotPixelsEnabled,
								})
							}
							inputProps={{ "aria-label": "controlled" }}
						/>
						<DefectText title={s.darkLibrary.create_defect_map.hot_pixels} />
						<DefectBackgroundText
							title={settings.hotPixelsCount}
							styles={{ paddingBlock: "12px" }}
						/>
						<NumericControl
							onChange={(e) =>
							{
								setState({
									...state,
									saved: false,
								});
								setState({ ...state, hotSpin: e });
							}}
							initialValue={hotSpin}
							steps={[1, 1]}
							customLimit={[0, 100]}
						/>
					</Box>
					<Box sx={[LOCAL_STYLES.gridCheckbox]}>
						<Checkbox
							style={{ color: "white" }}
							checked={coldPixelsEnabled}
							onClick={() =>
								setState({
									...state,
									coldPixelsEnabled: !coldPixelsEnabled,
								})
							}
							inputProps={{ "aria-label": "controlled" }}
						/>
						<DefectText title={s.darkLibrary.create_defect_map.cold_pixels} />
						<DefectBackgroundText
							title={settings.coldPixelsCount}
							styles={{ paddingBlock: "12px" }}
						/>
						<NumericControl
							onChange={(e) =>
							{
								setState({
									...state,
									saved: false,
								});
								setState({ ...state, coldSpin: e });
							}}
							initialValue={coldSpin}
							steps={[1, 1]}
							customLimit={[0, 100]}
						/>
					</Box>
					<Box
						sx={[
							styles.row,
							{
								alignItems: "center",
								justifyContent: "center",
								padding: "10px",
							},
						]}
					>
						<Button
							disabled={isEmpty(tableData)}
							onClick={generateMapB}
							sx={{
								background: "#444444",
								padding: "6px 12px",
								borderRadius: "8px",
								color: "white",
								textAlign: "center",
								width: "max-content",
							}}
						>
							{s.darkLibrary.create_defect_map.generate_map}
						</Button>
						<IconButton
							disabled={isEmpty(tableData)}
							onClick={() =>
							{
								dispatch(captureActions.darkLibrarySaveMap());
								setState({ ...state, saved: true });
							}}
						>
							<SaveIcon sx={{ color: "#FF6600", fontSize: 30 }} />
						</IconButton>
						{saved && (
							<Typography sx={{ color: "white", width: "max-content" }}>
								{s.darkLibrary.create_defect_map.save_map}
							</Typography>
						)}
					</Box>
					<ArrowButton />
				</Box>
			)}
			<img style={LOCAL_STYLES.image} src={imageData} />

			{!showControls && <ArrowButton />}
		</Box>
	);
};

const LOCAL_STYLES = {
	gridItem: {
		display: "grid",
		gridTemplateColumns: "140px auto",
		alignItems: "center",
		padding: "10px",
	},
	textTitle: {
		margin: "0 auto",
		color: "white",
		fontSize: "20px",
		width: "max-content",
	},
	gridCheckbox: {
		display: "grid",
		gridTemplateColumns: "50px 120px auto auto",
		justifyContent: "flex-start",
		padding: "10px",
		alignItems: "center",
	},
	image: {
		objectFit: "contain",
		width: "80%",
		height: "80%",
		maxHeight: "calc(100vh - 280px)",
	},
};

export default DefectMap;
