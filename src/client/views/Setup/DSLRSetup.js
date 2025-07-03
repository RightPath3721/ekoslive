import { Box, Button, Grid, Typography } from "@mui/material";
import React, { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { profileActions } from "@redux/actions";
import { selectDslrInfo } from "@redux/selectors";
import s from "@common/shared/i18n/i18n";
import { Palette } from "@common/shared/common/styles";
import NumericControl from "../../Components/NumericControl";
import CloseButton from "../../Components/CloseButton";

const LOCAL_STYLES = {
	modal: {
		borderRadius: 2,
		backgroundColor: "#151515",
		border: "1px solid #252525",
		padding: 2,
		position: "relative",
	},
};

const DSLRInput = ({ title, steps, limits, value, onChange }) =>
{
	return (
		<Box
			sx={{
				display: "flex",
				flexDirection: "row",
				alignItems: "center",
				marginTop: "12px",
				gap: "16px",
			}}
		>
			<Typography sx={{ color: "#CECECE", width: "120px", fontSize: "14px" }}>
				{title}
			</Typography>
			<NumericControl
				initialValue={value}
				steps={steps}
				customLimit={limits}
				onChange={onChange}
			/>
		</Box>
	);
};
const DSLRSetup = ({ close }) =>
{
	const dispatch = useDispatch();
	const model = useSelector(selectDslrInfo);
	const [state, setState] = useState({
		width: 0,
		height: 0,
		pixelw: 0.0,
		pixelh: 0.0,
		disableSubmit: false,
	});

	const { width, height, pixelh, pixelw } = state;

	const saveDSLRSetting = () =>
	{
		dispatch(
			profileActions.saveDSLRSettings({
				model: model,
				width: width,
				height: height,
				pixelw: pixelw,
				pixelh: pixelh,
			}),
		);
		close();
	};
	return (
		<Box sx={{ padding: "24px" }}>
			<Box sx={LOCAL_STYLES.modal}>
				<CloseButton right="15px" top="15px" onChange={close} />
				<Grid container sx={{ display: "flex", flexDirection: "row" }}>
					<Typography sx={{ color: "white" }}>
						{s.connect.btn_dslr_setup}
					</Typography>
				</Grid>
				<Typography sx={{ color: "#CECECE" }}>
					Please fill the required information below. This is one-time setup.
					You can obtain these values from your camera manual or from online
					resources such as Digital Camera Database
				</Typography>
				<Grid
					container
					style={{ display: "flex", flexDirection: "row", marginTop: "12px" }}
				>
					<Grid item xs={6}>
						<DSLRInput
							title={`${s.connect.dslr_setup.width} (Pixels):`}
							value={width}
							steps={[1000, 1000]}
							limits={[1000, 10000]}
							onChange={(val) =>
							{
								setState({ ...state, width: val });
							}}
						/>
						<DSLRInput
							title={`${s.connect.dslr_setup.height} (Pixels): `}
							value={height}
							steps={[1000, 1000]}
							limits={[1000, 10000]}
							onChange={(val) =>
							{
								setState({ ...state, height: val });
							}}
						/>
					</Grid>
					<Grid item xs={6}>
						<DSLRInput
							title={`${s.connect.dslr_setup.pixel_width} (μm) `}
							value={pixelw}
							steps={[0.5, 0.5]}
							limits={[1, 10]}
							onChange={(val) =>
							{
								setState({ ...state, pixelw: val });
							}}
						/>
						<DSLRInput
							title={`${s.connect.dslr_setup.pixel_height} (μm):`}
							value={pixelh}
							steps={[0.5, 0.5]}
							limits={[1, 10]}
							onChange={(val) =>
							{
								setState({ ...state, pixelh: val });
							}}
						/>
					</Grid>
				</Grid>

				<Button
					onClick={saveDSLRSetting}
					sx={{
						backgroundColor: Palette.orange,
						marginTop: "12px",
						color: "white",
					}}
					disabled={width < 1000 || height < 1000 || pixelh < 1 || pixelw < 1}
				>
					{s.general.save}
				</Button>
			</Box>
		</Box>
	);
};

export default DSLRSetup;
