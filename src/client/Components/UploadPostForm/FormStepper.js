import React, { useCallback, useState } from "react";
import { styled } from "@mui/material/styles";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Stepper from "@mui/material/Stepper";
import Step from "@mui/material/Step";
import StepLabel from "@mui/material/StepLabel";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import DisplaySettingsIcon from "@mui/icons-material/DisplaySettings";
import ImageIcon from "@mui/icons-material/Image";
import HelpIcon from "@mui/icons-material/Help";
import StepConnector, {
	stepConnectorClasses,
} from "@mui/material/StepConnector";
import { Palette } from "@common/shared/common/styles";
import UploadTabs from "./UploadTabs";
import s from "@common/shared/i18n/i18n";
import { useUploadFormContext } from "./UploadFormContext";

const icons = {
	1: <ImageIcon />,
	2: <HelpIcon />,
	3: <DisplaySettingsIcon />,
};

const ColorlibConnector = styled(StepConnector)(() => ({
	[`&.${stepConnectorClasses.alternativeLabel}`]: {
		top: 22,
	},
	[`&.${stepConnectorClasses.active}`]: {
		[`& .${stepConnectorClasses.line}`]: {
			backgroundColor: Palette.orange,
		},
	},
	[`&.${stepConnectorClasses.completed}`]: {
		[`& .${stepConnectorClasses.line}`]: {
			backgroundColor: Palette.orange,
		},
	},
	[`& .${stepConnectorClasses.line}`]: {
		height: 3,
		border: 0,
		backgroundColor: Palette.greycc,
		borderRadius: 1,
	},
}));

const ColorlibStepIconRoot = styled("div")(({ ownerState }) => ({
	backgroundColor: "#ccc",
	zIndex: 1,
	color: "#fff",
	width: 50,
	height: 50,
	display: "flex",
	borderRadius: "50%",
	justifyContent: "center",
	alignItems: "center",
	...(ownerState.active && {
		backgroundColor: Palette.orange,
		boxShadow: "0 4px 10px 0 rgba(0,0,0,.25)",
	}),
	...(ownerState.completed && {
		backgroundColor: Palette.orange,
	}),
}));

const ColorlibStepIcon = ({ icon, active, completed }) =>
{
	return (
		<ColorlibStepIconRoot ownerState={{ completed, active }}>
			{icons[icon]}
		</ColorlibStepIconRoot>
	);
};

const FormStepper = ({ close }) =>
{
	const [activeStep, setActiveStep] = useState(0);
	const { uploadPost, mode, updatePost, isOwner } = useUploadFormContext();
	const [isCurrentFormValid, setIsCurrentFormValid] = useState(false);

	const steps =
		mode === "edit"
			? ["Information", ...(isOwner ? ["Acquisition"] : [])]
			: ["Create Post", "Information", "Acquisition"];

	const handleNext = useCallback(() =>
	{
		if (!isCurrentFormValid) return;
		if (activeStep !== steps.length - 1)
		{
			setActiveStep((prevActiveStep) => prevActiveStep + 1);
			setIsCurrentFormValid(false);
			return;
		}
		mode === "edit" ? updatePost() : uploadPost();
		close();
	}, [
		isCurrentFormValid,
		activeStep,
		setIsCurrentFormValid,
		setActiveStep,
		updatePost,
		uploadPost,
		close,
		mode,
	]);

	const handleBack = useCallback(
		() => setActiveStep((prevActiveStep) => prevActiveStep - 1),
		[setActiveStep],
	);

	const handleReset = () => setActiveStep(0);

	return (
		<Stack
			sx={{ width: "100%", display: "grid", gridTemplateRows: "auto 1fr" }}
			spacing={4}
		>
			<Box
				sx={{
					display: "flex",
					justifyContent: "space-between",
					alignItems: "center",
				}}
			>
				<Button
					disabled={activeStep === 0}
					onClick={handleBack}
					variant="contained"
					sx={{
						backgroundColor: Palette.orange,
						fontSize: "1rem",
						whiteSpace: "nowrap",
					}}
				>
					{s.general.back}
				</Button>
				<Stepper
					alternativeLabel
					activeStep={activeStep}
					connector={<ColorlibConnector />}
					sx={{ flex: "1 1 auto" }}
				>
					{steps.map((label, idx) => (
						<Step sx={{ color: Palette.white }} key={label}>
							<StepLabel
								StepIconComponent={ColorlibStepIcon}
								StepIconProps={{
									active: activeStep === idx,
									completed: activeStep > idx,
									icon: idx + 1,
								}}
								sx={{
									gap: ".25rem",
									"& .MuiStepLabel-labelContainer": {
										color: Palette.white,
										width: "max-content",
										marginTop: 0,
										"& .MuiStepLabel-label": {
											marginTop: 0,
										},
										"& .MuiStepLabel-label.Mui-active": {
											color: Palette.white,
											marginTop: 0,
										},
										"& .MuiStepLabel-label.Mui-completed": {
											color: Palette.white,
											marginTop: 0,
										},
									},
								}}
							>
								{label}
							</StepLabel>
						</Step>
					))}
				</Stepper>
				<Button
					onClick={handleNext}
					variant="contained"
					sx={{
						backgroundColor: Palette.orange,
						fontSize: "1rem",
						whiteSpace: "nowrap",
					}}
					disabled={!isCurrentFormValid}
				>
					{activeStep === steps.length - 1
						? s.tourGuide.finish
						: s.general.next}
				</Button>
			</Box>
			{activeStep === steps.length ? (
				<React.Fragment>
					<Typography sx={{ mt: 2, mb: 1 }}>
						All steps completed - you&apos;re finished
					</Typography>
					<Box sx={{ display: "flex", flexDirection: "row", pt: 2 }}>
						<Box sx={{ flex: "1 1 auto" }} />
						<Button onClick={handleReset}>Reset</Button>
					</Box>
				</React.Fragment>
			) : (
				<UploadTabs
					active={activeStep}
					back={handleBack}
					next={handleNext}
					setFormValid={setIsCurrentFormValid}
				/>
			)}
		</Stack>
	);
};

export default FormStepper;
