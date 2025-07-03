import { Box, Button, Checkbox, Typography } from "@mui/material";
import { get } from "lodash";
import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { alignActions, polarActions } from "@redux/actions";
import s from "@common/shared/i18n/i18n";
import { styles } from "../../shared/styles";
import { Palette } from "@common/shared/common/styles";
import NumericControl from "../../Components/NumericControl";
import {
	selectPolarStage,
	selectAlignSettings,
	selectManualSlew,
} from "@redux/selectors";

const LOCAL_STYLES = {
	polarControlsContainer: {
		position: "absolute",
		top: "50px",
		right: "16px",
		zIndex: 10,
		display: "flex",
		flexDirection: "column",
		gap: "12px",
		padding: "12px",
		backgroundColor: "#1D1D1D",
		borderRadius: "4px",
	},
};

const PolarControls = () =>
{
	const dispatch = useDispatch();

	const stage = useSelector(selectPolarStage);
	const polarSettings = useSelector(selectAlignSettings);
	const manualSlew = useSelector(selectManualSlew);
	const [refresh, setRefresh] = useState(1);
	const [selectedAlgorithm, setSelectedAlgorithm] = useState(
		get(polarSettings, "pAHRefreshAlgorithm", null),
	);

	useEffect(() =>
	{
		let payload = {
			pAHExposure: refresh,
			pAHRefreshAlgorithm: selectedAlgorithm,
		};
		dispatch(alignActions.setAllSettings(payload));
	}, [refresh, selectedAlgorithm]);
	return (
		<Box sx={[LOCAL_STYLES.polarControlsContainer]}>
			{stage === "Second Rotation" && manualSlew === true ? (
				<Button
					onClick={() =>
						{
						dispatch(polarActions.setManualSlewDone());
					}}
					fullWidth
					sx={{ color: "white", width: "max-content" }}
				>
					{s.general.next}
				</Button>
			) : null}
			{/* At Select Refresh stage, allow the user to select a refresh rate, the click on set before starting */}
			{(stage === "Select Refresh" ||
				stage === "Select Star" ||
				stage === "Refreshing") && (
				<>
					{stage === "Refreshing" ? (
						<Button
							onClick={() =>
								{
								dispatch(polarActions.refreshingDone());
							}}
							sx={{
								backgroundColor: Palette.orange,
								color: "white",
								width: "max-content",
							}}
							fullWidth
						>
							{s.general.done}
						</Button>
					) : (
						<Button
							sx={{
								backgroundColor: Palette.orange,
								color: Palette.white,
								width: "max-content",
							}}
							onClick={() =>
								{
								dispatch(polarActions.refresh(refresh));
							}}
							fullWidth
						>
							{s.ekos.collapse_polar.refresh}
						</Button>
					)}
					{stage !== "Refreshing" && (
						<Box
							sx={[
								styles.row,
								styles.center,
								{ justifyContent: "flex-start", width: "100%", gap: "10px" },
							]}
						>
							<Checkbox
								sx={{ padding: 0, color: "white" }}
								color="default"
								checked={selectedAlgorithm === "Plate Solve"}
								onChange={() =>
								{
									if (selectedAlgorithm === "Plate Solve")
										setSelectedAlgorithm("Move Star & Calc Error");
									else setSelectedAlgorithm("Plate Solve");
								}}
							/>
							<Typography sx={[{ color: "white", width: "max-content" }]}>
								{s.ekos.livestacking.plate_solve}
							</Typography>
						</Box>
					)}
					<Box>
						<Typography
							sx={[{ color: "white", width: "max-content" }]}
						>{`${s.ekos.collapse_align.refresh_rate}: ${refresh}s`}</Typography>
						<NumericControl
							initialValue={refresh}
							onChange={(newRefreshRate) =>
							{
								setRefresh(newRefreshRate);
							}}
							customLimit={[1, 30]}
							steps={[1, 1]}
						/>
					</Box>
				</>
			)}
		</Box>
	);
};

export default PolarControls;
