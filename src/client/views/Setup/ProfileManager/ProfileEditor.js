import { useTheme } from "@mui/material";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Grid from "@mui/material/Grid";
import Typography from "@mui/material/Typography";
import isEmpty from "lodash/isEmpty";
import React, { useCallback, useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { profileActions } from "@redux/actions";
import { SNACKBAR_VARIANTS } from "@redux/constants";
import { selectDrivers, selectProfiles } from "@redux/selectors";
import s from "@common/shared/i18n/i18n";
import InputField from "@components/InputField";
import { SelectInput } from "@components/Select";
import CloseButton from "@components/CloseButton";
import AdvancedSettingsToggler from "./AdvancedSettingsToggler";

const ProfileEditor = ({ open, isNew, close, profile, setTargetProfile }) =>
{
	const { palette } = useTheme();
	const dispatch = useDispatch();
	const drivers = useSelector(selectDrivers);
	const profiles = useSelector(selectProfiles);

	const [newProfile, setNewProfile] = useState(profile);

	useEffect(() =>
	{
		if (isNew)
		{
			setNewProfile({});
		}
		else
		{
			setNewProfile(profile);
		}
	}, [isNew, open]);

	const onAcceptAction = () =>
	{
		if (isNew && isEmpty(newProfile.name))
			dispatch({
				type: SNACKBAR_VARIANTS.ERROR,
				message: "Cannot save unnamed profile.",
			});
		else if (
			isNew &&
			profiles.find((item) =>
			{
				return item.name === newProfile.name;
			})
		)
			dispatch({
				type: SNACKBAR_VARIANTS.ERROR,
				message: "Profile name already exists. Please choose another name.",
			});
		else
		{
			// CallFunction(profileEditor.onAccept, newProfile);
			// setErrorMessage("");
			setTargetProfile(newProfile);
			dispatch(profileActions.saveSelectedProfile(newProfile.name));
			onAccept({ ...newProfile, port_selector: true });
		}
	};

	const onAccept = (newProfile) =>
	{
		// Always make sure the profiles are synced
		const isExist = profiles.find((item) => item.name === newProfile.name);
		if (isExist) dispatch(profileActions.updateProfile(newProfile));
		else
		{
			dispatch(profileActions.addProfile(newProfile));
		}
		close();
	};

	const updateProfile = useCallback(
		(key, value) =>
		{
			setNewProfile((prevData) => ({ ...prevData, [key]: value }));
		},
		[setNewProfile],
	);

	return (
		<Box
			sx={{
				borderRadius: ".5rem",
				backgroundColor: "common.black",
				border: `1px solid ${palette.black[500]}`,
				padding: "1rem",
				position: "relative",
				width: "calc(100% - 3rem)",
			}}
		>
			<CloseButton right="15px" top="15px" onChange={close} />
			<Typography variant="h2">
				{isNew
					? s.connect.add_profile.add_profile
					: s.connect.add_profile.edit_profile}
			</Typography>

			<Grid
				container
				sx={{
					flexDirection: "row",
					display: "flex",
					marginTop: "24px",
					gap: "24px",
					flexWrap: "nowrap",
				}}
			>
				{[
					[
						{ driver: "mount", family: "Telescopes" },
						{ driver: "ccd", family: "CCDs" },
						{ driver: "guider", family: "CCDs" },
						{ driver: "focuser", family: "Focusers" },
					],
					[
						{ driver: "filter", family: "Filter Wheels" },
						{ driver: "ao", family: "Adaptive Optics" },
						{ driver: "dome", family: "Domes" },
						{ driver: "weather", family: "Weather" },
					],
					[
						{ driver: "aux1", family: "Auxiliary" },
						{ driver: "aux2", family: "Auxiliary" },
						{ driver: "aux3", family: "Auxiliary" },
						{ driver: "aux4", family: "Auxiliary" },
					],
				].map((item, idx) => (
					<Grid
						item
						sx={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}
						xs={4}
						key={idx}
					>
						{item.map(({ driver, family }) => (
							<Box key={driver}>
								<Typography>{s.connect.add_profile[driver]}</Typography>
								<SelectInput
									isClearable={false}
									value={
										isEmpty(newProfile) || !newProfile[driver]
											? s.general.select_option
											: newProfile[driver]
									}
									onChange={(item) =>
									{
										setNewProfile({ ...newProfile, [driver]: item.value });
									}}
									options={[
										{ label: "--", value: "--" },
										...drivers
											.filter((item) =>
											{
												return family ? item.family === family : true;
											})
											.map((item) => ({
												label: item.label,
												value: item.label,
											})),
									]}
									width="auto"
								/>
							</Box>
						))}
					</Grid>
				))}
			</Grid>

			<Box
				sx={{
					display: "flex",
					flexDirection: "row",
					alignItems: "center",
					marginTop: "24px",
					gap: "8px",
				}}
			>
				<Typography sx={{ color: "white" }}>{s.general.name}</Typography>
				<InputField
					value={newProfile?.name ?? ""}
					placeholder="My Observatory"
					disabled={!isNew}
					width="400px"
					onChange={(e) =>
					{
						setNewProfile({ ...newProfile, name: e });
					}}
					clear={() => setNewProfile({ ...newProfile, name: "" })}
				/>
				<AdvancedSettingsToggler
					newProfile={newProfile}
					setNewProfile={updateProfile}
				/>
				<Button variant="contained" onClick={onAcceptAction}>
					{s.general.save}
				</Button>
			</Box>
		</Box>
	);
};

export default ProfileEditor;
