import React, { useState } from "react";
import { useSelector } from "react-redux";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import { selectActiveKStarID } from "@redux/selectors";
import { styles } from "../../../shared/styles";
import useObservatories from "../../../hooks/useObservatories";
import ObservatorySetupBox from "../EkosInstanceSelector/ObservatorySetupBox";
import CloseButton from "../../../Components/CloseButton";

const ConnectedObservatoryIndicator = () =>
{
	const connectedKStarID = useSelector(selectActiveKStarID);
	const { observatories, setObservatories } = useObservatories();
	const [isViewObservatoryMode, setIsViewObservatoryMode] = useState(false);
	const connectedObservatory = observatories.find(
		(observatory) => observatory.machine_id === connectedKStarID,
	);

	return (
		<Box
			sx={{
				width: "100%",
				display: "flex",
				alignItems: "center",
				justifyContent: connectedObservatory ? "space-between" : "flex-end",
				paddingLeft: "50px",
			}}
		>
			{connectedObservatory && (
				<Box sx={[styles.center]}>
					<Typography>Connected to:&nbsp;</Typography>
					<Button onClick={() => setIsViewObservatoryMode((prev) => !prev)}>
						{connectedObservatory.name}
					</Button>
				</Box>
			)}

			<Dialog
				PaperProps={{ sx: { alignItems: "center", padding: "20px" } }}
				onClose={() => setIsViewObservatoryMode(false)}
				open={isViewObservatoryMode}
			>
				<DialogTitle>Connected observatory</DialogTitle>
				<ObservatorySetupBox
					observatory={connectedObservatory}
					setObservatories={setObservatories}
					isViewMode
				/>

				<CloseButton
					onChange={() => setIsViewObservatoryMode(false)}
					iconSize={20}
					right="10px"
					top="10px"
				/>
			</Dialog>
		</Box>
	);
};

export default ConnectedObservatoryIndicator;
