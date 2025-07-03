import { get } from "lodash";
import moment from "moment";
import { APP_MODE } from "../../../config";
import api, { POST } from "@common/shared/utils/api";
import { logError } from "../../utils/logs";
import { store } from "../store";
import { deviceConstants, userConstants } from "../constants";
import { wssMessageSocketActions } from "./wssMessageSocketActions";
import { wssMediaSocketActions } from "./wssMediaSocketActions";
import { removeAll } from "./progress.actions";
import { setupActions } from "./setup.actions";
import { alertActions } from "./alert.actions";
import commands from "../../commands";
import { Severity } from "../../indi/enums";
import s from "../../i18n/i18n";

export const userActions = {
	login,
	register,
	register_user,
	get_register_info,
	logout,
};

const webLogin = (username, password) =>
{
	return async (dispatch) =>
	{
		dispatch(request(null));
		try
		{
			const user = await authenticate(username, password);
			dispatch(success(user));
		}
		catch (error)
		{
			dispatch(failure(error));
			dispatch(alertActions.error(error));
		}
	};

	async function authenticate(username, password)
	{
		if (!username || !password) return Promise.reject("Username and password are required");
		const requestOptions = {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ username, password }),
		};
		return fetch("/api/authenticate", requestOptions)
			.then((response) =>
			{
				if (!response.ok)
				{
					return Promise.reject(response.statusText);
				}
				return response.json();
			})
			.then((user) =>
			{
				if (user)
				{
					if (user.token === undefined) return Promise.reject(user.message);
				}
				return user;
			});
	}

	function request(user)
	{
		return { type: userConstants.USER_LOGIN_REQUESTED, user };
	}

	function success(user)
	{
		return { type: userConstants.USER_LOGIN_SUCCEEDED, user };
	}

	function failure(error)
	{
		return { type: userConstants.USER_LOGIN_FAILED, error };
	}
};
const appLogin = (username, password, ip, license, serial) =>
{
	return async (dispatch) =>
	{
		dispatch(request({ username }));

		const url = `http://${ip}:3000/api/authenticate/`;
		try
		{
			const response = await POST(
				url,
				{ username, password },
				{ timeout: 10000 },
			);
			const { deviceActions } = await import("./devices.mobile.actions");
			const data = response.data;
			if (!data.success)
			{
				// If we get not registered error, then we try to register
				if (data.message.includes("not registered"))
				{
					dispatch(register({ username, password, license, serial, ip }));
				}
				else
				{
					dispatch(removeAll());
					dispatch(failure(data.message));
					dispatch({
						type: deviceConstants.DEVICE_UPDATE,
						payload: { ip, connecting: false, logged: false },
					});
					dispatch(deviceActions.setEkosLiveStatus(0));
				}
				//dispatch(alertActions.error(error));
			}
			else
			{
				dispatch(success({ ...data, username, password }));

				let isEkosLiveConnected = false;
				try
				{
					isEkosLiveConnected = await api.getEkosLiveProperty(
						ip,
						"ekosLiveStatus",
					);
					dispatch(deviceActions.setKStarsStatus(1));
				}
				catch (error)
				{
					logError(
						`Failed to query EkosLive status. KStars down? ${error.message}`,
					);
				}
				finally
				{
					// If ekoslive is not connected, try to connect it
					if (isEkosLiveConnected === false)
					{
						try
						{
							await prepareEkosLive(username, password, ip);
							dispatch(deviceActions.setKStarsStatus(1));
							dispatch(deviceActions.setEkosLiveStatus(1));
							isEkosLiveConnected = true;
						}
						catch (error)
						{
							dispatch(deviceActions.setEkosLiveStatus(0));
							dispatch({
								type: deviceConstants.DEVICE_UPDATE,
								payload: { ip, connecting: false, logged: false },
							});
							dispatch(removeAll());
							dispatch(failure(error.message));
						}
					}
					else dispatch(deviceActions.setEkosLiveStatus(1));
				}

				// No need to proceed if EkosLive is down
				if (isEkosLiveConnected === false) return;

				dispatch(wssMessageSocketActions.connect(data, ip));
				dispatch(wssMediaSocketActions.connect(data, ip));

				// If either time or location need syncing
				// then we do this.
				const syncTime = get(store.getState().options, "timeSync", false);
				const syncLocation = get(
					store.getState().options,
					"locationSync",
					false,
				);

				if (syncTime || syncLocation)
				{
					// Sync Time and Location
					try
					{
						if (syncLocation)
						{
							const location = await api.getLocation();
							dispatch(setupActions.saveLocation(location));

							await api.setLocation(ip, location);
						}
						if (syncTime)
						{
							await Promise.all([
								api.setTimeZone(ip),
								api.setNTP(ip, false),
								api.setTime(ip),
								api.syncKStarsTimeToNow(ip),
								api.setNTP(ip, true),
							]);
						}
					}
					catch (error)
					{
						logError(
							`Failed to synchronize StellarMate. ${JSON.stringify(error)}`,
						);
					}
				}
			}
		}
		catch (error)
		{
			// TO remove "establishing connection" message if the auto-login fails.
			dispatch(removeAll());
			dispatch(failure(error.message));
			dispatch({
				type: deviceConstants.DEVICE_UPDATE,
				payload: { ip, connecting: false, logged: false },
			});
			logError(`login Error: ${JSON.stringify(error)}`);
		}
	};

	function request(user)
	{
		return { type: userConstants.USER_LOGIN_REQUESTED, payload: user };
	}

	function success(user)
	{
		return { type: userConstants.USER_LOGIN_SUCCEEDED, payload: user };
	}

	function failure(error)
	{
		return (dispatch) =>
		{
			dispatch({ type: userConstants.USER_LOGIN_FAILED, payload: error });
			const ts = moment().format("YYYY-MM-DD-hh-mim-ss");
			dispatch({
				type: commands.NEW_NOTIFICATION,
				payload: { severity: Severity.CRITICAL, uuid: ts, message: error },
			});
		};
	}
};

export const login = ({ username, password, ip, license, serial }) =>
{
	return APP_MODE === "1"
		? webLogin(username, password)
		: appLogin(username, password, ip, license, serial);
};

export const get_register_info = ({ username, password }) =>
{
	return (dispatch) =>
	{
		dispatch(request({ username }));

		const url = `https://ekoslive.com/api/register_info/`;
		POST(url, { username, password })
			.then((response) =>
			{
				const data = response.data;
				if (!data.success) dispatch(failure(data.message));
				else dispatch(success({ ...data, password }));
			})
			.catch((error) =>
			{
				const response = get(error, "response", null);
				// If we have a response object, then try to extract actual failure message.
				if (response)
				{
					// If we get data then the request went through but authentication failed.
					const data = response.data;
					if (data) dispatch(failure(data.message));
					// Otherwise some generic server error
					else dispatch(failure(error.message));
				}
				// We get this if network access fails.
				else if (error.message === "Network Error")
				{
					// network error
					dispatch(failure(s.general.internet_required));
				}
				else dispatch(failure(error.message));
			});
	};

	function request(user)
	{
		return { type: userConstants.USER_REGISTER_INFO_REQUESTED, payload: user };
	}

	function success(user)
	{
		return { type: userConstants.USER_REGISTER_INFO_SUCCEEDED, payload: user };
	}

	function failure(error)
	{
		return (dispatch) =>
		{
			dispatch({
				type: userConstants.USER_REGISTER_INFO_FAILED,
				payload: error,
			});
			const ts = moment().format("YYYY-MM-DD-hh-mm-ss");
			dispatch({
				type: commands.NEW_NOTIFICATION,
				payload: { severity: Severity.CRITICAL, uuid: ts, message: error },
			});
		};
	}
};

export const register_user = ({ name, email, password, serial }) =>
{
	return (dispatch) =>
	{
		dispatch(request({ name }));

		const url = `https://stellarmate.com/scripts/register_user.php`;
		POST(url, {
			name,
			email,
			password,
			serial,
			client_key: "AS7@WpUYknGd13qtB&e*0NslU3NFmy!JVa9avOxjvKRoZD2EzF",
		})
			.then((response) =>
			{
				const data = response.data;
				if (!data.result) dispatch(failure(data.message));
				else dispatch(success({ ...data, password }));
			})
			.catch((error) =>
			{
				if (!error.status || error.message === "Network Error")
				{
					// network error
					dispatch(failure(s.general.internet_required));
				}
				else dispatch(failure(error.message));
			});
	};

	function request(user)
	{
		return { type: userConstants.USER_REGISTER_QR_REQUESTED, payload: user };
	}

	function success(user)
	{
		return { type: userConstants.USER_REGISTER_QR_SUCCEEDED, payload: user };
	}

	function failure(error)
	{
		return { type: userConstants.USER_REGISTER_QR_FAILED, payload: error };
	}
};

export const register = ({ username, password, license, serial, ip }) =>
{
	return async (dispatch) =>
	{
		dispatch(request({ username }));
		try
		{
			const url = `http://${ip}:3000/api/register/`;
			const response = await POST(url, { username, password, license, serial });
			const data = response.data;
			if (!data.success) dispatch(failure(data.message));
			else
			{
				dispatch(success({ ...data, username, password, license, serial }));
				try
				{
					await prepareEkosLive(username, password, ip);
					dispatch(login({ username, password, ip }));
				}
				catch (error)
				{
					dispatch(failure(error));
				}
			}
		}
		catch (error)
		{
			logError(`Failed to register. ${JSON.stringify(error)}`);

			if (!error.status || error.message === "Network Error")
			{
				// network error
				dispatch(failure(s.general.network_error));
			}
			else dispatch(failure(error.message));
		}
	};

	function request(user)
	{
		return { type: userConstants.USER_REGISTER_REQUESTED, payload: user };
	}

	function success(user)
	{
		return { type: userConstants.USER_REGISTER_SUCCEEDED, payload: user };
	}

	function failure(error)
	{
		return (dispatch) =>
		{
			dispatch({ type: userConstants.USER_REGISTER_FAILED, payload: error });
			const ts = moment().format("YYYY-MM-DD-hh-mm-ss");
			dispatch({
				type: commands.NEW_NOTIFICATION,
				payload: { severity: Severity.CRITICAL, uuid: ts, message: error },
			});
		};
	}
};

export const logout = () =>
{
	return (dispatch) =>
	{
		dispatch(wssMessageSocketActions.disconnect());
		dispatch(wssMediaSocketActions.disconnect());
		dispatch({ type: userConstants.USER_LOGOUT_REQUESTED });
		dispatch({ type: userConstants.LOGOUT });
	};
};

const prepareEkosLive = async (username, password, ip) =>
{
	return Promise.all([
		api.checkKStars(ip),
		api.setEkosLiveConnected(ip, false),
		api.setEkosLiveUser(ip, username, password),
		api.configureEkosLive(ip),
		api.setEkosLiveConnected(ip, true),
	]);
};
