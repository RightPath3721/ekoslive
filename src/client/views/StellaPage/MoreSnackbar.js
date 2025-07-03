import React from "react";
import { useDispatch, useSelector } from "react-redux";
import SnackbarContent from "@mui/material/SnackbarContent";
import Snackbar from "@mui/material/Snackbar";
import IconButton from "@mui/material/IconButton";
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";
import VisibilityIcon from "@mui/icons-material/Visibility";
import DeleteForeverIcon from "@mui/icons-material/DeleteForever";
import VolumeUpIcon from "@mui/icons-material/VolumeUp";
import VolumeOffIcon from "@mui/icons-material/VolumeOff";
import { stellaActions } from "@redux/actions";
import { Palette } from "@common/shared/common/styles";

const MoreSnackbar = ({ open, close, clearHistory }) =>
{
	const dispatch = useDispatch();
	const showExamples = useSelector((state) => state.stella.showExamples);
	const narrateResponse = useSelector((state) => state.stella.narrateResponse);

	return (
		<Snackbar
			open={open}
			sx={{
				position: "absolute",
				top: "-100% !important",
				left: "50% !important",
				transform: "translate(-50%, -90%)",
			}}
		>
			<SnackbarContent
				action={[
					<IconButton
						key={0}
						sx={{ padding: 0 }}
						onClick={() =>
						{
							dispatch(stellaActions.setShowExamples(!showExamples));
							close();
						}}
						type="button"
					>
						{showExamples ? (
							<VisibilityOffIcon sx={{ color: Palette.white, fontSize: 24 }} />
						) : (
							<VisibilityIcon sx={{ color: Palette.white, fontSize: 24 }} />
						)}
					</IconButton>,
					<IconButton
						key={1}
						sx={{ padding: 0 }}
						onClick={() =>
						{
							dispatch(
								stellaActions.setParameterValue(
									"narrateResponse",
									!narrateResponse,
								),
							);
							close();
						}}
						type="button"
					>
						{narrateResponse ? (
							<VolumeUpIcon sx={{ color: Palette.white, fontSize: 24 }} />
						) : (
							<VolumeOffIcon sx={{ color: Palette.white, fontSize: 24 }} />
						)}
					</IconButton>,
					<IconButton
						key={2}
						sx={{ padding: 0 }}
						type="button"
						onClick={async () =>
						{
							await clearHistory();
							close();
						}}
					>
						<DeleteForeverIcon sx={{ color: Palette.white, fontSize: 24 }} />
					</IconButton>,
				]}
				sx={{
					minWidth: "auto !important",
					padding: "4px",
					"& .MuiSnackbarContent-action": {
						display: "flex",
						flexDirection: "column",
						gap: "6px",
						width: "min-content",
						margin: 0,
						padding: 0,
					},
				}}
			/>
		</Snackbar>
	);
};

export default MoreSnackbar;
