import React, { useEffect, useState } from "react";
import { Box, Button, IconButton, Typography } from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import { isEqual } from "lodash";
import { useDispatch, useSelector } from "react-redux";
import { opticalTrainActions } from "@redux/actions";
import OpticalTrainModal from "./OpticalTrainModal";
import { Palette } from "@common/shared/common/styles";
import s from "@common/shared/i18n/i18n";
import CloseButton from "./CloseButton";
import { selectTrains, selectAllTrains } from "@redux/selectors";
import { toast } from "react-toastify";

const OpticalTrains = ({ close, toggleScopeLens }) =>
{
	const dispatch = useDispatch();
	const trains = useSelector(selectTrains);

	const allTrains = useSelector(selectAllTrains, isEqual);

	const [open, setOpen] = useState(false);
	const [currentTrain, setCurrentTrain] = useState({});

	const deleteTrain = (item) =>
	{
		dispatch(
			opticalTrainActions.removeOpticalTrain({
				name: allTrains[item].name,
			}),
		);
		dispatch(opticalTrainActions.getOpticalTrainInfo());
	};

	useEffect(() =>
	{
		// Only get trains when we are online
		dispatch(opticalTrainActions.getAllTrains());
		dispatch(opticalTrainActions.getSelectedTrains());

		setCurrentTrain(allTrains[0]);
	}, []);

	return (
		<Box sx={LOCAL_STYLES.modal}>
			<CloseButton right="1%" top="1%" onChange={close} />
			<CloseButton
				icon="refresh"
				right="1%"
				top="10%"
				onChange={() =>
				{
					dispatch(opticalTrainActions.getAllTrains());
					toast.success(s.notifications.train_refresh);
				}}
			/>
			<Typography
				sx={{
					color: Palette.white,
					margin: "0 auto",
					gridColumn: "span 2",
					fontSize: "20px",
					fontWeight: 500,
				}}
			>
				{s.tourGuide.title_trains}
			</Typography>

			<Box
				sx={{
					backgroundColor: "#1d1d1d",
					padding: "6px",
					display: "flex",
					flexDirection: "column",
				}}
			>
				<Box
					sx={{
						height: "400px",
						display: "flex",
						flexDirection: "column",
						gap: "12px",
					}}
				>
					{trains.map((oneTrain, index) =>
					{
						return (
							<Box
								sx={{
									display: "flex",
									justifyContent: "space-between",
									gap: "6px",
								}}
								key={`${oneTrain.label}${index}`}
							>
								<Button
									sx={{
										backgroundColor:
											allTrains[index].id === currentTrain.id
												? Palette.orange
												: "",
										width: "160px",
										"&:hover": {
											backgroundColor:
												allTrains[index] === currentTrain ? Palette.orange : "",
										},
										color: Palette.white,
										textAlign: "center",
									}}
									onClick={() =>
									{
										setCurrentTrain(allTrains[index]);
										setOpen(true);
									}}
								>
									{oneTrain.label}
								</Button>

								<IconButton
									onClick={() => deleteTrain(index)}
									sx={[
										{
											width: "40px",
											height: "40px",
											minWidth: "auto",
											padding: 0,
										},
										{ backgroundColor: "#FFFCFA1A", borderRadius: "4px" },
									]}
								>
									<DeleteIcon sx={{ color: "#CECECE", fontSize: 20 }} />
								</IconButton>
							</Box>
						);
					})}
				</Box>

				<Button
					onClick={() =>
					{
						dispatch(
							opticalTrainActions.addOpticalTrain({
								...allTrains[0],
								name: "New Train",
							}),
						);
					}}
					sx={{
						backgroundColor: "#ff6600",
						color: Palette.white,
						textAlign: "center",
						marginTop: "auto",
						width: "160px",
					}}
				>
					{s.optical_train.create_new}
				</Button>
			</Box>

			<OpticalTrainModal
				currentTrain={currentTrain}
				open={open}
				close={close}
				toggleScopeLens={toggleScopeLens}
			/>
		</Box>
	);
};

const LOCAL_STYLES = {
	btn: {
		backgroundColor: "#ff6600",
		color: "#FFFFFF",
		textTransform: "none",
		width: "175px",
		height: "52px",
		border: "1px solid #2d2d2d",
	},
	modal: {
		borderRadius: 2,
		backgroundColor: "#151515",
		border: "1px solid #252525",
		padding: "18px",
		position: "absolute",
		top: "70px",
		zIndex: 1001,
		display: "grid",
		gridTemplateColumns: "1fr 4fr",
		gap: "16px",
	},
};

export default OpticalTrains;
