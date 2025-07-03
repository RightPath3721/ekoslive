import axios from "axios";
import { get } from "lodash";
import { APP_MODE } from "../../config";
import { logDebug, logError, logInfo } from "./logs";

const cancelTokenSource = axios.CancelToken.source();

export const DELETE = (URL = null, config = { timeout: 20000 }) =>
	new Promise(async (resolve, reject) =>
	{
		if (URL == null)
		{
			reject("URL cannot be null");
		}
		else
		{
			try
			{
				const response = await axios.delete(URL, config);
				logDebug(
					`[DELETE] ${URL} (${JSON.stringify(
						response.status,
					)}) Data : ${JSON.stringify(response.data)}`,
				);
				resolve(response);
			}
			catch (err)
			{
				logError(
					`[DELETE] ${URL} ${get(err, "response", { message: err.message })}`,
				);
				reject(err);
			}
		}
	});

export const GET = (URL = null, config = { timeout: 20000 }) =>
	new Promise(async (resolve, reject) =>
	{
		if (URL == null)
		{
			reject("URL cannot be null");
		}
		else
		{
			try
			{
				const response = await axios.get(URL, config);
				logDebug(
					`[GET] ${URL} (${JSON.stringify(
						response.status,
					)}) Data : ${JSON.stringify(response.data)}`,
				);
				resolve(response);
			}
			catch (err)
			{
				logError(
					`[GET] ${URL} ${JSON.stringify(
						get(err, "response", { message: err.message }),
					)}`,
				);
				reject(err);
			}
		}
	});

export const POST = (URL = null, data = {}, config = {}) =>
	new Promise(async (resolve, reject) =>
	{
		if (URL == null)
		{
			reject("URL cannot be null");
		}
		else
		{
			try
			{
				const response = await axios.post(URL, data, {
					timeout: 20000,
					...config,
				});
				logDebug(
					`[POST] ${URL} (${JSON.stringify(
						response.status,
					)}) Data: ${JSON.stringify(response.data)}`,
				);
				resolve(response);
			}
			catch (err)
			{
				// // handle error
				logError(
					`[POST] ${URL} ${JSON.stringify(
						get(err, "response", { message: err.message }),
					)}`,
				);
				reject(err);
			}
		}
	});

// StellarMate API Calls
const getURLForIP = (ip) =>
{
	if (ip) return `http://${ip}:8624/api`;
};

// Set UTC Time
const setTime = (ip) =>
	new Promise(async (resolve, reject) =>
	{
		try
		{
			const ts = Date.now() / 1000;
			const response = await POST(getURLForIP(ip) + "/system/time/utc", { ts });
			resolve(response.data.result);
		}
		catch (err)
		{
			reject(err);
		}
	});

const getTime = (ip) =>
	new Promise(async (resolve, reject) =>
	{
		try
		{
			const response = await GET(getURLForIP(ip) + "/system/time/utc");
			if (response.data.result)
				resolve(get(response.data, "payload.utc", 0) * 1000);
			else reject(response.data.message);
		}
		catch (err)
		{
			reject(err);
		}
	});

// Sync KStars Time to Now
const syncKStarsTimeToNow = (ip) =>
	new Promise(async (resolve, reject) =>
	{
		try
		{
			const response = await POST(getURLForIP(ip) + "/system/time/kstars");
			resolve(response.data.result);
		}
		catch (err)
		{
			reject(err);
		}
	});

// Get Local Time from server
const getLocalTime = (ip) =>
	new Promise(async (resolve, reject) =>
	{
		try
		{
			const response = await GET(getURLForIP(ip) + "/system/time/local");
			if (response.data.result)
				resolve(get(response.data, "payload.datetime", "NA"));
			else reject(response.data.message);
		}
		catch (err)
		{
			reject(err);
		}
	});

// Set Local Time
const setLocalTime = (ip, datetime) =>
	new Promise(async (resolve, reject) =>
	{
		try
		{
			const response = await POST(getURLForIP(ip) + "/system/time/local", {
				datetime,
			});
			resolve(response.data.result);
		}
		catch (err)
		{
			reject(err);
		}
	});

// NTP used or not?
const getNTP = (ip) =>
	new Promise(async (resolve, reject) =>
	{
		try
		{
			const response = await GET(getURLForIP(ip) + "/system/time/ntp");
			if (response.data.result)
				resolve(get(response.data, "payload.ntp", false));
			else reject(response.data.message);
		}
		catch (err)
		{
			reject(err);
		}
	});

// Set NTP. True --> Automatic syncing with NTP
const setNTP = (ip, ntp) =>
	new Promise(async (resolve, reject) =>
	{
		try
		{
			const response = await POST(getURLForIP(ip) + "/system/time/ntp", {
				ntp,
			});
			resolve(response.data.result);
		}
		catch (err)
		{
			reject(err);
		}
	});

// List of IANA time zones
const getTimeZones = (ip) =>
	new Promise(async (resolve, reject) =>
	{
		try
		{
			const response = await GET(getURLForIP(ip) + "/system/time/zones");
			if (response.data.result) resolve(get(response.data, "payload", []));
			else reject(response.data.message);
		}
		catch (err)
		{
			reject(err);
		}
	});

// Get Current time zone
const getTimeZone = (ip) =>
	new Promise(async (resolve, reject) =>
	{
		try
		{
			const response = await GET(getURLForIP(ip) + "/system/time/zone");
			if (response.data.result)
				resolve(get(response.data, "payload.tz", false));
			else reject(response.data.message);
		}
		catch (err)
		{
			reject(err);
		}
	});

// Set time zone
const setTimeZone = (ip) =>
	new Promise(async (resolve, reject) =>
	{
		try
		{
			if (APP_MODE === "1") reject("web");
			const localize = await import("react-native-localize");
			const response = await POST(getURLForIP(ip) + "/system/time/zone", {
				tz: localize.getTimeZone(),
			});
			resolve(response.data.result);
		}
		catch (err)
		{
			reject(err);
		}
	});

// Set country code
const setCountryCode = (ip, code) =>
	new Promise(async (resolve, reject) =>
	{
		try
		{
			const response = await POST(getURLForIP(ip) + "/system/country", {
				country: code,
			});
			resolve(response.data.result);
		}
		catch (err)
		{
			reject(err);
		}
	});

const getLocation = () =>
{
	return new Promise(async (resolve, reject) =>
	{
		if (APP_MODE === "1") reject("web");
		try
		{
			const geolocation = await import("react-native-geolocation-service");
			geolocation.default.getCurrentPosition(
				(position) =>
				{
					resolve({
						longitude: get(position, "coords.longitude", 0),
						latitude: get(position, "coords.latitude", 0),
						elevation: get(position, "coords.altitude", 0),
					});
				},
				(error) =>
				{
					reject(error);
				},
				{ enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 },
			);
		}
		catch (error)
		{
			reject(error);
		}
	});
};

const setLocation = (ip, location) =>
	new Promise(async (resolve, reject) =>
	{
		try
		{
			const response = await POST(getURLForIP(ip) + "/system/location", {
				longitude: location.longitude,
				latitude: location.latitude,
				elevation: location.elevation,
				tz0: 0,
			});
			if ("success" in response.data) resolve(response.data.success);
			else reject(response.data.failure);
		}
		catch (err)
		{
			reject(err);
		}
	});

const getWeather = (ip, longitude, latitude, units) =>
	new Promise(async (resolve, reject) =>
	{
		try
		{
			const response = await POST(getURLForIP(ip) + "/info/weather", {
				longitude,
				latitude,
				units,
			});
			resolve(response.data);
		}
		catch (err)
		{
			reject(err);
		}
	});

const getCloudsTile = (ip, x, y, z) =>
	new Promise(async (resolve, reject) =>
	{
		try
		{
			const response = await GET(
				"http://" + ip + ":3000" + `/clouds/${x}/${y}/${z}`,
			);
			resolve(response.data);
		}
		catch (err)
		{
			reject(err);
		}
	});

const getMapTile = (ip, x, y, z) =>
	new Promise(async (resolve, reject) =>
	{
		try
		{
			const response = await GET(
				"http://" + ip + ":3000" + `/osm/${x}/${y}/${z}`,
			);
			resolve(response.data);
		}
		catch (err)
		{
			reject(err);
		}
	});

const getBortle = (ip, longitude, latitude) =>
	new Promise(async (resolve, reject) =>
	{
		try
		{
			const response = await POST(getURLForIP(ip) + "/info/skyquality", {
				longitude,
				latitude,
			});
			resolve(response.data);
		}
		catch (err)
		{
			reject(err);
		}
	});

const getEkosLiveProperty = (ip, name) =>
	new Promise(async (resolve, reject) =>
	{
		try
		{
			const response = await GET(
				getURLForIP(ip) + "/ekoslive/property/" + name,
			);
			if ("success" in response.data) resolve(response.data.success);
			else reject(response.data.failure);
		}
		catch (err)
		{
			reject(err);
		}
	});

const setEkosLiveConnected = (ip, connected) =>
	new Promise(async (resolve, reject) =>
	{
		try
		{
			await POST(getURLForIP(ip) + "/ekoslive/connect", {
				connected,
			});
			resolve(true);
		}
		catch (err)
		{
			reject(err);
		}
	});

const setEkosLiveUser = (ip, username, password) =>
	new Promise(async (resolve, reject) =>
	{
		try
		{
			if (!username || !password)
				reject("Insufficient login parameters. username and password required");
			await POST(getURLForIP(ip) + "/ekoslive/user", {
				username,
				password,
			});
			resolve(true);
		}
		catch (err)
		{
			reject(err);
		}
	});

const configureEkosLive = (ip) =>
	new Promise(async (resolve, reject) =>
	{
		try
		{
			await POST(getURLForIP(ip) + "/ekoslive/config", {
				onlineService: false,
				rememberCredentials: true,
				autoConnect: true,
			});
			resolve(true);
		}
		catch (err)
		{
			reject(err);
		}
	});

const cancelAllRequests = () =>
{
	cancelTokenSource.cancel();
};

const getHostname = (ip) =>
	new Promise(async (resolve, reject) =>
	{
		try
		{
			const response = await GET(getURLForIP(ip) + "/info/hostname");
			resolve(get(response, "data.hostname", null));
		}
		catch (err)
		{
			reject(err);
		}
	});

const setHostname = (ip, newhostname) =>
	new Promise(async (resolve, reject) =>
	{
		try
		{
			if (!newhostname) reject("Hostname required.");
			await POST(getURLForIP(ip) + "/info/hostname/" + newhostname);
			resolve(true);
		}
		catch (err)
		{
			reject(err);
		}
	});

const setPicturesDirectory = (ip, directory) =>
	new Promise(async (resolve, reject) =>
	{
		try
		{
			await POST(getURLForIP(ip) + "/info/pictures", { directory });
			resolve(true);
		}
		catch (err)
		{
			reject(err);
		}
	});

const getUtilization = (ip) =>
	new Promise(async (resolve, reject) =>
	{
		try
		{
			const response = await GET(getURLForIP(ip) + "/info/utilization");
			const { memory, cpu, hdd, net } = get(response, "data", {
				memory: [],
				cpu: 0,
				hdd: [],
				net: [],
			});
			resolve({ memory, cpu, hdd, net });
		}
		catch (err)
		{
			reject(err);
		}
	});

/**
 * This API call checks the status of network interfaces
 * @param {string} ip
 */
const getModel = (ip) =>
	new Promise(async (resolve, reject) =>
	{
		try
		{
			const response = await GET(getURLForIP(ip) + "/info/model");
			const _res = get(response, "data", {});
			//_res = {model}
			resolve(_res.model);
		}
		catch (err)
		{
			reject(err);
		}
	});

/**
 * This API call gets the home directory
 * @param {string} ip
 */
const getHomeDirectory = (ip) =>
	new Promise(async (resolve, reject) =>
	{
		try
		{
			const response = await GET(getURLForIP(ip) + "/info/home");
			const _res = get(response, "data", {});
			resolve(_res.home);
		}
		catch (err)
		{
			reject(err);
		}
	});

/**
 * This API call gets the file listing from a directory with an extension
 * @param {string} ip SM Device IP
 * @param {string} directory path of the file
 * @param {string} extension .esl
 * @param {string} stat If true, retrieve the file size
 */
const getDirectoryFiles = (ip, directory, extension = "*", stat = false) =>
	new Promise(async (resolve, reject) =>
	{
		try
		{
			const response = await POST(getURLForIP(ip) + "/info/directory", {
				directory,
				extension,
				stat,
			});
			const _res = get(response, "data", {});
			resolve(_res.files.sort());
		}
		catch (err)
		{
			reject(err);
		}
	});

/**
 * This API call gets the folder listing from a directory
 * @param {string} ip SM Device IP
 * @param {string} directory path of the folder
 * @param {string} stat If true retrieve the Folder size
 */
const getDirectoryFolders = (ip, directory, stat = false) =>
	new Promise(async (resolve, reject) =>
	{
		try
		{
			const response = await POST(getURLForIP(ip) + "/info/directoryfolders", {
				directory,
				stat,
			});
			const _res = get(response, "data", {});
			resolve(_res.folders.sort());
		}
		catch (err)
		{
			reject(err);
		}
	});

/**
 *
 * @param {*} ip
 * @returns Total storage size used and available.
 */
const getDiskUtilization = (ip) =>
	new Promise(async (resolve, reject) =>
	{
		try
		{
			const response = await GET(getURLForIP(ip) + "/info/disk-utilization");
			if (response.data.result) resolve(get(response, "data.payload", {}));
			else reject(get(response, "data.message", "Error"));
		}
		catch (err)
		{
			reject(err);
		}
	});

/**
 * This API call gets the size of the directory
 * @param {string} ip
 * @param {string} path directory path
 */
const getDirectorySize = (ip, path) =>
	new Promise(async (resolve, reject) =>
	{
		try
		{
			const response = await POST(
				getURLForIP(ip) + "/info/path",
				{ path },
				{ timeout: 3000 },
			);
			if (response.data.result) resolve(get(response, "data.payload", {}));
			else reject(get(response, "data.message", "Error"));
		}
		catch (err)
		{
			reject(err);
		}
	});

/**
 * This API call creates the directory path
 * @param {string} ip
 * @param {string} directory
 */
const createDirectory = (ip, directory) =>
	new Promise(async (resolve, reject) =>
	{
		try
		{
			const response = await POST(
				getURLForIP(ip) + "/system/createdir",
				{ directory },
				{ timeout: 3000 },
			);
			if (response.data.result) resolve();
			else reject(get(response, "data.message", "Error"));
		}
		catch (err)
		{
			reject(err);
		}
	});

/**
 * This API call deletes the file from the given path if it exists
 * @param {string} ip
 * @param {string} directory
 */
const deleteFile = (ip, directory) =>
	new Promise(async (resolve, reject) =>
	{
		try
		{
			const response = await POST(
				getURLForIP(ip) + "/system/deletefile",
				{ directory },
				{ timeout: 3000 },
			);
			resolve();
		}
		catch (err)
		{
			reject(err);
		}
	});

/**
 * This API call deletes the file from the given path if it exists
 * @param {string} ip
 * @param {string} directory
 */
const deleteDirectory = (ip, directory) =>
	new Promise(async (resolve, reject) =>
	{
		try
		{
			const response = await POST(
				getURLForIP(ip) + "/system/deletedir",
				{ directory },
				{ timeout: 3000 },
			);
			const _res = get(response, "data", {});
			resolve(_res.result);
		}
		catch (err)
		{
			reject(err);
		}
	});

/**
 * This API call checks the status of network interfaces
 * @param {string} ip
 */
const getVersion = (ip) =>
	new Promise(async (resolve, reject) =>
	{
		try
		{
			const response = await GET(getURLForIP(ip) + "/info/version");
			const _res = get(response, "data", {});
			resolve(_res.version);
		}
		catch (err)
		{
			reject(err);
		}
	});

/**
 * This API call checks the status of network interfaces
 * @param {string} ip
 */
const getInterfaces = (ip) =>
	new Promise(async (resolve, reject) =>
	{
		try
		{
			const response = await GET(getURLForIP(ip) + "/info/interfaces");
			const _res = get(response, "data", {});
			resolve(_res);
		}
		catch (err)
		{
			reject(err);
		}
	});

/**
 * This API call makes the StellarMate scan the Wifi network that are available
 * to it.
 * @param {string} ip
 */
const getWifi = (ip) =>
	new Promise(async (resolve, reject) =>
	{
		try
		{
			const response = await GET(getURLForIP(ip) + "/info/wifi");
			const _res = get(response, "data", {});
			resolve(_res.result);
		}
		catch (err)
		{
			reject(err);
		}
	});

/**
 * This method will save Wifi Configuration for a particular SSID. But, to
 * connect to it, we'll need to call a seperate method called "selectWifi"
 * @param {string} ip
 * @param {string} ssid
 * @param {string} psk
 */
const configureWifi = (ip, ssid, psk) =>
	new Promise(async (resolve, reject) =>
	{
		try
		{
			await POST(getURLForIP(ip) + "/system/configure_wifi", { ssid, psk });
			resolve();
		}
		catch (err)
		{
			reject(err);
		}
	});

/**
 * This method will make StellarMate to connect to the wifi that was
 * configured on it.
 * @param {string} ip
 */
const selectWifi = (ip) =>
	new Promise(async (resolve, reject) =>
	{
		try
		{
			await POST(getURLForIP(ip) + "/system/select_wifi");
			resolve();
		}
		catch (err)
		{
			reject(err);
		}
	});

/**
 * This method makes the StellarMate forget the current Wifi it's connected to.
 * @param {string} ip
 */
const forgetWifi = (ip) =>
	new Promise(async (resolve, reject) =>
	{
		try
		{
			await POST(getURLForIP(ip) + "/system/forget_wifi");
			resolve();
		}
		catch (err)
		{
			reject(err);
		}
	});

/**
 * This method makes StellarMate to disconnect from any Wifi network and create
 * it's own hotspot instead.
 * @param {string} ip
 */
const activateHotspot = (ip) =>
	new Promise(async (resolve, reject) =>
	{
		try
		{
			await POST(
				getURLForIP(ip) + "/system/activate_hotspot",
				{},
				{ timeout: 3000 },
			);
			resolve();
		}
		catch (err)
		{
			reject(err);
		}
	});

/**
 * This method makes StellarMate to close it's hotspot and connect to it's last
 * remebered Wifi network instead.
 * @param {string} ip
 */
const deactivateHotspot = (ip) =>
	new Promise(async (resolve, reject) =>
	{
		try
		{
			await POST(
				getURLForIP(ip) + "/system/deactivate_hotspot",
				{},
				{ timeout: 3000 },
			);
			resolve();
		}
		catch (err)
		{
			reject(err);
		}
	});

const activateDirectEthernet = (ip) =>
	new Promise(async (resolve, reject) =>
	{
		try
		{
			await POST(
				getURLForIP(ip) + "/system/activate_direct_ethernet",
				{},
				{ timeout: 3000 },
			);
			resolve();
		}
		catch (err)
		{
			reject(err);
		}
	});

const deactivateDirectEthernet = (ip) =>
	new Promise(async (resolve, reject) =>
	{
		try
		{
			await POST(
				getURLForIP(ip) + "/system/deactivate_direct_ethernet",
				{},
				{ timeout: 3000 },
			);
			resolve();
		}
		catch (err)
		{
			reject(err);
		}
	});

const getHotspotBand = (ip) =>
	new Promise(async (resolve, reject) =>
	{
		try
		{
			const response = await GET(
				getURLForIP(ip) + "/system/band",
				{},
				{ timeout: 3000 },
			);
			if (response.data.result) resolve(get(response, "data", {}));
		}
		catch (err)
		{
			reject(err);
		}
	});

/**
 * Reset ekoslive, remove directories
 * @param {*} ip  ip address
 * @returns
 */
const ekosliveReset = (ip) =>
	new Promise(async (resolve, reject) =>
	{
		try
		{
			const url = `http://${ip}:3000/reset`;
			await GET(url);
			resolve({ result: true });
		}
		catch (err)
		{
			reject(err);
		}
	});

/**
 * Generate database
 * @param {*} ip address
 * @returns
 */
const regenerateEkoslive = (ip) =>
	new Promise(async (resolve, reject) =>
	{
		try
		{
			const url = `http://${ip}:3000/generate`;
			await GET(url);
			resolve({ result: true });
		}
		catch (err)
		{
			reject(err);
		}
	});

const setHotspotBand = (ip, band, channel) =>
	new Promise(async (resolve, reject) =>
	{
		try
		{
			await POST(
				getURLForIP(ip) + "/system/band",
				{ band, channel },
				{ timeout: 3000 },
			);
			resolve();
		}
		catch (err)
		{
			reject(err);
		}
	});

const updateCoreBuild = (ip, token) =>
	new Promise(async (resolve, reject) =>
	{
		try
		{
			let response = await GET(getURLForIP(ip) + "/api/software/build");
			const build = response.data.build.trim();

			await POST(
				getURLForIP(ip) + "/api/software/update_builds",
				{ build, token },
				{ timeout: 3000 },
			);
			resolve();
		}
		catch (err)
		{
			reject(err);
		}
	});

const getRelease = (ip) =>
	new Promise(async (resolve, reject) =>
	{
		try
		{
			let response = await GET(getURLForIP(ip) + "/software/release");
			// {"release": "beta" || "stable"}
			resolve(response.data);
		}
		catch (err)
		{
			reject(err);
		}
	});

const getPicturesDirectory = (ip) =>
	new Promise(async (resolve, reject) =>
	{
		try
		{
			const response = await GET(getURLForIP(ip) + "/info/pictures");
			if (response.data.result)
				resolve(get(response.data, "payload", "/home/stellarmate/Pictures"));
			else reject(response.data.message);
		}
		catch (err)
		{
			reject(err);
		}
	});

const getReleaseProgress = (ip) =>
	new Promise(async (resolve, reject) =>
	{
		try
		{
			const response = await GET(
				getURLForIP(ip) + "/software/release/progress",
			);
			if (response.data.result)
				resolve(get(response.data, "payload.progress", true));
			else reject(response.data.message);
		}
		catch (err)
		{
			reject(err);
		}
	});

const setRelease = (ip, releaseType) =>
	new Promise(async (resolve, reject) =>
	{
		try
		{
			await POST(getURLForIP(ip) + "/software/release", {
				release: releaseType,
			});
			resolve();
		}
		catch (err)
		{
			reject(err);
		}
	});

const isUpgradeable = (ip) =>
	new Promise(async (resolve, reject) =>
	{
		try
		{
			let response = await GET(getURLForIP(ip) + "/software/upgradable");
			resolve(response.data);
		}
		catch (err)
		{
			reject(err);
		}
	});

const upgradeSoftware = (ip) =>
	new Promise(async (resolve, reject) =>
	{
		try
		{
			let response = await GET(getURLForIP(ip) + "/software/upgrade");
			resolve(response.data);
		}
		catch (err)
		{
			reject(err);
		}
	});

const getProgress = (ip) =>
	new Promise(async (resolve, reject) =>
	{
		try
		{
			let response = await GET(getURLForIP(ip) + "/software/progress");
			resolve(response.data);
		}
		catch (err)
		{
			reject(err);
		}
	});

const factoryReset = (ip) =>
	new Promise(async (resolve, reject) =>
	{
		try
		{
			let response = await POST(getURLForIP(ip) + "/system/factory_reset");
			resolve(response.data);
		}
		catch (err)
		{
			reject(err);
		}
	});

const networkReset = (ip) =>
	new Promise(async (resolve, reject) =>
	{
		try
		{
			let response = await POST(getURLForIP(ip) + "/system/network_reset");
			resolve(response.data);
		}
		catch (err)
		{
			reject(err);
		}
	});

const getCurrentVideoMode = (ip) =>
	new Promise(async (resolve, reject) =>
	{
		try
		{
			let response = await GET(getURLForIP(ip) + "/tv");
			resolve(response.data);
		}
		catch (err)
		{
			reject(err);
		}
	});

const setCurrentVideoMode = (ip, data) =>
	new Promise(async (resolve, reject) =>
	{
		try
		{
			await POST(getURLForIP(ip) + "/tv", data);
			resolve();
		}
		catch (err)
		{
			reject(err);
		}
	});

const getDMTModes = (ip) =>
	new Promise(async (resolve, reject) =>
	{
		try
		{
			let response = await GET(getURLForIP(ip) + "/tv/DMT");
			resolve(response.data);
		}
		catch (err)
		{
			reject(err);
		}
	});

const getCEAModes = (ip) =>
	new Promise(async (resolve, reject) =>
	{
		try
		{
			let response = await GET(getURLForIP(ip) + "/tv/CEA");
			resolve(response.data);
		}
		catch (err)
		{
			reject(err);
		}
	});

const restartService = (ip, service) =>
	new Promise(async (resolve, reject) =>
	{
		try
		{
			await POST(getURLForIP(ip) + "/service", {
				service,
				operation: "restart",
			});
			resolve();
		}
		catch (err)
		{
			reject(err);
		}
	});

const startApplication = (ip, application) =>
	new Promise(async (resolve, reject) =>
	{
		try
		{
			let response = await POST(getURLForIP(ip) + "/application", {
				command: "start",
				application,
			});
			resolve(response.data);
		}
		catch (err)
		{
			reject(err);
		}
	});

const stopApplication = (ip, application) =>
	new Promise(async (resolve, reject) =>
	{
		try
		{
			let response = await POST(getURLForIP(ip) + "/application", {
				command: "stop",
				application,
			});
			resolve(response.data);
		}
		catch (err)
		{
			reject(err);
		}
	});

const isApplicationRunning = (ip, application) =>
	new Promise(async (resolve, reject) =>
	{
		try
		{
			let response = await POST(getURLForIP(ip) + "/application", {
				command: "is_running",
				application,
			});
			resolve(response.data);
		}
		catch (err)
		{
			reject(err);
		}
	});

const startDeviceDetection = (ip) =>
	new Promise(async (resolve, reject) =>
	{
		try
		{
			let response = await GET(getURLForIP(ip) + "/udev/scan");
			resolve(response.data);
		}
		catch (err)
		{
			reject(err);
		}
	});

const queryCameraInfo = (ip, name) =>
	new Promise(async (resolve, reject) =>
	{
		try
		{
			let response = await POST(getURLForIP(ip) + "/camera/query", { name });
			resolve(response.data);
		}
		catch (err)
		{
			reject(err);
		}
	});

const addDeviceRule = (ip, data) =>
	new Promise(async (resolve, reject) =>
	{
		try
		{
			let response = await POST(getURLForIP(ip) + "/udev/add_rule", data);
			resolve(response.data);
		}
		catch (err)
		{
			reject(err);
		}
	});

const deleteDriverConfigs = (ip) =>
	new Promise(async (resolve, reject) =>
	{
		try
		{
			let response = await DELETE(getURLForIP(ip) + "/drivers");
			resolve(response.data.result);
		}
		catch (err)
		{
			reject(err);
		}
	});

const checkKStars = (ip) =>
	new Promise(async (resolve, reject) =>
	{
		try
		{
			const isWrapperRunning = await isApplicationRunning(ip, "kstars_wrapper");
			if (isWrapperRunning["is_running"] === false)
			{
				try
				{
					// Ideally kstars_wrapper should be the one running, but just check also for KStars
					const isKStarsRunning = await isApplicationRunning(ip, "kstars");
					if (isKStarsRunning["is_running"] === false)
					{
						try
						{
							await startApplication(ip, "kstars_wrapper");
							resolve(true);
						}
						catch (e)
						{
							logError("Failed to start KStars on StellarMate.");
							reject("Failed to start KStars on StellarMate.");
						}
					}
					else resolve(true);
				}
				catch (e)
				{
					reject(e);
				}
			}
			else
			{
				resolve(true);
			}
		}
		catch (e)
		{
			reject(e);
		}
	});

const checkPHD2 = (ip) =>
	new Promise(async (resolve, reject) =>
	{
		try
		{
			const isPHD2Running = await isApplicationRunning(ip, "phd2");
			if (isPHD2Running["is_running"] === false)
			{
				try
				{
					await startApplication(ip, "phd2");
					resolve(true);
				}
				catch (e)
				{
					logError("Failed to start PHD2 on StellarMate.");
					reject("Failed to start PHD2 on StellarMate.");
				}
			}
			else resolve(true);
		}
		catch (e)
		{
			reject(e);
		}
	});

const syncDriverInfo = (driver) =>
{
	const url = "https://live.stellarmate.com/api/software/driver";
	POST(url, driver, { timeout: 2000 })
		.then(() =>
		{
			logInfo("Driver synced successfully.");
		})
		.catch((err) =>
		{
			// Silently ignore errors
			if (!__DEV__) logError(`Failed to sync driver info: ${err}`);
		});
};

const getTemperature = (ip) =>
	new Promise(async (resolve, reject) =>
	{
		try
		{
			let response = await GET(getURLForIP(ip) + "/info/temperature");
			const temperature = get(response, "data.success", false);
			if (temperature) resolve(temperature);
			else reject("NA");
		}
		catch (err)
		{
			reject(err);
		}
	});

const isRegistered = (ip, username) =>
	new Promise(async (resolve, reject) =>
	{
		try
		{
			const response = await GET(
				"http://" + ip + ":3000/api/registered?username=" + username,
			);
			const registered = get(response, "data.success", false);
			if (registered) resolve(true);
			else reject("Not registered");
		}
		catch (err)
		{
			reject(err);
		}
	});

const getExternalStorageInfo = (ip) =>
	new Promise(async (resolve, reject) =>
	{
		try
		{
			let response = await GET(getURLForIP(ip) + "/info/storage");
			if (response.data.result) resolve(response.data.payload);
			else reject("No payload for storage");
		}
		catch (err)
		{
			reject(err);
		}
	});

/**
 * This API call returns the Stellmate Architecture Info
 * @param {string} ip Current Network IP
 */
const getArchitecture = (ip) =>
	new Promise(async (resolve, reject) =>
	{
		try
		{
			const response = await GET(getURLForIP(ip) + "/info/arch");
			const _res = get(response, "data", {});
			resolve(_res);
		}
		catch (err)
		{
			reject(err);
		}
	});

/**
 * This API call checks wheather the service is active or inactive
 * @param {string} ip Current Network IP
 * @param {string} serviceName Name of the service to check whether it's active or not
 */
const isServiceActive = (ip, serviceName) =>
	new Promise(async (resolve, reject) =>
	{
		try
		{
			let response = await POST(getURLForIP(ip) + "/service/isactive", {
				service: serviceName,
			});
			resolve(response.data.status);
		}
		catch (err)
		{
			reject(err);
		}
	});

/**
 * This API call checks wheather the package is downloaded or not
 * @param {string} ip Current Network IP
 * @param {string} packageName Name of the package
 *
 */
const isPackageDownloaded = (ip, name) =>
	new Promise(async (resolve, reject) =>
	{
		try
		{
			let response = await POST(getURLForIP(ip) + "/package/downloaded", {
				name,
			});
			resolve(response.data.result);
		}
		catch (err)
		{
			reject(err);
		}
	});

/**
 * This API call downloads a required package.
 * @param {string} ip Current Network IP
 * @param {string} name Name of the package i.e teamviewer-host
 * @param {string} url Link of package to download
 */
const downloadPackage = (ip, name, url) =>
	new Promise(async (resolve, reject) =>
	{
		try
		{
			let response = await POST(getURLForIP(ip) + "/package/download", {
				name,
				url,
			});
			resolve(response.data.result);
		}
		catch (err)
		{
			reject(err);
		}
	});

/**
 * This API call Checks whether the package is installed.
 * @param {string} ip
 * @param {string} name Name of the package to check if installed i.e teamviewer-host
 */
const isPackageInstalled = (ip, name) =>
	new Promise(async (resolve, reject) =>
	{
		try
		{
			let response = await POST(getURLForIP(ip) + "/package/installed", {
				name,
			});
			resolve(response.data.result);
		}
		catch (err)
		{
			reject(err);
		}
	});

/**
 * This API call installs the package.
 * @param {string} ip
 * @param {string} name Name of the package to install i.e teamviewer-host
 */
const installPackage = (ip, name) =>
	new Promise(async (resolve, reject) =>
	{
		try
		{
			let response = await POST(
				getURLForIP(ip) + "/package/install",
				{ name },
				{ timeout: 30000 },
			);
			resolve(response.data.result);
		}
		catch (err)
		{
			reject(err);
		}
	});

/**
 * Start SM Streamer
 * @param {string} ip
 */
const startStreamer = (ip, device) =>
	new Promise(async (resolve, reject) =>
	{
		try
		{
			await startApplication(ip, "smstreamer");
			let response = await POST(getURLForIP(ip) + "/streamer/start", {
				device: device,
			});
			resolve(response.data.result);
		}
		catch (err)
		{
			reject(err);
		}
	});

/**
 * Stop SM Streamer
 * @param {string} ip
 */
const stopStreamer = (ip) =>
	new Promise(async (resolve, reject) =>
	{
		try
		{
			let response = await POST(getURLForIP(ip) + "/streamer/stop");
			resolve(response.data.result);
		}
		catch (err)
		{
			reject(err);
		}
	});

/**
 * Set rustdesk permenant password
 * @param {string} ip
 * @param {string} password
 */
const setRustdeskPassword = (ip, password = "stellar@Mate123!") =>
	new Promise(async (resolve, reject) =>
	{
		try
		{
			let response = await POST(getURLForIP(ip) + "/software/rustdesk/reset", {
				password: password,
			});
			resolve(response.data.result);
		}
		catch (err)
		{
			reject(err);
		}
	});

/**
 * This API returns the RustDesk ID
 * @param {string} ip
 */
const getRustDeskID = (ip) =>
	new Promise(async (resolve, reject) =>
	{
		try
		{
			const response = await GET(getURLForIP(ip) + "/software/rustdesk/id");
			const _res = get(response, "data", {});
			//_res = {model}
			if (_res.result) resolve(_res.payload);
		}
		catch (err)
		{
			reject(err);
		}
	});

/**
 * This API call manage the services to (Start / Stop / Disable / Enable / Restart)
 * @param {string} ip
 * @param {string} operation start, stop, disable, enable , restart
 * @param {string} service Name of the service
 */
const manageService = (ip, operation, service) =>
	new Promise(async (resolve, reject) =>
	{
		try
		{
			let response = await POST(getURLForIP(ip) + "/service", {
				operation,
				service,
			});
			resolve(response.data.result);
		}
		catch (err)
		{
			reject(err);
		}
	});

/**
 * This API call checks the progress of package being downloaded
 * @param {string} ip Current Network IP
 */
const packageProgress = (ip) =>
	new Promise(async (resolve, reject) =>
	{
		try
		{
			const response = await GET(
				getURLForIP(ip) + "/package/download/progress",
			);
			const _res = get(response, "data", {});
			resolve(_res.progress);
		}
		catch (err)
		{
			reject(err);
		}
	});

/**
 *
 * @param {*} ip device
 * @param {*} program name of programs
 * @returns
 */
const getSoftwareVersion = (ip, program) =>
	new Promise(async (resolve, reject) =>
	{
		try
		{
			const response = await GET(getURLForIP(ip) + `/info/version/${program}`);
			const _res = get(response, "data", {});
			resolve(_res.payload);
		}
		catch (err)
		{
			reject(err);
		}
	});

const removeSoftware = (ip, name, url) =>
	new Promise(async (resolve, reject) =>
	{
		try
		{
			let response = await POST(getURLForIP(ip) + "/package/remove", {
				name,
				url,
			});
			resolve(response.data);
		}
		catch (err)
		{
			reject(err);
		}
	});

/**
 * Update VNC password
 * @param {*} password smate
 * @returns
 */
const setVNCPassword = (ip, data) =>
	new Promise(async (resolve, reject) =>
	{
		try
		{
			const response = await POST(getURLForIP(ip) + `/system/vnc`, data);
			const _res = get(response, "data.result", {});
			resolve(_res);
		}
		catch (err)
		{
			reject(err);
		}
	});

/**
 * Unmount USB Device
 * @param {*} device device address
 * @returns
 */
const unmountUSB = (ip, data) =>
	new Promise(async (resolve, reject) =>
	{
		try
		{
			const response = await POST(getURLForIP(ip) + `/usb/unmount`, data);
			const _res = get(response, "data.result", {});
			resolve(_res);
		}
		catch (err)
		{
			reject(err);
		}
	});

/**
 * get duplicate monitors
 * @param {*} device device address
 * @returns
 */
const getMonitorDisplays = (ip) =>
	new Promise(async (resolve, reject) =>
	{
		try
		{
			const response = await GET(getURLForIP(ip) + "/tv/displays");
			if (response.data.result) resolve(get(response, "data.payload", []));
			resolve([]);
		}
		catch (err)
		{
			logError(`Failed to get monitor displays: ${err}`);
			resolve([]);
		}
	});

/**
 * select monitor
 * @param {*} device device address
 * @returns
 */
const setMonitor = (ip, data) =>
	new Promise(async (resolve, reject) =>
	{
		try
		{
			const response = await POST(getURLForIP(ip) + `/tv/duplicate`, data);
			resolve(get(response, "data.result", false));
		}
		catch (err)
		{
			reject(err);
		}
	});

/**
 * set resolution
 * @param {*} device device address
 * @returns
 */
const setMonitorResolution = (ip, data) =>
	new Promise(async (resolve, reject) =>
	{
		try
		{
			const response = await POST(getURLForIP(ip) + `/tv/resolution`, data);
			resolve(get(response, "data.result", false));
		}
		catch (err)
		{
			reject(err);
		}
	});

/**
 *
 * @param ip
 * @param hostname
 * @param port
 * @returns {Promise<unknown>}
 */
const connectINDI = (ip, hostname = "localhost", port = 12624) =>
	new Promise(async (resolve, reject) =>
	{
		try
		{
			const response = await POST(getURLForIP(ip) + "/indi/connect", {
				hostname,
				port,
			});
			resolve(get(response, "data.result", false));
		}
		catch (err)
		{
			reject(err);
		}
	});

/**
 *
 * @param ip
 * @returns {Promise<unknown>}
 */
const disconnectINDI = (ip) =>
	new Promise(async (resolve, reject) =>
	{
		try
		{
			const response = await POST(getURLForIP(ip) + "/indi/disconnect");
			resolve(get(response, "data.result", false));
		}
		catch (err)
		{
			reject(err);
		}
	});

/**
 * Get All INDI device properties in a list
 * @param ip
 * @param device
 * @returns {Promise<unknown>}
 */
const getINDIStatus = (ip, device) =>
	new Promise(async (resolve, reject) =>
	{
		try
		{
			const response = await GET(getURLForIP(ip) + "/indi/device/" + device);
			if (response.data.result) resolve(get(response.data, "payload", []));
			else reject(false);
		}
		catch (err)
		{
			reject(err);
		}
	});

/**
 *
 * @param ip
 * @param device
 * @param property
 * @returns {Promise<unknown>}
 */
const getINDIProperty = (ip, device, property) =>
	new Promise(async (resolve, reject) =>
	{
		try
		{
			const response = await POST(getURLForIP(ip) + "/indi/get", {
				device,
				property,
			});
			if (response.data.result) resolve(get(response.data, "payload", []));
			else reject(response.data.message);
		}
		catch (err)
		{
			reject(err);
		}
	});

/**
 *
 * @param ip
 * @param device
 * @param property
 * @param elements
 * @returns {Promise<unknown>}
 */
const setINDIProperty = (ip, device, property, elements) =>
	new Promise(async (resolve, reject) =>
	{
		try
		{
			const response = await POST(getURLForIP(ip) + "/indi/set", {
				device,
				property,
				elements,
			});
			if (response.data.result) resolve(true);
			else reject(response.data.message);
		}
		catch (err)
		{
			reject(err);
		}
	});

/**
 * Get USB devices list
 * @param {*} ip network address
 * @returns
 */
const getUsbDevices = (ip) =>
	new Promise(async (resolve, reject) =>
	{
		try
		{
			let response = await GET(getURLForIP(ip) + "/udev/usb");
			resolve(response.data);
		}
		catch (err)
		{
			reject(err);
		}
	});

const updateCoreSoftware = (ip, token) =>
	new Promise(async (resolve, reject) =>
	{
		try
		{
			let response = await GET(getURLForIP(ip) + "/software/versions");
			const versions = response.data.versions;

			await POST(getURLForIP(ip) + "/software/update_software", {
				versions,
				token,
			});
			resolve();
		}
		catch (err)
		{
			reject(err);
		}
	});

const handleRestart = (ip) =>
{
	new Promise(async (resolve, reject) =>
	{
		try
		{
			await POST(`${getURLForIP(ip)}/system/reboot`);
			resolve();
		}
		catch (err)
		{
			reject(err);
		}
	});
};

const handleShutdown = (ip) =>
{
	new Promise(async (resolve, reject) =>
	{
		try
		{
			await POST(`${getURLForIP(ip)}/system/shutdown`);
			resolve();
		}
		catch (err)
		{
			reject(err);
		}
	});
};

const handleBackup = (ip) =>
	new Promise(async (resolve, reject) =>
	{
		try
		{
			let response = await POST(`${getURLForIP(ip)}/system/backup`);
			resolve(response.data);
		}
		catch (err)
		{
			reject(err);
		}
	});

/**
 * Starts Backup from the Mobile App
 * @param {*} ip
 * @param {*} username username
 * @param {*} isCloudSync boolean,, if true, upload backup file to S3 Bucket (for Pro users)
 * @returns
 */
const handleAppBackup = (ip, username, isCloudSync) =>
	new Promise(async (resolve, reject) =>
	{
		try
		{
			let response = await POST(`${getURLForIP(ip)}/system/app/backup`, {
				username,
			});
			resolve(response.data);
		}
		catch (err)
		{
			reject(err);
		}
	});

/**
 * Ability to restore from backup file
 * @param {*} ip
 * @param {*} filename Backup filename
 * @returns
 */
const handleAppRestore = (ip, filename, username, url) =>
	new Promise(async (resolve, reject) =>
	{
		try
		{
			let response = await POST(`${getURLForIP(ip)}/system/app/restore`, {
				filename,
				username,
				url,
			});
			resolve(response.data);
		}
		catch (err)
		{
			reject(err);
		}
	});

/**
 * Ability to restore from backup file
 * @param {*} ip
 * @param {*} filename Backup filename
 * @returns
 */
const startRestore = (ip, filename) =>
	new Promise(async (resolve, reject) =>
	{
		try
		{
			let response = await POST(`${getURLForIP(ip)}/system/app/restore/start`, {
				filename,
			});
			resolve(response.data);
		}
		catch (err)
		{
			reject(err);
		}
	});

/**
 * Fetch S3 Upload status
 * @param {*} ip
 * @returns
 */
const getS3UploadStatus = (ip) =>
	new Promise(async (resolve, reject) =>
	{
		try
		{
			let response = await GET(
				`${getURLForIP(ip)}/system/app/backup/upload-status`,
			);
			resolve(response.data);
		}
		catch (err)
		{
			reject(err);
		}
	});

/**
 * Returns Astrometry index file name in .txt file
 * @param {*} ip
 * @param {*} filename restore filename
 * @returns
 */
const getAstrometryFile = (ip, filename, username) =>
	new Promise(async (resolve, reject) =>
	{
		try
		{
			let response = await POST(`${getURLForIP(ip)}/system/astrometry/file`, {
				filename,
				username,
			});
			resolve(response.data);
		}
		catch (err)
		{
			reject(err);
		}
	});

/**
 * Start uploading backup file to S3
 * @param {*} ip
 * @param {*} filename restore filename
 * @returns
 */
const uploadToS3 = (ip, url) =>
	new Promise(async (resolve, reject) =>
	{
		try
		{
			let response = await POST(
				`${getURLForIP(ip)}/system/app/backup/upload-to-s3`,
				{
					url,
				},
			);
			resolve(response.data);
		}
		catch (err)
		{
			reject(err);
		}
	});

const handleRestore = (ip, filename) =>
	new Promise(async (resolve, reject) =>
	{
		try
		{
			let response = await POST(`${getURLForIP(ip)}/system/restore`, {
				filename,
			});
			resolve(response.data);
		}
		catch (err)
		{
			reject(err);
		}
	});

/**
 * Get progress for backup
 * @param {*} ip SM Device IP
 * @returns
 */
const getBackupProgress = (ip) =>
	new Promise(async (resolve, reject) =>
	{
		try
		{
			let response = await GET(getURLForIP(ip) + "/system/app/backup/progress");
			resolve(response.data);
		}
		catch (err)
		{
			reject(err);
		}
	});

/**
 * Get download progress of restore
 * @param {*} ip IP Address
 * @returns Download progress info
 */
const getRestoreDownloadProgress = (ip) =>
	new Promise(async (resolve, reject) =>
	{
		try
		{
			let response = await GET(
				getURLForIP(ip) + "/system/app/restore/download-status",
			);
			resolve(response.data);
		}
		catch (err)
		{
			reject(err);
		}
	});

const getRestoreProgress = (ip) =>
	new Promise(async (resolve, reject) =>
	{
		try
		{
			let response = await GET(getURLForIP(ip) + "/system/restore/progress");
			resolve(response.data);
		}
		catch (err)
		{
			reject(err);
		}
	});

const fileUpload = async (ip, file, formKey) =>
	new Promise(async (resolve, reject) =>
	{
		try
		{
			const url = getURLForIP(ip) + "/system/backup/upload";
			const formData = new FormData();
			formData.append(formKey, file);
			let response = await POST(url, formData);
			resolve(response);
		}
		catch (err)
		{
			reject(err);
		}
	});

const getServiceLog = (ip, logKey) =>
	new Promise(async (resolve, reject) =>
	{
		try
		{
			let response = await GET(getURLForIP(ip) + "/log/service/" + logKey);
			resolve(response.data);
		}
		catch (err)
		{
			reject(err);
		}
	});

const getAppLog = (ip, logKey) =>
	new Promise(async (resolve, reject) =>
	{
		try
		{
			let response = await GET(getURLForIP(ip) + "/log/app/" + logKey);
			resolve(response.data);
		}
		catch (err)
		{
			reject(err);
		}
	});

const getLog = (ip, logKey) =>
	new Promise(async (resolve, reject) =>
	{
		try
		{
			let response = await GET(getURLForIP(ip) + "/log/" + logKey);
			resolve(response.data);
		}
		catch (err)
		{
			reject(err);
		}
	});

const testDslr = (ip) =>
	new Promise(async (resolve, reject) =>
	{
		try
		{
			let response = await GET(getURLForIP(ip) + "/test/dslr");
			resolve(response.data);
		}
		catch (err)
		{
			reject(err);
		}
	});

const downloadFromHome = (ip, path) =>
	new Promise(async (resolve) =>
	{
		// to do test
		fetch(getURLForIP(ip) + "/download" + path)
			.then((r) => r.text())
			.then((text) =>
			{
				resolve(text);
			})
			.catch((err) =>
			{
				console.log("ERR", err);
			});
	});

const getRtcInfo = (ip) =>
	new Promise(async (resolve, reject) =>
	{
		try
		{
			let response = await GET(getURLForIP(ip) + "/info/rtc");
			resolve(response.data);
		}
		catch (err)
		{
			reject(err);
		}
	});

/**
 * Force to the USB hub to reset, called before the profile is started if set true
 * @param {*} ip
 * @returns
 */
const forceUSBReset = (ip, vid, pid) =>
	new Promise(async (resolve, reject) =>
	{
		try
		{
			const response = await POST(getURLForIP(ip) + "/usb/reset", { vid, pid });
			resolve(response.data.result);
		}
		catch (err)
		{
			reject(err);
		}
	});

/**
 * Get Stella Prompt
 * @param {*} url URL of online server
 * @returns
 */
const stellaGet = (url) =>
	new Promise(async (resolve, reject) =>
	{
		try
		{
			const response = await GET(url);
			resolve(response);
		}
		catch (err)
		{
			reject(err);
		}
	});

/**
 * Post Stella Feedback
 * @param {*} url URL of online server
 * @param {*} payload Prompt feedback
 * @returns
 */
const ekoslivePost = (url, payload, config) =>
	new Promise(async (resolve, reject) =>
	{
		try
		{
			const response = await POST(url, payload ?? {}, config ?? {});
			resolve(response);
		}
		catch (err)
		{
			reject(err);
		}
	});

/**
 * RSync folders, transfers SM pictures to external storage
 * @param {*} ip
 * @param {*} sources list of folders
 * @param {*} destination path to external storage
 * @returns
 */
const RSyncFolders = (ip, sources, destination) =>
	new Promise(async (resolve, reject) =>
	{
		try
		{
			const response = await POST(getURLForIP(ip) + "/system/rsync/start", {
				sources,
				destination,
			});
			resolve(response.data.result);
		}
		catch (err)
		{
			reject(err);
		}
	});

/**
 * Get the progress for RSync
 * @param {*} ip
 * @returns
 */
const getRsyncProgress = (ip) =>
	new Promise(async (resolve, reject) =>
	{
		try
		{
			let response = await GET(getURLForIP(ip) + "/system/rsync/progress");
			resolve(response.data);
		}
		catch (err)
		{
			reject(err);
		}
	});

/**
 * Get the progress for RSync
 * @param {*} ip
 * @returns
 */
const cancelRSyncProgress = (ip) =>
	new Promise(async (resolve, reject) =>
	{
		try
		{
			let response = await GET(getURLForIP(ip) + "/system/rsync/cancel");
			resolve(response.data);
		}
		catch (err)
		{
			reject(err);
		}
	});

export default {
	// Time functions
	getTime,
	setTime,
	getTimeZones,
	getTimeZone,
	setTimeZone,
	getLocalTime,
	setLocalTime,
	getNTP,
	setNTP,
	syncKStarsTimeToNow,

	// Location
	setCountryCode,
	getLocation,
	setLocation,
	getWeather,
	getBortle,
	getCloudsTile,
	getMapTile,

	// Host name
	getHostname,
	setHostname,

	// Ekos Live
	configureEkosLive,
	setEkosLiveConnected,
	setEkosLiveUser,
	getEkosLiveProperty,
	getPicturesDirectory,

	// Device Info
	getUtilization,
	getModel,
	getVersion,
	cancelAllRequests,
	setPicturesDirectory,

	getExternalStorageInfo,
	// user
	isRegistered,
	getHomeDirectory,
	getDirectoryFiles,
	getDirectoryFolders,
	getDirectorySize,
	getDiskUtilization,
	createDirectory,
	deleteFile,
	deleteDirectory,

	// wifi
	getInterfaces,
	getWifi,
	configureWifi,
	selectWifi,
	forgetWifi,
	activateHotspot,
	deactivateHotspot,
	activateDirectEthernet,
	deactivateDirectEthernet,
	getHotspotBand,
	setHotspotBand,

	// software upgrade
	getRelease,
	getReleaseProgress,
	updateCoreSoftware,
	setRelease,
	isUpgradeable,
	upgradeSoftware,
	getProgress,
	factoryReset,
	networkReset,
	updateCoreBuild,

	// TV Modes
	getCurrentVideoMode,
	setCurrentVideoMode,
	getDMTModes,
	getCEAModes,

	// services
	restartService,

	// applications
	startApplication,
	stopApplication,
	isApplicationRunning,
	checkKStars,
	checkPHD2,
	getSoftwareVersion,

	// Auto detect
	startDeviceDetection,
	addDeviceRule,
	queryCameraInfo,

	// Driver
	syncDriverInfo,
	deleteDriverConfigs,

	// Raspberry Pi
	getTemperature,

	// Download Software
	getArchitecture,
	isServiceActive,
	isPackageDownloaded,
	downloadPackage,
	installPackage,
	removeSoftware,

	getRustDeskID,
	setRustdeskPassword,

	manageService,
	isPackageInstalled,
	packageProgress,
	handleBackup,
	handleRestore,
	getBackupProgress,
	getRestoreDownloadProgress,

	handleRestart,
	handleShutdown,

	// Streamer
	startStreamer,
	stopStreamer,

	//VNC
	setVNCPassword,

	//USB Unmount
	unmountUSB,
	getMonitorDisplays,
	setMonitor,
	setMonitorResolution,
	getUsbDevices,

	// INDI
	connectINDI,
	disconnectINDI,
	setINDIProperty,
	getINDIProperty,
	getINDIStatus,

	ekosliveReset,
	regenerateEkoslive,

	fileUpload,
	getServiceLog,
	getLog,
	getAppLog,
	downloadFromHome,
	testDslr,
	getRtcInfo,
	forceUSBReset,

	//RSync
	RSyncFolders,
	getRsyncProgress,
	cancelRSyncProgress,

	//Stella
	stellaGet,
	ekoslivePost,

	handleAppBackup,
	getS3UploadStatus,
	handleAppRestore,
	getAstrometryFile,
	getRestoreDownloadProgress,
	getRestoreProgress,
	startRestore,
	uploadToS3,
};
