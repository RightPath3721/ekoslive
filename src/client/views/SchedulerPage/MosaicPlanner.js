import React, { useEffect, useState } from "react";
import Button from "@mui/material/Button";
import Checkbox from "@mui/material/Checkbox";
import IconButton from "@mui/material/IconButton";
import Input from "@mui/material/Input";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";
import SnippetFolderIcon from "@mui/icons-material/SnippetFolder";
import { isEmpty } from "lodash";
import { useDispatch, useSelector } from "react-redux";
import { schedulerActions } from "@redux/actions";
import { selectHomeDir, selectPicturesDirectory } from "@redux/selectors";
import InputField from "../../Components/InputField";
import { Palette } from "@common/shared/common/styles";
import s from "@common/shared/i18n/i18n";
import DirectoryBrowser from "@components/DirectoryBrowser";
import { styles } from "@client/shared/styles";
import CloseButton from "@components/CloseButton";

const SchedulerText = ({ title, styles }) =>
{
	return (
		<Typography
			sx={{
				color: "white",
				width: "max-content",
				textTransform: "none",
				padding: "10px",
				...styles,
			}}
		>
			{title}
		</Typography>
	);
};

const MosaicCheckbox = ({ checked, onChange, title }) =>
{
	return (
		<Box sx={{ display: "flex", flexDirection: "row", gap: "4px" }}>
			<Checkbox
				checked={checked}
				onChange={onChange}
				style={{ color: "white", padding: 0 }}
			/>
			<SchedulerText title={title} />
		</Box>
	);
};

const MosaicPlanner = ({ onClose }) =>
{
	const dispatch = useDispatch();
	// const [schedulerSetting, setSchedulerSetting] = useState();
	const schedulerSetting = {};
	const picturesDirectory = useSelector(selectPicturesDirectory);
	const homeDir = useSelector(selectHomeDir);

	const [state, setState] = useState({
		target: "",
		sequence: isEmpty(schedulerSetting) ? "" : schedulerSetting?.mosaicSequence,
		track: true,
		focus: true,
		align: true,
		guide: true,
		showDirectoryBrowser: false,
		directory: "",
		csv: "",
	});

	const {
		target,
		sequence,
		track,
		focus,
		align,
		guide,
		csv,
		showDirectoryBrowser,
		directory,
	} = state;

	// Import mosaic
	const createJobs = () =>
	{
		let payload = {
			csv: csv,
			sequence: sequence,
			target: target,
			directory: picturesDirectory,
			track: track,
			align: align,
			focus: focus,
			guide: guide,
			copiedText: "",
		};
		dispatch(schedulerActions.mosiacPlanner(payload));
		onClose();
	};

	const handleFileSelection = (path) =>
	{
		setState({ ...state, sequence: path });
	};

	// update sequence file added
	useEffect(() =>
	{
		setState({ ...state, sequence: schedulerSetting?.mosaicSequence });
	}, [schedulerSetting]);

	return (
		<Box sx={[LOCAL_STYLES.modal]}>
			<CloseButton onChange={onClose} />
			<SchedulerText
				title={s.ekos.scheduler.mosaic.planner}
				styles={{ gridColumn: "span 2" }}
			/>
			{showDirectoryBrowser && (
				<DirectoryBrowser
					show={showDirectoryBrowser}
					toggle={() =>
						setState((prevState) => ({
							...prevState,
							showDirectoryBrowser: false,
						}))
					}
					dir={directory}
					fileExtension="esq"
					selection={handleFileSelection}
					isFile={true}
				/>
			)}
			<SchedulerText title={s.general.target} />
			<InputField
				value={target}
				width="250px"
				onChange={(e) => setState({ ...state, target: e })}
				placeholder="M 31"
				clear={() => setState({ ...state, target: "" })}
			/>

			<SchedulerText title="CSV" />
			<InputField
				value={csv}
				onChange={(e) => setState({ ...state, csv: e })}
				placeholder="CSV"
				clear={() => setState({ ...state, csv: "" })}
				sx={{
					color: "white",
					backgroundColor: "#1d1d1d",
					padding: "4px",
					border: "1px solid red",
				}}
				width="250px"
				height="150px"
			/>

			<Box
				sx={{
					marginTop: "10px",
				}}
			>
				<SchedulerText title={s.ekos.collapse_sequence.sequence} />
				<Input
					value={sequence || "None"}
					contentEditable={false}
					disableUnderline
					sx={[styles.text, { backgroundColor: "#1d1d1d", paddingLeft: "8px" }]}
				/>
				<IconButton
					// onClick={() => setState({ ...state, showDirectoryBrowser: true })}
					onClick={async () =>
					{
						setState((prevState) => ({
							...prevState,
							showDirectoryBrowser: true,
							directory: homeDir + "/Documents",
						}));
					}}
					sx={{
						width: "40px",
						height: "40px",
						minWidth: "auto",
						padding: 0,
						borderRadius: "4px",
						backgroundColor: "#FFFCFA1A",
					}}
				>
					<SnippetFolderIcon sx={{ color: "white", fontSize: 20 }} />
				</IconButton>
			</Box>

			<SchedulerText title={s.ekos.collapse_focus.steps} />

			<Box
				sx={{
					display: "flex",
					flexDirection: "row",
					alignItems: "center",
					gap: "10px",
				}}
			>
				<MosaicCheckbox
					title={s.general.track}
					checked={track}
					onChange={() => setState({ ...state, track: !track })}
				/>

				<MosaicCheckbox
					title={s.tourGuide.title_focus}
					checked={focus}
					onChange={() => setState({ ...state, focus: !focus })}
				/>
				<MosaicCheckbox
					title={s.tourGuide.title_align}
					onChange={() => setState({ ...state, align: !align })}
					checked={align}
				/>
				<MosaicCheckbox
					title={s.tourGuide.title_guide}
					onChange={() => setState({ ...state, guide: !guide })}
					checked={guide}
				/>
			</Box>

			<Button
				disabled={
					isEmpty(sequence) ||
					sequence === "None" ||
					isEmpty(csv) ||
					isEmpty(target)
				}
				onClick={createJobs}
				sx={{
					backgroundColor: Palette.orange,
					color: "white",
					gridColumn: "span 2",
					width: "160px",
					"&:disabled": { color: "white" },
				}}
			>
				{s.ekos.scheduler.mosaic.import}
			</Button>
		</Box>
	);
};

const LOCAL_STYLES = {
	modal: {
		padding: "20px",
	},
};

export default MosaicPlanner;
