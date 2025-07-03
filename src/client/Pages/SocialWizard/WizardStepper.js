import React, { useCallback, useState } from "react";
import { styled } from "@mui/material/styles";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Stepper from "@mui/material/Stepper";
import Step from "@mui/material/Step";
import StepLabel from "@mui/material/StepLabel";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import StepConnector, {
	stepConnectorClasses,
} from "@mui/material/StepConnector";
import { Palette } from "@common/shared/common/styles";
import s from "@common/shared/i18n/i18n";
import UsersIcon from "@client/icons/UsersIcon";
import ObservatoriesIcon from "@client/icons/ObservatoryIcon";
import SoftwareIcon from "@client/icons/SoftwareIcon";
import HardwareIcon from "@client/icons/HardwareIcon";
import ImageIcon from "@client/icons/ImageIcon";
import steps from "./wizardSteps";
import WizardTabs from "./WizardTabs";
import { useSocialWizardContext } from "./SocialWizardTabs/SocialWizardContext";
import wizardSteps from "./wizardSteps";

const icons = {
	1: <UsersIcon />,
	2: <ObservatoriesIcon />,
	3: <SoftwareIcon />,
	4: <HardwareIcon />,
	5: <ImageIcon />,
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

const ColorlibStepIconRoot = styled("div")(({ ownerState, theme }) => ({
	backgroundColor: "#ccc",
	zIndex: 1,
	color: theme.palette.common.black,
	width: 50,
	height: 50,
	display: "flex",
	borderRadius: "50%",
	justifyContent: "center",
	alignItems: "center",
	...(ownerState.active && {
		backgroundColor: theme.palette.primary.main,
		boxShadow: "0 4px 10px 0 rgba(0,0,0,.25)",
		color: theme.palette.common.white,
	}),
	...(ownerState.completed && {
		backgroundColor: theme.palette.primary.main,
		color: theme.palette.common.white,
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

const WizardStepper = () =>
{
	const [activeStep, setActiveStep] = useState(0);
	const { survey } = useSocialWizardContext();

	const handleNext = useCallback(async () =>
	{
		if (activeStep !== steps.length - 1)
		{
			setTimeout(
				() => setActiveStep((prevActiveStep) => prevActiveStep + 1),
				200,
			);
			return;
		}
	}, [activeStep, setActiveStep, survey]);

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
					gap: ".5rem",
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
					{steps.map((step, idx) => (
						<Step sx={{ color: Palette.white }} key={step.title}>
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
								{step.title}
							</StepLabel>
						</Step>
					))}
				</Stepper>
				<Button
					variant="contained"
					sx={{
						backgroundColor: Palette.orange,
						fontSize: "1rem",
						whiteSpace: "nowrap",
					}}
					type="submit"
					form={wizardSteps[activeStep]?.formId}
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
				<WizardTabs next={handleNext} active={activeStep} />
			)}
		</Stack>
	);
};

export default WizardStepper;
