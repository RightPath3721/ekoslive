import React, { useEffect, useState } from "react";
import { Box } from "@mui/system";
import Grid from "@mui/material/Grid";
import { get, isEmpty } from "lodash";
import { useDispatch, useSelector } from "react-redux";
import { captureActions } from "@redux/actions";
import api from "@common/shared/utils/api";
import { selectFileSettings, selectPicturesDirectory } from "@redux/selectors";
import { setupActions } from "@redux/actions";
import { IconButton, Typography } from "@mui/material";
import InputField from "@components/InputField";
import NumericControl from "@components/NumericControl";
import SettingsRoundedIcon from "@mui/icons-material/SettingsRounded";
import FolderRoundedIcon from "@mui/icons-material/FolderRounded";
import s from "@common/shared/i18n/i18n";
import DirectoryBrowser from "@components/DirectoryBrowser";
import FormatSettings from "./FormatSettings";
import CloseButton from "@components/CloseButton";

const LOCAL_STYLES = {
	image: {
		width: "100%",
		height: "100%",
		maxWidth: "100%",
		marginLeft: "auto",
		marginRight: "auto",
		cursor: "pointer",
	},
	gridItem: {
		display: "grid",
		gridTemplateColumns: "70px auto auto auto auto",
		justifyContent: "flex-start",
		alignItems: "center",
		width: "100%",
		gap: "12px",
	},
	imageButton: { width: "40px", height: "40px", minWidth: "auto", padding: 0 },
};

const KEYS = {
	targetNameT: "targetNameT",
	fileDirectoryT: "fileDirectoryT",
	placeholderFormatT: "placeholderFormatT",
	formatSuffixN: "formatSuffixN",
};

const FileSettings = ({ onClose }) =>
{
	const dispatch = useDispatch();

	const fileSettings = useSelector(selectFileSettings);
	const picturesDirectory = useSelector(selectPicturesDirectory);
	const captureSettings = useSelector((state) => state.ekos.captureSettings);

	const selectedDeviceIP = useSelector(
		(state) => state.devices.selectedDevice.ip,
	);

	const NEW_STATE = {
		prefix: isEmpty(fileSettings) ? "" : fileSettings.prefix,
		directory: get(captureSettings, KEYS.fileDirectoryT, ""),
		format: get(captureSettings, KEYS.placeholderFormatT, ""),
		suffix: get(captureSettings, KEYS.formatSuffixN, ""),
	};

	const [showDirectory, setShowDirectory] = useState(false);
	const [showFormatSettings, setShowFormatSettings] = useState(false);

	const prefix = isEmpty(fileSettings) ? "" : fileSettings.prefix;

	const [state, setState] = useState(NEW_STATE);
	const { directory, format, suffix } = state;

	/**
	 * To get the USB Devices attached with the Stellarmate Device/Computer.
	 */
	const getExternalStorageDevices = async () =>
	{
		try
		{
			let disks = [];
			const response = await api.getExternalStorageInfo(selectedDeviceIP);
			for (const oneDisk of response)
			{
				if (oneDisk["mountpoint"].startsWith("/media/stellarmate"))
				{
					disks.push(oneDisk["mountpoint"]);
				}
			}
		}
		catch
		{}
	};

	/**
	 * Set settings If New capture settings are supported
	 * @param {*} key placeholderFormatT
	 * @param {*} value value i.e /%t/%T
	 * @param {*} type state type
	 */
	const setSettings = (key, value, type) =>
	{
		setState({ ...state, [type]: value });
		dispatch(captureActions.setAllSettings({ [key]: value }));
	};

	const onSaveFileSettings = (settings) =>
	{
		dispatch(captureActions.saveFileSettings(settings));
	};

	const useEffectAsync = (effect, inputs) =>
	{
		useEffect(() =>
		{
			effect();
		}, inputs);
	};

	useEffectAsync(async () =>
	{
		await getExternalStorageDevices();
	}, []);

	useEffect(() =>
	{
		let data = {
			prefix: prefix,
			directory: directory,
			format: format,
			suffix: suffix,
		};
		onSaveFileSettings(data);
		dispatch(captureActions.setFileSettings(data));
	}, [prefix, directory, format, suffix]);

	return (
		<Grid
			sx={{
				width: "100%",
				display: "grid",
				gridTemplateColumns: "1fr",
				rowGap: "12px",
				justifyItems: "center",
				position: "relative",
			}}
		>
			<CloseButton onChange={onClose} />
			{showDirectory && !showFormatSettings && (
				<DirectoryBrowser
					toggle={() => setShowDirectory(false)}
					dir={`${picturesDirectory}`}
					onConfirm={(dir) =>
					{
						setShowDirectory(false);
						setState({ ...state, directory: dir });
						setSettings(KEYS.fileDirectoryT, dir, "directory");
						dispatch(setupActions.savePicturesDirectory(dir));
					}}
					show={showDirectory}
					fileExtension="dir"
					isFolder={true}
					selection={setShowDirectory}
				/>
			)}
			{showFormatSettings && (
				<FormatSettings
					format={format}
					preview={fileSettings.preview}
					setPreview={(value) => setState({ ...state, format: value })}
					modal={showFormatSettings}
				/>
			)}
			{!showFormatSettings && (
				<>
					<Typography sx={{ width: "100%", textAlign: "center" }}>
						{s.ekos.capture_file.heading}
					</Typography>
					<Box
						sx={[LOCAL_STYLES.gridItem, { alignItems: "center", gap: "6px" }]}
					>
						<Typography sx={{ width: "100%" }}>
							{s.ekos.capture_file.directory}
						</Typography>
						<InputField
							value={directory || ""}
							height="38px"
							width="250px"
							onChange={(value) =>
								setSettings(KEYS.fileDirectoryT, value, "directory")
							}
						/>
						<IconButton
							onClick={() => setShowDirectory(true)}
							sx={[
								LOCAL_STYLES.imageButton,
								{ backgroundColor: "#FFFCFA1A", borderRadius: "4px" },
							]}
						>
							<FolderRoundedIcon sx={{ color: "#CECECE", fontSize: 25 }} />
						</IconButton>
					</Box>
					<Box
						sx={[LOCAL_STYLES.gridItem, { alignItems: "center", gap: "6px" }]}
					>
						<Typography>{s.ekos.capture_file.suffix}</Typography>
						<NumericControl
							initialValue={suffix}
							onChange={(val) => setSettings(KEYS.formatSuffixN, val, "suffix")}
							steps={[1, 1]}
							customLimit={[1, 9]}
						/>
					</Box>
					<Box
						sx={[LOCAL_STYLES.gridItem, { alignItems: "center", gap: "6px" }]}
					>
						<Typography>{s.tourGuide.title_preview}</Typography>
						<Typography>{fileSettings?.preview || "--"}</Typography>
					</Box>
					<Box
						sx={[LOCAL_STYLES.gridItem, { alignItems: "center", gap: "6px" }]}
					>
						<Typography>{s.general.format}</Typography>
						<InputField
							width="250px"
							value={format || ""}
							height="38px"
							onChange={(value) =>
								setSettings(KEYS.placeholderFormatT, value, "format")
							}
						/>
						<IconButton
							onClick={() => setShowFormatSettings(true)}
							sx={[
								LOCAL_STYLES.imageButton,
								{ backgroundColor: "#FFFCFA1A", borderRadius: "4px" },
							]}
						>
							<SettingsRoundedIcon sx={{ color: "#CECECE", fontSize: 25 }} />
						</IconButton>
					</Box>
				</>
			)}
		</Grid>
	);
};

export default FileSettings;
