import React, { useState } from "react";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import AdaptiveOpticIcon from "@client/icons/AdaptiveOpticIcon";
import AuxiliaryIcon from "@client/icons/AuxiliaryIcon";
import CameraTrainIcon from "@client/icons/trains/CameraIcon";
import DomeDeviceIcon from "@client/icons/DomeDeviceIcon";
import DustcapIcon from "@client/icons/trains/DustcapIcon";
import FocusIcon from "@client/icons/quick_controls/FocusIcon";
import LensIcon from "@client/icons/trains/LensIcon";
import LightBoxIcon from "@client/icons/trains/LightBoxIcon";
import ReducerIcon from "@client/icons/trains/ReducerIcon";
import TelescopeIcon from "@client/icons/trains/TelescopeIcon";
import WeatherStationDeviceIcon from "@client/icons/WeatherStationDevice";
import EquipmentFilterIcon from "@client/icons/EquipmentFilterIcon";
import ManufacturerIcon from "@client/icons/ManufacturerIcon";
import EquipmentDetailView from "./EquipmentDetailView";
import MountIcon  from "@client/icons/trains/MountIcon";
import FilterWheelIcon from "@client/icons/trains/FilterIcon";
import PowerIcon from "@client/icons/trains/PowerIcon";
import TripodIcon from "@client/icons/trains/TripodIcon";
import MountHandsetIcon from "@client/icons/trains/MountHandsetIcon";
import CounterweightSystemIcon from "@client/icons/trains/CounterweightSystemIcon";
import PierIcon from "@client/icons/trains/PierIcon";
import ThreadAdapterIcon from "@client/icons/trains/ThreadAdapterIcon";
import VisualBackIcon from "@client/icons/trains/VisualBackIcon";
import ExtensionTubeIcon from "@client/icons/trains/ExtensionTubeIcon";
import ObservatoryControllerIcon from "@client/icons/trains/ObservatoryControllerIcon";

export const typeIcons = {
    Mount: <MountIcon height={28} width={28} />,
    "Telescope / Lense": <TelescopeIcon height={28} width={28} />,
    Camera: <CameraTrainIcon height={28} width={28} />,
    Focuser: <FocusIcon height={28} width={28} />,
    "Filter Wheel": <FilterWheelIcon height={28} width={28} />,
    Dome: <DomeDeviceIcon height={28} width={28} />,
    "Adaptive Optic": <AdaptiveOpticIcon width={28} height={28} />,
    "Weather Station": <WeatherStationDeviceIcon width={28} height={28} />,
    Rotator: <ReducerIcon height={28} width={28} />,
    "Dust Cap": <DustcapIcon height={28} width={28} />,
    "Light Box": <LightBoxIcon height={28} width={28} />,
    Auxiliary: <AuxiliaryIcon height={28} width={28} />,
    "Filter": <EquipmentFilterIcon height={28} width={28} />,
    "Barlow / Reducer": <LensIcon height={28} width={28} />,
    // "Power Controller": <PowerIcon height={28} width={28} />,
	"Tripod": <TripodIcon height={28} width={28} />,
	"Mount Handset": <MountHandsetIcon height={28} width={28} />,
	"Counterweight System": <CounterweightSystemIcon height={28} width={28} />,
	"Pier": <PierIcon height={28} width={28} />,
	"Thread Adapter": <ThreadAdapterIcon height={28} width={28} />,
	"Visual Back": <VisualBackIcon height={28} width={28} />,
	"Extension Tube": <ExtensionTubeIcon height={28} width={28} />,
	"Observatory Controller": <ObservatoryControllerIcon height={28} width={28} />,
};

export const manufacturerIcon = <ManufacturerIcon height={28} width={28} />;

const EquipmentBox = ({ equipment, setFormData }) =>
{
	const [showDetailedView, setShowDetailedView] = useState(false);

	return (
		<>
			<Button
				sx={{
					display: "flex",
					flexDirection: "row",
					gap: "12px",
					alignItems: "center",
					justifyContent: "flex-start",
					textTransform: "none",
				}}
				onClick={() => setShowDetailedView(true)}
			>
				{typeIcons[equipment.equipment_type.name]}
				<Typography sx={{ color: "white", fontSize: "20px" }}>
					{equipment.label}
				</Typography>
			</Button>

			<EquipmentDetailView
				close={() => setShowDetailedView(false)}
				open={showDetailedView}
				equipment={equipment}
				setFormData={setFormData}
			/>
		</>
	);
};

export default EquipmentBox;
