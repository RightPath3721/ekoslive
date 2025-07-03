import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
import { get, isEmpty } from "lodash";
import { shallowEqual, useDispatch, useSelector } from "react-redux";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import IconButton from "@mui/material/IconButton";
import Icon from "./Icon";
import { Palette } from "@common/shared/common/styles";
import { capitalizeAllWords } from "@common/shared/common/common";
import {
	getActiveGuideTour,
	getCompletedTours,
	selectUnitystem,
	selectSkyQuality,
	selectWeatherInfo,
	selectLocation,
} from "@redux/selectors";
import { tourGuideZones } from "@indi/enums";
import { setupActions } from "@redux/actions";
import s from "@common/shared/i18n/i18n";
import CloudsMap from "./CloudsMap";
import ShowerRainIcon from "@client/icons/weather/ShowerRainIcon";
import RainIcon from "@client/icons/weather/Rain";
import FewCloudsIcon from "@client/icons/weather/FewCloudsIcon";
import MistIcon from "@client/icons/weather/MistIcon";
import BrokenCloudsIcon from "@client/icons/weather/BrokenCloudsIcon";
import { Modal, Paper } from "@mui/material";
import CloseModalButton from "./shared/CloseModalButton";
import LightPollutionMap from "./Map/LightPollution";

const icons = {
	clearSky: <Icon name="circle" size={25} color="#EC6E4C" />,
	fewClouds: <FewCloudsIcon />,
	scatteredClouds: <Icon name="cloud" size={25} color={Palette.white} />,
	brokenClouds: <BrokenCloudsIcon />,
	showerRain: <ShowerRainIcon />,
	rain: <RainIcon />,
	thunderStorm: <Icon name="thunderstorm" size={25} color="#48484A" />,
	snow: <Icon name="snow" size={25} color="#48484A" />,
	mist: <MistIcon />,
};

/**
 * Uses the groups of https://openweathermap.org/weather-conditions to match the id with it's icon
 * Above every section is the group type and the icon id from the documentation.
 * @param {number} id - Icon id according to the openweater documentation.
 * @returns {JSX.Element|null} The appropriate icon for the given ID.
 */
const selectWeatherIcon = (id) =>
{
	// Thunderstorm 11d
	let thunderStormIds = [200, 201, 202, 210, 211, 212, 221, 230, 231, 232];
	if (thunderStormIds.includes(id)) return icons.thunderStorm;

	// Drizzle or rain shower 09d
	let DrizzleIds = [
		300, 301, 302, 310, 311, 312, 313, 314, 321, 520, 521, 522, 531,
	];
	if (DrizzleIds.includes(id)) return icons.showerRain;

	// rain 10d
	let rainIds = [500, 501, 502, 503, 504];
	if (rainIds.includes(id)) return icons.rain;

	// snow 13d
	let snowIds = [511, 600, 601, 602, 611, 612, 613, 615, 616, 620, 621, 622];
	if (snowIds.includes(id)) return icons.snow;

	// mist 50d
	let mistIds = [701, 711, 721, 731, 741, 751, 761, 762, 771, 781];
	if (mistIds.includes(id)) return icons.mist;

	// Clear Sky
	if (id === 800) return icons.clearSky;

	// clouds
	// few clouds 02d
	if (id === 801) return icons.fewClouds;
	// scattered clouds 03d
	if (id === 802)
		// broken or overcast clouds 04d
		return icons.scatteredClouds;
	if (id === 803 || id === 804) return icons.brokenClouds;
	return null;
};
const WeatherBar = () =>
{
	const dispatch = useDispatch();
	const unitSystem = useSelector(selectUnitystem);
	const skyQuality = useSelector(selectSkyQuality);
	const weatherInfo = useSelector(selectWeatherInfo, shallowEqual);
	const location = useSelector(selectLocation);
	const activeGuideTour = useSelector(getActiveGuideTour);
	const completedTour = useSelector(getCompletedTours);
	const [cloudMapOpen, setCloudMapOpen] = useState(false);
	const [isLightPollution, setIsLightPollution] = useState(false);
	const mapRef = useRef(null);

	const checkOpacity = (currentZone) =>
	{
		if (
			activeGuideTour === currentZone ||
			activeGuideTour === 0 ||
			get(completedTour, "profileManager", true)
		)
			return 1;
		return 0.2;
	};

	useEffect(() =>
	{
		if (isEmpty(location)) return;
		(async () =>
		{
			// Weather
			const apiKey = "b827f892b32d0f93e3511027bae60f27";
			const weatherUrl = `https://api.openweathermap.org/data/2.5/weather?lat=${location.latitude}&lon=${location.longitude}&units=${unitSystem}&appid=${apiKey}`;

			try
			{
				const response = await axios.get(weatherUrl);
				dispatch(setupActions.saveWeather(response.data));
			}
			catch
			{
				dispatch(setupActions.saveWeather({}));
				return null;
			}

			// Sky Quality
			const skyqualityUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(`https://clearoutside.com/forecast/${location.latitude}/${location.longitude}`)}`;

			try
			{
				const skyqualityResponse = await axios.get(skyqualityUrl);
				const pageContent = skyqualityResponse.data.contents;
				const regex =
					/Sky Quality: &nbsp;<strong>(.*)<\/strong> Magnitude. &nbsp;<strong>Class (.*)<\/strong> Bortle. &nbsp;<strong>(.*)<\/strong> mcd\/m<sup>2<\/sup> Brightness. &nbsp;<strong>(.*)<\/strong>/;
				const result = pageContent.match(regex);

				if (result)
				{
					const values = result.slice(1);
					const skyQualityData = {
						magnitude: parseFloat(values[0]),
						bortle: parseInt(values[1]),
						brightness: parseFloat(values[2]),
						artificial: parseFloat(values[3]),
					};

					dispatch(setupActions.saveSkyQuality(skyQualityData));
				}
				else
				{
					dispatch(setupActions.saveSkyQuality({}));
				}
			}
			catch
			{
				dispatch(setupActions.saveSkyQuality({}));
			}
		})();
	}, [location]);

	useEffect(() =>
	{
		if (mapRef.current)
		{
			mapRef.current.loadCloudTiles();
		}
	}, []);

	if (isEmpty(weatherInfo) || !(weatherInfo.weather instanceof Array))
		return null;

	return (
		<Box
			sx={{
				alignSelf: "flex-end",
				display: "flex",
				flexDirection: "row",
				alignItems: "center",
				justifyContent: "space-between",
				gap: "12px",
				opacity: checkOpacity(tourGuideZones.WeatherBar),
				borderWidth: activeGuideTour === tourGuideZones.WeatherBar ? 2 : 0,
				borderColor: Palette.orange,
				alignItems: "flex-end",
			}}
		>
			{cloudMapOpen && (
				<Modal open={true}>
					<Paper>
						{isLightPollution ? (
							<LightPollutionMap onClose={() => setCloudMapOpen(false)} />
						) : (
							<CloudsMap onClose={() => setCloudMapOpen(false)} />
						)}
						<CloseModalButton
							className="z-[999] bg-[#000000] rounded-[6px]"
							size="45px"
							close={() => setCloudMapOpen(false)}
							label="Close Map"
						/>
						<CloseModalButton
							className="z-[999] bg-[#000000] rounded-[6px]"
							size="45px"
							name={isLightPollution ? "cloud" : "light"}
							close={() => setIsLightPollution(!isLightPollution)}
							label="Close Map"
						/>
					</Paper>
				</Modal>
			)}
			<Box sx={[LOCAL_STYLES.rowItem]}>
				{selectWeatherIcon(weatherInfo.weather[0]?.id)}
				<Typography sx={{ fontSize: "14px", color: Palette.white70 }}>
					{capitalizeAllWords(weatherInfo.weather[0]?.description)}
				</Typography>
			</Box>

			<Box sx={[LOCAL_STYLES.rowItem]}>
				<Icon name="device-thermostat" size={24} color={Palette.white} />
				<Typography sx={{ fontSize: "14px", color: Palette.white70 }}>
					{weatherInfo.main?.temp}
					{unitSystem === "imperial" ? "°F" : "°C"}
				</Typography>
			</Box>
			<Box sx={[LOCAL_STYLES.rowItem]}>
				<Icon name="speed" size={24} color={Palette.white} />
				<Typography sx={{ fontSize: "14px", color: Palette.white70 }}>
					{" "}
					{weatherInfo.wind?.speed} {unitSystem === "imperial" ? "mph" : "m/s"}
				</Typography>
			</Box>
			<Box sx={[LOCAL_STYLES.rowItem]}>
				<Icon name="opacity" size={24} color={Palette.white} />
				<Typography sx={{ fontSize: "14px", color: Palette.white70 }}>
					{weatherInfo.main?.humidity}%
				</Typography>
			</Box>
			<Box sx={[LOCAL_STYLES.rowItem]}>
				<Icon name="auto-awesome" size={24} color={Palette.white} />
				<Typography sx={{ fontSize: "14px", color: Palette.white70 }}>
					{" "}
					{s.connect.cloudsMap.bortle_class} {get(skyQuality, "bortle", "N/A")}
				</Typography>
			</Box>
			{/* Clouds Map toggle */}
			<IconButton
				onClick={() => setCloudMapOpen(true)}
				sx={[
					LOCAL_STYLES.portsButton,
					{
						opacity: checkOpacity(tourGuideZones.CloudReport),
						borderWidth: activeGuideTour === tourGuideZones.CloudReport ? 2 : 0,
						borderColor: Palette.orange,
					},
				]}
				disabled={isEmpty(weatherInfo)}
			>
				<Icon name="cloud" size={20} color={Palette.white} />
			</IconButton>
		</Box>
	);
};

export default WeatherBar;

const LOCAL_STYLES = {
	portsButton: {
		border: `2px solid ${Palette.orange}`,
		borderRadius: "25px",
		backgroundColor: Palette.orange,
		paddingInline: "14px",
	},
	rowItem: {
		display: "flex",
		flexDirection: "row",
		alignItems: "center",
		gap: "4px",
	},
};
