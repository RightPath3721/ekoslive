import React from "react";
import CloseIcon from "@mui/icons-material/Close";
import EmojiFlagsIcon from "@mui/icons-material/EmojiFlags";
import TrackChangesIcon from "@mui/icons-material/TrackChanges";
import CameraAltIcon from "@mui/icons-material/CameraAlt";
import FilterIcon from "@mui/icons-material/Filter";
import DeviceThermostatIcon from "@mui/icons-material/DeviceThermostat";
import FullscreenIcon from "@mui/icons-material/Fullscreen";
import SearchIcon from "@mui/icons-material/Search";
import FindReplaceIcon from "@mui/icons-material/FindReplace";
import ArrowUpwardIcon from "@mui/icons-material/ArrowUpward";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import ArrowDownwardIcon from "@mui/icons-material/ArrowDownward";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import HighlightOffIcon from "@mui/icons-material/HighlightOff";
import KeyboardArrowUpIcon from "@mui/icons-material/KeyboardArrowUp";
import KeyboardArrowLeftIcon from "@mui/icons-material/KeyboardArrowLeft";
import KeyboardArrowRightIcon from "@mui/icons-material/KeyboardArrowRight";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import DownloadIcon from "@mui/icons-material/Download";
import AspectRatioIcon from "@mui/icons-material/AspectRatio";
import GridViewIcon from "@mui/icons-material/GridView";
import DeleteForeverIcon from "@mui/icons-material/DeleteForever";
import PowerIcon from "@mui/icons-material/Power";
import PowerOffIcon from "@mui/icons-material/PowerOff";
import VisibilityIcon from "@mui/icons-material/Visibility";
import FormatListBulletedIcon from "@mui/icons-material/FormatListBulleted";
import FilterAltIcon from "@mui/icons-material/FilterAlt";
import StarRateIcon from "@mui/icons-material/StarRate";
import SettingsBackupRestoreIcon from "@mui/icons-material/SettingsBackupRestore";
import NorthEastIcon from "@mui/icons-material/NorthEast";
import SouthEastIcon from "@mui/icons-material/SouthEast";
import FlareIcon from "@mui/icons-material/Flare";
import EastIcon from "@mui/icons-material/East";
import FavoriteIcon from "@mui/icons-material/Favorite";
import AddIcon from "@mui/icons-material/Add";
import RemoveIcon from "@mui/icons-material/Remove";
import GpsFixedIcon from "@mui/icons-material/GpsFixed";
import WbSunnyIcon from "@mui/icons-material/WbSunny";
import NightlightRoundIcon from "@mui/icons-material/NightlightRound";
import EditIcon from "@mui/icons-material/Edit";
import CheckIcon from "@mui/icons-material/Check";
import HeightIcon from "@mui/icons-material/Height";
import ScheduleIcon from "@mui/icons-material/Schedule";
import VignetteIcon from "@mui/icons-material/Vignette";
import InfoIcon from "@mui/icons-material/Info";
import CrisisAlertIcon from "@mui/icons-material/CrisisAlert";
import FolderCopyIcon from "@mui/icons-material/FolderCopy";
import SaveAsIcon from "@mui/icons-material/SaveAs";
import RotateRightIcon from "@mui/icons-material/RotateRight";
import HelpIcon from "@mui/icons-material/Help";
import WarningIcon from "@mui/icons-material/Warning";
import ErrorIcon from "@mui/icons-material/Error";
import HourglassBottomIcon from "@mui/icons-material/HourglassBottom";
import FlipCameraIosIcon from "@mui/icons-material/FlipCameraIos";
import ThermostatIcon from "@mui/icons-material/Thermostat";
import SpeedIcon from "@mui/icons-material/Speed";
import OpacityIcon from "@mui/icons-material/Opacity";
import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";
import CloudIcon from "@mui/icons-material/Cloud";
import CircleIcon from "@mui/icons-material/Circle";
import ThunderstormIcon from "@mui/icons-material/Thunderstorm";
import AcUnitIcon from "@mui/icons-material/AcUnit";
import ClearAllIcon from "@mui/icons-material/ClearAll";
import SquareFootIcon from "@mui/icons-material/SquareFoot";
import NumbersIcon from "@mui/icons-material/Numbers";
import ExpandIcon from "@mui/icons-material/Expand";
import { LibraryBooks } from "@mui/icons-material";
import BarChartIcon from "@mui/icons-material/BarChart";
import RefreshIcon from "@mui/icons-material/Refresh";
import CleaningServicesIcon from "@mui/icons-material/CleaningServices";

const Icon = ({ name, onClick, color, size = "20px" }) =>
{
	return name === "Close" ? (
		<CloseIcon sx={{ color: color, fontSize: size }} onClick={onClick} />
	) : name === "books" ? (
		<LibraryBooks sx={{ color: color, fontSize: size }} onClick={onClick} />
	) : name === "barchart" ? (
		<BarChartIcon sx={{ color: color, fontSize: size }} onClick={onClick} />
	) : name === "ruler" ? (
		<SquareFootIcon sx={{ color: color, fontSize: size }} onClick={onClick} />
	) : name === "altimeter" ? (
		<ExpandIcon sx={{ color: color, fontSize: size }} onClick={onClick} />
	) : name === "numbers" ? (
		<NumbersIcon sx={{ color: color, fontSize: size }} onClick={onClick} />
	) : name === "Flag" ? (
		<EmojiFlagsIcon sx={{ color: color, fontSize: size }} />
	) : name === "clear" ? (
		<ClearAllIcon onClick={onClick} sx={{ color: color, fontSize: size }} />
	) : name === "clean" ? (
		<CleaningServicesIcon
			onClick={onClick}
			sx={{ color: color, fontSize: size }}
		/>
	) : name === "camera" ? (
		<CameraAltIcon sx={{ color: color, fontSize: size }} />
	) : name === "filter" ? (
		<FilterIcon sx={{ color: color, fontSize: size }} />
	) : name === "temperature" ? (
		<DeviceThermostatIcon sx={{ color: color, fontSize: size }} />
	) : name === "fullscreen" ? (
		<FullscreenIcon sx={{ color: color, fontSize: size }} onClick={onClick} />
	) : name === "search" ? (
		<SearchIcon sx={{ color: color, fontSize: size }} />
	) : name === "find" ? (
		<FindReplaceIcon sx={{ color: color, fontSize: size }} />
	) : name === "refresh" ? (
		<RefreshIcon sx={{ color: color, fontSize: size }} />
	) : name === "arrow-up" ? (
		<ArrowUpwardIcon sx={{ color: color, fontSize: size }} fontSize="large" />
	) : name === "arrow-down" ? (
		<ArrowDownwardIcon sx={{ color: color, fontSize: size }} fontSize="large" />
	) : name === "arrow-left" ? (
		<ArrowBackIcon sx={{ color: color, fontSize: size }} fontSize="large" />
	) : name === "arrow-right" ? (
		<ArrowForwardIcon sx={{ color: color, fontSize: size }} fontSize="large" />
	) : name === "crosshair" ? (
		<HighlightOffIcon fontSize="large" sx={{ color: color, fontSize: size }} />
	) : name === "status-arrowup" ? (
		<KeyboardArrowUpIcon
			onClick={onClick}
			sx={{ color: color, fontSize: size }}
		/>
	) : name === "status-arrowleft" ? (
		<KeyboardArrowLeftIcon
			onClick={onClick}
			sx={{ color: color, fontSize: size }}
		/>
	) : name === "status-arrowright" ? (
		<KeyboardArrowRightIcon
			onClick={onClick}
			sx={{ color: color, fontSize: size }}
		/>
	) : name === "status-arrowdown" ? (
		<KeyboardArrowDownIcon
			onClick={onClick}
			sx={{ color: color, fontSize: size }}
		/>
	) : name === "aspect" ? (
		<AspectRatioIcon sx={{ color: color, fontSize: size }} />
	) : name === "grid" ? (
		<GridViewIcon sx={{ color: color, fontSize: size }} />
	) : name === "delete" ? (
		<DeleteForeverIcon
			onClick={onClick}
			sx={{ color: color, fontSize: size }}
		/>
	) : name === "power" ? (
		<PowerIcon sx={{ color: color, fontSize: size }} fontSize="small" />
	) : name === "power-off" ? (
		<PowerOffIcon fontSize="small" sx={{ color: color, fontSize: size }} />
	) : name === "download" ? (
		<DownloadIcon fontSize="small" sx={{ color: color, fontSize: size }} />
	) : name === "visibility" ? (
		<VisibilityIcon fontSize="small" sx={{ color: color, fontSize: size }} />
	) : name === "list" ? (
		<FormatListBulletedIcon
			fontSize="small"
			sx={{ color: color, fontSize: size }}
		/>
	) : name === "filter-alt" ? (
		<FilterAltIcon fontSize="small" sx={{ color: color, fontSize: size }} />
	) : name === "star" ? (
		<StarRateIcon fontSize="small" sx={{ color: color, fontSize: size }} />
	) : name === "settings-backup-restore" ? (
		<SettingsBackupRestoreIcon
			fontSize="small"
			sx={{ color: color, fontSize: size }}
		/>
	) : name === "north-east" ? (
		<NorthEastIcon fontSize="small" sx={{ color: color, fontSize: size }} />
	) : name === "south-east" ? (
		<SouthEastIcon fontSize="small" sx={{ color: color, fontSize: size }} />
	) : name === "flare" ? (
		<FlareIcon fontSize="small" sx={{ color: color, fontSize: size }} />
	) : name === "east" ? (
		<EastIcon fontSize="small" sx={{ color: color, fontSize: size }} />
	) : name === "favorite" ? (
		<FavoriteIcon fontSize="small" sx={{ color: color, fontSize: size }} />
	) : name === "add" ? (
		<AddIcon fontSize="small" sx={{ color: color, fontSize: size }} />
	) : name === "remove" ? (
		<RemoveIcon fontSize="small" sx={{ color: color, fontSize: size }} />
	) : name === "gps-fixed" ? (
		<GpsFixedIcon fontSize="small" sx={{ color: color, fontSize: size }} />
	) : name === "wb-sunny" ? (
		<WbSunnyIcon fontSize="small" sx={{ color: color, fontSize: size }} />
	) : name === "nightlight-round" ? (
		<NightlightRoundIcon
			fontSize="small"
			sx={{ color: color, fontSize: size }}
		/>
	) : name === "edit" ? (
		<EditIcon
			fontSize="small"
			onClick={onClick}
			sx={{ color: color, fontSize: size }}
		/>
	) : name === "check" ? (
		<CheckIcon fontSize="small" sx={{ color: color, fontSize: size }} />
	) : name === "height" ? (
		<HeightIcon fontSize="small" sx={{ color: color, fontSize: size }} />
	) : name === "schedule" ? (
		<ScheduleIcon fontSize="small" sx={{ color: color, fontSize: size }} />
	) : name === "vignette" ? (
		<VignetteIcon fontSize="small" sx={{ color: color, fontSize: size }} />
	) : name === "info" ? (
		<InfoIcon fontSize="small" sx={{ color: color, fontSize: size }} />
	) : name === "fits" ? (
		<CrisisAlertIcon fontSize="small" sx={{ color: color, fontSize: size }} />
	) : name === "folder" ? (
		<FolderCopyIcon fontSize="large" sx={{ color: color, fontSize: size }} />
	) : name === "save" ? (
		<SaveAsIcon fontSize="small" sx={{ color: color, fontSize: size }} />
	) : name === "rotate-right" ? (
		<RotateRightIcon fontSize="small" sx={{ color: color, fontSize: size }} />
	) : name === "rotate-left" ? (
		<RotateRightIcon fontSize="small" sx={{ color: color, fontSize: size }} />
	) : name === "hourglass-bottom" ? (
		<HourglassBottomIcon
			fontSize="small"
			sx={{ color: color, fontSize: size }}
		/>
	) : name === "flip-camera-ios" ? (
		<FlipCameraIosIcon fontSize="small" sx={{ color: color, fontSize: size }} />
	) : name === "help" ? (
		<HelpIcon sx={{ color: color, fontSize: size }} />
	) : name === "warning" ? (
		<WarningIcon sx={{ color: color, fontSize: size }} />
	) : name === "error" ? (
		<ErrorIcon sx={{ color: color, fontSize: size }} />
	) : name === "device-thermostat" ? (
		<ThermostatIcon sx={{ color: color, fontSize: size }} />
	) : name === "speed" ? (
		<SpeedIcon sx={{ color: color, fontSize: size }} />
	) : name === "opacity" ? (
		<OpacityIcon sx={{ color: color, fontSize: size }} />
	) : name === "auto-awesome" ? (
		<AutoAwesomeIcon sx={{ color: color, fontSize: size }} />
	) : name === "cloud" ? (
		<CloudIcon sx={{ color: color, fontSize: size }} />
	) : name === "circle" ? (
		<CircleIcon sx={{ color: color, fontSize: size }} />
	) : name === "thunderstorm" ? (
		<ThunderstormIcon sx={{ color: color, fontSize: size }} />
	) : name === "snow" ? (
		<AcUnitIcon sx={{ color: color, fontSize: size }} />
	) : (
		<TrackChangesIcon sx={{ color: color, fontSize: size }} onClick={onClick} />
	);
};

export default Icon;
