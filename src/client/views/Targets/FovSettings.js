import React, { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { get, isEmpty } from "lodash";
import { Box, Button, Typography } from "@mui/material";
import { targetsActions } from "@redux/actions";
import {
	selectFovProfiles,
	selectCurrentFOVProfile,
	selectSelectedProfile,
	selectTrainName,
} from "@redux/selectors";
import s from "@common/shared/i18n/i18n";
import { Palette } from "@common/shared/common/styles";
import Icon from "../../Components/Icon";
import InputField from "../../Components/InputField";
import { trainModules } from "@indi/enums";

const FovSettings = ({ presetToggle, setPresetToggle }) =>
{
	const fovProfiles = useSelector(selectFovProfiles);
	const currentFOVProfile = useSelector(selectCurrentFOVProfile);
	const activeProfile = useSelector(selectSelectedProfile);
	const activeTrain = useSelector((state) =>
		selectTrainName(state, { trainType: trainModules.CaptureOpticalTrain }),
	);

	// if creating a profile, all fields will have default values, otherwise, gets the profile object to populate the fields
	const existingProfile =
		presetToggle.mode === "create"
			? null
			: fovProfiles.find((profile) => profile.name === currentFOVProfile);

	const profile = existingProfile || {};

	const [cameraDimensions, setCameraDimensions] = useState(
		get(profile, "cameraDimensions", { width: 0, height: 0 }),
	);
	const [pixelDimensions, setPixelDimensions] = useState(
		get(profile, "pixelDimensions", { width: 0, height: 0 }),
	);

	const [name, setName] = useState(get(profile, "name", ""));

	const [focalLength, setFocalLength] = useState(
		get(profile, "focalLength", 0),
	);

	const pa = get(profile, "pa", 0);

	const [fovW, setFovW] = useState(get(profile, "fovW", 0));
	const [fovH, setFovH] = useState(get(profile, "fovH", 0));
	const createdAt = get(profile, "createdAt", -1);
	const updatedAt = get(profile, "updatedAt", -1);

	const dispatch = useDispatch();

	// function to update modify profile state
	// has optional 'modify' prop, if set to true, will update the profile if it exists, otherwise, it adds a new profile
	// function to update modify profile state
	const updateProfilesState = (modify) =>
	{
		if (isEmpty(name))
		{
			return;
		}

		// Create a new profile object
		const newProfile = {
			focalLength,
			cameraDimensions,
			pixelDimensions,
			name,
			pa,
			fovW,
			fovH,
			profile: activeProfile,
			train: activeTrain,
			generated: false,
			createdAt: modify ? createdAt : +new Date(),
			updatedAt: modify ? +new Date() : updatedAt,
			uuid: name,
		};

		let newFovProfiles;

		if (modify)
		{
			newFovProfiles = fovProfiles.map((profile) =>
				profile.name === name ? newProfile : profile,
			);
		}
		else
		{
			newFovProfiles = [...fovProfiles, newProfile];
		}

		dispatch(targetsActions.setFovProfiles(newFovProfiles));
		dispatch(targetsActions.setCurrentFOVProfile(name));
		setPresetToggle({
			...presetToggle,
			enabled: false,
		});
	};

	return (
		<>
			<Typography sx={{ fontSize: "22px", color: Palette.white70 }}>
				{s.targets.fov_profile}
			</Typography>
			{/* Profile Name */}
			<Box sx={[LOCAL_STYLES.row, {}]}>
				<Typography sx={LOCAL_STYLES.titleFont}>{s.general.name}</Typography>
				<Typography sx={[LOCAL_STYLES.requireIndicator]}>* </Typography>
				<InputField
					value={`${name}`}
					placeholder="My Camera FOV Profile"
					onChange={(text) => setName(text)}
				/>
			</Box>

			{/* Focal Length */}
			<Box sx={[LOCAL_STYLES.row, {}]}>
				<Typography sx={LOCAL_STYLES.titleFont}>
					{s.connect.add_scope.focal_length}
				</Typography>
				<Typography sx={[LOCAL_STYLES.requireIndicator]}>* </Typography>
				<InputField
					value={`${focalLength || ""}`}
					keyboardType="numeric"
					decimal={true}
					onChange={(value) =>
					{
						value === "" ? setFocalLength(0) : setFocalLength(Number(value));
					}}
				/>
				<Typography sx={LOCAL_STYLES.titleFont}>mm</Typography>
			</Box>

			{/* Camera Dimensions */}
			<Box sx={[LOCAL_STYLES.row, {}]}>
				<Typography sx={LOCAL_STYLES.titleFont}>
					{s.targets.cam_width}
				</Typography>
				<Typography sx={[LOCAL_STYLES.requireIndicator]}>* </Typography>
				<InputField
					value={`${cameraDimensions.width || ""}`}
					keyboardType="numeric"
					onChange={(value) =>
						setCameraDimensions({
							...cameraDimensions,
							width: value,
						})
					}
				/>
				<Typography sx={LOCAL_STYLES.titleFont}>
					{s.targets.cam_height}
				</Typography>
				<Typography sx={[LOCAL_STYLES.requireIndicator]}>* </Typography>
				<InputField
					value={`${cameraDimensions.height || ""}`}
					keyboardType="numeric"
					onChange={(value) =>
						setCameraDimensions({
							...cameraDimensions,
							height: value,
						})
					}
				/>
				<Typography sx={LOCAL_STYLES.titleFont}>
					{s.ekos.capture_limits.focus_hfr_unit}
				</Typography>
			</Box>

			{/* Pixel Dimensions */}
			<Box sx={[LOCAL_STYLES.row, {}]}>
				<Typography sx={LOCAL_STYLES.titleFont}>
					{s.connect.dslr_setup.pixel_width}
				</Typography>
				<Typography sx={[LOCAL_STYLES.requireIndicator]}>* </Typography>
				<InputField
					value={`${pixelDimensions.width || ""}`}
					keyboardType="numeric"
					decimal={true}
					onChange={(value) =>
						setPixelDimensions({
							...pixelDimensions,
							width: value,
						})
					}
				/>
				<Typography sx={LOCAL_STYLES.titleFont}>
					{s.connect.dslr_setup.pixel_height}
				</Typography>
				<Typography sx={[LOCAL_STYLES.requireIndicator]}>* </Typography>
				<InputField
					value={`${pixelDimensions.height || ""}`}
					keyboardType="numeric"
					decimal={true}
					onChange={(value) =>
						setPixelDimensions({
							...pixelDimensions,
							height: value,
						})
					}
				/>
				<Typography sx={LOCAL_STYLES.titleFont}>µm</Typography>
			</Box>

			{/* pa */}
			<Box sx={[LOCAL_STYLES.row, {}]}>
				<Typography sx={LOCAL_STYLES.titleFont}>PA</Typography>
				<Typography sx={[LOCAL_STYLES.titleFont, { color: Palette.white70 }]}>
					{(pa >= 0 ? "+" : "-") +
						Math.abs(pa).toFixed(0).toString().padStart(3, "0")}
					° E of N
				</Typography>
			</Box>

			<Box
				sx={{
					borderBottomColor: Palette.grey66,
					width: "50%",
					marginBottom: "10px",
					borderBottomWidth: "1px",
				}}
			/>

			{/* FOV Width and Height */}
			<Box sx={[LOCAL_STYLES.row, {}]}>
				<Typography sx={[LOCAL_STYLES.titleFont, { color: Palette.orange }]}>
					{s.targets.fov_width}
				</Typography>
				<InputField
					value={`${fovW > 0 ? fovW.toFixed(1) : ""}`}
					keyboardType="numeric"
					onChange={(value) =>
						value === "" ? setFovW(0) : setFovW(Number(value))
					}
				/>
				<Typography sx={[LOCAL_STYLES.titleFont, { color: Palette.orange }]}>
					{s.targets.fov_height}
				</Typography>
				<InputField
					value={`${fovH > 0 ? fovH.toFixed(1) : ""}`}
					keyboardType="numeric"
					onChange={(value) =>
						value === "" ? setFovW(0) : setFovH(Number(value))
					}
				/>
				<Typography style={{ color: Palette.white70 }}>
					{s.general.arcmin}
				</Typography>
			</Box>

			<Button
				style={{
					backgroundColor: Palette.grey44,
					color: Palette.orange,
					width: "fit-content",
					margin: "0 auto",
				}}
				onClick={() =>
				{
					if (focalLength !== 0)
					{
						setFovW(
							(206264.8062470963552 *
								cameraDimensions.width *
								pixelDimensions.width) /
								60000.0 /
								focalLength,
						);
						setFovH(
							(206264.8062470963552 *
								cameraDimensions.height *
								pixelDimensions.height) /
								60000.0 /
								focalLength,
						);
					}
				}}
			>
				{s.general.calculate} FOV
			</Button>

			<Box style={LOCAL_STYLES.closeButton}>
				<Button
					sx={[LOCAL_STYLES.exitButtons]}
					onClick={() =>
					{
						if (presetToggle.mode === "create") updateProfilesState();
						else updateProfilesState(true);
					}}
				>
					<Icon name="save" size={28} color={Palette.white} />
				</Button>
				<Button
					sx={[LOCAL_STYLES.exitButtons]}
					onClick={() =>
						setPresetToggle({
							...presetToggle,
							enabled: false,
						})
					}
				>
					<Icon name="Close" size={28} color={Palette.white} />
				</Button>
			</Box>
		</>
	);
};

export default FovSettings;

const LOCAL_STYLES = {
	closeBtn: {
		width: "48px",
		height: "40px",
		marginLeft: "8px",
		marginBottom: "15px",
	},
	titleFont: {
		fontSize: "18px",
		width: "150px",
		color: Palette.white70,
	},
	row: {
		display: "flex",
		alignItems: "center",
		flexDirection: "row",
		gap: "10px",
	},
	requireIndicator: {
		color: Palette.red,
		alignSelf: "flex-start",
	},
	closeButton: {
		position: "absolute",
		right: "50px",
		top: "50px",
		alignItems: "center",
		justifyContent: "center",
		display: "flex",
		gap: "8px",
	},
	exitButtons: {
		width: "48px",
		height: "48px",
		backgroundColor: Palette.orange,
	},
};
