import React, { Fragment, useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import isEqual from "lodash/isEqual";
import { useTheme } from "@mui/material";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { optionActions } from "@redux/actions";
import { selectOptions, selectIsProPlan, selectUser } from "@redux/selectors";
import { optionsConstants } from "@redux/constants";
import s from "@common/shared/i18n/i18n";
import { styles } from "@client/shared/styles";
import CustomizedSwitch from "@components/CustomSwitch";
import Dropdown from "@components/Dropdown";
import SwitchToggle from "@components/Switch";
import PricingTableModal from "@components/PricingTableModal";
import CurrentPlanInformer from "@components/shared/PricingTable/CurrentPlanInformer";
import { planType } from "@indi/enums";
import CloudStorageUsage from "@components/CloudStorageUsage";
import { ekosliveServer } from "@client/config";

const SettingsText = ({ title }) =>
{
	return <Typography sx={{ fontSize: "1rem" }}>{title}</Typography>;
};

const settingsList = [
	"ekosLiveHighBandwidth",
	"ekosLiveImageTransfer",
	"ekosLiveNotifications",
	"tourguide",
	"ekosLiveSound",
	"ekosLiveCloud",
];
const syncSettingsList = ["timeSync", "locationSync"];
const labelNames = {
	unitSystem: {
		command: optionsConstants.UNIT_SYSTEM,
		text: s.settings.unit_system,
	},
	ekosLiveHighBandwidth: {
		command: optionsConstants.ekosLiveHighBandwidth,
		text: s.settings.high_bandwidth,
	},
	ekosLiveImageTransfer: {
		command: optionsConstants.ekosLiveImageTransfer,
		text: s.settings.transfer_images,
	},
	ekosLiveNotifications: {
		command: optionsConstants.ekosLiveNotifications,
		text: s.settings.notifications,
	},
	tourguide: {
		command: optionsConstants.TOUR_GUIDE,
		text: s.tourGuide.tour_guide,
	},
	ekosLiveSound: {
		command: optionsConstants.ekosLiveSound,
		text: s.settings.sounds,
	},
	ekosLiveCloud: {
		command: optionsConstants.ekosLiveCloud,
		text: s.settings.cloud_storage,
	},
	timeSync: {
		command: optionsConstants.TIME_SYNC,
		text: s.status.time,
	},
	locationSync: {
		command: optionsConstants.LOCATION_SYNC,
		text: s.settings.location,
	},
};

const Settings = ({ active }) =>
{
	const dispatch = useDispatch();
	const { palette } = useTheme();

	const options = useSelector(selectOptions, isEqual);
	const isProPlan = useSelector(selectIsProPlan);
	const user = useSelector(selectUser); // User object includes username and token

	const [showModal, setShowModal] = useState(false);
	const [cloudUsage, setCloudUsage] = useState({ usage: 0, limit: 1, percentage: 0 });
	const [loadingUsage, setLoadingUsage] = useState(false);

	const toggleSetting = async (setting, value) =>
	{
		// Dispatch Redux action for immediate UI update
		dispatch(optionActions.setOption(labelNames[setting].command, value));

		// If the setting is ekosLiveCloud, also call the API to persist
		if (labelNames[setting].command === optionsConstants.ekosLiveCloud)
		{
			if (user && user.username && user.token)
			{
				try
				{
					const url = `api/user/settings/cloud-storage?username=${encodeURIComponent(user.username)}&token=${user.token}`;
					await ekosliveServer.put(
						url,
						{ ekosLiveCloudEnabled: value },
						// No special headers needed if auth is via query params
					);
					// Optionally, handle success (e.g., show a toast notification)
					console.log("EkosLive Cloud setting updated successfully via API");
				} catch (error)
				{
					console.error("Failed to update EkosLive Cloud setting via API:", error);
					// Optionally, handle error (e.g., show a toast, revert Redux state)
					// For now, we'll keep the UI optimistic and log the error.
					// Consider reverting the Redux state if the API call fails:
					// dispatch(optionActions.setOption(labelNames[setting].command, !value));
				}
			} else
			{
				console.error("Username or token not available, cannot update EkosLive Cloud setting via API.");
			}
		}
	};

	const handleLanguageChange = ({ value }) =>
	{
		s.setLanguage(value);
		dispatch(optionActions.setOption("language", value));
	};

	const handleUnitSystemChange = (value) =>
	{
		if (value)
		{
			dispatch(optionActions.setOption("unitSystem", value));
		}
	};

	// Fetch cloud storage usage data
	const fetchCloudUsage = async () =>
	{
		if (!user || !user.token) return;

		setLoadingUsage(true);
		try
		{
			const response = await ekosliveServer.get(`api/cloud/usage`, {
				params: {
					username: user.username,
					token: user.token
				}
			});

			if (response.data.result)
			{
				setCloudUsage({
					usage: response.data.usage,
					limit: response.data.limit,
					percentage: response.data.percentage
				});
			}
		} catch (error)
		{
			console.error("Error fetching cloud usage:", error);
		} finally
		{
			setLoadingUsage(false);
		}
	};

	useEffect(() =>
	{
		dispatch(
			optionActions.getOptions(settingsList.map((key) => ({ name: key }))),
		);

		// Fetch cloud usage when component mounts and when user changes
		if (active && user)
		{
			fetchCloudUsage();
		}
	}, [active, user]);

	// Refetch cloud usage when cloud storage option changes
	useEffect(() =>
	{
		if (active && user && options.ekosLiveCloud)
		{
			fetchCloudUsage();
		}
	}, [options.ekosLiveCloud]);

	if (!active) return null;

	return (
		<Box
			sx={{
				padding: "2rem",
				width: "100%",
				display: "flex",
				gap: "4rem",
				backgroundColor: palette.black[800],
			}}
		>
			<Box sx={[LOCAL_STYLES.gridItem]}>
				<Typography
					sx={[styles.text, { gridColumn: "span 2", fontSize: "1.5rem" }]}
				>
					{s.settings.heading}
				</Typography>
				{/* <SettingsText title={s.settings.language} />
				<Dropdown
					value={s.getLanguage()}
					options={s
						.getAvailableLanguages()
						.map((lang) => ({ label: lang, value: lang }))}
					onChange={handleLanguageChange}
				/> */}
				<SettingsText title={labelNames.unitSystem.text} />
				<CustomizedSwitch
					options={[
						{ label: s.settings.metric, value: "metric" },
						{ label: s.settings.imperial, value: "imperial" },
					]}
					onChange={handleUnitSystemChange}
					value={options.unitSystem}
				/>
				{settingsList.map((setting, index) => (
					<Fragment key={index}>
						<SettingsText title={labelNames[setting].text} />
						<Box sx={{ display: "flex", gap: "6px", alignItems: "center" }}>
							<SwitchToggle
								checked={options[setting]}
								onChange={(e) => toggleSetting(setting, e.target.checked)}
							/>
							{labelNames[setting].text === s.settings.cloud_storage && (
								<>
									{
										options.ekosLiveCloud && !loadingUsage && cloudUsage.usage > 0 && (
											<CloudStorageUsage
												usage={cloudUsage.usage}
												limit={cloudUsage.limit}
											/>
										)
									}
									{(user && user.plan_id === planType.DEFAULT) && (
										<CurrentPlanInformer text={s.settings.limit_cloud_storage} />
									)}
								</>
							)}
						</Box>
					</Fragment>
				))}
			</Box>
			<Box sx={[LOCAL_STYLES.gridItem]}>
				<Typography
					sx={[styles.text, { gridColumn: "span 2", fontSize: "1.5rem" }]}
				>
					{s.settings.auto_sync}
				</Typography>
				{syncSettingsList.map((setting, index) => (
					<Fragment key={index}>
						<SettingsText title={labelNames[setting].text} />
						<SwitchToggle
							checked={options[setting]}
							onChange={(e) => toggleSetting(setting, e.target.checked)}
						/>
					</Fragment>
				))}
			</Box>
			<PricingTableModal open={showModal} close={() => setShowModal(false)} />
		</Box>
	);
};

const LOCAL_STYLES = {
	gridItem: {
		display: "grid",
		gridTemplateColumns: "140px 1fr",
		rowGap: ".75rem",
		columnGap: ".5rem",
		gridTemplateRows: "repeat(auto-fill, 50px)",
		alignItems: "center",
	},
};

export default Settings;
