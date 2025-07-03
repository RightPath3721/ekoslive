import { Box, Button, Typography } from "@mui/material";
import { get, isEmpty, isEqual } from "lodash";
import React, { memo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import Dropdown from "../../Components/Dropdown";
import Icon from "../../Components/Icon";
import { styles } from "../../shared/styles";
import { Palette } from "@common/shared/common/styles";
import { targetsActions } from "@redux/actions";
import {
	selectFovProfiles,
	selectCurrentFOVProfile,
	selectSelectedProfile,
	selectTrainName,
} from "@redux/selectors";
import { trainModules } from "@indi/enums";

const FovBar = ({
	setPresetToggle,
	setShowFilterOverlay,
	setShowListOverlay,
}) =>
{
	const dispatch = useDispatch();

	const fovProfiles = useSelector(selectFovProfiles);
	const currentFOVProfile = useSelector(selectCurrentFOVProfile);
	const activeTrain = useSelector((state) =>
		selectTrainName(state, {
			trainType: trainModules.CaptureOpticalTrain,
		}),
	);
	const activeSetupProfile = useSelector(selectSelectedProfile);
	// Use shallow equal so that selector is updated when the fovProfiles array is UPDATED.
	const selectedFOVProfile = useSelector(
		(state) =>
			state.targets.fovProfiles.find(
				(oneFOV) => oneFOV.name === currentFOVProfile,
			),
		isEqual,
	);
	const [activeProfile, setActiveProfile] = useState("");

	return (
		<Box
			sx={[
				styles.row,
				{ alignItems: "center", gap: "5px", justifyContent: "space-between" },
			]}
		>
			<Typography sx={LOCAL_STYLES.header}>FOV</Typography>
			<Dropdown
				disabled={isEmpty(fovProfiles)}
				width="180px"
				options={fovProfiles
					.filter(
						(profile) =>
							!profile.deletedAt &&
							get(profile, "profile", "") === activeSetupProfile &&
							get(profile, "train", "") === activeTrain,
					)
					.map((oneProfile) => ({
						label: oneProfile.name,
						value: oneProfile.name,
					}))}
				onChange={(newProfile) =>
				{
					dispatch(targetsActions.setCurrentFOVProfile(newProfile.label));
					setActiveProfile(newProfile.label);
				}}
				value={currentFOVProfile}
			/>

			<Button
				sx={LOCAL_STYLES.fovButton}
				onClick={() =>
				{
					setShowListOverlay(false);
					setShowFilterOverlay(false);
					setPresetToggle({ enabled: true, mode: "create" });
				}}
			>
				<Icon name="add" color="white" />
			</Button>

			<Button
				sx={LOCAL_STYLES.fovButton}
				onClick={() =>
				{
					setPresetToggle({ enabled: true, mode: "edit" });
					setShowListOverlay(false);
					setShowFilterOverlay(false);
				}}
				disabled={!selectedFOVProfile || selectedFOVProfile.generated}
			>
				<Icon
					name="edit"
					color="white"
					sx={{ width: "30px", height: "30px" }}
				/>
			</Button>
			<Button
				sx={LOCAL_STYLES.fovButton}
				onClick={() =>
				{
					const newFovProfiles = [...fovProfiles];

					// Find the index of the profile to be "deleted"
					let index = newFovProfiles.findIndex(
						(profile) => profile.name === activeProfile,
					);

					if (index !== -1)
					{
						const updatedProfile = {
							...newFovProfiles[index], // Copy all existing properties
							deletedAt: +new Date(), // Add deletedAt timestamp
						};
						newFovProfiles[index] = updatedProfile;
					}

					// Dispatch updated array to the store
					dispatch(targetsActions.setFovProfiles(newFovProfiles));
					dispatch(targetsActions.setCurrentFOVProfile(""));
				}}
				disabled={!selectedFOVProfile || selectedFOVProfile.generated}
			>
				<Icon name="delete" color="white" />
			</Button>
		</Box>
	);
};

export default memo(FovBar);

const LOCAL_STYLES = {
	fovButton: {
		minWidth: "auto",
	},
	header: {
		color: Palette.white70,
		fontSize: "20px",
		width: "60px",
	},
};
