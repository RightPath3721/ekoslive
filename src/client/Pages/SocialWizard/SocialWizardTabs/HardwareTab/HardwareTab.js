import React, { useRef } from "react";
import Box from "@mui/material/Box";
import QuizSelector from "../QuizSelector";
import { useSocialWizardContext } from "../SocialWizardContext";

const HardwareTab = ({ step, next }) =>
{
	const ref = useRef();
	const { setSurvey } = useSocialWizardContext();

	const submit = (e) =>
	{
		e.preventDefault();
		const data = ref.current;

		setSurvey((prevData) => ({ ...prevData, hardware: data }));
		next();
	};

	return (
		<Box component="form" onSubmit={submit} id="hardware-form">
			<QuizSelector ref={ref} options={step.options} question={step.question} />
		</Box>
	);
};

export default HardwareTab;
