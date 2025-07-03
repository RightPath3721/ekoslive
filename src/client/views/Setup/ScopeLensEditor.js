import React from "react";
import { Button, Typography, Box } from "@mui/material";
import { isEmpty } from "lodash";
import { useDispatch } from "react-redux";
import { snackbarActions } from "@redux/actions";
import { SNACKBAR_VARIANTS } from "@redux/constants";
import { ScopeLensType } from "../../helpers/common";
import NumericControl from "../../Components/NumericControl";
import { SelectInput } from "../../Components/Select";
import InputField from "../../Components/InputField";
import CloseButton from "../../Components/CloseButton";
import s from "@common/shared/i18n/i18n";

const scopeTypes = [
	"Refractor",
	"Newtonian",
	"Maksutov",
	"Schmidt-Cassegrain",
	"Kutter (Schiefspiegler)",
	"Cassegrain",
	"Ritchey-Chretien",
].map((item) => ({ label: item, value: item }));

const ScopeLensEditor = ({ close, mode, data, onAccept, handleChange }) =>
{
	const dispatch = useDispatch();
	const {
		vendor = "",
		model = "",
		type = "",
		aperture = 10,
		focal_length = 10,
		focal_ratio = 0.9,
	} = data;
	const validate = () =>
	{
		// // validate the new scope values
		if (isEmpty(vendor))
		{
			dispatch(
				snackbarActions.enqueueSnackbar({
					message: "Please fill Vendor!",
					type: SNACKBAR_VARIANTS.ERROR,
				}),
			);
		}
		else if (isEmpty(model))
		{
			dispatch(
				snackbarActions.enqueueSnackbar({
					message: "Please fill Model",
					type: SNACKBAR_VARIANTS.ERROR,
				}),
			);
		}
		else if (focal_length < 10)
		{
			dispatch(
				snackbarActions.enqueueSnackbar({
					message: "Focal length must be > 10",
					type: SNACKBAR_VARIANTS.ERROR,
				}),
			);
		}
		else if (focal_ratio < 0.9)
		{
			dispatch(
				snackbarActions.enqueueSnackbar({
					message: "Focal ratio must be > 0.9",
					type: SNACKBAR_VARIANTS.ERROR,
				}),
			);
		}
		onAccept(data);
	};

	return (
		<Box sx={LOCAL_STYLES.modal}>
			<Typography
				sx={{
					color: "white",
					margin: "0 auto",
					fontSize: "20px",
					fontWeight: 500,
				}}
			>
				{`${vendor ? s.general.edit : s.general.add} ${s.optical_train.telescope}`}
			</Typography>
			<CloseButton right="1%" top="1%" onChange={close} />

			<Box sx={[LOCAL_STYLES.inputBox]}>
				<Typography sx={{ color: "white" }}>
					{s.connect.add_scope.vendor}
				</Typography>
				<InputField
					value={vendor}
					placeholder="Celestron"
					onChange={(val) => handleChange(val, ScopeLensType.vendor)}
					clear={() => handleChange("", ScopeLensType.vendor)}
				/>
			</Box>

			<Box sx={[LOCAL_STYLES.inputBox]}>
				<Typography sx={{ color: "white" }}>{s.status.model}</Typography>
				<InputField
					value={model}
					placeholder={mode === "scope" ? "CPC 1100HD" : "Canon"}
					onChange={(val) => handleChange(val, ScopeLensType.model)}
					clear={() => handleChange("", ScopeLensType.model)}
				/>
			</Box>

			{mode === "scope" && (
				<Box sx={[LOCAL_STYLES.inputBox]}>
					<Typography sx={{ color: "white" }}>{s.general.type}</Typography>
					<SelectInput
						type={ScopeLensType.type}
						options={scopeTypes}
						value={type}
						onChange={(val, type) => handleChange(val, type)}
						width="200px"
					/>
				</Box>
			)}

			{mode === "scope" && (
				<Box
					sx={[LOCAL_STYLES.inputBox, { gridTemplateColumns: "100px 143px" }]}
				>
					<Typography sx={{ color: "white" }}>
						{s.connect.add_scope.aperture}
					</Typography>
					<NumericControl
						initialValue={aperture}
						onChange={(val) => handleChange(val, ScopeLensType.aperture)}
						steps={[50, 50]}
						customLimit={[10, 10000]}
					/>
				</Box>
			)}
			{mode === "lens" && (
				<Box
					sx={[LOCAL_STYLES.inputBox, { gridTemplateColumns: "100px 143px" }]}
				>
					<Typography sx={{ color: "white" }}>Focal Ratio</Typography>
					<NumericControl
						initialValue={focal_ratio}
						onChange={(val) => handleChange(val, ScopeLensType.focalRatio)}
						steps={[10, 10]}
						customLimit={[0.9, 22]}
					/>
				</Box>
			)}

			{mode === "scope" && (
				<Box
					sx={[LOCAL_STYLES.inputBox, { gridTemplateColumns: "100px 143px" }]}
				>
					<Typography sx={{ color: "white" }}>
						{s.connect.add_scope.focal_length}
					</Typography>
					<NumericControl
						initialValue={focal_length}
						onChange={(val) => handleChange(val, ScopeLensType.focalLength)}
						steps={[100, 100]}
						customLimit={[10, 40000]}
					/>
				</Box>
			)}

			{mode === "lens" && (
				<Box
					sx={[LOCAL_STYLES.inputBox, { gridTemplateColumns: "100px 143px" }]}
				>
					<Typography sx={{ color: "white" }}>
						{s.connect.add_scope.focal_length}
					</Typography>
					<NumericControl
						initialValue={focal_length}
						onChange={(val) => handleChange(val, ScopeLensType.focalLength)}
						steps={[100, 100]}
						customLimit={[10, 900]}
					/>
				</Box>
			)}

			<Box
				sx={{
					display: "flex",
					width: "100%",
					justifyContent: "space-evenly",
					alignItems: "center",
				}}
			>
				<Button
					onClick={close}
					sx={[LOCAL_STYLES.btn, { backgroundColor: "#1D1D1D" }]}
				>
					{s.general.cancel}
				</Button>
				<Button onClick={validate} sx={LOCAL_STYLES.btn}>
					{s.general.save}
				</Button>
			</Box>
		</Box>
	);
};

const LOCAL_STYLES = {
	modal: {
		padding: "18px",
		borderRadius: 2,
		backgroundColor: "#151515",
		border: "1px solid #252525",
		position: "absolute",
		top: "70px",
		left: "50%",
		transform: "translateX(-50%)",
		zIndex: 10,
		display: "flex",
		flexDirection: "column",
		alignItems: "center",
		justifyContent: "center",
		gap: "32px",
	},
	btn: {
		backgroundColor: "#ff6600",
		color: "#FFFFFF",
		textTransform: "none",
		border: "1px solid #2d2d2d",
	},
	inputBox: {
		width: "100%",
		display: "grid",
		gridTemplateColumns: "100px auto",
		gap: "10px",
		alignItems: "center",
	},
};

export default ScopeLensEditor;
