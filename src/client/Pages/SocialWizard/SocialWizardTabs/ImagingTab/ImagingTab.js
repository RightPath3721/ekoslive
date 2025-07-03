import React, { useRef } from "react";
import axios from "axios";
import Box from "@mui/material/Box";
import { useNavigate } from "react-router-dom";
import { captureException } from "@sentry/browser";
import QuizSelector from "../QuizSelector";
import { useSocialWizardContext } from "../SocialWizardContext";
import useActiveUser from "@hooks/useActiveUser";

const postSurveyResult = async (survey, user) =>
{
	if (!user) return null;
	
	try
	{
		const { data } = await axios.post("/api/survey", survey, {
			params: {
				username: user.username,
				token: user.token,
			},
		});
		return data;
	}
	catch (error)
	{
		captureException(error, { addAttachment: { survey, user } });
		return null;
	}
};

const ImagingTab = ({ step }) =>
{
	const user = useActiveUser();
	const ref = useRef();
	const navigate = useNavigate();
	const { setSurvey, survey } = useSocialWizardContext();

	const submit = async (e) =>
	{
		e.preventDefault();
		const data = ref.current;

		setSurvey((prevData) => ({ ...prevData, imaging: data }));
		await postSurveyResult({ ...survey, imaging: data }, user);
		navigate("/community/profile/");
	};

	return (
		<Box component="form" onSubmit={submit} id="imaging-form">
			<QuizSelector ref={ref} options={step.options} question={step.question} />
		</Box>
	);
};

export default ImagingTab;
