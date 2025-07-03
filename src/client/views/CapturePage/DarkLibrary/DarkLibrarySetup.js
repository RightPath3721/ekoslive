import React from "react";
import { IconButton, Box, Typography } from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import { useDispatch, useSelector } from "react-redux";
import Dropdown from "../../../Components/Dropdown";
import { trainModules } from "@indi/enums";
import {
	selectDarkLibraryCameraSettings,
	selectTrains,
} from "@redux/selectors";
import CustomizedSwitch from "../../../Components/CustomSwitch";
import { captureActions, opticalTrainActions } from "@redux/actions";
import { selectTrainName } from "@redux/selectors";
import CreateDarks from "./CreateDarks";
import DefectMap from "./DefectMap";
import ViewMasters from "./ViewMasters";
import TabView from "../../../Components/TabView";
import s from "@common/shared/i18n/i18n";

const headers = [
	{
		title: "Create darks",
		component: <CreateDarks />,
		containerStyle: {
			display: "grid",
			gridTemplateColumns: "1fr",
			rowGap: "18px",
			padding: "16px",
		},
	},
	{
		title: "Create defects",
		component: <DefectMap />,
		containerStyle: {
			display: "grid",
			gridTemplateColumns: "1fr",
			rowGap: "18px",
			padding: "16px",
			paddingBottom: "0",
		},
	},
	{
		title: "View masters",
		component: <ViewMasters />,
		containerStyle: {
			display: "grid",
			gridTemplateColumns: "1fr",
			rowGap: "18px",
			padding: "16px",
			overflowY: "scroll",
		},
	},
];

const DarkLibrarySetup = ({ toggleTrains, onClose }) =>
{
	const dispatch = useDispatch();
	const settings = useSelector(selectDarkLibraryCameraSettings);
	const allTrains = useSelector(selectTrains);
	const activeTrain = useSelector((state) =>
		selectTrainName(state, { trainType: trainModules.DarkLibraryOpticalTrain }),
	);

	return (
		<Box
			sx={{
				backgroundColor: "rgba(0,0,0,1)",
				height: "38rem",
				overflow: "hidden",
			}}
		>
			<Box
				sx={{
					display: "flex",
					flexDirection: "row",
					width: "100%",
					gap: "32px",
				}}
			>
				<Box
					sx={{
						display: "flex",
						justifyContent: "flex-start",
						alignItems: "center",
						gap: "16px",
						width: "100%",
					}}
				>
					<Typography sx={{ color: "white", width: "max-content" }}>
						{s.general.train}:{" "}
					</Typography>
					<Dropdown
						onChange={(e) =>
						{
							let payload = {
								name: e.value,
								module: "darklibrary",
							};
							dispatch(opticalTrainActions.setTrain(payload));
							dispatch(opticalTrainActions.getAllTrains());
						}}
						options={allTrains}
						value={activeTrain}
					/>
					<IconButton
						onClick={toggleTrains}
						sx={[
							{
								width: "36px",
								height: "36px",
								minWidth: "auto",
								padding: 0,
								backgroundColor: "#FFFCFA1A",
								borderRadius: "4px",
							},
						]}
					>
						<EditIcon sx={{ color: "#CECECE", fontSize: 25 }} />
					</IconButton>
				</Box>

				<Box
					sx={{
						display: "flex",
						justifyContent: "flex-start",
						alignItems: "center",
						gap: "16px",
						width: "100%",
					}}
				>
					<Typography sx={{ color: "white", width: "max-content" }}>
						{s.darkLibrary.prefer}:{" "}
					</Typography>
					<CustomizedSwitch
						options={[
							{ label: "Darks", value: "Darks" },
							{ label: "Defects", value: "Defects" },
						]}
						roundCorner={true}
						onChange={(value) =>
						{
							let data = {
								isDarkPrefer: value === "Darks",
								isDefectPrefer: value === "Defects",
							};
							dispatch(captureActions.darkLibrarySetCameraPresets(data));
							dispatch(captureActions.darkLibraryGetCameraPresets());
						}}
						value={settings.preferDarksRadio ? "Darks" : "Defects"}
					/>
				</Box>
			</Box>
			<TabView onClose={onClose} tabs={headers} />
		</Box>
	);
};

export default DarkLibrarySetup;
